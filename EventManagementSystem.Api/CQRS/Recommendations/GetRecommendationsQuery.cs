using EventManagementSystem.Api.DTOs;
using MediatR;

namespace EventManagementSystem.Api.CQRS.Recommendations;

/// <summary>
/// The "Query" in CQRS — describes what's being asked for, with no logic
/// attached. The Handler (next file) does the actual work.
/// </summary>
public record GetRecommendationsQuery(int UserId, int Count = 5)
    : IRequest<IReadOnlyList<RecommendationDto>>;
