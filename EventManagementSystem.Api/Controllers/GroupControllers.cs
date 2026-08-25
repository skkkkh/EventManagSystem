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
}