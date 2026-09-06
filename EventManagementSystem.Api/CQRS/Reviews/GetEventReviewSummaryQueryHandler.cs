using EventManagementSystem.Api.Models;
using EventManagementSystem.Api.Repositories;
using MediatR;

namespace EventManagementSystem.Api.CQRS.Reviews;

public class GetEventReviewSummaryQueryHandler : IRequestHandler<GetEventReviewSummaryQuery, ReviewSummaryDto>
{
    private readonly IUnitOfWork _uow;

    public GetEventReviewSummaryQueryHandler(IUnitOfWork uow)
    {
        _uow = uow;
    }

    public async Task<ReviewSummaryDto> Handle(GetEventReviewSummaryQuery request, CancellationToken cancellationToken)
    {
        var reviews = await _uow.Repository<Review>()
            .FindAsync(r => r.EventId == request.EventId);

        var list = reviews.ToList();
        var average = list.Count == 0 ? 0 : Math.Round(list.Average(r => r.Rating), 1);

        return new ReviewSummaryDto(average, list.Count);
    }
}