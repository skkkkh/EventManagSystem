using System.ComponentModel.DataAnnotations;

namespace EventManagementSystem.Api.DTOs;

public class RegisterDto
{
    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    [MinLength(6)]
    public string Password { get; set; } = string.Empty;

    // Optional: caller can request a role at registration time.
    // Defaults to "Attendee" if not provided or not a valid role.
    public string? Role { get; set; }
}

public class LoginDto
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    public string Password { get; set; } = string.Empty;
}

public record AuthResponseDto(
    int UserId,
    string Name,
    string Email,
    IList<string> Roles,
    string Token,
    DateTime ExpiresAt
);