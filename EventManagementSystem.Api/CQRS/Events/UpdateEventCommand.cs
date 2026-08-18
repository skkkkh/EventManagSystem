using EventManagementSystem.Api.DTOs;
using MediatR;

namespace EventManagementSystem.Api.CQRS.Events;

public record UpdateEventCommand(int Id, UpdateEventDto Dto) : IRequest<Unit>;
