using System;
using System.Linq;
using System.Net.Http.Headers;
using System.Threading.Tasks;
using System.Collections.Generic;
using System.Net.Http.Json;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using EventManagementSystem.Api.Models;
using Xunit;

namespace EventManagementSystem.Api.Tests;

public class EventIntegrationTests
{
    private const string JwtKey = "EventManagementSystem_SuperSecretKey_2026_ChangeThis";
    private const string JwtIssuer = "EventManagementSystem";
    private const string JwtAudience = "EventManagementSystemUsers";

    private WebApplicationFactory<Program> CreateFactory(SqliteConnection? connection = null)
    {
        connection ??= new SqliteConnection("DataSource=:memory:");
        connection.Open();

        var factory = new WebApplicationFactory<Program>().WithWebHostBuilder(builder =>
        {
            builder.ConfigureServices(services =>
            {
                // remove existing DbContext registrations
                var descriptor = services.SingleOrDefault(d => d.ServiceType == typeof(DbContextOptions<EventManagementSystem.Api.Data.AppDbContext>));
                if (descriptor != null) services.Remove(descriptor);

                services.AddDbContext<EventManagementSystem.Api.Data.AppDbContext>(options =>
                {
                    options.UseSqlite(connection);
                });
                // NOTE: Do NOT call EnsureCreated() here. Program.cs in the app
                // will call db.Database.Migrate() during startup. Calling
                // EnsureCreated() here leads to a race where EnsureCreated() has
                // created tables and Migrate() then attempts to CREATE TABLE and
                // fails with "table already exists". We intentionally leave
                // database initialization to the app's migrate step so only
                // Migrate() runs in the test host.
                // Replace IUnitOfWork with a test-friendly implementation that
                // ensures EventTemplates are loaded with their CustomFields
                // (the production Repository<T>.GetByIdAsync uses FindAsync and
                // does not include navigation properties). This keeps the
                // validation logic in CreateEventCommandHandler unchanged and
                // makes tests deterministic.
                var uowDescriptor = services.SingleOrDefault(d => d.ServiceType == typeof(EventManagementSystem.Api.Repositories.IUnitOfWork));
                if (uowDescriptor != null) services.Remove(uowDescriptor);

                services.AddScoped<EventManagementSystem.Api.Repositories.IUnitOfWork>(sp =>
                {
                    var ctx = sp.GetRequiredService<EventManagementSystem.Api.Data.AppDbContext>();
                    return new TestUnitOfWork(ctx);
                });
            });
        });

        return factory;
    }

    // Test-only UnitOfWork that includes CustomFields when fetching EventTemplates
    private class TestUnitOfWork : EventManagementSystem.Api.Repositories.IUnitOfWork
    {
        private readonly EventManagementSystem.Api.Data.AppDbContext _ctx;

        public TestUnitOfWork(EventManagementSystem.Api.Data.AppDbContext ctx)
        {
            _ctx = ctx;
            Events = new EventManagementSystem.Api.Repositories.Repository<EventManagementSystem.Api.Models.Event>(_ctx);
            CustomFields = new EventManagementSystem.Api.Repositories.Repository<EventManagementSystem.Api.Models.CustomField>(_ctx);
            EventFieldValues = new EventManagementSystem.Api.Repositories.Repository<EventManagementSystem.Api.Models.EventFieldValue>(_ctx);
            Registrations = new EventManagementSystem.Api.Repositories.Repository<EventManagementSystem.Api.Models.Registration>(_ctx);
            TicketTypes = new EventManagementSystem.Api.Repositories.Repository<EventManagementSystem.Api.Models.TicketType>(_ctx);
            Bookings = new EventManagementSystem.Api.Repositories.Repository<EventManagementSystem.Api.Models.Booking>(_ctx);
            Payments = new EventManagementSystem.Api.Repositories.Repository<EventManagementSystem.Api.Models.Payment>(_ctx);
            Users = new EventManagementSystem.Api.Repositories.Repository<EventManagementSystem.Api.Models.User>(_ctx);
            Notifications = new EventManagementSystem.Api.Repositories.Repository<EventManagementSystem.Api.Models.Notification>(_ctx);
        }

