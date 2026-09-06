using MediatR;

namespace EventManagementSystem.Api.CQRS.Groups;

public record SetEventGroupCommand(int EventId, int? GroupId, int RequestingOrganiserId) : IRequest;