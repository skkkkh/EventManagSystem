using MediatR;

namespace EventManagementSystem.Api.CQRS.Reviews;

public record GetPendingReviewsQuery(int UserId) : IRequest<List<PendingReviewDto>>;

public record PendingReviewDto(int EventId, string Title, DateTime EndDateTime);