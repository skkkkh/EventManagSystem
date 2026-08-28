using MediatR;

namespace EventManagementSystem.Api.CQRS.Notifications;

public class BookingConfirmedEvent : INotification
{
    public int BookingId { get; set; }
    public string RegistrationEmail { get; set; } = string.Empty;
    public string RegistrationName { get; set; } = string.Empty;
    public string EventTitle { get; set; } = string.Empty;
}