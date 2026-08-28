using System.ComponentModel.DataAnnotations;
using System.Linq;
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

    [MaxLength(200)]
    public string? Organizer { get; set; } // Added

    [MaxLength(2000)]
    public string? ImageUrl { get; set; }

    [Required]
    public DateTime StartDateTime { get; set; }

    [Required]
    public DateTime EndDateTime { get; set; }

    [Range(0, int.MaxValue)]
    public int Capacity { get; set; }

    [Required]
    public int EventTemplateId { get; set; }

    public string? Category { get; set; }

    [Range(0, double.MaxValue)]
    public decimal Price { get; set; }

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

    [MaxLength(200)]
    public string? Organizer { get; set; } // Added

    [MaxLength(2000)]
    public string? ImageUrl { get; set; }

    public DateTime StartDateTime { get; set; }
    public DateTime EndDateTime { get; set; }

    [Range(0, int.MaxValue)]
    public int Capacity { get; set; }

    public bool IsPublished { get; set; }

    public string? Category { get; set; }

    [Range(0, double.MaxValue)]
    public decimal Price { get; set; }

    public List<CustomFieldValueDto> FieldValues { get; set; } = new();
}

public class EventDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Location { get; set; }
    public string? Organizer { get; set; } // Added
    public string? ImageUrl { get; set; }
    public DateTime StartDateTime { get; set; }
    public DateTime EndDateTime { get; set; }
    public int Capacity { get; set; }
    public bool IsPublished { get; set; }
    public int? EventTemplateId { get; set; }
    public string? EventTemplateName { get; set; }
    public List<CustomFieldValueDto> FieldValues { get; set; } = new();

    public string Category { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public int SeatsRemaining { get; set; }
    public string StartDateTimeFormatted => StartDateTime.ToString("f");
    public string EndDateTimeFormatted => EndDateTime.ToString("f");
    public bool IsExpired { get; set; }

    public static EventDto FromEntity(Event e) => new()
    {
        Id = e.Id,
        Title = e.Title,
        Description = e.Description,
        Location = e.Location,
        Organizer = e.Organizer, // Added mapping
        ImageUrl = e.ImageUrl,
        StartDateTime = e.StartDateTime,
        EndDateTime = e.EndDateTime,
        Capacity = e.Capacity,
        IsPublished = e.IsPublished,
        EventTemplateId = e.EventTemplateId,
        EventTemplateName = e.EventTemplate?.Name,
        FieldValues = e.FieldValues
            .Select(v => new CustomFieldValueDto(v.CustomFieldId, v.Value))
            .ToList(),
        Category = e.Category.ToString(),
        Price = e.Price,
        IsExpired = e.EndDateTime < DateTime.UtcNow
    };
}