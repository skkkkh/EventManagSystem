using EventManagementSystem.Api.Data;
using EventManagementSystem.Api.DTOs;
using EventManagementSystem.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace EventManagementSystem.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TicketTypesController : ControllerBase
{
    private readonly AppDbContext _context;

    public TicketTypesController(AppDbContext context)
    {
        _context = context;
    }

    [HttpPost]
    public async Task<ActionResult<TicketTypeResponseDto>> CreateTicketType(
        CreateTicketTypeDto dto)
    {
        var eventExists = await _context.Events
            .AnyAsync(e => e.Id == dto.EventId);

        if (!eventExists)
            return NotFound("Event not found.");

        var ticketType = new TicketType
        {
            Name = dto.Name,
            Price = dto.Price,
            Quantity = dto.Quantity,
            EventId = dto.EventId
        };

        _context.TicketTypes.Add(ticketType);
        await _context.SaveChangesAsync();

        var response = new TicketTypeResponseDto(
            ticketType.Id,
            ticketType.Name,
            ticketType.Price,
            ticketType.Quantity,
            ticketType.EventId
        );

        return CreatedAtAction(
            nameof(GetTicketType),
            new { id = ticketType.Id },
            response);
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<TicketTypeResponseDto>>>
        GetTicketTypes()
    {
        var tickets = await _context.TicketTypes
            .AsNoTracking()
            .Select(t => new TicketTypeResponseDto(
                t.Id,
                t.Name,
                t.Price,
                t.Quantity,
                t.EventId
            ))
            .ToListAsync();

        return Ok(tickets);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<TicketTypeResponseDto>>
        GetTicketType(int id)
    {
        var ticket = await _context.TicketTypes
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.Id == id);

        if (ticket == null)
            return NotFound();

        return Ok(new TicketTypeResponseDto(
            ticket.Id,
            ticket.Name,
            ticket.Price,
            ticket.Quantity,
            ticket.EventId
        ));
    }
}