using MediatR;

namespace EventManagementSystem.Api.CQRS.Groups;

public record DeleteGroupCommand(int GroupId, int RequestingOrganiserId) : IRequest;
