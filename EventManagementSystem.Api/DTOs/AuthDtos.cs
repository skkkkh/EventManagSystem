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

    public string? Phone { get; set; }

    // Optional: caller can request a role at registration time.
    // Defaults to "Attendee" if not provided or not a valid role.
    public string? Role { get; set; }

    // Optional free-text interests, e.g. "tech, science, entertainment"
    [MaxLength(500)]
    public string? Interests { get; set; }

    // Raw identification number (CNIC/student ID/employee ID/etc.).
    // Never stored as-is — hashed immediately in the registration handler.
    [MaxLength(100)]
    public string? IdentificationNumber { get; set; }
}

public class LoginDto
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    public string Password { get; set; } = string.Empty;
}

public class UpdateInterestsDto
{
    [MaxLength(500)]
    public string? Interests { get; set; }
}

// "Personal Information" — the fields a user can edit about themselves.
// Email is deliberately not editable here (it's also the login username).
public class UpdateProfileDto
{
    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(20)]
    public string? Phone { get; set; }
}

public class ForgotPasswordDto
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;
}

public class ResetPasswordDto
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    // The reset code emailed by /auth/forgot-password (Identity's
    // password-reset token, copy-pasted back by the user).
    [Required]
    public string Token { get; set; } = string.Empty;

    [Required]
    [MinLength(6)]
    public string NewPassword { get; set; } = string.Empty;
}

public record AuthResponseDto(
    int UserId,
    string Name,
    string Email,
    IList<string> Roles,
    string Token,
    DateTime ExpiresAt,
    string? Interests,
    string? Phone
);