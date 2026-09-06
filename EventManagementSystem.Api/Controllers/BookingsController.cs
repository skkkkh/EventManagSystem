using EventManagementSystem.Api.CQRS.Bookings;
using EventManagementSystem.Api.CQRS.Groups;
using EventManagementSystem.Api.CQRS.Notifications;
using EventManagementSystem.Api.Data;
using EventManagementSystem.Api.DTOs;
using EventManagementSystem.Api.Models;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Security.Claims;
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

    // Every booking the currently logged-in user has made — matched by their
    // account (for bookings made while logged in) and by email as a fallback
    // (covers bookings made before the account link existed).
    [HttpGet("mine")]
    public async Task<ActionResult<List<MyBookingDto>>> GetMyBookings()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var email = User.FindFirst(ClaimTypes.Email)?.Value;
        int.TryParse(userIdClaim, out var userId);

        var bookings = await _context.Bookings
            .AsNoTracking()
            .Include(b => b.Registration)
            .Include(b => b.TicketType).ThenInclude(t => t!.Event)
            .Include(b => b.Payment)
            .Where(b => b.Registration != null &&
                        (b.Registration.UserId == userId || b.Registration.Email == email))
            .OrderByDescending(b => b.BookedAt)
            .Select(b => new MyBookingDto(
                b.Id,
                b.TicketType != null && b.TicketType.Event != null ? b.TicketType.Event.Title : "Unknown Event",
                b.TicketType != null && b.TicketType.Event != null ? b.TicketType.Event.StartDateTime : b.BookedAt,
                b.TicketType != null && b.TicketType.Event != null ? b.TicketType.Event.EndDateTime : b.BookedAt,
                b.Quantity,
                b.TotalAmount,
                b.Status.ToString(),
                b.BookedAt,
                b.IsPaid,
                b.Payment != null ? b.Payment.PaymentMethod : null,
                b.TicketType != null && b.TicketType.Event != null ? b.TicketType.Event.PaymentInstructions : null
            ))
            .ToListAsync();

        return Ok(bookings);
    }

    // Public guest checkout: create registration and booking, mark paid (mock)
    [AllowAnonymous]
    [HttpPost("guest-checkout")]
    public async Task<IActionResult> GuestCheckout([FromBody] GuestCheckoutDto dto)
    {
        // If the caller is actually logged in (our React app always sends a
        // token here even though the route allows anonymous access too),
        // link the registration to their account so "my bookings" and
        // reviews can find it later.
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        int? authenticatedUserId = int.TryParse(userIdClaim, out var uid) ? uid : null;

        // Find or create registration for this email + event
        var existing = await _context.Registrations.FirstOrDefaultAsync(r => r.EventId == dto.EventId && r.Email == dto.Email);
        Registration registration = existing ?? new Registration
        {
            FullName = dto.FullName,
            Email = dto.Email,
            Phone = dto.Phone,
            EventId = dto.EventId,
            UserId = authenticatedUserId,
            RegisteredAt = DateTime.UtcNow
        };

        if (existing == null)
        {
            await _context.Registrations.AddAsync(registration);
            await _context.SaveChangesAsync();
        }
        else if (existing.UserId == null && authenticatedUserId != null)
        {
            // Self-heal: this registration was created before this link existed.
            existing.UserId = authenticatedUserId;
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

        if (ev != null)
        {
            var allowed = await _mediator.Send(new CheckEventAccessQuery(ev.Id, authenticatedUserId));
            if (!allowed)
                return BadRequest("This event is restricted to a specific group you're not a member of.");
        }

        // Only truly-free events get auto-confirmed on click. A paid event
        // requires the organiser to actually confirm the payment was
        // received before the seat is finalised (see ConfirmPayment below) —
        // typing something into the payment-method box is just the attendee
        // declaring how they intend to pay, not an actual payment.
        var isFreeEvent = ev == null || ev.Price <= 0;
        if (!isFreeEvent && string.IsNullOrWhiteSpace(dto.PaymentMethod))
            return BadRequest("Please specify how you'll pay before reserving a spot on a paid event.");

        var bookingDto = new CreateBookingDto(registration.Id, ticketType.Id, dto.Quantity, isFreeEvent, dto.PaymentMethod);

        // Use mediator to create booking via existing handler
        var response = await _mediator.Send(new CreateBookingCommand(bookingDto));

        return CreatedAtAction(nameof(GetBooking), new { id = response.Id }, response);
    }

    // Bookings awaiting the organiser's payment confirmation. Admins see
    // every organiser's pending bookings; organisers see only their own
    // events'.
    [HttpGet("pending-payments")]
    [Authorize(Roles = "Admin,Organizer")]
    public async Task<ActionResult<List<PendingPaymentDto>>> GetPendingPayments()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        int.TryParse(userIdClaim, out var userId);
        var isAdmin = User.IsInRole("Admin");

        var query = _context.Bookings
            .AsNoTracking()
            .Include(b => b.Registration)
            .Include(b => b.TicketType).ThenInclude(t => t!.Event)
            .Include(b => b.Payment)
            .Where(b => !b.IsPaid && b.Status != BookingStatus.Cancelled &&
                        b.TicketType != null && b.TicketType.Event != null);

        if (!isAdmin)
            query = query.Where(b => b.TicketType!.Event!.OrganizerId == userId);

        var pending = await query
            .OrderByDescending(b => b.BookedAt)
            .Select(b => new PendingPaymentDto(
                b.Id,
                b.TicketType!.Event!.Title,
                b.Registration != null ? b.Registration.FullName : "Unknown",
                b.Registration != null ? b.Registration.Email : "",
                b.Quantity,
                b.TotalAmount,
                b.Payment != null ? b.Payment.PaymentMethod : null,
                b.BookedAt
            ))
            .ToListAsync();

        return Ok(pending);
    }

    // The organiser (or an admin) confirms an attendee's payment was
    // actually received. Only now does the booking count as paid/confirmed.
    [HttpPut("{id:int}/confirm-payment")]
    [Authorize(Roles = "Admin,Organizer")]
    public async Task<IActionResult> ConfirmPayment(int id)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        int.TryParse(userIdClaim, out var userId);
        var isAdmin = User.IsInRole("Admin");

        var booking = await _context.Bookings
            .Include(b => b.Registration)
            .Include(b => b.TicketType).ThenInclude(t => t!.Event)
            .Include(b => b.Payment)
            .FirstOrDefaultAsync(b => b.Id == id);

        if (booking == null) return NotFound();
        if (booking.TicketType?.Event == null) return NotFound("Event for this booking could not be found.");

        if (!isAdmin && booking.TicketType.Event.OrganizerId != userId)
            return Forbid();

        if (booking.Status == BookingStatus.Cancelled)
            return BadRequest("This booking has been cancelled.");

        if (booking.IsPaid)
            return Ok(new { message = "This booking is already confirmed." });

        booking.IsPaid = true;
        booking.Status = BookingStatus.Confirmed;

        if (booking.Payment != null)
        {
            booking.Payment.Status = PaymentStatus.Completed;
            booking.Payment.TransactionReference ??= $"TXN-{Guid.NewGuid():N}".ToUpper();
        }
        else
        {
            _context.Payments.Add(new Payment
            {
                BookingId = booking.Id,
                Amount = booking.TotalAmount,
                PaymentMethod = "Confirmed by organiser",
                Status = PaymentStatus.Completed,
                TransactionReference = $"TXN-{Guid.NewGuid():N}".ToUpper(),
                CreatedAt = DateTime.UtcNow
            });
        }

        await _context.SaveChangesAsync();

        if (booking.Registration != null)
        {
            await _mediator.Publish(new PaymentConfirmedEvent
            {
                BookingId = booking.Id,
                RegistrationEmail = booking.Registration.Email,
                RegistrationName = booking.Registration.FullName,
                EventTitle = booking.TicketType.Event.Title,
                UserId = booking.Registration.UserId
            });
        }

        return Ok(new { message = "Payment confirmed. The booking is now confirmed." });
    }

    [Authorize]
    [HttpPut("{id:int}/cancel")]
    public async Task<IActionResult> CancelBooking(int id)
    {
        await BookingLock.WaitAsync();

        try
        {
            var booking = await _context.Bookings
                .Include(b => b.TicketType).ThenInclude(t => t!.Event)
                .Include(b => b.Registration)
                .FirstOrDefaultAsync(b => b.Id == id);

            if (booking == null)
                return NotFound();

            // Only the attendee who made the booking, the event's organiser, or
            // an admin may cancel it — otherwise any signed-in user could cancel
            // anyone else's reservation just by guessing a booking id.
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            int.TryParse(userIdClaim, out var requestingUserId);
            var isOwner = booking.Registration != null && booking.Registration.UserId == requestingUserId;
            var isOrganiserOfEvent = booking.TicketType?.Event != null && booking.TicketType.Event.OrganizerId == requestingUserId;
            var isAdmin = User.IsInRole("Admin");

            if (!isOwner && !isOrganiserOfEvent && !isAdmin)
                return Forbid();

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