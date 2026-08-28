using EventManagementSystem.Api.DTOs;
using EventManagementSystem.Api.Models;
using EventManagementSystem.Api.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EventManagementSystem.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class NotificationsController : ControllerBase
{
    private readonly IUnitOfWork _uow;

    public NotificationsController(IUnitOfWork uow)
    {
        _uow = uow;
    }

    [HttpGet("user/{userId:int}")]
    public async Task<IActionResult> GetForUser(int userId)
    {
        var notifications = await _uow.Notifications.FindAsync(n => n.UserId == userId);
        return Ok(notifications.OrderByDescending(n => n.CreatedAt).Select(NotificationDto.FromEntity));
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