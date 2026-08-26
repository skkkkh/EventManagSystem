using EventManagementSystem.Api.Models;
using EventManagementSystem.Api.Repositories;
using MediatR;

namespace EventManagementSystem.Api.CQRS.Notifications;

public class NotifyOrganizerOfCapacityHandler : INotificationHandler<CapacityReachedEvent>
{
    private readonly IUnitOfWork _uow;

    public NotifyOrganizerOfCapacityHandler(IUnitOfWork uow)
    {
        _uow = uow;
    }

    public async Task Handle(CapacityReachedEvent e, CancellationToken cancellationToken)
    {
        if (e.OrganizerId is null) return; // event has no linked organizer account

        await _uow.Notifications.AddAsync(new Notification
        {
            UserId = e.OrganizerId.Value,
            Message = $"'{e.EventTitle}' has reached full capacity.",
            Type = NotificationType.CapacityReached
        });

        await _uow.SaveChangesAsync();
    }
}