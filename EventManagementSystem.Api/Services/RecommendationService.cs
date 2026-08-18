using EventManagementSystem.Api.DTOs;
using EventManagementSystem.Api.Models;
using EventManagementSystem.Api.Repositories;

namespace EventManagementSystem.Api.Services;

/// <summary>
/// Minimal, provisional recommendation service used so the
/// Dashboard/Recommendations code compiles and runs. This is a
/// lightweight content-similarity approach (no ML) and is intended
/// as a stand-in until the original module is provided.
/// </summary>
public class RecommendationService : IRecommendationService
{
    private readonly IUnitOfWork _uow;

    public RecommendationService(IUnitOfWork uow)
    {
        _uow = uow;
    }

    public async Task<IReadOnlyList<RecommendationDto>> GetRecommendationsForUserAsync(int userId, int count)
    {
        var user = await _uow.Users.GetByIdAsync(userId);
        if (user is null) return Array.Empty<RecommendationDto>();

        // Load upcoming published events
        var upcoming = await _uow.Events.FindAsync(e => e.IsPublished && e.StartDateTime >= DateTime.UtcNow);

        // Try to infer user's preferred event templates (categories) from their past registrations.
        // Registrations in this repo do not have a UserId FK; they store Email. Match by email.
        var registrations = await _uow.Registrations.FindAsync(r => r.Email == user.Email);
        // Collect event ids from registrations and resolve their template ids
        var registeredEventIds = registrations.Select(r => r.EventId).Distinct().ToList();
        var preferredTemplateIds = new HashSet<int>();
        if (registeredEventIds.Any())
        {
            var registeredEvents = (await _uow.Events.FindAsync(e => registeredEventIds.Contains(e.Id))).ToList();
            foreach (var re in registeredEvents)
            {
                preferredTemplateIds.Add(re.EventTemplateId);
            }
        }

        // Scoring: +10 for template match, plus keyword overlap as tiebreaker.
        string keywords = (user.Name + " " + (user.Email?.Split('@')[0] ?? string.Empty)).ToLowerInvariant();
        var w = new HashSet<string>(keywords.Split(new[] { ' ', '.', '_', '-' }, StringSplitOptions.RemoveEmptyEntries));

        var scored = upcoming.Select(e =>
        {
            int score = 0;
            if (preferredTemplateIds.Contains(e.EventTemplateId)) score += 10;

            var text = (e.Title + " " + (e.Description ?? string.Empty)).ToLowerInvariant();
            var tokens = new HashSet<string>(text.Split(new[] { ' ', '.', ',', ';', ':', '-', '_' }, StringSplitOptions.RemoveEmptyEntries));
            int overlap = tokens.Intersect(w).Count();
            score += overlap;

            return (Event: e, Score: score, Overlap: overlap);
        })
        .OrderByDescending(x => x.Score)
        .ThenBy(x => x.Event.StartDateTime)
        .Take(count)
        .ToList();

        // If user has no registration history (cold start), fall back to pure keyword overlap behavior.
        if (!preferredTemplateIds.Any())
        {
            var fallback = scored.OrderByDescending(s => s.Overlap).ThenBy(s => s.Event.StartDateTime)
                .Take(count)
                .Select(s => new RecommendationDto(EventDto.FromEntity(s.Event), s.Overlap > 0 ? "Because it matches your interests" : "Upcoming event"))
                .ToList();

            return fallback;
        }

        var result = scored.Select(s => new RecommendationDto(EventDto.FromEntity(s.Event), preferredTemplateIds.Contains(s.Event.EventTemplateId) ? "Because you attended similar events" : (s.Overlap > 0 ? "Because it matches your interests" : "Upcoming event"))).ToList();

        return result;
    }
}
