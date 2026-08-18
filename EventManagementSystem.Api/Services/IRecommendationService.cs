using EventManagementSystem.Api.DTOs;

namespace EventManagementSystem.Api.Services;

public interface IRecommendationService
{
    Task<IReadOnlyList<RecommendationDto>> GetRecommendationsForUserAsync(int userId, int count);
}
