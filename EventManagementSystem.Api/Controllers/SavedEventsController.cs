using System.Security.Claims;
using EventManagementSystem.Api.Data;
using EventManagementSystem.Api.DTOs;
using EventManagementSystem.Api.Models;
using EventManagementSystem.Api.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EventManagementSystem.Api.Controllers;

// "Saved Events" — lets a signed-in attendee bookmark events to view later
// from their Profile tab.
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SavedEventsController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IUnitOfWork _unitOfWork;

    public SavedEventsController(AppDbContext context, IUnitOfWork unitOfWork)
    {
        _context = context;
        _unitOfWork = unitOfWork;
    }

    private async Task<int> GetBookedCount(int eventId)
    {
        var ticketTypes = await _unitOfWork.TicketTypes.FindAsync(tt => tt.EventId == eventId);
        int booked = 0;
        foreach (var tt in ticketTypes)
        {
            var bookings = await _unitOfWork.Bookings.FindAsync(b => b.TicketTypeId == tt.Id && b.Status != BookingStatus.Cancelled);
            booked += bookings.Sum(b => b.Quantity);
        }
        return booked;
    }

    private int? GetUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(claim, out var id) ? id : null;
    }

    // All events the current user has saved, most recently saved first.
    [HttpGet("mine")]
    public async Task<ActionResult<List<EventDto>>> GetMine()
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var saved = await _context.SavedEvents.AsNoTracking()
            .Where(s => s.UserId == userId.Value)
            .OrderByDescending(s => s.SavedAt)
            .Include(s => s.Event)
            .ThenInclude(e => e!.FieldValues)
            .ToListAsync();

        var result = new List<EventDto>();
        foreach (var s in saved)
        {
            if (s.Event == null) continue;
            var dto = EventDto.FromEntity(s.Event);
            dto.SeatsRemaining = Math.Max(0, s.Event.Capacity - await GetBookedCount(s.Event.Id));
            result.Add(dto);
        }

        return Ok(result);
    }

    // Whether the current user has already saved a given event — used to
    // set the bookmark icon's initial state on the event card/detail page.
    [HttpGet("{eventId:int}/status")]
    public async Task<ActionResult<SavedEventStatusDto>> GetStatus(int eventId)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var isSaved = await _context.SavedEvents
            .AnyAsync(s => s.UserId == userId.Value && s.EventId == eventId);

        return Ok(new SavedEventStatusDto(isSaved));
    }

    [HttpPost("{eventId:int}")]
    public async Task<IActionResult> Save(int eventId)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var eventExists = await _context.Events.AnyAsync(e => e.Id == eventId);
        if (!eventExists) return NotFound("Event not found.");

        var already = await _context.SavedEvents
            .AnyAsync(s => s.UserId == userId.Value && s.EventId == eventId);
        if (!already)
        {
            _context.SavedEvents.Add(new SavedEvent { UserId = userId.Value, EventId = eventId });
            await _context.SaveChangesAsync();
        }

        return Ok(new SavedEventStatusDto(true));
    }

    [HttpDelete("{eventId:int}")]
    public async Task<IActionResult> Unsave(int eventId)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var existing = await _context.SavedEvents
            .FirstOrDefaultAsync(s => s.UserId == userId.Value && s.EventId == eventId);
        if (existing != null)
        {
            _context.SavedEvents.Remove(existing);
            await _context.SaveChangesAsync();
        }

        return Ok(new SavedEventStatusDto(false));
    }
}
