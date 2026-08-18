using EventManagementSystem.Api.DTOs;
using MediatR;

namespace EventManagementSystem.Api.CQRS.Events;

public record GetEventByIdQuery(int Id) : IRequest<EventDto?>;
