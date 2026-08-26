using EventManagementSystem.Api.CQRS.Groups;
using EventManagementSystem.Api.CQRS.Notifications;
using EventManagementSystem.Api.DTOs;
using EventManagementSystem.Api.Models;
using EventManagementSystem.Api.Repositories;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Linq;
using System.Security.Claims;

[Route("api/[controller]")]
[ApiController]
public class EventsController : ControllerBase
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMediator _mediator;

    public EventsController(IUnitOfWork unitOfWork, IMediator mediator)
    {
        _unitOfWork = unitOfWork;
        _mediator = mediator;
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

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] bool includeExpired = false)
    {
        var now = DateTime.UtcNow;
        IReadOnlyList<Event> events;

        if (includeExpired)
            events = await _unitOfWork.Events.FindAsync(e => e.EndDateTime < now);
        else
            events = await _unitOfWork.Events.FindAsync(e => e.EndDateTime >= now);

        var result = new List<EventDto>();

        foreach (var ev in events)
        {
            var dto = EventDto.FromEntity(ev);
            dto.SeatsRemaining = Math.Max(0, ev.Capacity - await GetBookedCount(ev.Id));
            result.Add(dto);
        }

        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var ev = await _unitOfWork.Events.GetByIdAsync(id);
        if (ev == null) return NotFound();

        var dto = EventDto.FromEntity(ev);
        dto.SeatsRemaining = Math.Max(0, ev.Capacity - await GetBookedCount(ev.Id));

        return Ok(dto);
    }

    [Authorize]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Event ev)
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (int.TryParse(userIdClaim, out var currentUserId))
        {
            ev.OrganizerId = currentUserId;
        }

        await _unitOfWork.Events.AddAsync(ev);
        await _unitOfWork.SaveChangesAsync();

        var defaultTicket = new TicketType
        {
            Name = "General Admission",
            Price = ev.Price,
            Quantity = ev.Capacity,
            EventId = ev.Id
        };

        await _unitOfWork.TicketTypes.AddAsync(defaultTicket);
        await _unitOfWork.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = ev.Id }, ev);
    }

    [Authorize]
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] Event ev)
    {
        if (id != ev.Id) return BadRequest();

        var existing = await _unitOfWork.Events.GetByIdAsync(id);
        if (existing == null) return NotFound();

        var oldCapacity = existing.Capacity;

        // Update only the fields the edit form actually sends — this preserves
        // OrganizerId, ImageUrl, CreatedAt, etc. which the form doesn't
        // include, so they no longer get silently wiped out on every edit.
        existing.Title = ev.Title;
        existing.Description = ev.Description;
        existing.Location = ev.Location;
        existing.Organizer = ev.Organizer;
        existing.StartDateTime = ev.StartDateTime;
        existing.EndDateTime = ev.EndDateTime;
        existing.Capacity = ev.Capacity;
        existing.IsPublished = ev.IsPublished;
        existing.Category = ev.Category;

        _unitOfWork.Events.Update(existing);

        // Keep ticket inventory in sync with capacity changes, so raising
        // capacity actually reopens booking availability, and lowering it
        // reduces remaining seats accordingly.
        var capacityDelta = ev.Capacity - oldCapacity;
        if (capacityDelta != 0)
        {
            var ticketTypes = await _unitOfWork.TicketTypes.FindAsync(t => t.EventId == id);
            var primaryTicket = ticketTypes.FirstOrDefault();
            if (primaryTicket != null)
            {
                primaryTicket.Quantity = Math.Max(0, primaryTicket.Quantity + capacityDelta);
                _unitOfWork.TicketTypes.Update(primaryTicket);
            }
        }

        await _unitOfWork.CompleteAsync();

        var registrations = await _unitOfWork.Registrations.FindAsync(r => r.EventId == id);
        if (registrations.Any())
        {
            await _mediator.Publish(new EventUpdatedEvent
            {
                EventTitle = existing.Title,
                Registrants = registrations.Select(r => (r.Email, r.FullName, r.UserId)).ToList()
            });
        }

        return NoContent();
    }

    [Authorize]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var ev = await _unitOfWork.Events.GetByIdAsync(id);
        if (ev == null) return NotFound();

        var registrations = await _unitOfWork.Registrations.FindAsync(r => r.EventId == id);
        var registrantList = registrations.Select(r => (r.Email, r.FullName, r.UserId)).ToList();
        var eventTitle = ev.Title;

        _unitOfWork.Events.Remove(ev);
        await _unitOfWork.CompleteAsync();

        if (registrantList.Any())
        {
            await _mediator.Publish(new EventCancelledEvent
            {
                EventTitle = eventTitle,
                Registrants = registrantList
            });
        }

        return NoContent();
    }

    [HttpPut("{id:int}/group")]
    [Authorize]
    public async Task<IActionResult> SetGroupRestriction(int id, [FromBody] int? groupId)
    {
        var organiserIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (organiserIdClaim is null || !int.TryParse(organiserIdClaim, out var organiserId))
            return Unauthorized("Could not identify the logged-in organiser.");

        try
        {
            await _mediator.Send(new SetEventGroupCommand(id, groupId, organiserId));
            return NoContent();
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpGet("{id:int}/access-check")]
    public async Task<IActionResult> AccessCheck(int id)
    {
        int? userId = null;
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userIdClaim is not null && int.TryParse(userIdClaim, out var parsedId))
            userId = parsedId;

        var allowed = await _mediator.Send(new CheckEventAccessQuery(id, userId));
        return Ok(new { IsAllowed = allowed });
    }
}