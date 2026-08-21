using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using EventManagementSystem.Api.DTOs;
using EventManagementSystem.Api.Models;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;

namespace EventManagementSystem.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly UserManager<User> _userManager;
    private readonly SignInManager<User> _signInManager;
    private readonly RoleManager<IdentityRole<int>> _roleManager;
    private readonly IConfiguration _configuration;

    private static readonly string[] AllowedSelfRegisterRoles = { "Attendee", "Organizer" };

    public AuthController(
        UserManager<User> userManager,
        SignInManager<User> signInManager,
        RoleManager<IdentityRole<int>> roleManager,
        IConfiguration configuration)
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _roleManager = roleManager;
        _configuration = configuration;
    }

    [HttpPost("register")]
    public async Task<ActionResult<AuthResponseDto>> Register(RegisterDto dto)
    {
        var existing = await _userManager.FindByEmailAsync(dto.Email);
        if (existing != null) return BadRequest("A user with this email already exists.");

        var role = AllowedSelfRegisterRoles.Contains(dto.Role) ? dto.Role! : "Attendee";

        var user = new User
        {
            UserName = dto.Email,
            Email = dto.Email,
            Name = dto.Name,
            Role = role,
            RegistrationDate = DateTime.UtcNow
        };

        var result = await _userManager.CreateAsync(user, dto.Password);
        if (!result.Succeeded) return BadRequest(result.Errors.Select(e => e.Description));

        if (!await _roleManager.RoleExistsAsync(role))
        {
            await _roleManager.CreateAsync(new IdentityRole<int>(role));
        }

        await _userManager.AddToRoleAsync(user, role);

        var response = await BuildAuthResponseAsync(user);
        await SignInMvcCookieAsync(user);

        return StatusCode(201, response);
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponseDto>> Login(LoginDto dto)
    {
        var user = await _userManager.FindByEmailAsync(dto.Email);
        if (user == null) return Unauthorized("Invalid email or password.");

        var checkResult = await _signInManager.CheckPasswordSignInAsync(user, dto.Password, lockoutOnFailure: false);
        if (!checkResult.Succeeded) return Unauthorized("Invalid email or password.");

        var response = await BuildAuthResponseAsync(user);
        await SignInMvcCookieAsync(user);

        return Ok(response);
    }

    private async Task SignInMvcCookieAsync(User user)
    {
        var roles = await _userManager.GetRolesAsync(user);
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Name, user.Name),
            new(ClaimTypes.Email, user.Email ?? string.Empty)
        };

        claims.AddRange(roles.Select(role => new Claim(ClaimTypes.Role, role)));

        var identity = new ClaimsIdentity(claims, "MvcCookie");
        await HttpContext.SignInAsync("MvcCookie", new ClaimsPrincipal(identity));
    }

    private async Task<AuthResponseDto> BuildAuthResponseAsync(User user)
    {
        var roles = await _userManager.GetRolesAsync(user);
        var jwtKey = _configuration["Jwt:Key"] ?? "EventManagementSystem_SuperSecretKey_2026_ChangeThis";
        var jwtIssuer = _configuration["Jwt:Issuer"] ?? "EventManagementSystem";
        var jwtAudience = _configuration["Jwt:Audience"] ?? "EventManagementSystemUsers";
        var expiresAt = DateTime.UtcNow.AddHours(8);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new(JwtRegisteredClaimNames.Email, user.Email ?? string.Empty),
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Name, user.Name),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        // Explicitly map as "role" so authorization attributes evaluate correctly
        foreach (var role in roles)
        {
            claims.Add(new Claim("role", role));
        }

        var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
        var credentials = new SigningCredentials(signingKey, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: jwtIssuer,
            audience: jwtAudience,
            claims: claims,
            expires: expiresAt,
            signingCredentials: credentials);

        var tokenString = new JwtSecurityTokenHandler().WriteToken(token);

        return new AuthResponseDto(
            user.Id,
            user.Name,
            user.Email ?? string.Empty,
            roles,
            tokenString,
            expiresAt);
    }
}