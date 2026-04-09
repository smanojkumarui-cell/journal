using TechEditor.Api.Models;

namespace TechEditor.Api.DTOs;

public record UserDto(int Id, string Email, string Name, string Role, string? OrcidId, bool IsExternal, string? Specialty, ResourceType? ResourceType);
public record LoginRequest(string Email);
public record AuthResponse(string Token, UserDto User);
public record RegisterRequest(string Email, string Name, string? OrcidId);

public record JournalDto(int Id, string Name, string Slug, string? Issn, string? Description);
public record CreateJournalRequest(string Name, string? Issn, string? Description);

public record ManuscriptDto(
    int Id, string ManuscriptNumber, int JournalId, string JournalName,
    int AuthorId, string AuthorName, string Title, string? Abstract,
    string? Keywords, string Status, DateTime CreatedAt, DateTime? UpdatedAt,
    List<ManuscriptVersionDto> Versions, List<AssignmentDto>? Assignments);
public record CreateManuscriptRequest(int JournalId, string Title, string? Abstract, string? Keywords);
public record UpdateManuscriptRequest(string? Title, string? Abstract, string? Keywords, string? Status);

public record ManuscriptVersionDto(int Id, int VersionNumber, string FileName, string FileType, long FileSize, DateTime UploadedAt);
public record UploadVersionRequest(IFormFile File);

public record AssignmentDto(
    int Id, int ManuscriptId, string ManuscriptTitle, int AssigneeId, string AssigneeName,
    string TaskType, string Status, int? SlaHours, DateTime? Deadline,
    DateTime? StartedAt, DateTime? CompletedAt, string? Notes);
public record CreateAssignmentRequest(int ManuscriptId, int AssigneeId, TaskType TaskType, int? SlaHours);
public record UpdateAssignmentRequest(AssignmentStatus? Status, int? SlaHours, string? Notes);
public record KanbanBoardDto(List<AssignmentDto> Todo, List<AssignmentDto> Assigned, List<AssignmentDto> InProgress, List<AssignmentDto> Review, List<AssignmentDto> Completed);

public record ReviewDto(int Id, int ManuscriptId, int ReviewerId, string ReviewerName, string? Recommendation, string? Comments, bool IsSubmitted, DateTime? DueDate);
public record CreateReviewRequest(int ManuscriptId, string? Recommendation, string? Comments, string? ConfidentialComments, DateTime? DueDate);
public record SubmitReviewRequest(string Recommendation, string Comments, string? ConfidentialComments);

public record DecisionDto(int Id, int ManuscriptId, int EditorId, string EditorName, string DecisionType, string? Letter, DateTime CreatedAt);
public record CreateDecisionRequest(string DecisionType, string? Letter);

public record NotificationDto(int Id, string Type, string Title, string Message, string? Link, bool IsRead, DateTime CreatedAt);
public record MarkNotificationReadRequest(bool IsRead);

public record DashboardStatsDto(
    int TotalManuscripts, int PendingAssignments, int InProgressAssignments,
    int CompletedToday, int OverdueCount,
    Dictionary<string, int> ManuscriptsByStatus, Dictionary<string, int> AssignmentsByTaskType);

public record InstructionDocumentDto(
    int Id, string Title, string? Description, string Category, string RoleType,
    string FileName, string FileType, long FileSize, string UploadedByName, DateTime CreatedAt);
public record CreateInstructionDocumentRequest(string Title, string? Description, string Category, string RoleType, IFormFile File);