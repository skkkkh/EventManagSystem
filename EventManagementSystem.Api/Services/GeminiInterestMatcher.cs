using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace EventManagementSystem.Api.Services;

public interface IInterestMatcher
{
    /// <summary>
    /// Scores each candidate event against the user's free-text interests,
    /// using semantic understanding rather than exact keyword overlap.
    /// Returns a map of EventId -> relevance score (0-10). Returns an empty
    /// dictionary if no API key is configured or the call fails, so callers
    /// can fall back to their own heuristic.
    /// </summary>
    Task<Dictionary<int, double>> ScoreEventsByInterestAsync(
        string interests,
        List<InterestMatchCandidate> candidates,
        CancellationToken ct);
}

public record InterestMatchCandidate(int EventId, string Title, string Category, string? Description);

public class GeminiInterestMatcher : IInterestMatcher
{
    private readonly HttpClient _http;
    private readonly IConfiguration _config;

    public GeminiInterestMatcher(HttpClient http, IConfiguration config)
    {
        _http = http;
        _config = config;
    }

    public async Task<Dictionary<int, double>> ScoreEventsByInterestAsync(
        string interests, List<InterestMatchCandidate> candidates, CancellationToken ct)
    {
        var empty = new Dictionary<int, double>();

        var apiKey = _config["Gemini:ApiKey"];
        if (string.IsNullOrWhiteSpace(apiKey) || string.IsNullOrWhiteSpace(interests) || candidates.Count == 0)
            return empty;

        var model = _config["Gemini:Model"] ?? "gemini-3.5-flash-lite";
        var url = $"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={apiKey}";

        var eventList = string.Join("\n", candidates.Select(c =>
            $"- id={c.EventId}, title=\"{c.Title}\", category=\"{c.Category}\", description=\"{Truncate(c.Description, 150)}\""));

        var prompt = $$"""
            A user's stated interests: "{interests}"

            Candidate upcoming events:
            {eventList}

            For EACH event above, judge how well it semantically matches what the
            user is interested in — not just exact word matches, but related topics,
            synonyms, and the same general subject area too.

            Respond with ONLY a JSON array, no other text, no markdown fences, in this
            exact shape:
            [{"eventId": 1, "score": 8.5}, {"eventId": 2, "score": 1.0}]

            score is a number from 0 (not relevant at all) to 10 (perfect match).
            Include every event id exactly once.
            """;

        var body = new
        {
            contents = new[] { new { parts = new[] { new { text = prompt } } } }
        };

        try
        {
            var response = await _http.PostAsJsonAsync(url, body, ct);
            if (!response.IsSuccessStatusCode) return empty;

            var result = await response.Content.ReadFromJsonAsync<GeminiResponse>(cancellationToken: ct);
            var text = result?.Candidates?.FirstOrDefault()?.Content?.Parts?.FirstOrDefault()?.Text?.Trim();
            if (string.IsNullOrWhiteSpace(text)) return empty;

            // Gemini sometimes wraps JSON in ```json fences despite instructions — strip them.
            text = text.Trim();
            if (text.StartsWith("```"))
            {
                var firstNewline = text.IndexOf('\n');
                var lastFence = text.LastIndexOf("```");
                if (firstNewline >= 0 && lastFence > firstNewline)
                    text = text.Substring(firstNewline + 1, lastFence - firstNewline - 1).Trim();
            }

            var scores = JsonSerializer.Deserialize<List<ScoreEntry>>(text, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });

            if (scores is null) return empty;

            return scores
                .GroupBy(s => s.EventId)
                .ToDictionary(g => g.Key, g => Math.Clamp(g.First().Score, 0, 10));
        }
        catch
        {
            // Any failure (network, bad JSON, unexpected shape) — fall back silently.
            return empty;
        }
    }

    private static string Truncate(string? text, int maxLength)
    {
        if (string.IsNullOrWhiteSpace(text)) return string.Empty;
        return text.Length <= maxLength ? text : text.Substring(0, maxLength);
    }

    private record ScoreEntry(
        [property: JsonPropertyName("eventId")] int EventId,
        [property: JsonPropertyName("score")] double Score);
}