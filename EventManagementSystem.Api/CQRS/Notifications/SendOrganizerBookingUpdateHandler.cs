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

        await _email.SendAsync(
            organizer.Email,
            "New Booking Received",
            $"<p>Hi {organizer.Name},</p><p>{e.RegistrantName} just booked {e.Quantity} ticket(s) for <b>{e.EventTitle}</b>.</p>"
        );
    }
}