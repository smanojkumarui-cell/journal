using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Hosting;
using TechEditor.Api.Data;
using TechEditor.Api.Models;
using TechEditor.Api.DTOs;

namespace TechEditor.Api.Services;

public class UserService
{
    private readonly TechEditorDbContext _context;
    private readonly IConfiguration _configuration;

    public UserService(TechEditorDbContext context, IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
    }

    public async Task<User?> GetByEmailAsync(string email) =>
        await _context.Users.FirstOrDefaultAsync(u => u.Email == email);

    public async Task<User?> GetByIdAsync(int id) =>
        await _context.Users.FirstOrDefaultAsync(u => u.Id == id);

    public async Task<User> CreateOrUpdateGoogleUserAsync(string email, string name, string? googleId)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
        if (user == null)
        {
            user = new User
            {
                Email = email,
                Name = name,
                GoogleId = googleId,
                Role = UserRole.Author,
                IsActive = true
            };
            _context.Users.Add(user);
            await _context.SaveChangesAsync();
        }
        else if (user.GoogleId == null && googleId != null)
        {
            user.GoogleId = googleId;
            await _context.SaveChangesAsync();
        }
        return user;
    }

    public async Task<string> GenerateTokenAsync(User user)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["JWT:Key"] ?? "default-key"));
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Email, user.Email),
            new(ClaimTypes.Name, user.Name),
            new(ClaimTypes.Role, user.Role.ToString())
        };

        var token = new JwtSecurityToken(
            issuer: _configuration["JWT:Issuer"] ?? "TechEditor",
            audience: _configuration["JWT:Audience"] ?? "TechEditor",
            claims: claims,
            expires: DateTime.UtcNow.AddDays(7),
            signingCredentials: new SigningCredentials(key, SecurityAlgorithms.HmacSha256)
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public async Task<UserDto> MapToDtoAsync(User user) => new(
        user.Id, user.Email, user.Name, user.Role.ToString(), user.OrcidId,
        user.IsExternal, user.Specialty, user.ResourceType
    );

    public async Task GoogleCallbackAsync(Microsoft.AspNetCore.Authentication.OAuth.OAuthCreatingTicketContext context)
    {
        var email = context.Principal?.FindFirst(ClaimTypes.Email)?.Value;
        var name = context.Principal?.FindFirst(ClaimTypes.Name)?.Value ?? email;
        var googleId = context.Principal?.FindFirst(ClaimTypes.NameIdentifier)?.Value?.Split(':').Last();

        if (!string.IsNullOrEmpty(email))
        {
            await CreateOrUpdateGoogleUserAsync(email, name, googleId);
        }
    }

    public async Task<List<UserDto>> GetResourcesAsync()
    {
        var resources = await _context.Users
            .Where(u => u.ResourceType != null && u.IsActive)
            .ToListAsync();
        return resources.Select(u => new UserDto(u.Id, u.Email, u.Name, u.Role.ToString(), u.OrcidId, u.IsExternal, u.Specialty, u.ResourceType)).ToList();
    }

    public async Task<User> AddExternalFreelancerAsync(string name, string email, string specialty, decimal hourlyRate)
    {
        var user = new User
        {
            Email = email,
            Name = name,
            Role = UserRole.TechnicalEditor,
            IsExternal = true,
            Specialty = specialty,
            HourlyRate = hourlyRate,
            IsActive = true
        };
        _context.Users.Add(user);
        await _context.SaveChangesAsync();
        return user;
    }
}

public class JournalService
{
    private readonly TechEditorDbContext _context;

    public JournalService(TechEditorDbContext context) => _context = context;

    public async Task<List<JournalDto>> GetAllAsync()
    {
        var journals = await _context.Journals.Where(j => j.IsActive).ToListAsync();
        return journals.Select(j => new JournalDto(j.Id, j.Name, j.Slug, j.Issn, j.Description)).ToList();
    }

