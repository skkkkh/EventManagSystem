using System.Security.Claims;
using EventManagementSystem.Api.CQRS.Groups;
using EventManagementSystem.Api.DTOs;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EventManagementSystem.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class GroupsController : ControllerBase
{
    private readonly IMediator _mediator;

    public GroupsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpPost]
    public async Task<ActionResult<GroupDto>> Create(CreateGroupDto dto)
    {
        var organiserIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (organiserIdClaim is null || !int.TryParse(organiserIdClaim, out var organiserId))
        {
            return Unauthorized("Could not identify the logged-in organiser.");
        }

        var result = await _mediator.Send(new CreateGroupCommand(dto, organiserId));
        return StatusCode(201, result);
    }

    [HttpPost("{groupId:int}/members")]
    public async Task<ActionResult<GroupMemberDto>> AddMember(int groupId, AddGroupMemberDto dto)
    {
        var organiserIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (organiserIdClaim is null || !int.TryParse(organiserIdClaim, out var organiserId))
        {
            return Unauthorized("Could not identify the logged-in organiser.");
        }

        try
        {
            var result = await _mediator.Send(new AddGroupMemberCommand(groupId, dto, organiserId));
            return StatusCode(201, result);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Forbid();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpGet]
    public async Task<ActionResult<List<GroupDto>>> GetMyGroups()
    {
        var organiserIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (organiserIdClaim is null || !int.TryParse(organiserIdClaim, out var organiserId))
            return Unauthorized();

        var result = await _mediator.Send(new GetGroupsByOrganiserQuery(organiserId));
        return Ok(result);
    }

    [HttpGet("{groupId:int}/members")]
    public async Task<ActionResult<List<GroupMemberDto>>> GetMembers(int groupId)
    {
        var result = await _mediator.Send(new GetGroupMembersQuery(groupId));
        return Ok(result);
    }

    [HttpPut("{groupId:int}")]
    public async Task<ActionResult<GroupDto>> UpdateGroup(int groupId, UpdateGroupDto dto)
    {
        var organiserIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (organiserIdClaim is null || !int.TryParse(organiserIdClaim, out var organiserId))
        {
            return Unauthorized("Could not identify the logged-in organiser.");
        }

        try
        {
            var result = await _mediator.Send(new UpdateGroupCommand(groupId, dto, organiserId));
            return Ok(result);
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpDelete("{groupId:int}")]
    public async Task<IActionResult> DeleteGroup(int groupId)
    {
        var organiserIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (organiserIdClaim is null || !int.TryParse(organiserIdClaim, out var organiserId))
        {
            return Unauthorized("Could not identify the logged-in organiser.");
        }

        try
        {
            await _mediator.Send(new DeleteGroupCommand(groupId, organiserId));
            return NoContent();
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }
}