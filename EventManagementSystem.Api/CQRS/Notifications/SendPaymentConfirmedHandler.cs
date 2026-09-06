using EventManagementSystem.Api.Services;
using MediatR;

namespace EventManagementSystem.Api.CQRS.Notifications;

public class SendPaymentConfirmedHandler : INotificationHandler<PaymentConfirmedEvent>
{
    private readonly IEmailService _email;

    public SendPaymentConfirmedHandler(IEmailService email)
    {
        _email = email;
    }

    public Task Handle(PaymentConfirmedEvent e, CancellationToken cancellationToken)
    {
        return _email.SendAsync(
            e.RegistrationEmail,
            "Payment Confirmed — Your Seat is Booked",
            $"<p>Hi {e.RegistrationName},</p><p>The organiser has confirmed your payment for <b>{e.EventTitle}</b>. Your booking (reference: #{e.BookingId}) is now confirmed. See you there!</p>"
        );
    }
}
