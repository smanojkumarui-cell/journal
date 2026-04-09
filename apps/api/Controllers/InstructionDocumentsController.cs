using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using TechEditor.Api.DTOs;
using TechEditor.Api.Services;
using IFormFile = Microsoft.AspNetCore.Http.IFormFile;

namespace TechEditor.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class InstructionDocumentsController : ControllerBase
{
    private readonly InstructionDocumentService _service;

    public InstructionDocumentsController(InstructionDocumentService service) => _service = service;

    [HttpGet]
    public async Task<ActionResult<List<InstructionDocumentDto>>> GetAll([FromQuery] string? category, [FromQuery] string? roleType)
    {
        var docs = await _service.GetAllAsync(category, roleType);
        return Ok(docs);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<InstructionDocumentDto>> GetById(int id)
    {
        var doc = await _service.GetByIdAsync(id);
        if (doc == null) return NotFound();
        return Ok(doc);
    }

    [HttpGet("role/{roleType}")]
    public async Task<ActionResult<List<InstructionDocumentDto>>> GetByRole(string roleType)
    {
        var docs = await _service.GetByRoleAsync(roleType);
        return Ok(docs);
    }

    [HttpPost]
    [Authorize(Roles = "Manager,Admin")]
    public async Task<ActionResult<InstructionDocumentDto>> Create([FromForm] CreateInstructionDocumentRequest request)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var document = await _service.CreateAsync(request, userId);
        var dto = await _service.GetByIdAsync(document.Id);
        return CreatedAtAction(nameof(GetById), new { id = document.Id }, dto);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Manager,Admin")]
    public async Task<ActionResult> Delete(int id)
    {
        var result = await _service.DeleteAsync(id);
        if (!result) return NotFound();
        return Ok();
    }
}