using EventManagementSystem.Api.DTOs;
using EventManagementSystem.Api.Models;
using EventManagementSystem.Api.Repositories;
using EventManagementSystem.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace EventManagementSystem.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DebugController : ControllerBase
{
    private readonly IUnitOfWork _uow;
    private readonly IRecommendationService _rec;

    public DebugController(IUnitOfWork uow, IRecommendationService rec)
    {
        _uow = uow;
        _rec = rec;
    }

    // Convenience endpoint to create a test template, event, user and registration
    // and return recommendations for that user. Safe to call multiple times.
    [HttpGet("setup")]
    public async Task<IActionResult> Setup(string email = "testuser@example.com")
    {
        // Ensure user
        var users = await _uow.Users.FindAsync(u => u.Email == email);
        var user = users.FirstOrDefault();
        if (user is null)
        {
            user = new User { Name = email.Split('@')[0], Email = email, Role = "Attendee", RegistrationDate = DateTime.UtcNow };
            await _uow.Users.AddAsync(user);
            await _uow.SaveChangesAsync();
        }

        // Ensure template
        var templates = await _uow.EventTemplates.FindAsync(t => t.Name == "DemoCategory");
        var template = templates.FirstOrDefault();
        if (template is null)
        {
            template = new EventTemplate { Name = "DemoCategory", Description = "Demo category" };
            await _uow.EventTemplates.AddAsync(template);
            await _uow.SaveChangesAsync();
        }

        // Ensure event
        var events = await _uow.Events.FindAsync(e => e.Title == "Demo Event" && e.EventTemplateId == template.Id);
        var ev = events.FirstOrDefault();
        if (ev is null)
        {
            ev = new Event { Title = "Demo Event", Description = "An event for demo", StartDateTime = DateTime.UtcNow.AddDays(10), EndDateTime = DateTime.UtcNow.AddDays(11), Capacity = 100, IsPublished = true, EventTemplateId = template.Id };
            await _uow.Events.AddAsync(ev);
            await _uow.SaveChangesAsync();
        }

        // Ensure registration linking email to event
        var regs = await _uow.Registrations.FindAsync(r => r.Email == email && r.EventId == ev.Id);
        if (!regs.Any())
        {
            var reg = new Registration { FullName = user.Name, Email = email, EventId = ev.Id, RegisteredAt = DateTime.UtcNow };
            await _uow.Registrations.AddAsync(reg);
            await _uow.SaveChangesAsync();
        }

        var recommendations = await _rec.GetRecommendationsForUserAsync(user.Id, 5);
        return Ok(recommendations);
    }
}
