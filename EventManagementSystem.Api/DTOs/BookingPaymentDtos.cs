using System;
using System.ComponentModel.DataAnnotations;

namespace EventManagementSystem.Api.DTOs;

public record CreateRegistrationDto(
    [Required, MaxLength(150)] string FullName,
    [Required, EmailAddress, MaxLength(200)] string Email,
    [MaxLength(30)] string? Phone,
    int EventId
);

public record RegistrationResponseDto(
    int Id,
    string FullName,
    string Email,
    string? Phone,
    int EventId,
    DateTime RegisteredAt
);

public record CreateTicketTypeDto(
    [Required, MaxLength(100)] string Name,
    [Range(0, 100000000)] decimal Price,
    [Range(1, 1000000)] int Quantity,
    int EventId
);

public record TicketTypeResponseDto(
    int Id,
    string Name,
    decimal Price,
    int Quantity,
    int EventId
);

public record CreateBookingDto(
    int RegistrationId,
    int TicketTypeId,
    [Range(1, 100)] int Quantity
);

public record BookingResponseDto(
    int Id,
    int RegistrationId,
    int TicketTypeId,
    int Quantity,
    decimal TotalAmount,
    string Status,
    DateTime BookedAt
);

public record CreatePaymentDto(
    int BookingId,
    [Required, MaxLength(50)] string PaymentMethod
);

public record PaymentResponseDto(
    int Id,
    int BookingId,
    decimal Amount,
    string PaymentMethod,
    string Status,
    string? TransactionReference,
    DateTime CreatedAt
);