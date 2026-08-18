using EventManagementSystem.Api.Models;

namespace EventManagementSystem.Api.DTOs;

public record UserDto(int Id, string Name, string Email, string Role = "User", DateTime? RegistrationDate = null)
{
    public static UserDto FromEntity(User u) => new(u.Id, u.Name, u.Email, u.Role, u.RegistrationDate);
}

public record NotificationDto(int Id, int UserId, string Message, DateTime CreatedAt, bool IsRead, NotificationType Type)
{
    public static NotificationDto FromEntity(Notification n) => new(n.Id, n.UserId, n.Message, n.CreatedAt, n.IsRead, n.Type);
}

public record RecommendationDto(EventDto Event, string Reason);
