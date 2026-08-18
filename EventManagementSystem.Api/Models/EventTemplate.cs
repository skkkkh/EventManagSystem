using System.ComponentModel.DataAnnotations;

namespace EventManagementSystem.Api.Models;

/// <summary>
/// A reusable blueprint for a category of events (e.g. "Conference",
/// "Wedding", "Workshop"). Defines which custom fields events created
/// from it will carry. This is the config-engine piece of the module.
/// </summary>
public class EventTemplate
{
    public int Id { get; set; }

    [Required, MaxLength(150)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(1000)]
    public string? Description { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public ICollection<CustomField> CustomFields { get; set; } = new List<CustomField>();
    public ICollection<Event> Events { get; set; } = new List<Event>();
}
