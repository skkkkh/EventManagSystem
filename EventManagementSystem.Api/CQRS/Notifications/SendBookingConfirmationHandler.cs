using EventManagementSystem.Api.Services;
using MediatR;

namespace EventManagementSystem.Api.CQRS.Notifications;

public class SendBookingConfirmationHandler : INotificationHandler<BookingConfirmedEvent>
{
    private readonly IEmailService _email;

    public SendBookingConfirmationHandler(IEmailService email)
    {
        _email = email;
    }

    public Task Handle(BookingConfirmedEvent e, CancellationToken cancellationToken)
    {
        if (e.IsPaid)
        {
            return _email.SendAsync(
                e.RegistrationEmail,
                "Booking Confirmed",
                $"<p>Hi {e.RegistrationName},</p><p>Your booking for <b>{e.EventTitle}</b> is confirmed. Booking reference: #{e.BookingId}.</p>"
            );
        }

        return _email.SendAsync(
            e.RegistrationEmail,
            "Booking Received — Awaiting Payment Confirmation",
            $"<p>Hi {e.RegistrationName},</p><p>We've received your booking for <b>{e.EventTitle}</b> (reference: #{e.BookingId}). Your seat is held, but it will only be confirmed once the organiser verifies your payment.</p>"
        );
    }
}
