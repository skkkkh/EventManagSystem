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

    // Navigation
    // Free-text interests the user provides themselves — e.g. "tech, science, entertainment".
    // Used by the recommendation engine alongside past booking history.
    [MaxLength(500)]
    public string? Interests { get; set; }

    public ICollection<Notification> Notifications { get; set; }
        = new List<Notification>();

    public ICollection<Registration> Registrations { get; set; }
        = new List<Registration>();
}