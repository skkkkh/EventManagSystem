using EventManagementSystem.Api.DTOs;
using EventManagementSystem.Api.Models;
using EventManagementSystem.Api.Repositories;

namespace EventManagementSystem.Api.Services;

/// <summary>
/// Content-based recommendation engine. Scores upcoming events using two
/// signals: (1) categories the user has attended before, and (2) free-text
/// interests the user has declared themselves — matched against each
/// event's category, title, and description.
/// </summary>
public class RecommendationService : IRecommendationService
{
    private readonly IUnitOfWork _uow;

    public RecommendationService(IUnitOfWork uow)
    {
        _uow = uow;
    }

    private async Task<int> GetBookedCount(int eventId)
    {
        var ticketTypes = await _uow.TicketTypes.FindAsync(tt => tt.EventId == eventId);
        int booked = 0;
        foreach (var tt in ticketTypes)
        {
            var bookings = await _uow.Bookings.FindAsync(b => b.TicketTypeId == tt.Id && b.Status != BookingStatus.Cancelled);
            booked += bookings.Sum(b => b.Quantity);
        }
        return booked;
    }

    private static HashSet<string> Tokenize(string? text)
    {
        if (string.IsNullOrWhiteSpace(text)) return new HashSet<string>();
        return new HashSet<string>(
            text.ToLowerInvariant().Split(new[] { ' ', ',', '.', ';', ':', '-', '_' }, StringSplitOptions.RemoveEmptyEntries)
        );
    }

    public async Task<IReadOnlyList<RecommendationDto>> GetRecommendationsForUserAsync(int userId, int count)
    {
        var user = await _uow.Users.GetByIdAsync(userId);
        if (user is null) return Array.Empty<RecommendationDto>();

        var upcoming = (await _uow.Events.FindAsync(e => e.IsPublished && e.StartDateTime >= DateTime.UtcNow)).ToList();

        var byUserId = await _uow.Registrations.FindAsync(r => r.UserId == userId);
        var byEmail = await _uow.Registrations.FindAsync(r => r.Email == user.Email);
        var registrations = byUserId.Concat(byEmail).DistinctBy(r => r.Id).ToList();
        var registeredEventIds = registrations.Select(r => r.EventId).Distinct().ToHashSet();

        // Only recommend events the user hasn't already registered for AND that still have seats
        var candidates = new List<(Event Event, int SeatsRemaining)>();
        foreach (var e in upcoming.Where(e => !registeredEventIds.Contains(e.Id)))
        {
            var seatsRemaining = Math.Max(0, e.Capacity - await GetBookedCount(e.Id));
            if (seatsRemaining > 0)
            {
                candidates.Add((e, seatsRemaining));
            }
        }

        // Signal 1: categories attended before
        var registeredEvents = (await _uow.Events.FindAsync(e => registeredEventIds.Contains(e.Id))).ToList();
        var preferredCategories = registeredEvents.Select(e => e.Category).Distinct().ToHashSet();

        // Signal 2: user's own declared interests (free text, e.g. "tech, science, entertainment")
        var interestTokens = Tokenize(user.Interests);

        var scored = candidates.Select(c =>
        {
            int score = 0;
            bool categoryMatch = preferredCategories.Contains(c.Event.Category);
            if (categoryMatch) score += 10;

            var eventText = (c.Event.Category + " " + c.Event.Title + " " + (c.Event.Description ?? string.Empty)).ToLowerInvariant();
            var eventTokens = Tokenize(eventText);

            int interestOverlap = eventTokens.Intersect(interestTokens).Count();
            score += interestOverlap * 8; // interests are a strong, deliberate signal — weigh heavily

            return (c.Event, c.SeatsRemaining, Score: score, CategoryMatch: categoryMatch, InterestOverlap: interestOverlap);
        })
        .OrderByDescending(x => x.Score)
        .ThenBy(x => x.Event.StartDateTime)
        .Take(count)
        .ToList();

        var result = scored.Select(s =>
        {
            var dto = EventDto.FromEntity(s.Event);
            dto.SeatsRemaining = s.SeatsRemaining;

            string reason;
            if (s.InterestOverlap > 0 && s.CategoryMatch)
                reason = $"Matches your interests and past {s.Event.Category} events";
            else if (s.InterestOverlap > 0)
                reason = "Matches your stated interests";
            else if (s.CategoryMatch)
                reason = $"Because you attended {s.Event.Category} events before";
            else
                reason = "Upcoming event";

            return new RecommendationDto(dto, reason);
        }).ToList();

        return result;
    }
}