using EventManagementSystem.Api.Models;
using EventManagementSystem.Api.Repositories;
using MediatR;

namespace EventManagementSystem.Api.CQRS.Groups;

public class DeleteGroupCommandHandler : IRequestHandler<DeleteGroupCommand>
{
    private readonly IUnitOfWork _uow;

    public DeleteGroupCommandHandler(IUnitOfWork uow)
    {
        _uow = uow;
    }

    public async Task Handle(DeleteGroupCommand request, CancellationToken cancellationToken)
    {
        var group = await _uow.Repository<Group>().GetByIdAsync(request.GroupId);
        if (group is null) throw new InvalidOperationException($"Group {request.GroupId} does not exist.");

        if (group.OrganiserId != request.RequestingOrganiserId)
            throw new UnauthorizedAccessException("Only the organiser who created this group can delete it.");

        // Deleting a group cascades to its GroupMembers and sets GroupId to
        // null on any events that were restricted to it (see AppDbContext
        // FK configuration) — so this is always safe to do directly.
        _uow.Repository<Group>().Remove(group);
        await _uow.SaveChangesAsync();
    }
}
