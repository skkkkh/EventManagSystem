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

// ==================================================
// MVC + API
// ==================================================
builder.Services.AddControllersWithViews();
builder.Services.AddEndpointsApiExplorer();

// ==================================================
// Swagger
// ==================================================
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

// ==================================================
// Entity Framework Core
// ==================================================
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(
        builder.Configuration.GetConnectionString("DefaultConnection")
        ?? "Data Source=eventmanagement.db"
    ));

// ==================================================
// ASP.NET Core Identity
// ==================================================
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

// ==================================================
// JWT
// ==================================================
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
            // API requests use JWT
            if (context.Request.Path.StartsWithSegments("/api"))
            {
                return JwtBearerDefaults.AuthenticationScheme;
            }

            // MVC requests use authentication cookie
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

            IssuerSigningKey =
                new SymmetricSecurityKey(
                    Encoding.UTF8.GetBytes(jwtKey))
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

// ==================================================
// Authorization
// ==================================================
builder.Services.AddAuthorization();

// ==================================================
// Repository / Unit of Work
// ==================================================
builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();
builder.Services.AddScoped(typeof(IRepository<>), typeof(Repository<>));

// ==================================================
// MediatR
// ==================================================
builder.Services.AddMediatR(cfg => cfg.RegisterServicesFromAssembly(typeof(Program).Assembly));

// ==================================================
// Recommendation Service
// ==================================================
builder.Services.AddScoped<IRecommendationService, RecommendationService>();

// ==================================================
// CORS
// ==================================================
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        // Allow localhost during development plus an optional configured frontend URL
        var allowedOrigins = new[]
        {
            "http://localhost:5173",
            builder.Configuration["FrontendUrl"] ?? "https://your-deployed-frontend-domain"
        };

        policy
            .WithOrigins(allowedOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

// ==================================================
// Build
// ==================================================
var app = builder.Build();

// ==================================================
// Swagger
// ==================================================
app.UseSwagger();
app.UseSwaggerUI(options =>
{
    options.SwaggerEndpoint("/swagger/v1/swagger.json", "Event Management System API v1");
});

// ==================================================
// Middleware
// ==================================================

// CORS must be first so browser preflight OPTIONS requests bypass redirection
app.UseCors("AllowFrontend");

// Optional for local dev: comment this out if it forces HTTPS redirects on port 5080
// app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();

// ==================================================
// Controllers
// ==================================================
app.MapControllers();
app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}");

// ==================================================
// Database
// ==================================================
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var db = services.GetRequiredService<AppDbContext>();
    db.Database.Migrate();
    await SeedRolesAsync(services);
}

// ==================================================
// Run
// ==================================================
app.Run();

// ==================================================
// Role Seeding
// ==================================================
static async Task SeedRolesAsync(IServiceProvider services)
{
    var roleManager = services.GetRequiredService<RoleManager<IdentityRole<int>>>();
    string[] roles = { "Admin", "Organizer", "Attendee" };

    foreach (var role in roles)
    {
        if (!await roleManager.RoleExistsAsync(role))
        {
            await roleManager.CreateAsync(new IdentityRole<int>(role));
        }
    }
}