using EventManagementSystem.Api.DTOs;

namespace EventManagementSystem.Api.ViewModels;

public class DashboardViewModel
{
    public UserDto User { get; set; } = null!;
    public List<NotificationDto> Notifications { get; set; } = new();
    public List<RecommendationDto> Recommendations { get; set; } = new();
}
