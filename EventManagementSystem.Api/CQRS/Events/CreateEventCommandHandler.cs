using EventManagementSystem.Api.CQRS.Events;
using EventManagementSystem.Api.DTOs;
using EventManagementSystem.Api.Models;
using EventManagementSystem.Api.Repositories;
using MediatR;

namespace EventManagementSystem.Api.CQRS.Events;

public class CreateEventCommandHandler : IRequestHandler<CreateEventCommand, EventDto>
{
    private readonly IUnitOfWork _uow;

    public CreateEventCommandHandler(IUnitOfWork uow)
    {
        _uow = uow;
    }

    public async Task<EventDto> Handle(CreateEventCommand request, CancellationToken cancellationToken)
    {
        var dto = request.Dto;

        var template = await _uow.EventTemplates.GetByIdAsync(dto.EventTemplateId);
        if (template is null) throw new InvalidOperationException($"EventTemplate {dto.EventTemplateId} does not exist.");

        if (dto.EndDateTime <= dto.StartDateTime) throw new InvalidOperationException("EndDateTime must be after StartDateTime.");

        // Validation: each CustomFieldId provided must belong to the template
        var templateFieldIds = template.CustomFields.Select(cf => cf.Id).ToHashSet();
        foreach (var fv in dto.FieldValues)
        {
            if (!templateFieldIds.Contains(fv.CustomFieldId))
            {
                throw new InvalidOperationException($"CustomFieldId {fv.CustomFieldId} is not defined on template {template.Id}.");
            }
        }

        // Validation: all required custom fields must have a non-null/whitespace value present
        var requiredFields = template.CustomFields.Where(cf => cf.IsRequired).ToList();
        foreach (var req in requiredFields)
        {
            var provided = dto.FieldValues.FirstOrDefault(f => f.CustomFieldId == req.Id);
            if (provided is null || string.IsNullOrWhiteSpace(provided.Value))
            {
                throw new InvalidOperationException($"Required custom field '{req.Name}' (id={req.Id}) is missing or empty.");
            }
        }

        var entity = new Event
        {
            Title = dto.Title,
            Description = dto.Description,
            Location = dto.Location,
            StartDateTime = dto.StartDateTime,
            EndDateTime = dto.EndDateTime,
            Capacity = dto.Capacity,
            EventTemplateId = dto.EventTemplateId,
            FieldValues = dto.FieldValues.Select(v => new EventFieldValue { CustomFieldId = v.CustomFieldId, Value = v.Value }).ToList()
        };

        await _uow.Events.AddAsync(entity);
        await _uow.SaveChangesAsync();

        return EventDto.FromEntity(entity);
    }
}
