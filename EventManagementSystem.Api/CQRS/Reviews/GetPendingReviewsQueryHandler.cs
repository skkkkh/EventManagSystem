using EventManagementSystem.Api.Models;
using EventManagementSystem.Api.Repositories;
using MediatR;

namespace EventManagementSystem.Api.CQRS.Reviews;

public class GetPendingReviewsQueryHandler : IRequestHandler<GetPendingReviewsQuery, List<PendingReviewDto>>
{
    private readonly IUnitOfWork _uow;

    public GetPendingReviewsQueryHandler(IUnitOfWork uow)
    {
        _uow = uow;
    }

    public async Task<List<PendingReviewDto>> Handle(GetPendingReviewsQuery request, CancellationToken cancellationToken)
    {
        // 1. Find every event this user has a non-cancelled booking for.
        var registrations = await _uow.Registrations.FindAsync(r => r.UserId == request.UserId);

        var attendedEventIds = new HashSet<int>();
        foreach (var reg in registrations)
        {
            var bookings = await _uow.Bookings.FindAsync(
                b => b.RegistrationId == reg.Id && b.Status != BookingStatus.Cancelled);
            if (bookings.Any())
                attendedEventIds.Add(reg.EventId);
        }

        if (attendedEventIds.Count == 0)
            return new List<PendingReviewDto>();

        // 2. Find which of those events the user has already reviewed.
        var existingReviews = await _uow.Repository<Review>().FindAsync(r => r.UserId == request.UserId);
        var reviewedEventIds = existingReviews.Select(r => r.EventId).ToHashSet();

        // 3. Only events that have already ended, and aren't reviewed yet.
        var now = DateTime.UtcNow;
        var events = await _uow.Events.FindAsync(
            e => attendedEventIds.Contains(e.Id) && e.EndDateTime < now && !reviewedEventIds.Contains(e.Id));

        return events
            .OrderByDescending(e => e.EndDateTime)
            .Select(e => new PendingReviewDto(e.Id, e.Title, e.EndDateTime))
            .ToList();
    }
}