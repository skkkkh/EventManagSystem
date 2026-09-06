using MediatR;

namespace EventManagementSystem.Api.CQRS.Groups;

public record CheckEventAccessQuery(int EventId, int? UserId) : IRequest<bool>;