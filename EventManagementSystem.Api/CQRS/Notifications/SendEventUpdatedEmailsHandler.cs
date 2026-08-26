using EventManagementSystem.Api.Services;
using MediatR;

namespace EventManagementSystem.Api.CQRS.Notifications;

public class SendEventUpdatedEmailsHandler : INotificationHandler<EventUpdatedEvent>
{
    private readonly IEmailService _email;

    public SendEventUpdatedEmailsHandler(IEmailService email)
    {
        _email = email;
    }

    public async Task Handle(EventUpdatedEvent e, CancellationToken cancellationToken)
    {
        foreach (var r in e.Registrants)
        {
            await _email.SendAsync(
                r.Email,
                "Event Updated",
                $"<p>Hi {r.FullName},</p><p>There's an update to <b>{e.EventTitle}</b> — details (date, time, or location) may have changed. Please check the event page for the latest information.</p>"
            );
        }
    }
}