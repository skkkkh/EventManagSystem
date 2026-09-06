using EventManagementSystem.Api.Models;
using EventManagementSystem.Api.Repositories;
using MediatR;

namespace EventManagementSystem.Api.CQRS.Reviews;

public class SubmitReviewCommandHandler : IRequestHandler<SubmitReviewCommand, int>
{
    private readonly IUnitOfWork _uow;

    public SubmitReviewCommandHandler(IUnitOfWork uow)
    {
        _uow = uow;
    }

    public async Task<int> Handle(SubmitReviewCommand request, CancellationToken cancellationToken)
    {
        if (request.Rating is < 1 or > 5)
            throw new ArgumentException("Rating must be between 1 and 5.");

        var registrations = await _uow.Registrations.FindAsync(
            r => r.EventId == request.EventId && r.UserId == request.UserId);

        var hasBooking = false;
        foreach (var reg in registrations)
        {
            var bookings = await _uow.Bookings.FindAsync(
                b => b.RegistrationId == reg.Id && b.Status != BookingStatus.Cancelled);
            if (bookings.Any())
            {
                hasBooking = true;
                break;
            }
        }

        if (!hasBooking)
            throw new InvalidOperationException("Only attendees who booked this event can leave a review.");

        var alreadyReviewed = await _uow.Repository<Review>()
            .FindAsync(r => r.EventId == request.EventId && r.UserId == request.UserId);
        if (alreadyReviewed.Any())
            throw new InvalidOperationException("You've already reviewed this event.");

        var review = new Review
        {
            EventId = request.EventId,
            UserId = request.UserId,
            Rating = request.Rating,
            Comment = request.Comment,
            CreatedAt = DateTime.UtcNow
        };

        await _uow.Repository<Review>().AddAsync(review);
        await _uow.SaveChangesAsync();

        return review.Id;
    }
}