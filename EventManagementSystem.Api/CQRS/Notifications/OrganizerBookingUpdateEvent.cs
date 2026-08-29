using MediatR;

namespace EventManagementSystem.Api.CQRS.Notifications;

public class OrganizerBookingUpdateEvent : INotification
{
    public int? OrganizerId { get; set; }
    public string EventTitle { get; set; } = string.Empty;
    public string RegistrantName { get; set; } = string.Empty;
    public int Quantity { get; set; }

    // True when the booking is already paid (e.g. a free event), false when
    // it's awaiting the organiser confirming payment was received.
    public bool IsPaid { get; set; } = true;
}
