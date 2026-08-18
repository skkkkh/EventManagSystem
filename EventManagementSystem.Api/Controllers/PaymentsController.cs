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
public class PaymentsController : ControllerBase
{
    private readonly AppDbContext _context;

    public PaymentsController(AppDbContext context)
    {
        _context = context;
    }

    [HttpPost]
    public async Task<ActionResult<PaymentResponseDto>> CreatePayment(
        CreatePaymentDto dto)
    {
        var booking = await _context.Bookings
            .Include(b => b.Payment)
            .FirstOrDefaultAsync(b => b.Id == dto.BookingId);

        if (booking == null)
            return NotFound("Booking not found.");

        if (booking.Status == BookingStatus.Cancelled)
            return BadRequest("Cannot pay for a cancelled booking.");

        if (booking.Payment != null)
            return BadRequest("Payment already exists for this booking.");

        var payment = new Payment
        {
            BookingId = booking.Id,
            Amount = booking.TotalAmount,
            PaymentMethod = dto.PaymentMethod,
            Status = PaymentStatus.Completed,
            TransactionReference =
                $"TXN-{Guid.NewGuid():N}".ToUpper(),
            CreatedAt = DateTime.UtcNow
        };

        booking.Status = BookingStatus.Confirmed;

        _context.Payments.Add(payment);

        await _context.SaveChangesAsync();

        var response = new PaymentResponseDto(
            payment.Id,
            payment.BookingId,
            payment.Amount,
            payment.PaymentMethod,
            payment.Status.ToString(),
            payment.TransactionReference,
            payment.CreatedAt
        );

        return CreatedAtAction(
            nameof(GetPayment),
            new { id = payment.Id },
            response);
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<PaymentResponseDto>>> GetPayments()
    {
        var payments = await _context.Payments
            .AsNoTracking()
            .OrderByDescending(p => p.CreatedAt)
            .Select(p => new PaymentResponseDto(
                p.Id,
                p.BookingId,
                p.Amount,
                p.PaymentMethod,
                p.Status.ToString(),
                p.TransactionReference,
                p.CreatedAt
            ))
            .ToListAsync();

        return Ok(payments);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<PaymentResponseDto>> GetPayment(int id)
    {
        var payment = await _context.Payments
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == id);

        if (payment == null)
            return NotFound();

        return Ok(new PaymentResponseDto(
            payment.Id,
            payment.BookingId,
            payment.Amount,
            payment.PaymentMethod,
            payment.Status.ToString(),
            payment.TransactionReference,
            payment.CreatedAt
        ));
    }
}