        public EventManagementSystem.Api.Repositories.IRepository<EventManagementSystem.Api.Models.Event> Events { get; }

        // EventTemplates property returns a small custom repo implementation
        public EventManagementSystem.Api.Repositories.IRepository<EventManagementSystem.Api.Models.EventTemplate> EventTemplates => new EventTemplateRepo(_ctx);

        public EventManagementSystem.Api.Repositories.IRepository<EventManagementSystem.Api.Models.CustomField> CustomFields { get; }

        public EventManagementSystem.Api.Repositories.IRepository<EventManagementSystem.Api.Models.EventFieldValue> EventFieldValues { get; }

        public EventManagementSystem.Api.Repositories.IRepository<EventManagementSystem.Api.Models.Registration> Registrations { get; }

        public EventManagementSystem.Api.Repositories.IRepository<EventManagementSystem.Api.Models.TicketType> TicketTypes { get; }

        public EventManagementSystem.Api.Repositories.IRepository<EventManagementSystem.Api.Models.Booking> Bookings { get; }

        public EventManagementSystem.Api.Repositories.IRepository<EventManagementSystem.Api.Models.Payment> Payments { get; }

        public EventManagementSystem.Api.Repositories.IRepository<EventManagementSystem.Api.Models.User> Users { get; }

        public EventManagementSystem.Api.Repositories.IRepository<EventManagementSystem.Api.Models.Notification> Notifications { get; }

        public EventManagementSystem.Api.Repositories.IRepository<T> Repository<T>() where T : class
            => new EventManagementSystem.Api.Repositories.Repository<T>(_ctx);

        public async Task<int> SaveChangesAsync() => await _ctx.SaveChangesAsync();

        public void Dispose() => _ctx.Dispose();

        private class EventTemplateRepo : EventManagementSystem.Api.Repositories.IRepository<EventManagementSystem.Api.Models.EventTemplate>
        {
            private readonly EventManagementSystem.Api.Data.AppDbContext _ctx;
            public EventTemplateRepo(EventManagementSystem.Api.Data.AppDbContext ctx) => _ctx = ctx;
            public async Task AddAsync(EventManagementSystem.Api.Models.EventTemplate entity) => await _ctx.EventTemplates.AddAsync(entity);
            public async Task<IReadOnlyList<EventManagementSystem.Api.Models.EventTemplate>> GetAllAsync() => await _ctx.EventTemplates.AsNoTracking().ToListAsync();
            public async Task<EventManagementSystem.Api.Models.EventTemplate?> GetByIdAsync(int id) =>
                await _ctx.EventTemplates.Include(t => t.CustomFields).FirstOrDefaultAsync(t => t.Id == id);
            public async Task<IReadOnlyList<EventManagementSystem.Api.Models.EventTemplate>> FindAsync(System.Linq.Expressions.Expression<System.Func<EventManagementSystem.Api.Models.EventTemplate, bool>> predicate) =>
                await _ctx.EventTemplates.AsNoTracking().Where(predicate).ToListAsync();
            public void Remove(EventManagementSystem.Api.Models.EventTemplate entity) => _ctx.EventTemplates.Remove(entity);
            public void Update(EventManagementSystem.Api.Models.EventTemplate entity) => _ctx.EventTemplates.Update(entity);
        }
    }

