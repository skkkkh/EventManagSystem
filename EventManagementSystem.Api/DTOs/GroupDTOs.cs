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

public class AddGroupMemberDto
{
    [Required]
    public int UserId { get; set; }
}

public record GroupMemberDto(
    int Id,
    int GroupId,
    int UserId,
    string UserName,
    string UserEmail
)
{
    public static GroupMemberDto FromEntity(GroupMember member) => new(
        member.Id,
        member.GroupId,
        member.UserId,
        member.User?.Name ?? string.Empty,
        member.User?.Email ?? string.Empty
    );
}