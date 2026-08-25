using EventManagementSystem.Api.DTOs;
using EventManagementSystem.Api.Models;
using EventManagementSystem.Api.Repositories;
using MediatR;

namespace EventManagementSystem.Api.CQRS.Groups;

public class GetGroupsByOrganiserQuery : IRequest<List<GroupDto>>
{
    public int OrganiserId { get; set; }
    public GetGroupsByOrganiserQuery(int organiserId) => OrganiserId = organiserId;
}

public class GetGroupsByOrganiserQueryHandler : IRequestHandler<GetGroupsByOrganiserQuery, List<GroupDto>>
{
    private readonly IUnitOfWork _uow;
    public GetGroupsByOrganiserQueryHandler(IUnitOfWork uow) => _uow = uow;

    public async Task<List<GroupDto>> Handle(GetGroupsByOrganiserQuery request, CancellationToken cancellationToken)
    {
        var groups = await _uow.Repository<Group>().FindAsync(g => g.OrganiserId == request.OrganiserId);
        return groups.Select(GroupDto.FromEntity).ToList();
    }
}