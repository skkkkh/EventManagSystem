using System.ComponentModel.DataAnnotations;

namespace EventManagementSystem.Api.Models;

public class Group
{
    public int Id { get; set; }

    [Required, MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    // The organiser (a User with Role = "Organizer") who created this group
    public int OrganiserId { get; set; }
    public User? Organiser { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<GroupMember> Members { get; set; } = new List<GroupMember>();
}