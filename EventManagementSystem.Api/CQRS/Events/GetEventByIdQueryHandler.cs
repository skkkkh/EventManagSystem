using EventManagementSystem.Api.CQRS.Events;
using EventManagementSystem.Api.DTOs;
using EventManagementSystem.Api.Repositories;
using MediatR;

namespace EventManagementSystem.Api.CQRS.Events;

public class GetEventByIdQueryHandler : IRequestHandler<GetEventByIdQuery, EventDto?>
{
    private readonly IUnitOfWork _uow;

    public GetEventByIdQueryHandler(IUnitOfWork uow)
    {
        _uow = uow;
    }

    public async Task<EventDto?> Handle(GetEventByIdQuery request, CancellationToken cancellationToken)
    {
        var ev = await _uow.Events.GetByIdAsync(request.Id);
        if (ev is null) return null;
        return EventDto.FromEntity(ev);
    }
}
