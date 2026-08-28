using EventManagementSystem.Api.CQRS.Recommendations;
using EventManagementSystem.Api.DTOs;
using EventManagementSystem.Api.Repositories;
using EventManagementSystem.Api.ViewModels;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace EventManagementSystem.Api.Controllers;

/// <summary>
/// MVC controller — returns HTML views, not JSON. Different from
/// UsersController/NotificationsController which are API controllers.
/// Note: no login/session yet, so the user id comes from the URL for now
/// (e.g. /Dashboard/Index/3). Once JWT auth is wired in by the CS student,
/// this should read the logged-in user's id from the auth token instead.
/// </summary>
public class DashboardController : Controller
{
    private readonly IUnitOfWork _uow;
    private readonly IMediator _mediator;

    public DashboardController(IUnitOfWork uow, IMediator mediator)
    {
        _uow = uow;
        _mediator = mediator;
    }

    // GET: /Dashboard/Index/3
    public async Task<IActionResult> Index(int id)
    {
        var user = await _uow.Users.GetByIdAsync(id);
        if (user is null) return NotFound();

        var notifications = await _uow.Notifications.FindAsync(n => n.UserId == id);
        var recommendations = await _mediator.Send(new GetRecommendationsQuery(id));

        var viewModel = new DashboardViewModel
        {
            User = UserDto.FromEntity(user),
            Notifications = notifications
                .OrderByDescending(n => n.CreatedAt)
                .Select(NotificationDto.FromEntity)
                .ToList(),
            Recommendations = recommendations.ToList()
        };

        return View(viewModel);
    }
}
