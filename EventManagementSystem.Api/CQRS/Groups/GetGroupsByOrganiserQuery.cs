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

        // The generic repository doesn't eager-load navigation properties,
        // so group.Members would always come back empty here — count each
        // group's members with a separate query instead of trusting it.
        var result = new List<GroupDto>();
        foreach (var group in groups)
        {
            var members = await _uow.Repository<GroupMember>().FindAsync(gm => gm.GroupId == group.Id);
            result.Add(new GroupDto(group.Id, group.Name, group.OrganiserId, group.CreatedAt, members.Count));
        }
        return result;
    }
}
