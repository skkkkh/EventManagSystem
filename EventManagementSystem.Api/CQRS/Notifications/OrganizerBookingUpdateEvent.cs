using MediatR;

namespace EventManagementSystem.Api.CQRS.Notifications;

public class OrganizerBookingUpdateEvent : INotification
{
    public int? OrganizerId { get; set; }
    public string EventTitle { get; set; } = string.Empty;
    public string RegistrantName { get; set; } = string.Empty;
    public int Quantity { get; set; }
}