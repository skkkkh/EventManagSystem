using EventManagementSystem.Api.CQRS.Groups;
using EventManagementSystem.Api.DTOs;
using EventManagementSystem.Api.Models;
using EventManagementSystem.Api.Repositories;
using MediatR;

namespace EventManagementSystem.Api.CQRS.Groups;

public class CreateGroupCommandHandler : IRequestHandler<CreateGroupCommand, GroupDto>
{
    private readonly IUnitOfWork _uow;

    public CreateGroupCommandHandler(IUnitOfWork uow)
    {
        _uow = uow;
    }

    public async Task<GroupDto> Handle(CreateGroupCommand request, CancellationToken cancellationToken)
    {
        var dto = request.Dto;

        var organiser = await _uow.Users.GetByIdAsync(request.OrganiserId);
        if (organiser is null) throw new InvalidOperationException($"User {request.OrganiserId} does not exist.");

        var entity = new Group
        {
            Name = dto.Name,
            OrganiserId = request.OrganiserId,
            CreatedAt = DateTime.UtcNow
        };

        await _uow.Repository<Group>().AddAsync(entity);
        await _uow.SaveChangesAsync();

        return GroupDto.FromEntity(entity);
    }
}