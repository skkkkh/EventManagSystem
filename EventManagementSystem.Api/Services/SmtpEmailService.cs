using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;

namespace EventManagementSystem.Api.Services;

public class SmtpEmailService : IEmailService
{
    private readonly IConfiguration _config;

    public SmtpEmailService(IConfiguration config)
    {
        _config = config;
    }

    public async Task SendAsync(string toEmail, string subject, string htmlBody)
    {
        var host = _config["Email:SmtpHost"];
        if (string.IsNullOrWhiteSpace(host))
        {
            // No SMTP configured yet (e.g. local dev) — skip silently instead of crashing the request.
            return;
        }

        var message = new MimeMessage();
        message.From.Add(MailboxAddress.Parse(_config["Email:FromAddress"] ?? "noreply@ems.com"));
        message.To.Add(MailboxAddress.Parse(toEmail));
        message.Subject = subject;
        message.Body = new TextPart("html") { Text = htmlBody };

        using var client = new SmtpClient();
        await client.ConnectAsync(host, int.Parse(_config["Email:SmtpPort"] ?? "587"), SecureSocketOptions.StartTls);
        await client.AuthenticateAsync(_config["Email:Username"], _config["Email:Password"]);
        await client.SendAsync(message);
        await client.DisconnectAsync(true);
    }
}