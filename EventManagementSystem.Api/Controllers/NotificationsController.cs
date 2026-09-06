using EventManagementSystem.Api.CQRS.Reviews;
using EventManagementSystem.Api.DTOs;
using EventManagementSystem.Api.Models;
using EventManagementSystem.Api.Repositories;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EventManagementSystem.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class NotificationsController : ControllerBase
{
    private readonly IUnitOfWork _uow;
    private readonly IMediator _mediator;

    public NotificationsController(IUnitOfWork uow, IMediator mediator)
    {
        _uow = uow;
        _mediator = mediator;
    }

    [HttpGet("user/{userId:int}")]
    public async Task<IActionResult> GetForUser(int userId)
    {
        await EnsureReviewPromptNotifications(userId);

        var notifications = await _uow.Notifications.FindAsync(n => n.UserId == userId);
        return Ok(notifications.OrderByDescending(n => n.CreatedAt).Select(NotificationDto.FromEntity));
    }

    private async Task EnsureReviewPromptNotifications(int userId)
    {
        var pending = await _mediator.Send(new GetPendingReviewsQuery(userId));
        if (pending.Count == 0)
            return;

        // Every review-prompt notification we create is tagged with a hidden
        // "[[EVENT:<id>]]" marker at the start of its Message, so we can tell
        // which event it's about and avoid creating a duplicate for the same
        // event on every poll — without needing a new database column.
        var existingPrompts = await _uow.Notifications.FindAsync(
            n => n.UserId == userId && n.Type == NotificationType.ReviewPrompt);
        var alreadyNotifiedEventIds = existingPrompts
            .Select(n => TryExtractEventId(n.Message))
            .Where(id => id.HasValue)
            .Select(id => id!.Value)
            .ToHashSet();

        var newOnes = pending.Where(p => !alreadyNotifiedEventIds.Contains(p.EventId)).ToList();
        if (newOnes.Count == 0)
            return;

        foreach (var ev in newOnes)
        {
            await _uow.Notifications.AddAsync(new Notification
            {
                UserId = userId,
                Message = $"[[EVENT:{ev.EventId}]]You attended \"{ev.Title}\" — tap to rate it!",
                Type = NotificationType.ReviewPrompt,
                CreatedAt = DateTime.UtcNow,
                IsRead = false
            });
        }
        await _uow.SaveChangesAsync();
    }

    private static int? TryExtractEventId(string message)
    {
        const string prefix = "[[EVENT:";
        if (!message.StartsWith(prefix)) return null;
        var end = message.IndexOf("]]", prefix.Length, StringComparison.Ordinal);
        if (end < 0) return null;
        var idPart = message.Substring(prefix.Length, end - prefix.Length);
        return int.TryParse(idPart, out var id) ? id : null;
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var n = await _uow.Notifications.GetByIdAsync(id);
        if (n is null) return NotFound();
        return Ok(NotificationDto.FromEntity(n));
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreateNotificationDto dto)
    {
        var entity = new Notification
        {
            UserId = dto.UserId,
            Message = dto.Message,
            Type = dto.Type,
            CreatedAt = dto.CreatedAt ?? DateTime.UtcNow,
            IsRead = false
        };

        await _uow.Notifications.AddAsync(entity);
        await _uow.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = entity.Id }, NotificationDto.FromEntity(entity));
    }

    [HttpPatch("{id:int}/read")]
    public async Task<IActionResult> MarkRead(int id)
    {
        var n = await _uow.Notifications.GetByIdAsync(id);
        if (n is null) return NotFound();
        n.IsRead = true;
        _uow.Notifications.Update(n);
        await _uow.SaveChangesAsync();
        return NoContent();
    }
}

public class CreateNotificationDto
{
    public int UserId { get; set; }
    public string Message { get; set; } = string.Empty;
    public NotificationType Type { get; set; } = NotificationType.General;
    public DateTime? CreatedAt { get; set; }
}