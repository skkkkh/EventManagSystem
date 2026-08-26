using EventManagementSystem.Api.CQRS.Notifications;
using EventManagementSystem.Api.DTOs;
using EventManagementSystem.Api.Models;
using EventManagementSystem.Api.Repositories;
using MediatR;

namespace EventManagementSystem.Api.CQRS.Bookings;

public class CreateBookingCommandHandler : IRequestHandler<CreateBookingCommand, BookingResponseDto>
{
    private readonly IUnitOfWork _uow;
    private readonly IMediator _mediator;

    private static readonly SemaphoreSlim BookingLock = new(1, 1);

    public CreateBookingCommandHandler(IUnitOfWork uow, IMediator mediator)
    {
        _uow = uow;
        _mediator = mediator;
    }

    public async Task<BookingResponseDto> Handle(CreateBookingCommand request, CancellationToken cancellationToken)
    {
        var dto = request.Dto;

        await BookingLock.WaitAsync(cancellationToken);
        try
        {
            var registration = await _uow.Registrations.GetByIdAsync(dto.RegistrationId);
            if (registration is null)
                throw new KeyNotFoundException("Registration not found.");

            var ticketType = await _uow.TicketTypes.GetByIdAsync(dto.TicketTypeId);
            if (ticketType is null)
                throw new KeyNotFoundException("Ticket type not found.");

            var ev = await _uow.Events.GetByIdAsync(ticketType.EventId);
            if (ev != null && ev.EndDateTime < DateTime.UtcNow)
                throw new InvalidOperationException("This event has ended and is no longer accepting bookings");

            if (registration.EventId != ticketType.EventId)
                throw new InvalidOperationException("Registration and ticket type belong to different events.");

            if (ticketType.Quantity < dto.Quantity)
                throw new InvalidOperationException($"Only {ticketType.Quantity} ticket(s) are available.");

            var totalAmount = ticketType.Price * dto.Quantity;

            ticketType.Quantity -= dto.Quantity;
            _uow.TicketTypes.Update(ticketType);

            var booking = new Booking
            {
                RegistrationId = dto.RegistrationId,
                TicketTypeId = dto.TicketTypeId,
                Quantity = dto.Quantity,
                TotalAmount = totalAmount,
                Status = dto.IsPaid ? BookingStatus.Confirmed : BookingStatus.Pending,
                IsPaid = dto.IsPaid,
                BookedAt = DateTime.UtcNow
            };

            await _uow.Bookings.AddAsync(booking);
            await _uow.SaveChangesAsync();

            if (dto.IsPaid)
            {
                var payment = new Payment
                {
                    Booking = booking,
                    Amount = booking.TotalAmount,
                    PaymentMethod = "Card (mock)",
                    Status = PaymentStatus.Completed,
                    TransactionReference = Guid.NewGuid().ToString(),
                    CreatedAt = DateTime.UtcNow
                };

                await _uow.Payments.AddAsync(payment);
                await _uow.SaveChangesAsync();
            }

            // Email confirmation to the registrant
            await _mediator.Publish(new BookingConfirmedEvent
            {
                BookingId = booking.Id,
                RegistrationEmail = registration.Email,
                RegistrationName = registration.FullName,
                EventTitle = ev?.Title ?? "the event"
            }, cancellationToken);

            // Email confirmation to the organizer, keeping them updated on registration activity
            await _mediator.Publish(new OrganizerBookingUpdateEvent
            {
                OrganizerId = ev?.OrganizerId,
                EventTitle = ev?.Title ?? "the event",
                RegistrantName = registration.FullName,
                Quantity = dto.Quantity
            }, cancellationToken);

            // In-app alert to organizer if capacity is now full
            if (ticketType.Quantity == 0)
            {
                await _mediator.Publish(new CapacityReachedEvent
                {
                    EventId = ticketType.EventId,
                    EventTitle = ev?.Title ?? "the event",
                    OrganizerId = ev?.OrganizerId
                }, cancellationToken);
            }

            return new BookingResponseDto(
                booking.Id,
                booking.RegistrationId,
                booking.TicketTypeId,
                booking.Quantity,
                booking.TotalAmount,
                booking.Status.ToString(),
                booking.BookedAt,
                booking.IsPaid
            );
        }
        finally
        {
            BookingLock.Release();
        }
    }
}