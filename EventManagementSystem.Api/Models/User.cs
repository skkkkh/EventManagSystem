using Microsoft.AspNetCore.Identity;
using System.ComponentModel.DataAnnotations;

namespace EventManagementSystem.Api.Models;

public class User : IdentityUser<int>
{
    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    // We keep this property because your existing
    // UsersController and DTOs already use it.
    // Actual authorization roles will be handled by ASP.NET Identity.
    [MaxLength(50)]
    public string Role { get; set; } = "Attendee";

    public DateTime RegistrationDate { get; set; } = DateTime.UtcNow;

    // Navigation
    public ICollection<Notification> Notifications { get; set; }
        = new List<Notification>();

    public ICollection<Registration> Registrations { get; set; }
        = new List<Registration>();
}