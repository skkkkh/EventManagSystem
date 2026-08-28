using EventManagementSystem.Api.DTOs;
using EventManagementSystem.Api.Models;
using EventManagementSystem.Api.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EventManagementSystem.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class UsersController : ControllerBase
{
    private readonly IUnitOfWork _uow;

    public UsersController(IUnitOfWork uow)
    {
        _uow = uow;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var users = await _uow.Users.GetAllAsync();
        return Ok(users.Select(u => UserDto.FromEntity(u)));
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var u = await _uow.Users.GetByIdAsync(id);
        if (u is null) return NotFound();
        return Ok(UserDto.FromEntity(u));
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreateUserDto dto)
    {
        var entity = new User { Name = dto.Name, Email = dto.Email, Role = dto.Role ?? "Attendee", RegistrationDate = dto.RegistrationDate ?? DateTime.UtcNow };
        await _uow.Users.AddAsync(entity);
        await _uow.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = entity.Id }, UserDto.FromEntity(entity));
    }

    [HttpPut("{id:int}")]
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