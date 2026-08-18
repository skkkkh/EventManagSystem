using EventManagementSystem.Api.Repositories;
using MediatR;

namespace EventManagementSystem.Api.CQRS.Bookings;

public class GetAvailableSeatsQueryHandler : IRequestHandler<GetAvailableSeatsQuery, int>
{
    private readonly IUnitOfWork _uow;

    public GetAvailableSeatsQueryHandler(IUnitOfWork uow)
    {
        _uow = uow;
    }

    public async Task<int> Handle(GetAvailableSeatsQuery request, CancellationToken cancellationToken)
    {
        var ticketType = await _uow.TicketTypes.GetByIdAsync(request.TicketTypeId);
        if (ticketType is null)
            throw new KeyNotFoundException("Ticket type not found.");

        // Quantity on TicketType already represents remaining seats —
        // it's decremented every time a booking is created.
        return ticketType.Quantity;
    }
}