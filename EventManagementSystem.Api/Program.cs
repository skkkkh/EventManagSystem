using EventManagementSystem.Api.Data;
using EventManagementSystem.Api.Models;
using EventManagementSystem.Api.Repositories;
using EventManagementSystem.Api.Services;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllersWithViews();
builder.Services.AddEndpointsApiExplorer();

builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Event Management System API",
        Version = "v1",
        Description = "Event Management System API"
    });

    options.AddSecurityDefinition("Bearer",
        new OpenApiSecurityScheme
        {
            Name = "Authorization",
            Type = SecuritySchemeType.Http,
            Scheme = "bearer",
            BearerFormat = "JWT",
            In = ParameterLocation.Header,
            Description = "Enter your JWT token like: Bearer eyJhbGci..."
        });

    options.AddSecurityRequirement(
        new OpenApiSecurityRequirement
        {
            {
                new OpenApiSecurityScheme
                {
                    Reference =
                        new OpenApiReference
                        {
                            Type = ReferenceType.SecurityScheme,
                            Id = "Bearer"
                        }
                },
                Array.Empty<string>()
            }
        });
});

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(
        builder.Configuration.GetConnectionString("DefaultConnection")
        ?? "Data Source=eventmanagement.db"
    ));

builder.Services
    .AddIdentity<User, IdentityRole<int>>(options =>
    {
        options.Password.RequireDigit = true;
        options.Password.RequireLowercase = true;
        options.Password.RequireUppercase = false;
        options.Password.RequireNonAlphanumeric = false;
        options.Password.RequiredLength = 6;
        options.User.RequireUniqueEmail = true;
    })
    .AddEntityFrameworkStores<AppDbContext>()
    .AddDefaultTokenProviders();

var jwtKey = builder.Configuration["Jwt:Key"] ?? "EventManagementSystem_SuperSecretKey_2026_ChangeThis";
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "EventManagementSystem";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "EventManagementSystemUsers";

builder.Services
    .AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme = "SmartScheme";
        options.DefaultChallengeScheme = "SmartScheme";
    })
    .AddPolicyScheme("SmartScheme", "JWT or MVC Cookie", options =>
    {
        options.ForwardDefaultSelector = context =>
        {
            if (context.Request.Path.StartsWithSegments("/api"))
            {
                return JwtBearerDefaults.AuthenticationScheme;
            }
            return "MvcCookie";
        };
    })
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtIssuer,
            ValidAudience = jwtAudience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
            RoleClaimType = "role"
        };
    })
    .AddCookie("MvcCookie", options =>
    {
        options.Cookie.Name = "EventManagement.Auth";
        options.LoginPath = "/api/auth/login";
        options.AccessDeniedPath = "/api/auth/login";
        options.SlidingExpiration = true;
        options.ExpireTimeSpan = TimeSpan.FromHours(8);
    });

builder.Services.AddAuthorization();
builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();
builder.Services.AddScoped(typeof(IRepository<>), typeof(Repository<>));
builder.Services.AddMediatR(cfg => cfg.RegisterServicesFromAssembly(typeof(Program).Assembly));
builder.Services.AddScoped<IRecommendationService, RecommendationService>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        var allowedOrigins = new[]
        {
            "http://localhost:5173",
            "http://localhost:5174",
            builder.Configuration["FrontendUrl"] ?? "https://your-deployed-frontend-domain"
        };

        policy
            .WithOrigins(allowedOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI(options =>
{
    options.SwaggerEndpoint("/swagger/v1/swagger.json", "Event Management System API v1");
});

app.UseCors("AllowFrontend");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}");

// Seed database and ready-to-test accounts for evaluators/buyers
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var db = services.GetRequiredService<AppDbContext>();
    db.Database.Migrate();
    await SeedRolesAndDefaultUsersAsync(services);
    await SeedEventDataAsync(db);
}

app.Run();

static async Task SeedRolesAndDefaultUsersAsync(IServiceProvider services)
{
    var roleManager = services.GetRequiredService<RoleManager<IdentityRole<int>>>();
    var userManager = services.GetRequiredService<UserManager<User>>();
    string[] roles = { "Admin", "Organizer", "Attendee" };

    foreach (var role in roles)
    {
        if (!await roleManager.RoleExistsAsync(role))
        {
            await roleManager.CreateAsync(new IdentityRole<int>(role));
        }
    }

    var adminEmail = "admin@ems.com";
    if (await userManager.FindByEmailAsync(adminEmail) == null)
    {
        var admin = new User { UserName = adminEmail, Email = adminEmail, Name = "System Admin", Role = "Admin", RegistrationDate = DateTime.UtcNow };
        var res = await userManager.CreateAsync(admin, "Admin123!");
        if (res.Succeeded) await userManager.AddToRoleAsync(admin, "Admin");
    }
}

static async Task SeedEventDataAsync(AppDbContext db)
{
    if (!await db.Set<EventTemplate>().AnyAsync())
    {
        db.Set<EventTemplate>().Add(new EventTemplate
        {
            Id = 1,
            Name = "Standard Event Template",
            Description = "Default system-seeded template for events"
        });
        await db.SaveChangesAsync();
    }

    if (!await db.Events.AnyAsync())
    {
        db.Events.Add(new Event
        {
            Title = "Tech Innovation Summit 2026",
            Description = "An introductory summit exploring modern AI and web architectures.",
            StartDateTime = DateTime.UtcNow.AddDays(10),
            EndDateTime = DateTime.UtcNow.AddDays(10).AddHours(2),
            Location = "Main Auditorium",
            Capacity = 100,
            EventTemplateId = 1
        });
        await db.SaveChangesAsync();
    }
}