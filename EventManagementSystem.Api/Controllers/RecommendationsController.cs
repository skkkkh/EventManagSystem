using EventManagementSystem.Api.CQRS.Recommendations;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EventManagementSystem.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class RecommendationsController : ControllerBase
{
    private readonly IMediator _mediator;

    public RecommendationsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet("user/{userId:int}")]
    public async Task<IActionResult> GetForUser(int userId)
    {
        var recommendations = await _mediator.Send(new GetRecommendationsQuery(userId));
        return Ok(recommendations);
    }
}