    private async Task<string> CreateUserAndGetJwtAsync(WebApplicationFactory<Program> factory, string role, string email)
    {
        using var scope = factory.Services.CreateScope();
        var services = scope.ServiceProvider;
        var userManager = services.GetRequiredService<Microsoft.AspNetCore.Identity.UserManager<User>>();

        var user = new User { UserName = email, Email = email, Name = email, Role = role };
        var result = await userManager.CreateAsync(user, "Password1!");
        if (!result.Succeeded)
        {
            // if the user already exists, fetch it
            user = await userManager.FindByEmailAsync(email) ?? user;
        }

        if (!await userManager.IsInRoleAsync(user, role))
        {
            await userManager.AddToRoleAsync(user, role);
        }

        // create JWT
        var claims = new[] {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(ClaimTypes.Name, user.UserName ?? email),
            new Claim(ClaimTypes.Email, user.Email ?? email),
            new Claim(ClaimTypes.Role, role),
            new Claim("role", role)
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(JwtKey));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var token = new JwtSecurityToken(
            issuer: JwtIssuer,
            audience: JwtAudience,
            claims: claims,
            expires: DateTime.UtcNow.AddHours(1),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    [Fact]
    public async Task CreateEvent_CRUD_and_TicketRegistration_Flow()
    {
        using var connection = new SqliteConnection("DataSource=:memory:");
        connection.Open();
        var factory = CreateFactory(connection);
        var client = factory.CreateClient();

        // create event template directly in DB
        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<EventManagementSystem.Api.Data.AppDbContext>();
            var template = new EventTemplate { Name = "Conference" };
            var cf1 = new CustomField { Name = "T-Shirt Size", IsRequired = true, FieldType = FieldType.Text, EventTemplate = template };
            var cf2 = new CustomField { Name = "Dietary", IsRequired = false, FieldType = FieldType.Text, EventTemplate = template };
            db.EventTemplates.Add(template);
            db.CustomFields.AddRange(cf1, cf2);
            await db.SaveChangesAsync();
        }

        // create organizer and get token
        var organizerToken = await CreateUserAndGetJwtAsync(factory, "Organizer", "org@example.com");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", organizerToken);

        // create event (valid)
        var createDto = new
        {
            Title = "Test Event",
            Description = "desc",
            Location = "here",
            StartDateTime = DateTime.UtcNow.AddDays(1),
            EndDateTime = DateTime.UtcNow.AddDays(1).AddHours(2),
            Capacity = 50,
            EventTemplateId = 1,
            FieldValues = new[] { new { CustomFieldId = 1, Value = "L" }, new { CustomFieldId = 2, Value = "Vegan" } }
        };

        var postResp = await client.PostAsJsonAsync("/api/events", createDto);
        Assert.Equal(System.Net.HttpStatusCode.Created, postResp.StatusCode);
        var created = await postResp.Content.ReadFromJsonAsync<EventManagementSystem.Api.DTOs.EventDto>();
        Assert.NotNull(created);

        // read it back
        var getResp = await client.GetAsync($"/api/events/{created.Id}");
        Assert.Equal(System.Net.HttpStatusCode.OK, getResp.StatusCode);

        // create ticket type
        var ticketDto = new { Name = "General", Price = 10.0m, Quantity = 10, EventId = created.Id };
        var ticketResp = await client.PostAsJsonAsync("/api/tickettypes", ticketDto);
        Assert.Equal(System.Net.HttpStatusCode.Created, ticketResp.StatusCode);
        var ticket = await ticketResp.Content.ReadFromJsonAsync<EventManagementSystem.Api.DTOs.TicketTypeResponseDto>();
        Assert.Equal(created.Id, ticket.EventId);

        // create registration (requires auth)
        var attendeeToken = await CreateUserAndGetJwtAsync(factory, "Attendee", "att@example.com");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", attendeeToken);

        var regDto = new { FullName = "Alice", Email = "a@example.com", Phone = "123", EventId = created.Id };
        var regResp = await client.PostAsJsonAsync("/api/registrations", regDto);
        Assert.Equal(System.Net.HttpStatusCode.Created, regResp.StatusCode);
        var reg = await regResp.Content.ReadFromJsonAsync<EventManagementSystem.Api.DTOs.RegistrationResponseDto>();
        Assert.Equal(created.Id, reg.EventId);
    }

    [Fact]
    public async Task CreateEvent_Validation_FieldValues_MissingRequired_ReturnsBadRequest()
    {
        using var connection = new SqliteConnection("DataSource=:memory:");
        connection.Open();
        var factory = CreateFactory(connection);
        var client = factory.CreateClient();

        // seed template with required field
        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<EventManagementSystem.Api.Data.AppDbContext>();
            var template = new EventTemplate { Name = "Workshop" };
            var cf1 = new CustomField { Name = "Phone", IsRequired = true, FieldType = FieldType.Text, EventTemplate = template };
            db.EventTemplates.Add(template);
            db.CustomFields.Add(cf1);
            await db.SaveChangesAsync();
        }

        var organizerToken = await CreateUserAndGetJwtAsync(factory, "Organizer", "org2@example.com");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", organizerToken);

        var createDto = new
        {
            Title = "Test",
            StartDateTime = DateTime.UtcNow.AddHours(1),
            EndDateTime = DateTime.UtcNow.AddHours(2),
            Capacity = 10,
            EventTemplateId = 1,
            FieldValues = new object[] { }
        };

        var resp = await client.PostAsJsonAsync("/api/events", createDto);
        Assert.Equal(System.Net.HttpStatusCode.BadRequest, resp.StatusCode);
    }

