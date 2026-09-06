using EventManagementSystem.Api.Repositories;
using EventManagementSystem.Api.Services;
using MediatR;

namespace EventManagementSystem.Api.CQRS.Notifications;

public class SendOrganizerBookingUpdateHandler : INotificationHandler<OrganizerBookingUpdateEvent>
{
    private readonly IUnitOfWork _uow;
    private readonly IEmailService _email;

    public SendOrganizerBookingUpdateHandler(IUnitOfWork uow, IEmailService email)
    {
        _uow = uow;
        _email = email;
    }

    public async Task Handle(OrganizerBookingUpdateEvent e, CancellationToken cancellationToken)
    {
        if (e.OrganizerId is null) return;

        var organizer = await _uow.Users.GetByIdAsync(e.OrganizerId.Value);
        if (organizer?.Email is null) return;

        var subject = e.IsPaid ? "New Booking Received" : "New Booking — Payment Confirmation Needed";
        var body = e.IsPaid
            ? $"<p>Hi {organizer.Name},</p><p>{e.RegistrantName} just booked {e.Quantity} ticket(s) for <b>{e.EventTitle}</b>.</p>"
            : $"<p>Hi {organizer.Name},</p><p>{e.RegistrantName} just booked {e.Quantity} ticket(s) for <b>{e.EventTitle}</b> and declared how they'll pay. Go to your Host Control Center to confirm the payment once you've received it — the seat won't be finalised until then.</p>";

        await _email.SendAsync(organizer.Email, subject, body);
    }
}