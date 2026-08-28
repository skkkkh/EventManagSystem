using MediatR;

namespace EventManagementSystem.Api.CQRS.Notifications;

public class EventCancelledEvent : INotification
{
    public string EventTitle { get; set; } = string.Empty;
    public List<(string Email, string FullName, int? UserId)> Registrants { get; set; } = new();
}