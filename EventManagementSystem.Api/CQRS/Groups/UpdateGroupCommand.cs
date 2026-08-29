using EventManagementSystem.Api.DTOs;
using MediatR;

namespace EventManagementSystem.Api.CQRS.Groups;

public class UpdateGroupCommand : IRequest<GroupDto>
{
    public int GroupId { get; set; }
    public UpdateGroupDto Dto { get; set; } = null!;
    public int RequestingOrganiserId { get; set; }

    public UpdateGroupCommand(int groupId, UpdateGroupDto dto, int requestingOrganiserId)
    {
        GroupId = groupId;
        Dto = dto;
        RequestingOrganiserId = requestingOrganiserId;
    }
}
