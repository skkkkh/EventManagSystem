using EventManagementSystem.Api.Models;
using EventManagementSystem.Api.Repositories;
using MediatR;

namespace EventManagementSystem.Api.CQRS.Groups;

public class SetEventGroupCommandHandler : IRequestHandler<SetEventGroupCommand>
{
    private readonly IUnitOfWork _uow;

    public SetEventGroupCommandHandler(IUnitOfWork uow)
    {
        _uow = uow;
    }

    public async Task Handle(SetEventGroupCommand request, CancellationToken cancellationToken)
    {
        var ev = await _uow.Repository<Event>().GetByIdAsync(request.EventId);
        if (ev is null) throw new InvalidOperationException($"Event {request.EventId} does not exist.");

        if (ev.OrganizerId != request.RequestingOrganiserId)
            throw new UnauthorizedAccessException("Only the organiser who owns this event can restrict it to a group.");

        if (request.GroupId is not null)
        {
            var group = await _uow.Repository<Group>().GetByIdAsync(request.GroupId.Value);
            if (group is null) throw new InvalidOperationException($"Group {request.GroupId} does not exist.");
        }

        ev.GroupId = request.GroupId;
        await _uow.SaveChangesAsync();
    }
}