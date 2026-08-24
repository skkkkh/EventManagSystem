using EventManagementSystem.Api.CQRS.Events;
using EventManagementSystem.Api.DTOs;
using EventManagementSystem.Api.Models;
using EventManagementSystem.Api.Repositories;
using MediatR;
using Microsoft.Extensions.Logging;

namespace EventManagementSystem.Api.CQRS.Events;

public class UpdateEventCommandHandler : IRequestHandler<UpdateEventCommand, Unit>
{
    private readonly IUnitOfWork _uow;
    private readonly ILogger<UpdateEventCommandHandler> _logger;

    public UpdateEventCommandHandler(
        IUnitOfWork uow,
        ILogger<UpdateEventCommandHandler> logger)
    {
        _uow = uow;
        _logger = logger;
    }

    public async Task<Unit> Handle(
        UpdateEventCommand request,
        CancellationToken cancellationToken)
    {
        var dto = request.Dto;

        var entity = await _uow.Events.GetByIdAsync(request.Id);

        if (entity is null)
            throw new InvalidOperationException(
                $"Event {request.Id} does not exist.");

        if (dto.EndDateTime <= dto.StartDateTime)
            throw new InvalidOperationException(
                "EndDateTime must be after StartDateTime.");

        // ---- DEBUG: log incoming field values before touching the DB ----
        _logger.LogInformation(
            "UpdateEvent {EventId}: EventTemplateId={TemplateId}, incoming FieldValues=[{FieldValues}]",
            entity.Id,
            entity.EventTemplateId,
            string.Join(", ", dto.FieldValues.Select(v => $"CustomFieldId={v.CustomFieldId}, Value={v.Value}")));

        Console.WriteLine(
            $"[DEBUG] UpdateEvent {entity.Id}: EventTemplateId={entity.EventTemplateId}, " +
            $"incoming FieldValues=[{string.Join(", ", dto.FieldValues.Select(v => $"CustomFieldId={v.CustomFieldId}, Value={v.Value}"))}]");

        // ---- VALIDATION: make sure every CustomFieldId actually belongs
        //      to this event's template, otherwise SQLite throws a raw
        //      FOREIGN KEY error instead of a clear message ----
        if (entity.EventTemplateId.HasValue)
        {
            var allCustomFields = await _uow.CustomFields.GetAllAsync();

            var validFieldIds = allCustomFields
                .Where(cf => cf.EventTemplateId == entity.EventTemplateId.Value)
                .Select(cf => cf.Id)
                .ToHashSet();

            var invalidIds = dto.FieldValues
                .Select(v => v.CustomFieldId)
                .Where(id => !validFieldIds.Contains(id))
                .Distinct()
                .ToList();

            if (invalidIds.Any())
            {
                _logger.LogWarning(
                    "UpdateEvent {EventId}: rejected invalid CustomFieldId(s): {InvalidIds}. Valid ids for template {TemplateId} are: {ValidIds}",
                    entity.Id,
                    string.Join(", ", invalidIds),
                    entity.EventTemplateId,
                    string.Join(", ", validFieldIds));

                throw new InvalidOperationException(
                    $"Invalid CustomFieldId(s) for this event's template: {string.Join(", ", invalidIds)}. " +
                    "The field list sent from the client is out of date - refresh the template's custom fields before saving.");
            }
        }
        else if (dto.FieldValues.Any())
        {
            _logger.LogWarning(
                "UpdateEvent {EventId}: has no EventTemplateId but received {Count} field values - ignoring them.",
                entity.Id,
                dto.FieldValues.Count);
        }

        entity.Title = dto.Title;
        entity.Description = dto.Description;
        entity.Location = dto.Location;
        entity.StartDateTime = dto.StartDateTime;
        entity.EndDateTime = dto.EndDateTime;
        entity.Capacity = dto.Capacity;
        entity.IsPublished = dto.IsPublished;

        // Update event image
        entity.ImageUrl = dto.ImageUrl;

        // Replace field values
        var existing = entity.FieldValues.ToList();

        foreach (var ev in existing)
        {
            _uow.EventFieldValues.Remove(ev);
        }

        entity.FieldValues = entity.EventTemplateId.HasValue
            ? dto.FieldValues
                .Select(v => new EventFieldValue
                {
                    EventId = entity.Id,
                    CustomFieldId = v.CustomFieldId,
                    Value = v.Value
                })
                .ToList()
            : new List<EventFieldValue>();

        _uow.Events.Update(entity);

        await _uow.SaveChangesAsync();

        return Unit.Value;
    }
}