    public async Task<JournalDto?> GetByIdAsync(int id)
    {
        var journal = await _context.Journals.FindAsync(id);
        return journal == null ? null : new JournalDto(journal.Id, journal.Name, journal.Slug, journal.Issn, journal.Description);
    }

    public async Task<Journal> CreateAsync(CreateJournalRequest request)
    {
        var journal = new Journal
        {
            Name = request.Name,
            Slug = request.Name.ToLower().Replace(" ", "-"),
            Issn = request.Issn,
            Description = request.Description
        };
        _context.Journals.Add(journal);
        await _context.SaveChangesAsync();
        return journal;
    }
}

public class ManuscriptService
{
    private readonly TechEditorDbContext _context;

    public ManuscriptService(TechEditorDbContext context) => _context = context;

    public async Task<List<ManuscriptDto>> GetAllAsync(int? userId = null, string? role = null)
    {
        IQueryable<Manuscript> query = _context.Manuscripts
            .Include(m => m.Author)
            .Include(m => m.Journal)
            .Include(m => m.Versions.OrderByDescending(v => v.VersionNumber))
            .Include(m => m.Assignments);

        if (role == "Author")
            query = query.Where(m => m.AuthorId == userId);
        else if (role == "TechnicalEditor")
            query = query.Where(m => m.Assignments.Any(a => a.AssigneeId == userId));

        var manuscripts = await query.OrderByDescending(m => m.CreatedAt).ToListAsync();
        return manuscripts.Select(MapToDto).ToList();
    }

    public async Task<ManuscriptDto?> GetByIdAsync(int id)
    {
        var manuscript = await _context.Manuscripts
            .Include(m => m.Author).Include(m => m.Journal)
            .Include(m => m.Versions.OrderByDescending(v => v.VersionNumber))
            .Include(m => m.Assignments).ThenInclude(a => a.Assignee)
            .FirstOrDefaultAsync(m => m.Id == id);
        return manuscript == null ? null : MapToDto(manuscript);
    }

    public async Task<Manuscript> CreateAsync(CreateManuscriptRequest request, int authorId)
    {
        var journal = await _context.Journals.FindAsync(request.JournalId);
        var count = await _context.Manuscripts.CountAsync(m => m.JournalId == request.JournalId);
        
        var manuscript = new Manuscript
        {
            ManuscriptNumber = $"{journal?.Slug?.ToUpper() ?? "MS"}-{DateTime.UtcNow:yyyyMM}-{count + 1:D4}",
            JournalId = request.JournalId,
            AuthorId = authorId,
            Title = request.Title,
            Abstract = request.Abstract,
            Keywords = request.Keywords,
            Status = ManuscriptStatus.Submitted
        };
        _context.Manuscripts.Add(manuscript);
        await _context.SaveChangesAsync();
        return manuscript;
    }

    public async Task<ManuscriptVersion> AddVersionAsync(int manuscriptId, IFormFile file, int userId)
    {
        var ms = await _context.Manuscripts.FindAsync(manuscriptId);
        var maxVersion = await _context.ManuscriptVersions.Where(v => v.ManuscriptId == manuscriptId).MaxAsync(v => (int?)v.VersionNumber) ?? 0;
        
        var version = new ManuscriptVersion
        {
            ManuscriptId = manuscriptId,
            VersionNumber = maxVersion + 1,
            FileName = file.FileName,
            FileType = Path.GetExtension(file.FileName).TrimStart('.').ToUpper(),
            FileSize = file.Length,
            UploadedById = userId,
            FilePath = $"/uploads/{manuscriptId}/v{maxVersion + 1}/{file.FileName}"
        };
        _context.ManuscriptVersions.Add(version);
        
        ms!.Status = ManuscriptStatus.Submitted;
        ms.UpdatedAt = DateTime.UtcNow;
        
        await _context.SaveChangesAsync();
        return version;
    }

