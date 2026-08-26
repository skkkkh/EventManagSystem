using EventManagementSystem.Api.Models;
using EventManagementSystem.Api.Repositories;
using MediatR;

namespace EventManagementSystem.Api.CQRS.Notifications;

public class NotifyRegistrantsOfEventUpdateHandler : INotificationHandler<EventUpdatedEvent>
{
    private readonly IUnitOfWork _uow;

    public NotifyRegistrantsOfEventUpdateHandler(IUnitOfWork uow)
    {
        _uow = uow;
    }

    public async Task Handle(EventUpdatedEvent e, CancellationToken cancellationToken)
    {
        var registeredUserIds = e.Registrants.Where(r => r.UserId.HasValue).Select(r => r.UserId!.Value);

        foreach (var userId in registeredUserIds)
        {
            await _uow.Notifications.AddAsync(new Notification
            {
                UserId = userId,
                Message = $"'{e.EventTitle}' has been updated. Check the event page for details.",
                Type = NotificationType.EventUpdated
            });
        }

        if (registeredUserIds.Any())
        {
            await _uow.SaveChangesAsync();
        }
    }
}