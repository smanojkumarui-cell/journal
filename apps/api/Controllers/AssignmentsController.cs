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
public class AssignmentsController : ControllerBase
{
    private readonly AssignmentService _assignmentService;

    public AssignmentsController(AssignmentService assignmentService) => _assignmentService = assignmentService;

    [HttpGet("kanban")]
    [Authorize(Roles = "Manager,TechnicalEditor,Admin")]
    public async Task<ActionResult<KanbanBoardDto>> GetKanban()
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var role = User.FindFirstValue(ClaimTypes.Role);
        var kanban = await _assignmentService.GetKanbanAsync(userId, role);
        return Ok(kanban);
    }

    [HttpPost]
    [Authorize(Roles = "Manager,Admin")]
    public async Task<ActionResult<AssignmentDto>> Create([FromBody] CreateAssignmentRequest request)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var assignment = await _assignmentService.CreateAsync(request, userId);
        return Ok(new AssignmentDto(assignment.Id, assignment.ManuscriptId, "", assignment.AssigneeId, "", assignment.TaskType.ToString(), assignment.Status.ToString(), assignment.SlaHours, assignment.Deadline, assignment.StartedAt, assignment.CompletedAt, assignment.Notes));
    }

    [HttpPut("{id}/status")]
    public async Task<ActionResult<AssignmentDto>> UpdateStatus(int id, [FromBody] UpdateStatusRequest request)
    {
        if (!Enum.TryParse<AssignmentStatus>(request.Status, out var status))
            return BadRequest("Invalid status");
        
        var assignment = await _assignmentService.UpdateStatusAsync(id, status);
        if (assignment == null) return NotFound();
        
        return Ok(new AssignmentDto(assignment.Id, assignment.ManuscriptId, "", assignment.AssigneeId, "", assignment.TaskType.ToString(), assignment.Status.ToString(), assignment.SlaHours, assignment.Deadline, assignment.StartedAt, assignment.CompletedAt, assignment.Notes));
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Manager,Admin")]
    public async Task<ActionResult<AssignmentDto>> Update(int id, [FromBody] UpdateAssignmentRequest request)
    {
        var assignment = await _assignmentService.UpdateAsync(id, request);
        if (assignment == null) return NotFound();
        
        return Ok(new AssignmentDto(assignment.Id, assignment.ManuscriptId, "", assignment.AssigneeId, "", assignment.TaskType.ToString(), assignment.Status.ToString(), assignment.SlaHours, assignment.Deadline, assignment.StartedAt, assignment.CompletedAt, assignment.Notes));
    }
}