using EventManagementSystem.Api.DTOs;
using EventManagementSystem.Api.Models;
using EventManagementSystem.Api.Repositories;

namespace EventManagementSystem.Api.Services;

/// <summary>
/// Content-based recommendation engine. Scores upcoming events using two
/// signals: (1) categories the user has attended before, and (2) free-text
/// interests the user has declared themselves — matched against each
/// event's category, title, and description using Gemini for semantic
/// understanding (e.g. "photography" matching a "camera workshop" event),
/// falling back to plain keyword overlap if no Gemini API key is configured.
/// </summary>
public class RecommendationService : IRecommendationService
{
    private readonly IUnitOfWork _uow;
    private readonly IReasonEnhancer _reasonEnhancer;
    private readonly IInterestMatcher _interestMatcher;

    public RecommendationService(IUnitOfWork uow, IReasonEnhancer reasonEnhancer, IInterestMatcher interestMatcher)
    {
        _uow = uow;
        _reasonEnhancer = reasonEnhancer;
        _interestMatcher = interestMatcher;
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

        // Signal 2: user's own declared interests (free text, e.g. "photography, live music").
        // Ask Gemini to semantically score every candidate against the interest text in one call.
        // If no API key is configured (or the call fails), this comes back empty and we fall
        // back to exact keyword overlap instead — same behaviour as before this change.
        var interestTokens = Tokenize(user.Interests);
        var aiScores = new Dictionary<int, double>();
        if (!string.IsNullOrWhiteSpace(user.Interests) && candidates.Count > 0)
        {
            var matchCandidates = candidates
                .Select(c => new InterestMatchCandidate(c.Event.Id, c.Event.Title, c.Event.Category.ToString(), c.Event.Description))
                .ToList();
            aiScores = await _interestMatcher.ScoreEventsByInterestAsync(user.Interests, matchCandidates, CancellationToken.None);
        }
        bool usedAiMatching = aiScores.Count > 0;

        var scored = candidates.Select(c =>
        {
            int score = 0;
            bool categoryMatch = preferredCategories.Contains(c.Event.Category);
            if (categoryMatch) score += 10;

            double interestScore; // 0-10 scale either way, for a consistent fallbackReason threshold below
            if (usedAiMatching && aiScores.TryGetValue(c.Event.Id, out var aiScore))
            {
                interestScore = aiScore;
                score += (int)Math.Round(aiScore * 8); // same weight the old keyword-overlap signal used
            }
            else
            {
                var eventText = (c.Event.Category + " " + c.Event.Title + " " + (c.Event.Description ?? string.Empty)).ToLowerInvariant();
                var eventTokens = Tokenize(eventText);
                int interestOverlap = eventTokens.Intersect(interestTokens).Count();
                interestScore = interestOverlap; // not on a 0-10 scale, but only used as a >0 check below
                score += interestOverlap * 8;
            }

            return (c.Event, c.SeatsRemaining, Score: score, CategoryMatch: categoryMatch, InterestMatch: interestScore > (usedAiMatching ? 4.0 : 0));
        })
        .OrderByDescending(x => x.Score)
        .ThenBy(x => x.Event.StartDateTime)
        .Take(count)
        .ToList();

        var result = new List<RecommendationDto>();
        foreach (var s in scored)
        {
            var dto = EventDto.FromEntity(s.Event);
            dto.SeatsRemaining = s.SeatsRemaining;

            string fallbackReason;
            if (s.InterestMatch && s.CategoryMatch)
                fallbackReason = $"Matches your interests and past {s.Event.Category} events";
            else if (s.InterestMatch)
                fallbackReason = "Matches your stated interests";
            else if (s.CategoryMatch)
                fallbackReason = $"Because you attended {s.Event.Category} events before";
            else
                fallbackReason = "Upcoming event";

            var reason = await _reasonEnhancer.GetNaturalReasonAsync(
                s.Event.Title, s.Event.Category.ToString(), fallbackReason, CancellationToken.None);

            result.Add(new RecommendationDto(dto, reason));
        }

        return result;
    }
}