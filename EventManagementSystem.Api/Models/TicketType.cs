using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace EventManagementSystem.Api.Models;

public class TicketType
{
    public int Id { get; set; }

    [Required, MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [Range(0, 100000000)]
    public decimal Price { get; set; }

    [Range(1, 1000000)]
    public int Quantity { get; set; }

    public int EventId { get; set; }
    public Event? Event { get; set; }

    public ICollection<Booking> Bookings { get; set; } = new List<Booking>();
}