    public async Task<bool> UpdateStatusAsync(int id, string status)
    {
        var manuscript = await _context.Manuscripts.FindAsync(id);
        if (manuscript == null) return false;
        
        if (Enum.TryParse<ManuscriptStatus>(status, out var newStatus))
        {
            manuscript.Status = newStatus;
            manuscript.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return true;
        }
        return false;
    }

    private ManuscriptDto MapToDto(Manuscript m) => new(
        m.Id, m.ManuscriptNumber, m.JournalId, m.Journal?.Name ?? "",
        m.AuthorId, m.Author?.Name ?? "", m.Title, m.Abstract, m.Keywords,
        m.Status.ToString(), m.CreatedAt, m.UpdatedAt,
        m.Versions.Select(v => new ManuscriptVersionDto(v.Id, v.VersionNumber, v.FileName, v.FileType, v.FileSize, v.UploadedAt)).ToList(),
        m.Assignments?.Select(a => new AssignmentDto(a.Id, a.ManuscriptId, m.Title, a.AssigneeId, a.Assignee?.Name ?? "", a.TaskType.ToString(), a.Status.ToString(), a.SlaHours, a.Deadline, a.StartedAt, a.CompletedAt, a.Notes)).ToList()
    );
}

public class AssignmentService
{
    private readonly TechEditorDbContext _context;

    public AssignmentService(TechEditorDbContext context) => _context = context;

    public async Task<KanbanBoardDto> GetKanbanAsync(int? userId = null, string? role = null)
    {
        IQueryable<Assignment> query = _context.Assignments
            .Include(a => a.Manuscript).Include(a => a.Assignee);

        if (role == "TechnicalEditor")
            query = query.Where(a => a.AssigneeId == userId);
        else if (role == "Manager")
            query = query.Where(a => a.AssignedById == userId);

        var assignments = await query.ToListAsync();
        
        var todo = assignments.Where(a => a.Status == AssignmentStatus.Todo).Select(MapToDto).ToList();
        var assigned = assignments.Where(a => a.Status == AssignmentStatus.Assigned).Select(MapToDto).ToList();
        var inProgress = assignments.Where(a => a.Status == AssignmentStatus.InProgress).Select(MapToDto).ToList();
        var review = assignments.Where(a => a.Status == AssignmentStatus.Review).Select(MapToDto).ToList();
        var completed = assignments.Where(a => a.Status == AssignmentStatus.Completed).Select(MapToDto).ToList();

        return new KanbanBoardDto(todo, assigned, inProgress, review, completed);
    }

    public async Task<Assignment> CreateAsync(CreateAssignmentRequest request, int assignedById)
    {
        var manuscript = await _context.Manuscripts.FindAsync(request.ManuscriptId);
        
        var assignment = new Assignment
        {
            ManuscriptId = request.ManuscriptId,
            AssigneeId = request.AssigneeId,
            AssignedById = assignedById,
            TaskType = request.TaskType,
            Status = AssignmentStatus.Assigned,
            SlaHours = request.SlaHours ?? GetDefaultSla(request.TaskType),
            Deadline = DateTime.UtcNow.AddDays(request.SlaHours ?? GetDefaultSla(request.TaskType))
        };
        _context.Assignments.Add(assignment);
        await _context.SaveChangesAsync();
        return assignment;
    }

    public async Task<Assignment?> UpdateStatusAsync(int id, AssignmentStatus status)
    {
        var assignment = await _context.Assignments.FindAsync(id);
        if (assignment == null) return null;

        assignment.Status = status;
        assignment.UpdatedAt = DateTime.UtcNow;
        
        if (status == AssignmentStatus.InProgress && assignment.StartedAt == null)
            assignment.StartedAt = DateTime.UtcNow;
        if (status == AssignmentStatus.Completed)
            assignment.CompletedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return assignment;
    }

