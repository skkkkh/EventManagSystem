using System.ComponentModel.DataAnnotations;

namespace EventManagementSystem.Api.Models;

/// <summary>
/// The central entity of the whole system. Registration, Booking, and
/// Payment (owned by the CS student) all foreign-key into this table,
/// so its shape needs to be agreed on by the whole team before anyone
/// else's migrations can be written.
/// </summary>
public class Event
{
    public int Id { get; set; }

    [Required, MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [MaxLength(2000)]
    public string? Description { get; set; }

    [MaxLength(300)]
    public string? Location { get; set; }

    public DateTime StartDateTime { get; set; }
    public DateTime EndDateTime { get; set; }

    /// <summary>Max attendees. Booking module reads this to enforce capacity.</summary>
    public int Capacity { get; set; }

    public bool IsPublished { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // FK to the template this event was created from
    public int EventTemplateId { get; set; }
    public EventTemplate? EventTemplate { get; set; }

    // Values for the template's custom fields, specific to this event
    public ICollection<EventFieldValue> FieldValues { get; set; } = new List<EventFieldValue>();
}
