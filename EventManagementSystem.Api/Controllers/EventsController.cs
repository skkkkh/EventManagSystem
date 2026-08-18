using EventManagementSystem.Api.DTOs;
using EventManagementSystem.Api.Models;
using EventManagementSystem.Api.Repositories;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EventManagementSystem.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class EventsController : ControllerBase
{
    private readonly IUnitOfWork _uow;
    private readonly ILogger<EventsController> _logger;
    private readonly IMediator _mediator;

    public EventsController(IUnitOfWork uow, ILogger<EventsController> logger, IMediator mediator)
    {
        _uow = uow;
        _logger = logger;
        _mediator = mediator;
    }

    // GET: api/events
    [HttpGet]
    public async Task<ActionResult<IEnumerable<EventDto>>> GetAll()
    {
        var result = await _mediator.Send(new EventManagementSystem.Api.CQRS.Events.GetEventsQuery());
        return Ok(result);
    }

    // GET: api/events/5
    [HttpGet("{id:int}")]
    public async Task<ActionResult<EventDto>> GetById(int id)
    {
        var ev = await _mediator.Send(new EventManagementSystem.Api.CQRS.Events.GetEventByIdQuery(id));
        if (ev is null) return NotFound();
        return Ok(ev);
    }

    // GET: api/events/upcoming
    [HttpGet("upcoming")]
    public async Task<ActionResult<IEnumerable<EventDto>>> GetUpcoming()
    {
        var events = await _mediator.Send(new EventManagementSystem.Api.CQRS.Events.GetUpcomingEventsQuery());
        return Ok(events);
    }

    // POST: api/events
    [HttpPost]
    [Authorize(Roles = "Admin,Organizer")]
    public async Task<ActionResult<EventDto>> Create(CreateEventDto dto)
    {
        try
        {
            var created = await _mediator.Send(new EventManagementSystem.Api.CQRS.Events.CreateEventCommand(dto));
            _logger.LogInformation("Created event {EventId}: {Title}", created.Id, created.Title);
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    // PUT: api/events/5
    [HttpPut("{id:int}")]
    [Authorize(Roles = "Admin,Organizer")]
    public async Task<IActionResult> Update(int id, UpdateEventDto dto)
    {
        try
        {
            await _mediator.Send(new EventManagementSystem.Api.CQRS.Events.UpdateEventCommand(id, dto));
            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            if (ex.Message.Contains("does not exist")) return NotFound();
            return BadRequest(ex.Message);
        }
    }

    // DELETE: api/events/5
    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        try
        {
            await _mediator.Send(new EventManagementSystem.Api.CQRS.Events.DeleteEventCommand(id));
            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            if (ex.Message.Contains("does not exist")) return NotFound();
            return BadRequest(ex.Message);
        }
    }
}