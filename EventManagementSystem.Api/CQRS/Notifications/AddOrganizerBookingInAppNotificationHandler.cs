using EventManagementSystem.Api.Models;
using EventManagementSystem.Api.Repositories;
using MediatR;

namespace EventManagementSystem.Api.CQRS.Notifications;

/// <summary>
/// Companion to SendOrganizerBookingUpdateHandler — that one emails the
/// organiser, this one adds the matching in-app notification. When the
/// booking isn't paid yet, the message makes clear the organiser needs to
/// go confirm payment before the seat is final.
/// </summary>
public class AddOrganizerBookingInAppNotificationHandler : INotificationHandler<OrganizerBookingUpdateEvent>
{
    private readonly IUnitOfWork _uow;

    public AddOrganizerBookingInAppNotificationHandler(IUnitOfWork uow)
    {
        _uow = uow;
    }

    public async Task Handle(OrganizerBookingUpdateEvent e, CancellationToken cancellationToken)
    {
        if (e.OrganizerId is null) return;

        var message = e.IsPaid
            ? $"{e.RegistrantName} booked {e.Quantity} ticket(s) for \"{e.EventTitle}\"."
            : $"{e.RegistrantName} booked {e.Quantity} ticket(s) for \"{e.EventTitle}\" — payment confirmation needed.";

        await _uow.Notifications.AddAsync(new Notification
        {
            UserId = e.OrganizerId.Value,
            Message = message,
            Type = e.IsPaid ? NotificationType.General : NotificationType.PaymentPending,
            CreatedAt = DateTime.UtcNow
        });

        await _uow.SaveChangesAsync();
    }
}
