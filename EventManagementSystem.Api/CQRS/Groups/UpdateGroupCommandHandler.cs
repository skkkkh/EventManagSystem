using EventManagementSystem.Api.DTOs;
using EventManagementSystem.Api.Models;
using EventManagementSystem.Api.Repositories;
using MediatR;

namespace EventManagementSystem.Api.CQRS.Groups;

public class UpdateGroupCommandHandler : IRequestHandler<UpdateGroupCommand, GroupDto>
{
    private readonly IUnitOfWork _uow;

    public UpdateGroupCommandHandler(IUnitOfWork uow)
    {
        _uow = uow;
    }

    public async Task<GroupDto> Handle(UpdateGroupCommand request, CancellationToken cancellationToken)
    {
        var group = await _uow.Repository<Group>().GetByIdAsync(request.GroupId);
        if (group is null) throw new InvalidOperationException($"Group {request.GroupId} does not exist.");

        if (group.OrganiserId != request.RequestingOrganiserId)
            throw new UnauthorizedAccessException("Only the organiser who created this group can edit it.");

        group.Name = request.Dto.Name;
        _uow.Repository<Group>().Update(group);
        await _uow.SaveChangesAsync();

        // group.Members isn't eager-loaded by the generic repository, so
        // count members with a separate query instead of trusting it.
        var members = await _uow.Repository<GroupMember>().FindAsync(gm => gm.GroupId == group.Id);
        return new GroupDto(group.Id, group.Name, group.OrganiserId, group.CreatedAt, members.Count);
    }
}
