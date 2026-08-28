using EventManagementSystem.Api.CQRS.Bookings;
using EventManagementSystem.Api.Data;
using EventManagementSystem.Api.DTOs;
using EventManagementSystem.Api.Models;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace EventManagementSystem.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class BookingsController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IMediator _mediator;

    // Prevents two booking requests from changing the same
    // ticket inventory at the same time inside this API instance.
    private static readonly SemaphoreSlim BookingLock = new(1, 1);

    public BookingsController(AppDbContext context, IMediator mediator)
    {
        _context = context;
        _mediator = mediator;
    }

    [HttpPost]
    public async Task<ActionResult<BookingResponseDto>> CreateBooking(
        CreateBookingDto dto)
    {
        try
        {
            var response = await _mediator.Send(new CreateBookingCommand(dto));

            return CreatedAtAction(
                nameof(GetBooking),
                new { id = response.Id },
                response);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpGet("available-seats/{ticketTypeId:int}")]
    public async Task<ActionResult<object>> GetAvailableSeats(int ticketTypeId)
    {
        try
        {
            var seats = await _mediator.Send(new GetAvailableSeatsQuery(ticketTypeId));
            return Ok(new { AvailableSeats = seats });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ex.Message);
        }
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<BookingResponseDto>>> GetBookings()
    {
        var bookings = await _context.Bookings
            .AsNoTracking()
            .OrderByDescending(b => b.BookedAt)
            .Select(b => new BookingResponseDto(
                b.Id,
                b.RegistrationId,
                b.TicketTypeId,
                b.Quantity,
                b.TotalAmount,
                b.Status.ToString(),
                b.BookedAt,
                b.IsPaid
            ))
            .ToListAsync();

        return Ok(bookings);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<BookingResponseDto>> GetBooking(int id)
    {
        var booking = await _context.Bookings
            .AsNoTracking()
            .FirstOrDefaultAsync(b => b.Id == id);

        if (booking == null)
            return NotFound();

        return Ok(new BookingResponseDto(
            booking.Id,
            booking.RegistrationId,
            booking.TicketTypeId,
            booking.Quantity,
            booking.TotalAmount,
            booking.Status.ToString(),
            booking.BookedAt,
            booking.IsPaid
        ));
    }

    // Public guest checkout: create registration and booking, mark paid (mock)
    [AllowAnonymous]
    [HttpPost("guest-checkout")]
    public async Task<IActionResult> GuestCheckout([FromBody] GuestCheckoutDto dto)
    {
        // Find or create registration for this email + event
        var existing = await _context.Registrations.FirstOrDefaultAsync(r => r.EventId == dto.EventId && r.Email == dto.Email);
        Registration registration = existing ?? new Registration
        {
            FullName = dto.FullName,
            Email = dto.Email,
            Phone = dto.Phone,
            EventId = dto.EventId,
            RegisteredAt = DateTime.UtcNow
        };

        if (existing == null)
        {
            await _context.Registrations.AddAsync(registration);
            await _context.SaveChangesAsync();
        }

        // Find first available ticket type for event
        var ticketType = await _context.TicketTypes.FirstOrDefaultAsync(t => t.EventId == dto.EventId && t.Quantity >= dto.Quantity);
        if (ticketType == null)
            return BadRequest("No ticket type with sufficient quantity available for this event.");

        // Prevent bookings for events that have already ended
        var ev = await _context.Events.FirstOrDefaultAsync(e => e.Id == ticketType.EventId);
        if (ev != null && ev.EndDateTime < DateTime.UtcNow)
            return BadRequest("This event has ended and is no longer accepting bookings");

        var bookingDto = new CreateBookingDto(registration.Id, ticketType.Id, dto.Quantity, true);

        // Use mediator to create booking via existing handler
        var response = await _mediator.Send(new CreateBookingCommand(bookingDto));

        return CreatedAtAction(nameof(GetBooking), new { id = response.Id }, response);
    }

    [HttpPut("{id:int}/cancel")]
    public async Task<IActionResult> CancelBooking(int id)
    {
        await BookingLock.WaitAsync();

        try
        {
            var booking = await _context.Bookings
                .Include(b => b.TicketType)
                .FirstOrDefaultAsync(b => b.Id == id);

            if (booking == null)
                return NotFound();

            if (booking.Status == BookingStatus.Cancelled)
                return BadRequest("Booking is already cancelled.");

            booking.Status = BookingStatus.Cancelled;

            if (booking.TicketType != null)
            {
                booking.TicketType.Quantity += booking.Quantity;
            }

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Booking cancelled successfully."
            });
        }
        finally
        {
            BookingLock.Release();
        }
    }
}