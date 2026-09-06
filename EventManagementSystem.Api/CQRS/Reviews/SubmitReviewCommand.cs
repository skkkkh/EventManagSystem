using MediatR;

namespace EventManagementSystem.Api.CQRS.Reviews;

public record SubmitReviewCommand(int EventId, int UserId, int Rating, string? Comment) : IRequest<int>;