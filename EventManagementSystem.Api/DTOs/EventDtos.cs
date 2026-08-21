using System.ComponentModel.DataAnnotations;
using EventManagementSystem.Api.Models;

namespace EventManagementSystem.Api.DTOs;

public record CustomFieldValueDto(int CustomFieldId, string? Value);

public class CreateEventDto
{
    [Required, MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [MaxLength(2000)]
    public string? Description { get; set; }

    [MaxLength(300)]
    public string? Location { get; set; }

    [Required]
    public DateTime StartDateTime { get; set; }

    [Required]
    public DateTime EndDateTime { get; set; }

    [Range(1, int.MaxValue)]
    public int Capacity { get; set; }

    [Required]
    public int EventTemplateId { get; set; }

    public List<CustomFieldValueDto> FieldValues { get; set; } = new();
}

public class UpdateEventDto
{
    [Required, MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [MaxLength(2000)]
    public string? Description { get; set; }

    [MaxLength(300)]
    public string? Location { get; set; }

    public DateTime StartDateTime { get; set; }
    public DateTime EndDateTime { get; set; }

    [Range(1, int.MaxValue)]
    public int Capacity { get; set; }

    public bool IsPublished { get; set; }

    public List<CustomFieldValueDto> FieldValues { get; set; } = new();
}

public class EventDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Location { get; set; }
    public DateTime StartDateTime { get; set; }
    public DateTime EndDateTime { get; set; }
    public int Capacity { get; set; }
    public bool IsPublished { get; set; }
    public int? EventTemplateId { get; set; }
    public string? EventTemplateName { get; set; }
    public List<CustomFieldValueDto> FieldValues { get; set; } = new();

    public static EventDto FromEntity(Event e) => new()
    {
        Id = e.Id,
        Title = e.Title,
        Description = e.Description,
        Location = e.Location,
        StartDateTime = e.StartDateTime,
        EndDateTime = e.EndDateTime,
        Capacity = e.Capacity,
        IsPublished = e.IsPublished,
        EventTemplateId = e.EventTemplateId,
        EventTemplateName = e.EventTemplate?.Name,
        FieldValues = e.FieldValues
            .Select(v => new CustomFieldValueDto(v.CustomFieldId, v.Value))
            .ToList()
    };
}
