using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using TechEditor.Api.DTOs;
using TechEditor.Api.Models;
using TechEditor.Api.Services;

namespace TechEditor.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ManuscriptsController : ControllerBase
{
    private readonly ManuscriptService _manuscriptService;

    public ManuscriptsController(ManuscriptService manuscriptService) => _manuscriptService = manuscriptService;

    [HttpGet]
    public async Task<ActionResult<List<ManuscriptDto>>> GetAll()
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var role = User.FindFirstValue(ClaimTypes.Role);
        var manuscripts = await _manuscriptService.GetAllAsync(userId, role);
        return Ok(manuscripts);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ManuscriptDto>> GetById(int id)
    {
        var manuscript = await _manuscriptService.GetByIdAsync(id);
        if (manuscript == null) return NotFound();
        return Ok(manuscript);
    }

    [HttpPost]
    [Authorize(Roles = "Author,Admin")]
    public async Task<ActionResult<ManuscriptDto>> Create([FromBody] CreateManuscriptRequest request)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var manuscript = await _manuscriptService.CreateAsync(request, userId);
        var dto = await _manuscriptService.GetByIdAsync(manuscript.Id);
        return CreatedAtAction(nameof(GetById), new { id = manuscript.Id }, dto);
    }

    [HttpPost("{id}/versions")]
    public async Task<ActionResult<ManuscriptVersionDto>> UploadVersion(int id, IFormFile file)
    {
        if (file == null || file.Length == 0) return BadRequest("File is required");
        
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var version = await _manuscriptService.AddVersionAsync(id, file, userId);
        return Ok(new ManuscriptVersionDto(version.Id, version.VersionNumber, version.FileName, version.FileType, version.FileSize, version.UploadedAt));
    }

    [HttpPut("{id}/status")]
    [Authorize(Roles = "Editor,Manager,Admin")]
    public async Task<ActionResult> UpdateStatus(int id, [FromBody] UpdateStatusRequest request)
    {
        var result = await _manuscriptService.UpdateStatusAsync(id, request.Status);
        if (!result) return NotFound();
        return Ok();
    }
}

public record UpdateStatusRequest(string Status);