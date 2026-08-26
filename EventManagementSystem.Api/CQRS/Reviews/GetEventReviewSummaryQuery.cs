using MediatR;

namespace EventManagementSystem.Api.CQRS.Reviews;

public record GetEventReviewSummaryQuery(int EventId) : IRequest<ReviewSummaryDto>;

public record ReviewSummaryDto(double AverageRating, int TotalReviews);