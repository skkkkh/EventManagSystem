using EventManagementSystem.Api.DTOs;
using MediatR;

namespace EventManagementSystem.Api.CQRS.Groups;

public class AddGroupMemberCommand : IRequest<GroupMemberDto>
{
    public int GroupId { get; set; }
    public AddGroupMemberDto Dto { get; set; } = null!;
    public int RequestingOrganiserId { get; set; }

    public AddGroupMemberCommand(int groupId, AddGroupMemberDto dto, int requestingOrganiserId)
    {
        GroupId = groupId;
        Dto = dto;
        RequestingOrganiserId = requestingOrganiserId;
    }
}