using EventManagementSystem.Api.DTOs;
using EventManagementSystem.Api.Models;
using EventManagementSystem.Api.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EventManagementSystem.Api.Controllers.Admin;

// MVC admin controller for creating events and templates (server-rendered views)
// This is separate from the API controllers and uses the UnitOfWork directly.
[Authorize(Roles = "Admin,Organizer")]
public class EventsAdminController : Controller
{
    private readonly IUnitOfWork _uow;

    public EventsAdminController(IUnitOfWork uow)
    {
        _uow = uow;
    }

    // GET: /Events
    public async Task<IActionResult> Index()
    {
        var events = await _uow.Events.GetAllAsync();
        return View(events.Select(EventDto.FromEntity));
    }

    // GET: /Events/Create
    public async Task<IActionResult> Create()
    {
        ViewBag.Templates = new Microsoft.AspNetCore.Mvc.Rendering.SelectList(await _uow.EventTemplates.GetAllAsync(), "Id", "Name");
        return View();
    }

    // POST: /Events/Create
    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Create(CreateEventDto dto)
    {
        if (!ModelState.IsValid)
        {
            ViewBag.Templates = (await _uow.EventTemplates.GetAllAsync()).Select(t => (t.Id, t.Name)).ToList();
            return View(dto);
        }

        var entity = new Event
        {
            Title = dto.Title,
            Description = dto.Description,
            Location = dto.Location,
            StartDateTime = dto.StartDateTime,
            EndDateTime = dto.EndDateTime,
            Capacity = dto.Capacity,
            EventTemplateId = dto.EventTemplateId,
            FieldValues = dto.FieldValues.Select(v => new EventFieldValue { CustomFieldId = v.CustomFieldId, Value = v.Value }).ToList()
        };

        await _uow.Events.AddAsync(entity);
        await _uow.SaveChangesAsync();

        return RedirectToAction(nameof(Index));
    }

    // Templates
    public async Task<IActionResult> Templates()
    {
        var templates = await _uow.EventTemplates.GetAllAsync();
        return View(templates.Select(EventTemplateDto.FromEntity));
    }

    public IActionResult CreateTemplate()
    {
        return View();
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> CreateTemplate(CreateEventTemplateDto dto)
    {
        if (!ModelState.IsValid)
        {
            return View(dto);
        }

        var template = new EventTemplate
        {
            Name = dto.Name,
            Description = dto.Description,
            CustomFields = dto.CustomFields.Select(f => new CustomField { Name = f.Name, FieldType = f.FieldType, IsRequired = f.IsRequired, Options = f.Options }).ToList()
        };

        await _uow.EventTemplates.AddAsync(template);
        await _uow.SaveChangesAsync();

        return RedirectToAction(nameof(Templates));
    }
}