using System.Security.Claims;
using EventManagementSystem.Api.CQRS.Reviews;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EventManagementSystem.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ReviewsController : ControllerBase
{
    private readonly IMediator _mediator;

    public ReviewsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpPost("event/{eventId:int}")]
    [Authorize]
    public async Task<ActionResult<int>> Submit(int eventId, [FromBody] SubmitReviewBody body)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userIdClaim is null || !int.TryParse(userIdClaim, out var userId))
            return Unauthorized("Could not identify the logged-in user.");

        try
        {
            var reviewId = await _mediator.Send(
                new SubmitReviewCommand(eventId, userId, body.Rating, body.Comment));
            return StatusCode(201, reviewId);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpGet("event/{eventId:int}/summary")]
    public async Task<ActionResult<ReviewSummaryDto>> GetSummary(int eventId)
    {
        var result = await _mediator.Send(new GetEventReviewSummaryQuery(eventId));
        return Ok(result);
    }
}

public record SubmitReviewBody(int Rating, string? Comment);