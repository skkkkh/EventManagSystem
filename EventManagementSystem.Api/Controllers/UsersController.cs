using EventManagementSystem.Api.DTOs;
using EventManagementSystem.Api.Models;
using EventManagementSystem.Api.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EventManagementSystem.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly IUnitOfWork _uow;

    public UsersController(IUnitOfWork uow)
    {
        _uow = uow;
    }

    // Lightweight lookup any logged-in user can use — e.g. an organiser
    // searching for who to add to a group by name or email. Deliberately
    // NOT Admin-only like the actions below, and only returns minimal fields
    // (no role, registration date, etc.) since any authenticated user can call it.
    [HttpGet("search")]
    public async Task<IActionResult> Search([FromQuery] string query)
    {
        if (string.IsNullOrWhiteSpace(query) || query.Trim().Length < 2)
            return Ok(Array.Empty<object>());

        var q = query.Trim().ToLowerInvariant();
        var users = await _uow.Users.GetAllAsync();

        var matches = users
            .Where(u => (u.Name?.ToLowerInvariant().Contains(q) ?? false) ||
                        (u.Email?.ToLowerInvariant().Contains(q) ?? false))
            .Take(10)
            .Select(u => new { u.Id, u.Name, u.Email })
            .ToList();

        return Ok(matches);
    }

    [HttpGet]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetAll()
    {
        var users = await _uow.Users.GetAllAsync();
        return Ok(users.Select(u => UserDto.FromEntity(u)));
    }

    [HttpGet("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetById(int id)
    {
        var u = await _uow.Users.GetByIdAsync(id);
        if (u is null) return NotFound();
        return Ok(UserDto.FromEntity(u));
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Create(CreateUserDto dto)
    {
        var entity = new User { Name = dto.Name, Email = dto.Email, Role = dto.Role ?? "Attendee", RegistrationDate = dto.RegistrationDate ?? DateTime.UtcNow };
        await _uow.Users.AddAsync(entity);
        await _uow.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = entity.Id }, UserDto.FromEntity(entity));
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(int id, CreateUserDto dto)
    {
        var entity = await _uow.Users.GetByIdAsync(id);
        if (entity is null) return NotFound();
        entity.Name = dto.Name;
        entity.Email = dto.Email;
        entity.Role = dto.Role ?? entity.Role;
        entity.RegistrationDate = dto.RegistrationDate ?? entity.RegistrationDate;
        _uow.Users.Update(entity);
        await _uow.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        var entity = await _uow.Users.GetByIdAsync(id);
        if (entity is null) return NotFound();
        _uow.Users.Remove(entity);
        await _uow.SaveChangesAsync();
        return NoContent();
    }
}

public class CreateUserDto
{
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Role { get; set; }
    public DateTime? RegistrationDate { get; set; }
}