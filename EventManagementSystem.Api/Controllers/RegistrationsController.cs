using EventManagementSystem.Api.Data;
using EventManagementSystem.Api.DTOs;
using EventManagementSystem.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace EventManagementSystem.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class RegistrationsController : ControllerBase
{
    private readonly AppDbContext _context;

    public RegistrationsController(AppDbContext context)
    {
        _context = context;
    }

    [HttpPost]
    public async Task<ActionResult<RegistrationResponseDto>>
        CreateRegistration(CreateRegistrationDto dto)
    {
        var eventExists = await _context.Events
            .AnyAsync(e => e.Id == dto.EventId);

        if (!eventExists)
            return NotFound("Event not found.");

        var registration = new Registration
        {
            FullName = dto.FullName,
            Email = dto.Email,
            Phone = dto.Phone,
            EventId = dto.EventId,
            RegisteredAt = DateTime.UtcNow
        };

        _context.Registrations.Add(registration);
        await _context.SaveChangesAsync();

        var response = new RegistrationResponseDto(
            registration.Id,
            registration.FullName,
            registration.Email,
            registration.Phone,
            registration.EventId,
            registration.RegisteredAt
        );

        return CreatedAtAction(
            nameof(GetRegistration),
            new { id = registration.Id },
            response);
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<RegistrationResponseDto>>>
        GetRegistrations()
    {
        var registrations = await _context.Registrations
            .AsNoTracking()
            .Select(r => new RegistrationResponseDto(
                r.Id,
                r.FullName,
                r.Email,
                r.Phone,
                r.EventId,
                r.RegisteredAt
            ))
            .ToListAsync();

        return Ok(registrations);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<RegistrationResponseDto>>
        GetRegistration(int id)
    {
        var registration = await _context.Registrations
            .AsNoTracking()
            .FirstOrDefaultAsync(r => r.Id == id);

        if (registration == null)
            return NotFound();

        return Ok(new RegistrationResponseDto(
            registration.Id,
            registration.FullName,
            registration.Email,
            registration.Phone,
            registration.EventId,
            registration.RegisteredAt
        ));
    }
}