using EventManagementSystem.Api.DTOs;
using MediatR;

namespace EventManagementSystem.Api.CQRS.Events;

public record GetEventsQuery() : IRequest<IReadOnlyList<EventDto>>;
