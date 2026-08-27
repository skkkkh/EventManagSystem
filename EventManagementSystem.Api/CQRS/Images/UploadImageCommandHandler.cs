using MediatR;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace EventManagementSystem.Api.CQRS.Images;

public class UploadImageCommandHandler : IRequestHandler<UploadImageCommand, string>
{
    private readonly IWebHostEnvironment _env;
    private readonly ILogger<UploadImageCommandHandler> _logger;

    public UploadImageCommandHandler(
        IWebHostEnvironment env,
        ILogger<UploadImageCommandHandler> logger)
    {
        _env = env;
        _logger = logger;
    }

    public async Task<string> Handle(UploadImageCommand request, CancellationToken cancellationToken)
    {
        var file = request.File;
        if (file is null || file.Length == 0)
            throw new InvalidOperationException("No file was uploaded.");

        // Optional server-side size limit (e.g. 5 MB)
        const long maxSize = 5 * 1024 * 1024;
        if (file.Length > maxSize)
            throw new InvalidOperationException("File too large. Maximum allowed size is 5 MB.");

        var webRoot = _env.WebRootPath;
        if (string.IsNullOrEmpty(webRoot))
        {
            // Ensure a webroot exists when running from tools or tests
            webRoot = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
        }

        var uploads = Path.Combine(webRoot, "uploads");
        Directory.CreateDirectory(uploads);

        var ext = Path.GetExtension(file.FileName);
        var fileName = $"{Guid.NewGuid():N}{ext}";
        var filePath = Path.Combine(uploads, fileName);

        await using var stream = File.Create(filePath);
        await file.CopyToAsync(stream, cancellationToken);

        var relativeUrl = $"/uploads/{fileName}";

        _logger.LogInformation("Saved uploaded image to {Path}", filePath);

        return relativeUrl;
    }
}
