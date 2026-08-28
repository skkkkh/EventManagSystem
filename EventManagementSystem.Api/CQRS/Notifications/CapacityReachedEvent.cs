using MediatR;

namespace EventManagementSystem.Api.CQRS.Notifications;

public class CapacityReachedEvent : INotification
{
    public int EventId { get; set; }
    public string EventTitle { get; set; } = string.Empty;
    public int? OrganizerId { get; set; }
}