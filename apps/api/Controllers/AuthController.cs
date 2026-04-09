using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using TechEditor.Api.DTOs;
using TechEditor.Api.Services;

namespace TechEditor.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly UserService _userService;

    public AuthController(UserService userService) => _userService = userService;

    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<UserDto>> Me()
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var user = await _userService.GetByIdAsync(userId);
        if (user == null) return Unauthorized();
        return Ok(await _userService.MapToDtoAsync(user));
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login([FromBody] LoginRequest request)
    {
        var user = await _userService.GetByEmailAsync(request.Email);
        if (user == null) return NotFound("User not found");
        
        var token = await _userService.GenerateTokenAsync(user);
        var userDto = await _userService.MapToDtoAsync(user);
        return Ok(new AuthResponse(token, userDto));
    }

    [HttpGet("resources")]
    [Authorize]
    public async Task<ActionResult<List<UserDto>>> GetResources()
    {
        var resources = await _userService.GetResourcesAsync();
        return Ok(resources);
    }

    [HttpPost("freelancer")]
    [Authorize(Roles = "Manager,Admin")]
    public async Task<ActionResult<UserDto>> AddFreelancer([FromBody] AddFreelancerRequest request)
    {
        var user = await _userService.AddExternalFreelancerAsync(request.Name, request.Email, request.Specialty, request.HourlyRate);
        return Ok(await _userService.MapToDtoAsync(user));
    }
}

public record AddFreelancerRequest(string Name, string Email, string Specialty, decimal HourlyRate);