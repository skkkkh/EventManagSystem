using System;
using EventManagementSystem.Api.DTOs;
using EventManagementSystem.Api.Models;
using Xunit;

namespace EventManagementSystem.UnitTests;

public class EventDtoTests
{
    [Fact]
    public void FromEntity_IncludesCapacity()
    {
        var e = new Event
        {
            Id = 1,
            Title = "Test",
            StartDateTime = DateTime.UtcNow,
            EndDateTime = DateTime.UtcNow.AddHours(1),
            Capacity = 123,
            EventTemplateId = 2
        };

        var dto = EventDto.FromEntity(e);

        Assert.Equal(123, dto.Capacity);
    }
}
