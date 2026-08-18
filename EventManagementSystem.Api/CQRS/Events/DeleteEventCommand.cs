using MediatR;

namespace EventManagementSystem.Api.CQRS.Events;

public record DeleteEventCommand(int Id) : IRequest<Unit>;
