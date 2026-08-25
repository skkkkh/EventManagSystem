using System.ComponentModel.DataAnnotations;
using EventManagementSystem.Api.Models;

namespace EventManagementSystem.Api.DTOs;

public class CreateGroupDto
{
    [Required, MaxLength(200)]
    public string Name { get; set; } = string.Empty;
}

public record GroupDto(
    int Id,
    string Name,
    int OrganiserId,
    DateTime CreatedAt,
    int MemberCount
)
{
    public static GroupDto FromEntity(Group group) => new(
        group.Id,
        group.Name,
        group.OrganiserId,
        group.CreatedAt,
        group.Members.Count
    );
}