using EventManagementSystem.Api.DTOs;
using EventManagementSystem.Api.Models;
using EventManagementSystem.Api.Repositories;
using MediatR;

namespace EventManagementSystem.Api.CQRS.Bookings;

public class CreateBookingCommandHandler : IRequestHandler<CreateBookingCommand, BookingResponseDto>
{
    private readonly IUnitOfWork _uow;

    // Prevents two booking requests from changing the same
    // ticket inventory at the same time inside this API instance.
    // (Same concurrency guard your controller used to have.)
    private static readonly SemaphoreSlim BookingLock = new(1, 1);

    public CreateBookingCommandHandler(IUnitOfWork uow)
    {
        _uow = uow;
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
                Status = BookingStatus.Pending,
                BookedAt = DateTime.UtcNow
            };

            await _uow.Bookings.AddAsync(booking);
            await _uow.SaveChangesAsync();

            return new BookingResponseDto(
                booking.Id,
                booking.RegistrationId,
                booking.TicketTypeId,
                booking.Quantity,
                booking.TotalAmount,
                booking.Status.ToString(),
                booking.BookedAt
            );
        }
        finally
        {
            BookingLock.Release();
        }
    }
}