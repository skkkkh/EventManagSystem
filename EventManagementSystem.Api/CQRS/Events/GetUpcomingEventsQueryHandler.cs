using EventManagementSystem.Api.CQRS.Events;
using EventManagementSystem.Api.DTOs;
using EventManagementSystem.Api.Repositories;
using MediatR;

namespace EventManagementSystem.Api.CQRS.Events;

public class GetUpcomingEventsQueryHandler : IRequestHandler<GetUpcomingEventsQuery, IReadOnlyList<EventDto>>
{
    private readonly IUnitOfWork _uow;

    public GetUpcomingEventsQueryHandler(IUnitOfWork uow)
    {
        _uow = uow;
    }

    public async Task<IReadOnlyList<EventDto>> Handle(GetUpcomingEventsQuery request, CancellationToken cancellationToken)
    {
        var events = await _uow.Events.FindAsync(e => e.StartDateTime >= DateTime.UtcNow && e.IsPublished);
        return events.OrderBy(e => e.StartDateTime).Select(EventDto.FromEntity).ToList();
    }
}
