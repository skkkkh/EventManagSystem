using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace EventManagementSystem.Api.Models;

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

    [Range(0, 100000000)]
    public decimal Price { get; set; } = 0m;

    public bool IsPublished { get; set; }

    public EventCategory Category { get; set; } = EventCategory.Other;


    // If set, only members of this group can see the event. Null = public event.
    public int? GroupId { get; set; }
    public Group? Group { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Made optional so the database/API won't crash if it's missing
    public int? EventTemplateId { get; set; }
    public EventTemplate? EventTemplate { get; set; }

    // Values for the template's custom fields, specific to this event
    public ICollection<EventFieldValue> FieldValues { get; set; } = new List<EventFieldValue>();
}

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum EventCategory
{
    Conference,
    Ceremony,
    Workshop,
    Seminar,
    Other
}
