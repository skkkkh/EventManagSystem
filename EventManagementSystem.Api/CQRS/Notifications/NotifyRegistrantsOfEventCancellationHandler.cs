using EventManagementSystem.Api.Models;
using EventManagementSystem.Api.Repositories;
using MediatR;

namespace EventManagementSystem.Api.CQRS.Notifications;

public class NotifyRegistrantsOfEventCancellationHandler : INotificationHandler<EventCancelledEvent>
{
    private readonly IUnitOfWork _uow;

    public NotifyRegistrantsOfEventCancellationHandler(IUnitOfWork uow)
    {
        _uow = uow;
    }

    public async Task Handle(EventCancelledEvent e, CancellationToken cancellationToken)
    {
        var registeredUserIds = e.Registrants.Where(r => r.UserId.HasValue).Select(r => r.UserId!.Value);

        foreach (var userId in registeredUserIds)
        {
            await _uow.Notifications.AddAsync(new Notification
            {
                UserId = userId,
                Message = $"'{e.EventTitle}' has been cancelled.",
                Type = NotificationType.EventCancelled
            });
        }

        if (registeredUserIds.Any())
        {
            await _uow.SaveChangesAsync();
        }
    }
}