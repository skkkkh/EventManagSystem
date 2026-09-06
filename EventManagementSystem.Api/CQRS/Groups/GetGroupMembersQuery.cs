using EventManagementSystem.Api.DTOs;
using EventManagementSystem.Api.Models;
using EventManagementSystem.Api.Repositories;
using MediatR;

namespace EventManagementSystem.Api.CQRS.Groups;

public class GetGroupMembersQuery : IRequest<List<GroupMemberDto>>
{
    public int GroupId { get; set; }
    public GetGroupMembersQuery(int groupId) => GroupId = groupId;
}

public class GetGroupMembersQueryHandler : IRequestHandler<GetGroupMembersQuery, List<GroupMemberDto>>
{
    private readonly IUnitOfWork _uow;
    public GetGroupMembersQueryHandler(IUnitOfWork uow) => _uow = uow;

    public async Task<List<GroupMemberDto>> Handle(GetGroupMembersQuery request, CancellationToken cancellationToken)
    {
        var members = await _uow.Repository<GroupMember>().FindAsync(gm => gm.GroupId == request.GroupId);
        var result = new List<GroupMemberDto>();
        foreach (var m in members)
        {
            var user = await _uow.Users.GetByIdAsync(m.UserId);
            result.Add(new GroupMemberDto(m.Id, m.GroupId, m.UserId, user?.Name ?? "", user?.Email ?? ""));
        }
        return result;
    }
}