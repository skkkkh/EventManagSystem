using EventManagementSystem.Api.CQRS.Events;
using EventManagementSystem.Api.DTOs;
using EventManagementSystem.Api.Repositories;
using MediatR;
using System;

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
        var now = DateTime.UtcNow;
        IReadOnlyList<EventManagementSystem.Api.Models.Event> events;

        if (request.IncludeExpired)
        {
            // Return only past/expired events
            events = await _uow.Events.FindAsync(e => e.EndDateTime < now);
        }
        else
        {
            // Default: return only upcoming/non-expired events
            events = await _uow.Events.FindAsync(e => e.EndDateTime >= now);
        }

        return events.Select(EventDto.FromEntity).ToList();
    }
}
