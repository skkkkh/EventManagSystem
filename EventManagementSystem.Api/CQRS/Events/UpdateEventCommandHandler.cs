using EventManagementSystem.Api.CQRS.Events;
using EventManagementSystem.Api.DTOs;
using EventManagementSystem.Api.Models;
using EventManagementSystem.Api.Repositories;
using MediatR;

namespace EventManagementSystem.Api.CQRS.Events;

public class UpdateEventCommandHandler : IRequestHandler<UpdateEventCommand, Unit>
{
    private readonly IUnitOfWork _uow;

    public UpdateEventCommandHandler(IUnitOfWork uow)
    {
        _uow = uow;
    }

    public async Task<Unit> Handle(UpdateEventCommand request, CancellationToken cancellationToken)
    {
        var dto = request.Dto;
        var entity = await _uow.Events.GetByIdAsync(request.Id);
        if (entity is null) throw new InvalidOperationException($"Event {request.Id} does not exist.");

        if (dto.EndDateTime <= dto.StartDateTime) throw new InvalidOperationException("EndDateTime must be after StartDateTime.");

        entity.Title = dto.Title;
        entity.Description = dto.Description;
        entity.Location = dto.Location;
        entity.StartDateTime = dto.StartDateTime;
        entity.EndDateTime = dto.EndDateTime;
        entity.Capacity = dto.Capacity;
        entity.IsPublished = dto.IsPublished;

        // Replace field values
        var existing = entity.FieldValues.ToList();
        foreach (var ev in existing)
        {
            _uow.EventFieldValues.Remove(ev);
        }

        entity.FieldValues = dto.FieldValues.Select(v => new EventFieldValue { CustomFieldId = v.CustomFieldId, Value = v.Value }).ToList();

        _uow.Events.Update(entity);
        await _uow.SaveChangesAsync();

        return Unit.Value;
    }
}
