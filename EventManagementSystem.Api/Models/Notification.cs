using System.ComponentModel.DataAnnotations;

namespace EventManagementSystem.Api.Models;

public enum NotificationType
{
    BookingConfirmation = 0,
    EventReminder = 1,
    Recommendation = 2,
    General = 3
}

public class Notification
{
    public int Id { get; set; }

    // FK
    public int UserId { get; set; }
    public User? User { get; set; }

    [Required, MaxLength(500)]
    public string Message { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public bool IsRead { get; set; }

    public NotificationType Type { get; set; } = NotificationType.General;
}
