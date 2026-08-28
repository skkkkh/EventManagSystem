using System.ComponentModel.DataAnnotations;

namespace EventManagementSystem.Api.Models;

/// <summary>
/// The kind of value a dynamic field can hold. Drives both validation
/// and how the admin UI renders the field builder.
/// </summary>
public enum FieldType
{
    Text,
    Number,
    Date,
    Boolean,
    Dropdown
}

/// <summary>
/// A single dynamic field defined on an EventTemplate (e.g. "T-Shirt Size",
/// "Dietary Restrictions"). Templates own a collection of these so that
/// every Event created from the template exposes the same custom fields.
/// </summary>
public class CustomField
{
    public int Id { get; set; }

    [Required, MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    public FieldType FieldType { get; set; } = FieldType.Text;

    public bool IsRequired { get; set; }

    /// <summary>
    /// Comma-separated options, only used when FieldType == Dropdown.
    /// Kept as a simple string for now — fine for a 3-week capstone;
    /// a real product would normalize this into its own table.
    /// </summary>
    [MaxLength(500)]
    public string? Options { get; set; }

    // FK back to the owning template
    public int EventTemplateId { get; set; }
    public EventTemplate? EventTemplate { get; set; }
}
