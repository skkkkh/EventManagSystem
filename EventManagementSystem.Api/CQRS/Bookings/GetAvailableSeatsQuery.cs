using MediatR;

namespace EventManagementSystem.Api.CQRS.Bookings;

/// <summary>
/// Query to get the number of seats remaining for a given ticket type.
/// </summary>
public record GetAvailableSeatsQuery(int TicketTypeId) : IRequest<int>;