    public async Task<Assignment?> UpdateAsync(int id, UpdateAssignmentRequest request)
    {
        var assignment = await _context.Assignments.FindAsync(id);
        if (assignment == null) return null;

        if (request.Status.HasValue)
        {
            assignment.Status = request.Status.Value;
            assignment.UpdatedAt = DateTime.UtcNow;
            if (request.Status == AssignmentStatus.Completed)
                assignment.CompletedAt = DateTime.UtcNow;
        }
        if (request.SlaHours.HasValue)
        {
            assignment.SlaHours = request.SlaHours;
            assignment.Deadline = DateTime.UtcNow.AddHours(request.SlaHours.Value);
        }
        if (request.Notes != null)
            assignment.Notes = request.Notes;

        await _context.SaveChangesAsync();
        return assignment;
    }

    private int GetDefaultSla(TaskType taskType) => taskType switch
    {
        TaskType.Copyediting => 168,
        TaskType.ProofReading => 120,
        TaskType.TEReview => 72,
        TaskType.QACheck => 48,
        TaskType.PeerReview => 336,
        _ => 168
    };

    private AssignmentDto MapToDto(Assignment a) => new(
        a.Id, a.ManuscriptId, a.Manuscript?.Title ?? "", a.AssigneeId, a.Assignee?.Name ?? "",
        a.TaskType.ToString(), a.Status.ToString(), a.SlaHours, a.Deadline,
        a.StartedAt, a.CompletedAt, a.Notes
    );
}

public class ReviewService
{
    private readonly TechEditorDbContext _context;

    public ReviewService(TechEditorDbContext context) => _context = context;

    public async Task<List<ReviewDto>> GetByManuscriptAsync(int manuscriptId)
    {
        var reviews = await _context.Reviews
            .Include(r => r.Reviewer)
            .Where(r => r.ManuscriptId == manuscriptId)
            .ToListAsync();
        
        return reviews.Select(r => new ReviewDto(r.Id, r.ManuscriptId, r.ReviewerId, r.Reviewer?.Name ?? "", r.Recommendation, r.Comments, r.IsSubmitted, r.DueDate)).ToList();
    }

    public async Task<Review> CreateAsync(CreateReviewRequest request, int reviewerId)
    {
        var review = new Review
        {
            ManuscriptId = request.ManuscriptId,
            ReviewerId = reviewerId,
            Recommendation = request.Recommendation,
            Comments = request.Comments,
            ConfidentialComments = request.ConfidentialComments,
            DueDate = request.DueDate
        };
        _context.Reviews.Add(review);
        await _context.SaveChangesAsync();
        return review;
    }

    public async Task<Review?> SubmitAsync(int id, SubmitReviewRequest request)
    {
        var review = await _context.Reviews.FindAsync(id);
        if (review == null) return null;

        review.Recommendation = request.Recommendation;
        review.Comments = request.Comments;
        review.ConfidentialComments = request.ConfidentialComments;
        review.IsSubmitted = true;
        review.SubmittedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return review;
    }
}

public class NotificationService
{
    private readonly TechEditorDbContext _context;

    public NotificationService(TechEditorDbContext context) => _context = context;

    public async Task<List<NotificationDto>> GetForUserAsync(int userId)
    {
        var notifications = await _context.Notifications
            .Where(n => n.UserId == userId)
            .OrderByDescending(n => n.CreatedAt)
            .Take(50)
            .ToListAsync();
        
        return notifications.Select(n => new NotificationDto(n.Id, n.Type, n.Title, n.Message, n.Link, n.IsRead, n.CreatedAt)).ToList();
    }

    public async Task CreateAsync(int userId, string type, string title, string message, string? link = null)
    {
        var notification = new Notification
        {
            UserId = userId,
            Type = type,
            Title = title,
            Message = message,
            Link = link
        };
        _context.Notifications.Add(notification);
        await _context.SaveChangesAsync();
    }