    [Fact]
    public async Task CreateEvent_InvalidCustomFieldId_ReturnsBadRequest()
    {
        using var connection = new SqliteConnection("DataSource=:memory:");
        connection.Open();
        var factory = CreateFactory(connection);
        var client = factory.CreateClient();

        // seed template without custom fields
        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<EventManagementSystem.Api.Data.AppDbContext>();
            var template = new EventTemplate { Name = "Seminar" };
            db.EventTemplates.Add(template);
            await db.SaveChangesAsync();
        }

        var organizerToken = await CreateUserAndGetJwtAsync(factory, "Organizer", "org3@example.com");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", organizerToken);

        var createDto = new
        {
            Title = "Test",
            StartDateTime = DateTime.UtcNow.AddHours(1),
            EndDateTime = DateTime.UtcNow.AddHours(2),
            Capacity = 10,
            EventTemplateId = 1,
            FieldValues = new[] { new { CustomFieldId = 999, Value = "x" } }
        };

        var resp = await client.PostAsJsonAsync("/api/events", createDto);
        Assert.Equal(System.Net.HttpStatusCode.BadRequest, resp.StatusCode);
    }

    [Fact]
    public async Task CreateEvent_EndBeforeStart_ReturnsBadRequest()
    {
        using var connection = new SqliteConnection("DataSource=:memory:");
        connection.Open();
        var factory = CreateFactory(connection);
        var client = factory.CreateClient();

        // seed template
        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<EventManagementSystem.Api.Data.AppDbContext>();
            var template = new EventTemplate { Name = "Meetup" };
            db.EventTemplates.Add(template);
            await db.SaveChangesAsync();
        }

        var organizerToken = await CreateUserAndGetJwtAsync(factory, "Organizer", "org4@example.com");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", organizerToken);

        var createDto = new
        {
            Title = "Test",
            StartDateTime = DateTime.UtcNow.AddHours(2),
            EndDateTime = DateTime.UtcNow.AddHours(1),
            Capacity = 10,
            EventTemplateId = 1,
            FieldValues = new object[] { }
        };

        var resp = await client.PostAsJsonAsync("/api/events", createDto);
        Assert.Equal(System.Net.HttpStatusCode.BadRequest, resp.StatusCode);
    }

    [Fact]
    public async Task CreateEvent_RoleForbidden_For_Attendee()
    {
        using var connection = new SqliteConnection("DataSource=:memory:");
        connection.Open();
        var factory = CreateFactory(connection);
        var client = factory.CreateClient();

        // seed template
        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<EventManagementSystem.Api.Data.AppDbContext>();
            var template = new EventTemplate { Name = "Party" };
            db.EventTemplates.Add(template);
            await db.SaveChangesAsync();
        }

        var attendeeToken = await CreateUserAndGetJwtAsync(factory, "Attendee", "att2@example.com");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", attendeeToken);

        var createDto = new
        {
            Title = "Test",
            StartDateTime = DateTime.UtcNow.AddHours(1),
            EndDateTime = DateTime.UtcNow.AddHours(2),
            Capacity = 10,
            EventTemplateId = 1,
            FieldValues = new object[] { }
        };

        var resp = await client.PostAsJsonAsync("/api/events", createDto);
        Assert.Equal(System.Net.HttpStatusCode.Forbidden, resp.StatusCode);
    }
}
