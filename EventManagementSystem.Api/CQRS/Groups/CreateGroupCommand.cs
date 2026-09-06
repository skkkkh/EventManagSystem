using EventManagementSystem.Api.DTOs;
using MediatR;

namespace EventManagementSystem.Api.CQRS.Groups;

public class CreateGroupCommand : IRequest<GroupDto>
{
    public CreateGroupDto Dto { get; set; } = null!;
    public int OrganiserId { get; set; }

    public CreateGroupCommand(CreateGroupDto dto, int organiserId)
    {
        Dto = dto;
        OrganiserId = organiserId;
    }
}