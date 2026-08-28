using Microsoft.AspNetCore.Identity;
using System.ComponentModel.DataAnnotations;

namespace EventManagementSystem.Api.Models;

public class User : IdentityUser<int>
{
    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(50)]
    public string Role { get; set; } = "Attendee";

    public DateTime RegistrationDate { get; set; } = DateTime.UtcNow;

    [MaxLength(20)]
    public string? Phone { get; set; }

    public bool IsValidated { get; set; } = false;

    public bool BiometricEnabled { get; set; } = false;

    // Free-text interests the user provides themselves — e.g. "tech, science, entertainment".
    // Used by the recommendation engine alongside past booking history.
    [MaxLength(500)]
    public string? Interests { get; set; }

    // Salted hash of the user's identification number (CNIC/student ID/employee ID/etc.).
    // Verification-only — the raw value is never stored, so it can't be recovered or displayed.
    [MaxLength(500)]
    public string? IdentificationNumberHash { get; set; }

    // Last 4 characters of the ID number, stored in plain text purely so admins
    // can visually reference a record ("...ending in 5678") without exposing the full value.
    [MaxLength(10)]
    public string? IdentificationNumberLast4 { get; set; }

    public ICollection<Notification> Notifications { get; set; }
        = new List<Notification>();

    public ICollection<Registration> Registrations { get; set; }
        = new List<Registration>();
}