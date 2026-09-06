using System.ComponentModel.DataAnnotations;

namespace EventManagementSystem.Api.DTOs;

public record TeamMemberDto(
    int Id,
    string Name,
    string Title,
    string? PhotoUrl,
    int DisplayOrder
);

public record OrganizerProfileDto(
    int OrganizerId,
    string OrganizerName,
    string? AboutUs,
    List<TeamMemberDto> TeamMembers
);

public record UpdateAboutUsDto(
    [MaxLength(2000)] string? AboutUs
);

public record UpsertTeamMemberDto(
    [Required, MaxLength(150)] string Name,
    [Required, MaxLength(150)] string Title,
    [MaxLength(500)] string? PhotoUrl,
    int DisplayOrder
);