    public async Task MarkReadAsync(int id, bool isRead)
    {
        var notification = await _context.Notifications.FindAsync(id);
        if (notification != null)
        {
            notification.IsRead = isRead;
            await _context.SaveChangesAsync();
        }
    }
}

public class AuditService
{
    private readonly TechEditorDbContext _context;

    public AuditService(TechEditorDbContext context) => _context = context;

    public async Task LogAsync(int? userId, string action, string? entityType = null, int? entityId = null, string? details = null, string? ipAddress = null)
    {
        var log = new AuditLog
        {
            UserId = userId,
            Action = action,
            EntityType = entityType,
            EntityId = entityId,
            Details = details,
            IpAddress = ipAddress
        };
        _context.AuditLogs.Add(log);
        await _context.SaveChangesAsync();
    }
}

public class InstructionDocumentService
{
    private readonly TechEditorDbContext _context;
    private readonly IWebHostEnvironment _environment;

    public InstructionDocumentService(TechEditorDbContext context, IWebHostEnvironment environment)
    {
        _context = context;
        _environment = environment;
    }

    public async Task<List<InstructionDocumentDto>> GetAllAsync(string? category = null, string? roleType = null)
    {
        IQueryable<InstructionDocument> query = _context.InstructionDocuments
            .Include(d => d.UploadedBy)
            .Where(d => d.IsActive);

        if (!string.IsNullOrEmpty(category))
            query = query.Where(d => d.Category == category);
        if (!string.IsNullOrEmpty(roleType))
            query = query.Where(d => d.RoleType == roleType || d.RoleType == "Both");

        var docs = await query.OrderByDescending(d => d.CreatedAt).ToListAsync();
        return docs.Select(MapToDto).ToList();
    }

    public async Task<InstructionDocumentDto?> GetByIdAsync(int id)
    {
        var doc = await _context.InstructionDocuments
            .Include(d => d.UploadedBy)
            .FirstOrDefaultAsync(d => d.Id == id && d.IsActive);
        return doc == null ? null : MapToDto(doc);
    }

    public async Task<InstructionDocument> CreateAsync(CreateInstructionDocumentRequest request, int userId)
    {
        var uploadsFolder = Path.Combine(_environment.ContentRootPath, "uploads", "instruction-docs");
        Directory.CreateDirectory(uploadsFolder);

        var fileName = $"{Guid.NewGuid()}{Path.GetExtension(request.File.FileName)}";
        var filePath = Path.Combine(uploadsFolder, fileName);

        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await request.File.CopyToAsync(stream);
        }

        var document = new InstructionDocument
        {
            Title = request.Title,
            Description = request.Description,
            Category = request.Category,
            RoleType = request.RoleType,
            FileName = request.File.FileName,
            FilePath = $"/uploads/instruction-docs/{fileName}",
            FileType = Path.GetExtension(request.File.FileName).TrimStart('.').ToUpper(),
            FileSize = request.File.Length,
            UploadedById = userId
        };

        _context.InstructionDocuments.Add(document);
        await _context.SaveChangesAsync();
        return document;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var doc = await _context.InstructionDocuments.FindAsync(id);
        if (doc == null) return false;

        doc.IsActive = false;
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<List<InstructionDocumentDto>> GetByRoleAsync(string roleType)
    {
        var docs = await _context.InstructionDocuments
            .Include(d => d.UploadedBy)
            .Where(d => d.IsActive && (d.RoleType == roleType || d.RoleType == "Both"))
            .OrderByDescending(d => d.CreatedAt)
            .ToListAsync();
        return docs.Select(MapToDto).ToList();
    }

    private InstructionDocumentDto MapToDto(InstructionDocument d) => new(
        d.Id, d.Title, d.Description, d.Category, d.RoleType,
        d.FileName, d.FileType, d.FileSize, d.UploadedBy?.Name ?? "", d.CreatedAt
    );
}