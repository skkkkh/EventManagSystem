using EventManagementSystem.Api.Models;
using EventManagementSystem.Api.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[Route("api/[controller]")]
[ApiController]
public class EventsController : ControllerBase
{
    private readonly IUnitOfWork _unitOfWork;

    public EventsController(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    // Public: Anyone can view events
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var events = await _unitOfWork.Events.GetAllAsync();
        return Ok(events);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var ev = await _unitOfWork.Events.GetByIdAsync(id);
        if (ev == null) return NotFound();
        return Ok(ev);
    }

    // Protected: Only logged-in users/admins can modify
    [Authorize]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Event ev)
    {
        await _unitOfWork.Events.AddAsync(ev);
        await _unitOfWork.CompleteAsync();
        return CreatedAtAction(nameof(GetById), new { id = ev.Id }, ev);
    }

    [Authorize]
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] Event ev)
    {
        if (id != ev.Id) return BadRequest();
        _unitOfWork.Events.Update(ev);
        await _unitOfWork.CompleteAsync();
        return NoContent();
    }

    [Authorize]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var ev = await _unitOfWork.Events.GetByIdAsync(id);
        if (ev == null) return NotFound();

        _unitOfWork.Events.Remove(ev);
        await _unitOfWork.CompleteAsync();
        return NoContent();
    }
}