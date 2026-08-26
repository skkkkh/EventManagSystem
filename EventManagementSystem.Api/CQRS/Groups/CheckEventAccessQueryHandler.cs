using EventManagementSystem.Api.Models;
using EventManagementSystem.Api.Repositories;
using MediatR;

namespace EventManagementSystem.Api.CQRS.Groups;

public class CheckEventAccessQueryHandler : IRequestHandler<CheckEventAccessQuery, bool>
{
    private readonly IUnitOfWork _uow;

    public CheckEventAccessQueryHandler(IUnitOfWork uow)
    {
        _uow = uow;
    }

    public async Task<bool> Handle(CheckEventAccessQuery request, CancellationToken cancellationToken)
    {
        var ev = await _uow.Repository<Event>().GetByIdAsync(request.EventId);
        if (ev is null) return false;

        // No restriction — open to everyone.
        if (ev.GroupId is null) return true;

        // Restricted, but nobody's logged in.
        if (request.UserId is null) return false;

        // The organiser who owns the event can always see it.
        if (ev.OrganizerId == request.UserId) return true;

        var membership = await _uow.Repository<GroupMember>()
            .FindAsync(gm => gm.GroupId == ev.GroupId && gm.UserId == request.UserId);

        return membership.Any();
    }
}