using EventManagementSystem.Api.CQRS.Groups;
using EventManagementSystem.Api.DTOs;
using EventManagementSystem.Api.Models;
using EventManagementSystem.Api.Repositories;
using MediatR;

namespace EventManagementSystem.Api.CQRS.Groups;

public class AddGroupMemberCommandHandler : IRequestHandler<AddGroupMemberCommand, GroupMemberDto>
{
    private readonly IUnitOfWork _uow;

    public AddGroupMemberCommandHandler(IUnitOfWork uow)
    {
        _uow = uow;
    }

    public async Task<GroupMemberDto> Handle(AddGroupMemberCommand request, CancellationToken cancellationToken)
    {
        var group = await _uow.Repository<Group>().GetByIdAsync(request.GroupId);
        if (group is null) throw new InvalidOperationException($"Group {request.GroupId} does not exist.");

        if (group.OrganiserId != request.RequestingOrganiserId)
            throw new UnauthorizedAccessException("Only the organiser who created this group can add members.");

        var user = await _uow.Users.GetByIdAsync(request.Dto.UserId);
        if (user is null) throw new InvalidOperationException($"User {request.Dto.UserId} does not exist.");

        var existing = await _uow.Repository<GroupMember>()
            .FindAsync(gm => gm.GroupId == request.GroupId && gm.UserId == request.Dto.UserId);
        if (existing.Any()) throw new InvalidOperationException("This user is already a member of the group.");

        var entity = new GroupMember
        {
            GroupId = request.GroupId,
            UserId = request.Dto.UserId
        };

        await _uow.Repository<GroupMember>().AddAsync(entity);
        await _uow.SaveChangesAsync();

        return new GroupMemberDto(entity.Id, entity.GroupId, entity.UserId, user.Name, user.Email ?? string.Empty);
    }
}