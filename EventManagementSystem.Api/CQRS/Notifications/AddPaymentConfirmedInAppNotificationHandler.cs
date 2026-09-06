using EventManagementSystem.Api.Models;
using EventManagementSystem.Api.Repositories;
using MediatR;

namespace EventManagementSystem.Api.CQRS.Notifications;

public class AddPaymentConfirmedInAppNotificationHandler : INotificationHandler<PaymentConfirmedEvent>
{
    private readonly IUnitOfWork _uow;

    public AddPaymentConfirmedInAppNotificationHandler(IUnitOfWork uow)
    {
        _uow = uow;
    }

    public async Task Handle(PaymentConfirmedEvent e, CancellationToken cancellationToken)
    {
        if (e.UserId is null) return;

        await _uow.Notifications.AddAsync(new Notification
        {
            UserId = e.UserId.Value,
            Message = $"Your payment for \"{e.EventTitle}\" has been confirmed — your seat is booked!",
            Type = NotificationType.PaymentConfirmed,
            CreatedAt = DateTime.UtcNow
        });

        await _uow.SaveChangesAsync();
    }
}
