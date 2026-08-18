using System.ComponentModel.DataAnnotations;
using EventManagementSystem.Api.Models;

namespace EventManagementSystem.Api.ViewModels;

// ---- Step 1: pick a ticket type and register ----

public class BookEventViewModel
{
    public Event Event { get; set; } = null!;
    public List<TicketType> TicketTypes { get; set; } = new();
    public BookingFormModel Form { get; set; } = new();
}

public class BookingFormModel
{
    public int EventId { get; set; }

    [Required, MaxLength(150)]
    public string FullName { get; set; } = string.Empty;

    [Required, EmailAddress, MaxLength(200)]
    public string Email { get; set; } = string.Empty;

    [MaxLength(30)]
    public string? Phone { get; set; }

    [Required(ErrorMessage = "Pick a ticket type.")]
    public int TicketTypeId { get; set; }

    [Range(1, 100)]
    public int Quantity { get; set; } = 1;
}

// ---- Step 2: checkout / payment ----

public class CheckoutViewModel
{
    public Booking Booking { get; set; } = null!;
    public string TicketTypeName { get; set; } = string.Empty;
    public PaymentFormModel Form { get; set; } = new();
}

public class PaymentFormModel
{
    public int BookingId { get; set; }

    [Required, MaxLength(50)]
    public string PaymentMethod { get; set; } = "Card";
}

// ---- Step 3: confirmation ----

public class ConfirmationViewModel
{
    public Booking Booking { get; set; } = null!;
    public Payment? Payment { get; set; }
    public string TicketTypeName { get; set; } = string.Empty;
}