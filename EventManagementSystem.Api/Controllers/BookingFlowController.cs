using System.Security.Claims;

using EventManagementSystem.Api.CQRS.Bookings;
using EventManagementSystem.Api.DTOs;
using EventManagementSystem.Api.Models;
using EventManagementSystem.Api.Repositories;
using EventManagementSystem.Api.ViewModels;

using MediatR;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EventManagementSystem.Api.Controllers;

/// <summary>
/// MVC controller for the server-rendered booking flow:
/// pick tickets -> checkout -> payment confirmation.
///
/// Authentication is handled through the MVC authentication cookie.
/// </summary>
[Authorize]
public class BookingFlowController : Controller
{
    private readonly IUnitOfWork _uow;
    private readonly IMediator _mediator;

    public BookingFlowController(
        IUnitOfWork uow,
        IMediator mediator)
    {
        _uow = uow;
        _mediator = mediator;
    }

    // ==================================================
    // GET: /BookingFlow/Book/5
    // ==================================================
    [HttpGet]
    public async Task<IActionResult> Book(int id)
    {
        var eventEntity =
            await _uow.Events.GetByIdAsync(id);

        if (eventEntity is null)
        {
            return NotFound();
        }

        var ticketTypes =
            await _uow.TicketTypes
                .FindAsync(t => t.EventId == id);

        return View(
            new BookEventViewModel
            {
                Event = eventEntity,

                TicketTypes =
                    ticketTypes
                        .OrderBy(t => t.Price)
                        .ToList(),

                Form = new BookingFormModel
                {
                    EventId = id
                }
            });
    }

    // ==================================================
    // POST: /BookingFlow/Book
    // ==================================================
    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Book(
        BookingFormModel form)
    {
        // Get the logged-in user's information
        // from the authentication cookie.
        var userEmail =
            User.FindFirstValue(
                ClaimTypes.Email);

        var userName =
            User.FindFirstValue(
                ClaimTypes.Name);

        if (string.IsNullOrWhiteSpace(userEmail))
        {
            return Unauthorized();
        }

        if (ModelState.IsValid)
        {
            try
            {
                // Find an existing registration using
                // the authenticated user's email.
                //
                // We do NOT trust form.Email anymore.
                var existing =
                    await _uow.Registrations.FindAsync(
                        r =>
                            r.EventId == form.EventId &&
                            r.Email == userEmail);

                var registration =
                    existing.FirstOrDefault();

                // Create registration if it does not exist.
                if (registration is null)
                {
                    registration = new Registration
                    {
                        FullName =
                            userName ?? form.FullName,

                        Email = userEmail,

                        Phone = form.Phone,

                        EventId = form.EventId,

                        RegisteredAt =
                            DateTime.UtcNow
                    };

                    await _uow.Registrations
                        .AddAsync(registration);

                    // Need generated registration ID
                    // before creating the booking.
                    await _uow.SaveChangesAsync();
                }

                // Create booking through CQRS.
                var bookingDto =
                    new CreateBookingDto(
                        registration.Id,
                        form.TicketTypeId,
                        form.Quantity);

                var booking =
                    await _mediator.Send(
                        new CreateBookingCommand(
                            bookingDto));

                return RedirectToAction(
                    nameof(Checkout),
                    new
                    {
                        id = booking.Id
                    });
            }
            catch (Exception ex)
                when (
                    ex is KeyNotFoundException
                    or InvalidOperationException)
            {
                ModelState.AddModelError(
                    string.Empty,
                    ex.Message);
            }
        }

        // If validation fails, reload the event
        // and ticket types for the view.
        var eventEntity =
            await _uow.Events.GetByIdAsync(
                form.EventId);

        if (eventEntity is null)
        {
            return NotFound();
        }

        var ticketTypes =
            await _uow.TicketTypes
                .FindAsync(
                    t => t.EventId == form.EventId);

        return View(
            new BookEventViewModel
            {
                Event = eventEntity,

                TicketTypes =
                    ticketTypes
                        .OrderBy(t => t.Price)
                        .ToList(),

                Form = form
            });
    }

    // ==================================================
    // GET: /BookingFlow/Checkout/7
    // ==================================================
    [HttpGet]
    public async Task<IActionResult> Checkout(int id)
    {
        var booking =
            await _uow.Bookings.GetByIdAsync(id);

        if (booking is null)
        {
            return NotFound();
        }

        if (booking.Status ==
            BookingStatus.Confirmed)
        {
            return RedirectToAction(
                nameof(Confirmation),
                new
                {
                    id = booking.Id
                });
        }

        var ticketType =
            await _uow.TicketTypes
                .GetByIdAsync(
                    booking.TicketTypeId);

        return View(
            new CheckoutViewModel
            {
                Booking = booking,

                TicketTypeName =
                    ticketType?.Name
                    ?? "(unknown ticket type)",

                Form = new PaymentFormModel
                {
                    BookingId = booking.Id
                }
            });
    }

    // ==================================================
    // POST: /BookingFlow/Checkout
    // ==================================================
    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Checkout(
        PaymentFormModel form)
    {
        var booking =
            await _uow.Bookings
                .GetByIdAsync(
                    form.BookingId);

        if (booking is null)
        {
            return NotFound();
        }

        if (booking.Status ==
            BookingStatus.Cancelled)
        {
            ModelState.AddModelError(
                string.Empty,
                "This booking has been cancelled and can't be paid for.");
        }

        var existingPayments =
            await _uow.Payments.FindAsync(
                p => p.BookingId == booking.Id);

        if (existingPayments.Any())
        {
            ModelState.AddModelError(
                string.Empty,
                "A payment already exists for this booking.");
        }

        if (!ModelState.IsValid)
        {
            var ticketType =
                await _uow.TicketTypes
                    .GetByIdAsync(
                        booking.TicketTypeId);

            return View(
                new CheckoutViewModel
                {
                    Booking = booking,

                    TicketTypeName =
                        ticketType?.Name
                        ?? "(unknown ticket type)",

                    Form = form
                });
        }

        var payment = new Payment
        {
            BookingId = booking.Id,

            Amount = booking.TotalAmount,

            PaymentMethod =
                form.PaymentMethod,

            Status =
                PaymentStatus.Completed,

            TransactionReference =
                $"TXN-{Guid.NewGuid():N}".ToUpper(),

            CreatedAt =
                DateTime.UtcNow
        };

        booking.Status =
            BookingStatus.Confirmed;

        _uow.Bookings.Update(booking);

        await _uow.Payments
            .AddAsync(payment);

        await _uow.SaveChangesAsync();

        return RedirectToAction(
            nameof(Confirmation),
            new
            {
                id = booking.Id
            });
    }

    // ==================================================
    // GET: /BookingFlow/Confirmation/7
    // ==================================================
    [HttpGet]
    public async Task<IActionResult> Confirmation(
        int id)
    {
        var booking =
            await _uow.Bookings
                .GetByIdAsync(id);

        if (booking is null)
        {
            return NotFound();
        }

        var payment =
            (await _uow.Payments
                .FindAsync(
                    p => p.BookingId == id))
                .FirstOrDefault();

        var ticketType =
            await _uow.TicketTypes
                .GetByIdAsync(
                    booking.TicketTypeId);

        return View(
            new ConfirmationViewModel
            {
                Booking = booking,

                Payment = payment,

                TicketTypeName =
                    ticketType?.Name
                    ?? "(unknown ticket type)"
            });
    }
}