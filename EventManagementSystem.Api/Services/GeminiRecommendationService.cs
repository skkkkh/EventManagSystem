using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace EventManagementSystem.Api.Services;

public interface IReasonEnhancer
{
    Task<string> GetNaturalReasonAsync(string eventTitle, string category, string fallbackReason, CancellationToken ct);
}

public class GeminiReasonEnhancer : IReasonEnhancer
{
    private readonly HttpClient _http;
    private readonly IConfiguration _config;

    public GeminiReasonEnhancer(HttpClient http, IConfiguration config)
    {
        _http = http;
        _config = config;
    }

    public async Task<string> GetNaturalReasonAsync(string eventTitle, string category, string fallbackReason, CancellationToken ct)
    {
        var apiKey = _config["Gemini:ApiKey"];
        if (string.IsNullOrWhiteSpace(apiKey)) return fallbackReason;

        var model = _config["Gemini:Model"] ?? "gemini-3.5-flash-lite";
        var url = $"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={apiKey}";

        var prompt = $"""
            Write ONE short, friendly sentence (under 15 words) explaining why we're
            recommending the event "{eventTitle}" ({category}) to a user.
            Base reason: {fallbackReason}
            Respond with ONLY the sentence, no quotes, no extra text.
            """;

        var body = new
        {
            contents = new[] { new { parts = new[] { new { text = prompt } } } }
        };

        try
        {
            var response = await _http.PostAsJsonAsync(url, body, ct);
            if (!response.IsSuccessStatusCode) return fallbackReason;

            var result = await response.Content.ReadFromJsonAsync<GeminiResponse>(cancellationToken: ct);
            var text = result?.Candidates?.FirstOrDefault()?.Content?.Parts?.FirstOrDefault()?.Text?.Trim();

            return string.IsNullOrWhiteSpace(text) ? fallbackReason : text;
        }
        catch
        {
            return fallbackReason;
        }
    }
}

public class GeminiResponse
{
    [JsonPropertyName("candidates")]
    public List<GeminiCandidate>? Candidates { get; set; }
}

public class GeminiCandidate
{
    [JsonPropertyName("content")]
    public GeminiContent? Content { get; set; }
}

public class GeminiContent
{
    [JsonPropertyName("parts")]
    public List<GeminiPart>? Parts { get; set; }
}

public class GeminiPart
{
    [JsonPropertyName("text")]
    public string? Text { get; set; }
}