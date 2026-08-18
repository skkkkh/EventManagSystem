using System;
using System.ComponentModel.DataAnnotations;

namespace EventManagementSystem.Api.Models;

public class Booking
{
    public int Id { get; set; }

    public int RegistrationId { get; set; }
    public Registration? Registration { get; set; }

    public int TicketTypeId { get; set; }
    public TicketType? TicketType { get; set; }

    [Range(1, 100)]
    public int Quantity { get; set; }

    [Range(0, 100000000)]
    public decimal TotalAmount { get; set; }

    public BookingStatus Status { get; set; } = BookingStatus.Pending;

    public DateTime BookedAt { get; set; } = DateTime.UtcNow;

    public Payment? Payment { get; set; }
}

public enum BookingStatus
{
    Pending,
    Confirmed,
    Cancelled
}