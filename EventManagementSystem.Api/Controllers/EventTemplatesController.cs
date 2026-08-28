using EventManagementSystem.Api.DTOs;
using EventManagementSystem.Api.Models;
using EventManagementSystem.Api.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EventManagementSystem.Api.Controllers;

/// <summary>
/// The "config engine" API — lets admins define event categories
/// (templates) and the dynamic custom fields each category needs.
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class EventTemplatesController : ControllerBase
{
    private readonly IUnitOfWork _uow;

    public EventTemplatesController(IUnitOfWork uow)
    {
        _uow = uow;
    }

    // GET: api/eventtemplates
    [HttpGet]
    public async Task<ActionResult<IEnumerable<EventTemplateDto>>> GetAll()
    {
        var templates = await _uow.EventTemplates.GetAllAsync();
        return Ok(templates.Select(EventTemplateDto.FromEntity));
    }

    // GET: api/eventtemplates/5
    [HttpGet("{id:int}")]
    public async Task<ActionResult<EventTemplateDto>> GetById(int id)
    {
        var template = await _uow.EventTemplates.GetByIdAsync(id);
        if (template is null)
        {
            return NotFound();
        }
        return Ok(EventTemplateDto.FromEntity(template));
    }

    // POST: api/eventtemplates
    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<EventTemplateDto>> Create(CreateEventTemplateDto dto)
    {
        var entity = new EventTemplate
        {
            Name = dto.Name,
            Description = dto.Description,
            CustomFields = dto.CustomFields.Select(f => new CustomField
            {
                Name = f.Name,
                FieldType = f.FieldType,
                IsRequired = f.IsRequired,
                Options = f.Options
            }).ToList()
        };

        await _uow.EventTemplates.AddAsync(entity);
        await _uow.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = entity.Id }, EventTemplateDto.FromEntity(entity));
    }

    // POST: api/eventtemplates/5/fields
    [HttpPost("{id:int}/fields")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<CustomFieldDto>> AddField(int id, CreateCustomFieldDto dto)
    {
        var template = await _uow.EventTemplates.GetByIdAsync(id);
        if (template is null)
        {
            return NotFound();
        }

        var field = new CustomField
        {
            EventTemplateId = id,
            Name = dto.Name,
            FieldType = dto.FieldType,
            IsRequired = dto.IsRequired,
            Options = dto.Options
        };

        await _uow.CustomFields.AddAsync(field);
        await _uow.SaveChangesAsync();

        return Ok(CustomFieldDto.FromEntity(field));
    }

    // DELETE: api/eventtemplates/5
    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        var template = await _uow.EventTemplates.GetByIdAsync(id);
        if (template is null)
        {
            return NotFound();
        }

        _uow.EventTemplates.Remove(template);
        await _uow.SaveChangesAsync();

        return NoContent();
    }
}