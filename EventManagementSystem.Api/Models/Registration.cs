using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace EventManagementSystem.Api.Models;

public class Registration
{
    public int Id { get; set; }

    [Required, MaxLength(150)]
    public string FullName { get; set; } = string.Empty;

    [Required, EmailAddress, MaxLength(200)]
    public string Email { get; set; } = string.Empty;

    [MaxLength(30)]
    public string? Phone { get; set; }

    public int EventId { get; set; }
    public Event? Event { get; set; }

    public DateTime RegisteredAt { get; set; } = DateTime.UtcNow;

    public ICollection<Booking> Bookings { get; set; } = new List<Booking>();
}