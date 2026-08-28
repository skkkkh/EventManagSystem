using EventManagementSystem.Api.DTOs;
using MediatR;

namespace EventManagementSystem.Api.CQRS.Bookings;

/// <summary>
/// Command to create a new booking. Returns the created booking as a DTO.
/// </summary>
public record CreateBookingCommand(CreateBookingDto Dto) : IRequest<BookingResponseDto>;