using EventManagementSystem.Api.DTOs;
using EventManagementSystem.Api.Services;
using MediatR;

namespace EventManagementSystem.Api.CQRS.Recommendations;

/// <summary>
/// Handles GetRecommendationsQuery. Delegates to the existing
/// IRecommendationService rather than duplicating logic — CQRS here is
/// about the *entry point* being a mediator call, not about rewriting
/// recommendation logic from scratch.
/// </summary>
public class GetRecommendationsQueryHandler
    : IRequestHandler<GetRecommendationsQuery, IReadOnlyList<RecommendationDto>>
{
    private readonly IRecommendationService _recommendationService;

    public GetRecommendationsQueryHandler(IRecommendationService recommendationService)
    {
        _recommendationService = recommendationService;
    }

    public async Task<IReadOnlyList<RecommendationDto>> Handle(
        GetRecommendationsQuery request, CancellationToken cancellationToken)
    {
        return await _recommendationService.GetRecommendationsForUserAsync(request.UserId, request.Count);
    }
}
