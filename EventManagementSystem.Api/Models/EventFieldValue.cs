namespace EventManagementSystem.Api.Models;

/// <summary>
/// The actual value an event organizer entered for one of the template's
/// custom fields (e.g. Event #12, field "Dress Code" -> "Black Tie").
/// Stored as a plain string; the FieldType on CustomField tells you how
/// to parse/validate it.
/// </summary>
public class EventFieldValue
{
    public int Id { get; set; }

    public int EventId { get; set; }
    public Event? Event { get; set; }

    public int CustomFieldId { get; set; }
    public CustomField? CustomField { get; set; }

    public string? Value { get; set; }
}
