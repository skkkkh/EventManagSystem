using EventManagementSystem.Api.DTOs;
using MediatR;

namespace EventManagementSystem.Api.CQRS.Events;

// includeExpired: when false (default) return upcoming/non-expired events.
// when true return only expired (past) events.
public record GetEventsQuery(bool IncludeExpired = false) : IRequest<IReadOnlyList<EventDto>>;
