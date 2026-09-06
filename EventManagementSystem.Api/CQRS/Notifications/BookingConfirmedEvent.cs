using MediatR;

namespace EventManagementSystem.Api.CQRS.Notifications;

public class BookingConfirmedEvent : INotification
{
    public int BookingId { get; set; }
    public string RegistrationEmail { get; set; } = string.Empty;
    public string RegistrationName { get; set; } = string.Empty;
    public string EventTitle { get; set; } = string.Empty;

    // Null for guest checkouts that were never linked to a logged-in account —
    // there's no in-app account to show a notification to in that case.
    public int? UserId { get; set; }

    // True when the booking was paid/confirmed immediately (free event or
    // already-verified payment). False means it's still awaiting the
    // organiser confirming payment was received.
    public bool IsPaid { get; set; } = true;
}
