using System.Security.Claims;
using EventManagementSystem.Api.Data;
using EventManagementSystem.Api.DTOs;
using EventManagementSystem.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EventManagementSystem.Api.Controllers;

// An organizer's public "About Us" — their bio plus a leadership team
// (e.g. a university society's head/sub-head), shown to attendees. Reading
// is open to any signed-in user; writing is restricted to the organizer
// who owns the profile.
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class OrganizerProfileController : ControllerBase
{
    private readonly AppDbContext _context;

    public OrganizerProfileController(AppDbContext context)
    {
        _context = context;
    }

    // Any signed-in user can view an organizer's About Us — e.g. tapped
    // from an event's detail page to see who's running it.
    [HttpGet("{organizerId:int}")]
    public async Task<ActionResult<OrganizerProfileDto>> GetProfile(int organizerId)
    {
        var organizer = await _context.Users.AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == organizerId && u.Role == "Organizer");
        if (organizer == null)
            return NotFound("Organizer not found.");

        var team = await _context.TeamMembers.AsNoTracking()
            .Where(t => t.OrganizerId == organizerId)
            .OrderBy(t => t.DisplayOrder)
            .ThenBy(t => t.Id)
            .Select(t => new TeamMemberDto(t.Id, t.Name, t.Title, t.PhotoUrl, t.DisplayOrder))
            .ToListAsync();

        return Ok(new OrganizerProfileDto(organizer.Id, organizer.Name, organizer.AboutUs, team));
    }

    // The logged-in organizer writes/updates their own bio.
    [HttpPut("about-us")]
    [Authorize(Roles = "Organizer")]
    public async Task<IActionResult> UpdateAboutUs(UpdateAboutUsDto dto)
    {
        var organizerId = GetOrganizerId();
        if (organizerId == null)
            return Unauthorized();

        var organizer = await _context.Users.FindAsync(organizerId.Value);
        if (organizer == null)
            return NotFound();

        organizer.AboutUs = dto.AboutUs;
        await _context.SaveChangesAsync();

        return Ok(new { message = "About Us updated." });
    }

    [HttpPost("team")]
    [Authorize(Roles = "Organizer")]
    public async Task<ActionResult<TeamMemberDto>> AddTeamMember(UpsertTeamMemberDto dto)
    {
        var organizerId = GetOrganizerId();
        if (organizerId == null)
            return Unauthorized();

        var member = new TeamMember
        {
            OrganizerId = organizerId.Value,
            Name = dto.Name,
            Title = dto.Title,
            PhotoUrl = dto.PhotoUrl,
            DisplayOrder = dto.DisplayOrder
        };

        _context.TeamMembers.Add(member);
        await _context.SaveChangesAsync();

        return StatusCode(201, new TeamMemberDto(
            member.Id, member.Name, member.Title, member.PhotoUrl, member.DisplayOrder));
    }

    [HttpPut("team/{id:int}")]
    [Authorize(Roles = "Organizer")]
    public async Task<ActionResult<TeamMemberDto>> UpdateTeamMember(int id, UpsertTeamMemberDto dto)
    {
        var organizerId = GetOrganizerId();
        if (organizerId == null)
            return Unauthorized();

        var member = await _context.TeamMembers.FirstOrDefaultAsync(t => t.Id == id);
        if (member == null)
            return NotFound();
        if (member.OrganizerId != organizerId.Value)
            return Forbid();

        member.Name = dto.Name;
        member.Title = dto.Title;
        member.PhotoUrl = dto.PhotoUrl;
        member.DisplayOrder = dto.DisplayOrder;
        await _context.SaveChangesAsync();

        return Ok(new TeamMemberDto(
            member.Id, member.Name, member.Title, member.PhotoUrl, member.DisplayOrder));
    }

    [HttpDelete("team/{id:int}")]
    [Authorize(Roles = "Organizer")]
    public async Task<IActionResult> DeleteTeamMember(int id)
    {
        var organizerId = GetOrganizerId();
        if (organizerId == null)
            return Unauthorized();

        var member = await _context.TeamMembers.FirstOrDefaultAsync(t => t.Id == id);
        if (member == null)
            return NotFound();
        if (member.OrganizerId != organizerId.Value)
            return Forbid();

        _context.TeamMembers.Remove(member);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    private int? GetOrganizerId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(claim, out var id) ? id : null;
    }
}
