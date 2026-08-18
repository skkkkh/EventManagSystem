using EventManagementSystem.Api.DTOs;
using MediatR;

namespace EventManagementSystem.Api.CQRS.Events;

public record CreateEventCommand(CreateEventDto Dto) : IRequest<EventDto>;
