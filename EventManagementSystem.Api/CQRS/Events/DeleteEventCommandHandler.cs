using EventManagementSystem.Api.CQRS.Events;
using EventManagementSystem.Api.Repositories;
using MediatR;

namespace EventManagementSystem.Api.CQRS.Events;

public class DeleteEventCommandHandler : IRequestHandler<DeleteEventCommand, Unit>
{
    private readonly IUnitOfWork _uow;

    public DeleteEventCommandHandler(IUnitOfWork uow)
    {
        _uow = uow;
    }

    public async Task<Unit> Handle(DeleteEventCommand request, CancellationToken cancellationToken)
    {
        var entity = await _uow.Events.GetByIdAsync(request.Id);
        if (entity is null) throw new InvalidOperationException($"Event {request.Id} does not exist.");

        _uow.Events.Remove(entity);
        await _uow.SaveChangesAsync();

        return Unit.Value;
    }
}
