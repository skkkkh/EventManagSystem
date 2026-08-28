using EventManagementSystem.Api.DTOs;
using MediatR;

namespace EventManagementSystem.Api.CQRS.Events;

public record GetUpcomingEventsQuery() : IRequest<IReadOnlyList<EventDto>>;
