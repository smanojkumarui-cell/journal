namespace TechEditor.Api.Models;

public enum UserRole
{
    Author,
    Manager,
    TechnicalEditor,
    Editor,
    Reviewer,
    Admin
}

public enum ResourceType
{
    TechnicalEditor,
    Copyeditor,
    Proofreader,
    Reviewer
}

public enum ManuscriptStatus
{
    Draft,
    Submitted,
    UnderReview,
    RevisionRequired,
    Accepted,
    Rejected,
    Published
}

public enum AssignmentStatus
{
    Todo,
    Assigned,
    InProgress,
    Review,
    Completed
}

public enum TaskType
{
    Copyediting,
    ProofReading,
    TEReview,
    QACheck,
    PeerReview
}

public class User
{
    public int Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? GoogleId { get; set; }
    public string? OrcidId { get; set; }
    public UserRole Role { get; set; }
    public bool IsExternal { get; set; }
    public decimal? HourlyRate { get; set; }
    public string? Specialty { get; set; }
    public ResourceType? ResourceType { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<Manuscript> AuthoredManuscripts { get; set; } = new List<Manuscript>();
    public ICollection<Assignment> Assignments { get; set; } = new List<Assignment>();
    public ICollection<Assignment> AssignedTasks { get; set; } = new List<Assignment>();
}

public class Journal
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? Issn { get; set; }
    public string? Description { get; set; }
    public int PublisherId { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<Manuscript> Manuscripts { get; set; } = new List<Manuscript>();
}

public class Manuscript
{
    public int Id { get; set; }
    public string ManuscriptNumber { get; set; } = string.Empty;
    public int JournalId { get; set; }
    public int AuthorId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Abstract { get; set; }
    public string? Keywords { get; set; }
    public ManuscriptStatus Status { get; set; } = ManuscriptStatus.Draft;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    public DateTime? PublishedAt { get; set; }

    public Journal Journal { get; set; } = null!;
    public User Author { get; set; } = null!;
    public ICollection<ManuscriptVersion> Versions { get; set; } = new List<ManuscriptVersion>();
    public ICollection<Assignment> Assignments { get; set; } = new List<Assignment>();
    public ICollection<Review> Reviews { get; set; } = new List<Review>();
    public Decision? Decision { get; set; }
    public Publication? Publication { get; set; }
}

public class ManuscriptVersion
{
    public int Id { get; set; }
    public int ManuscriptId { get; set; }
    public int VersionNumber { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string FilePath { get; set; } = string.Empty;
    public string FileType { get; set; } = string.Empty;
    public long FileSize { get; set; }
    public int UploadedById { get; set; }
    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;

    public Manuscript Manuscript { get; set; } = null!;
    public User UploadedBy { get; set; } = null!;
}

public class Assignment
{
    public int Id { get; set; }
    public int ManuscriptId { get; set; }
    public int AssigneeId { get; set; }
    public int AssignedById { get; set; }
    public TaskType TaskType { get; set; }
    public AssignmentStatus Status { get; set; } = AssignmentStatus.Todo;
    public int? SlaHours { get; set; }
    public DateTime? Deadline { get; set; }
    public DateTime? StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public Manuscript Manuscript { get; set; } = null!;
    public User Assignee { get; set; } = null!;
    public User AssignedBy { get; set; } = null!;
}

public class Review
{
    public int Id { get; set; }
    public int ManuscriptId { get; set; }
    public int ReviewerId { get; set; }
    public string? Recommendation { get; set; }
    public string? Comments { get; set; }
    public string? ConfidentialComments { get; set; }
    public bool IsSubmitted { get; set; }
    public DateTime? DueDate { get; set; }
    public DateTime? SubmittedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Manuscript Manuscript { get; set; } = null!;
    public User Reviewer { get; set; } = null!;
}

public class Decision
{
    public int Id { get; set; }
    public int ManuscriptId { get; set; }
    public int EditorId { get; set; }
    public string DecisionType { get; set; } = string.Empty;
    public string? Letter { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Manuscript Manuscript { get; set; } = null!;
    public User Editor { get; set; } = null!;
}

public class Publication
{
    public int Id { get; set; }
    public int ManuscriptId { get; set; }
    public string? Doi { get; set; }
    public string? PdfPath { get; set; }
    public DateTime PublishedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Manuscript Manuscript { get; set; } = null!;
}

public class Notification
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string Type { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string? Link { get; set; }
    public bool IsRead { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public User User { get; set; } = null!;
}

public class AuditLog
{
    public int Id { get; set; }
    public int? UserId { get; set; }
    public string Action { get; set; } = string.Empty;
    public string? EntityType { get; set; }
    public int? EntityId { get; set; }
    public string? Details { get; set; }
    public string? IpAddress { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}

public enum InstructionCategory
{
    Punctuation,
    UKStyle,
    USStyle
}

public enum InstructionRoleType
{
    CopyEditor,
    TechnicalEditor,
    Both
}

public class InstructionDocument
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Category { get; set; } = string.Empty;
    public string RoleType { get; set; } = string.Empty;
    public string FileName { get; set; } = string.Empty;
    public string FilePath { get; set; } = string.Empty;
    public string FileType { get; set; } = string.Empty;
    public long FileSize { get; set; }
    public int UploadedById { get; set; }
    public User UploadedBy { get; set; } = null!;
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}