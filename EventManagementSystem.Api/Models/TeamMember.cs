using System.ComponentModel.DataAnnotations;

namespace EventManagementSystem.Api.Models;

// A person shown in an organiser's public "About Us" leadership section
// (e.g. a university society's head/sub-head). Purely display content for
// that organiser's profile — not a real user account, so members don't
// sign up or log in themselves.
public class TeamMember
{
    public int Id { get; set; }

    // The organiser (a User with Role = "Organizer") this leadership team
    // belongs to.
    public int OrganizerId { get; set; }
    public User? Organizer { get; set; }

    [Required, MaxLength(150)]
    public string Name { get; set; } = string.Empty;

    [Required, MaxLength(150)]
    public string Title { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? PhotoUrl { get; set; }

    // Lower numbers show first — lets the organiser rank their top 3/5
    // (head, sub-head, etc.) instead of relying on insertion order.
    public int DisplayOrder { get; set; } = 0;
}
