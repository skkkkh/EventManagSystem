using EventManagementSystem.Api.CQRS.Events;
using EventManagementSystem.Api.DTOs;
using EventManagementSystem.Api.Repositories;
using MediatR;

namespace EventManagementSystem.Api.CQRS.Events;

public class GetEventsQueryHandler : IRequestHandler<GetEventsQuery, IReadOnlyList<EventDto>>
{
    private readonly IUnitOfWork _uow;

    public GetEventsQueryHandler(IUnitOfWork uow)
    {
        _uow = uow;
    }

    public async Task<IReadOnlyList<EventDto>> Handle(GetEventsQuery request, CancellationToken cancellationToken)
    {
        var events = await _uow.Events.GetAllAsync();
        return events.Select(EventDto.FromEntity).ToList();
    }
}
