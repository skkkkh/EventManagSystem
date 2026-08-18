using System;
using System.ComponentModel.DataAnnotations;

namespace EventManagementSystem.Api.Models;

public class Payment
{
    public int Id { get; set; }

    public int BookingId { get; set; }
    public Booking? Booking { get; set; }

    [Required, MaxLength(50)]
    public string PaymentMethod { get; set; } = string.Empty;

    [Range(0, 100000000)]
    public decimal Amount { get; set; }

    public PaymentStatus Status { get; set; } = PaymentStatus.Pending;

    [MaxLength(200)]
    public string? TransactionReference { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public enum PaymentStatus
{
    Pending,
    Completed,
    Failed,
    Refunded
}