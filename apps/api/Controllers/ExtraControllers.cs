using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using TechEditor.Api.DTOs;
using TechEditor.Api.Services;

namespace TechEditor.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class JournalsController : ControllerBase
{
    private readonly JournalService _journalService;

    public JournalsController(JournalService journalService) => _journalService = journalService;

    [HttpGet]
    public async Task<ActionResult<List<JournalDto>>> GetAll()
    {
        var journals = await _journalService.GetAllAsync();
        return Ok(journals);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<JournalDto>> GetById(int id)
    {
        var journal = await _journalService.GetByIdAsync(id);
        if (journal == null) return NotFound();
        return Ok(journal);
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<JournalDto>> Create([FromBody] CreateJournalRequest request)
    {
        var journal = await _journalService.CreateAsync(request);
        return Ok(new JournalDto(journal.Id, journal.Name, journal.Slug, journal.Issn, journal.Description));
    }
}

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ReviewsController : ControllerBase
{
    private readonly ReviewService _reviewService;

    public ReviewsController(ReviewService reviewService) => _reviewService = reviewService;

    [HttpGet("manuscript/{manuscriptId}")]
    public async Task<ActionResult<List<ReviewDto>>> GetByManuscript(int manuscriptId)
    {
        var reviews = await _reviewService.GetByManuscriptAsync(manuscriptId);
        return Ok(reviews);
    }

    [HttpPost]
    [Authorize(Roles = "Editor,Admin")]
    public async Task<ActionResult<ReviewDto>> Create([FromBody] CreateReviewRequest request)
    {
        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var review = await _reviewService.CreateAsync(request, userId);
        return Ok(new ReviewDto(review.Id, review.ManuscriptId, review.ReviewerId, "", review.Recommendation, review.Comments, review.IsSubmitted, review.DueDate));
    }

    [HttpPut("{id}/submit")]
    [Authorize(Roles = "Reviewer,Admin")]
    public async Task<ActionResult<ReviewDto>> Submit(int id, [FromBody] SubmitReviewRequest request)
    {
        var review = await _reviewService.SubmitAsync(id, request);
        if (review == null) return NotFound();
        return Ok(new ReviewDto(review.Id, review.ManuscriptId, review.ReviewerId, "", review.Recommendation, review.Comments, review.IsSubmitted, review.DueDate));
    }
}

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class NotificationsController : ControllerBase
{
    private readonly NotificationService _notificationService;

    public NotificationsController(NotificationService notificationService) => _notificationService = notificationService;

    [HttpGet]
    public async Task<ActionResult<List<NotificationDto>>> GetAll()
    {
        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var notifications = await _notificationService.GetForUserAsync(userId);
        return Ok(notifications);
    }

    [HttpPut("{id}/read")]
    public async Task<ActionResult> MarkRead(int id, [FromBody] MarkNotificationReadRequest request)
    {
        await _notificationService.MarkReadAsync(id, request.IsRead);
        return Ok();
    }
}