using EventManagementSystem.Api.Models;
using EventManagementSystem.Api.Repositories;
using EventManagementSystem.Api.DTOs;
using System.Linq;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[Route("api/[controller]")]
[ApiController]
public class EventsController : ControllerBase
{
    private readonly IUnitOfWork _unitOfWork;

    public EventsController(IUnitOfWork unitOfWork)
    {
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

    // Public: Anyone can view events
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

    // Protected: Only logged-in users/admins can modify
    [Authorize]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Event ev)
    {
        await _unitOfWork.Events.AddAsync(ev);
        await _unitOfWork.SaveChangesAsync();

        // Create a default ticket type so guest checkout can find tickets for this event
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
        _unitOfWork.Events.Update(ev);
        await _unitOfWork.CompleteAsync();
        return NoContent();
    }

    [Authorize]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var ev = await _unitOfWork.Events.GetByIdAsync(id);
        if (ev == null) return NotFound();

        _unitOfWork.Events.Remove(ev);
        await _unitOfWork.CompleteAsync();
        return NoContent();
    }
}