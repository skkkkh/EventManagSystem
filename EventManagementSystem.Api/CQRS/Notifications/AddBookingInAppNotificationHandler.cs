using EventManagementSystem.Api.Models;
using EventManagementSystem.Api.Repositories;
using MediatR;

namespace EventManagementSystem.Api.CQRS.Notifications;

/// <summary>
/// Companion to SendBookingConfirmationHandler — that one emails the
/// attendee, this one adds the matching in-app notification so it shows
/// up in the bell icon too, not just their inbox.
/// </summary>
public class AddBookingInAppNotificationHandler : INotificationHandler<BookingConfirmedEvent>
{
    private readonly IUnitOfWork _uow;

    public AddBookingInAppNotificationHandler(IUnitOfWork uow)
    {
        _uow = uow;
    }

    public async Task Handle(BookingConfirmedEvent e, CancellationToken cancellationToken)
    {
        if (e.UserId is null) return; // guest checkout with no linked account

        var message = e.IsPaid
            ? $"Your booking for \"{e.EventTitle}\" is confirmed!"
            : $"Your booking for \"{e.EventTitle}\" is received — it'll be confirmed once the organiser verifies your payment.";

        await _uow.Notifications.AddAsync(new Notification
        {
            UserId = e.UserId.Value,
            Message = message,
            Type = e.IsPaid ? NotificationType.BookingConfirmation : NotificationType.PaymentPending,
            CreatedAt = DateTime.UtcNow
        });

        await _uow.SaveChangesAsync();
    }
}
