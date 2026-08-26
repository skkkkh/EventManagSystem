using EventManagementSystem.Api.Services;
using MediatR;

namespace EventManagementSystem.Api.CQRS.Notifications;

public class SendEventCancelledEmailsHandler : INotificationHandler<EventCancelledEvent>
{
    private readonly IEmailService _email;

    public SendEventCancelledEmailsHandler(IEmailService email)
    {
        _email = email;
    }

    public async Task Handle(EventCancelledEvent e, CancellationToken cancellationToken)
    {
        foreach (var r in e.Registrants)
        {
            await _email.SendAsync(
                r.Email,
                "Event Cancelled",
                $"<p>Hi {r.FullName},</p><p>We're sorry to let you know that <b>{e.EventTitle}</b> has been cancelled.</p>"
            );
        }
    }
}