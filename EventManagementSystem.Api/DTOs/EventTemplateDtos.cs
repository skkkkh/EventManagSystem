using System.ComponentModel.DataAnnotations;
using EventManagementSystem.Api.Models;

namespace EventManagementSystem.Api.DTOs;

public class CreateCustomFieldDto
{
    [Required, MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    public FieldType FieldType { get; set; } = FieldType.Text;

    public bool IsRequired { get; set; }

    [MaxLength(500)]
    public string? Options { get; set; }
}

public class CreateEventTemplateDto
{
    [Required, MaxLength(150)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(1000)]
    public string? Description { get; set; }

    public List<CreateCustomFieldDto> CustomFields { get; set; } = new();
}

public class CustomFieldDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public FieldType FieldType { get; set; }
    public bool IsRequired { get; set; }
    public string? Options { get; set; }

    public static CustomFieldDto FromEntity(CustomField f) => new()
    {
        Id = f.Id,
        Name = f.Name,
        FieldType = f.FieldType,
        IsRequired = f.IsRequired,
        Options = f.Options
    };
}

public class EventTemplateDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public List<CustomFieldDto> CustomFields { get; set; } = new();

    public static EventTemplateDto FromEntity(EventTemplate t) => new()
    {
        Id = t.Id,
        Name = t.Name,
        Description = t.Description,
        CustomFields = t.CustomFields.Select(CustomFieldDto.FromEntity).ToList()
    };
}
