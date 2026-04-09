using TechEditor.Api.Data;
using TechEditor.Api.Models;

namespace TechEditor.Api;

public static class SeedData
{
    public static void Seed(IServiceProvider serviceProvider)
    {
        using var scope = serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<TechEditorDbContext>();
        
        if (context.Users.Any()) return;

        var journals = new List<Journal>
        {
            new() { Name = "Journal of Software Engineering", Slug = "jse", Issn = "1234-5678", Description = "Peer-reviewed software engineering research" },
            new() { Name = "International Journal of AI", Slug = "ijai", Issn = "9876-5432", Description = "Artificial intelligence research" },
            new() { Name = "Open Access Computing", Slug = "oac", Issn = "1111-2222", Description = "Computing and IT research" }
        };
        context.Journals.AddRange(journals);

        var users = new List<User>
        {
            new() { Email = "manager@techeditor.com", Name = "John Manager", Role = UserRole.Manager, IsActive = true },
            new() { Email = "editor@techeditor.com", Name = "Sarah Editor", Role = UserRole.Editor, IsActive = true },
            new() { Email = "te1@techeditor.com", Name = "Alice Technical Editor", Role = UserRole.TechnicalEditor, ResourceType = ResourceType.TechnicalEditor, IsActive = true },
            new() { Email = "te2@techeditor.com", Name = "Bob Technical Editor", Role = UserRole.TechnicalEditor, ResourceType = ResourceType.TechnicalEditor, IsActive = true },
            new() { Email = "reviewer1@techeditor.com", Name = "Carol Reviewer", Role = UserRole.Reviewer, ResourceType = ResourceType.Reviewer, IsActive = true },
            new() { Email = "author1@techeditor.com", Name = "David Author", Role = UserRole.Author, IsActive = true },
            new() { Email = "author2@techeditor.com", Name = "Emma Author", Role = UserRole.Author, IsActive = true },
            new() { Email = "admin@techeditor.com", Name = "Admin User", Role = UserRole.Admin, IsActive = true },
            new() { Email = "freelancer1@techeditor.com", Name = "External Freelancer", Role = UserRole.TechnicalEditor, IsExternal = true, Specialty = "Copyediting", HourlyRate = 25, IsActive = true }
        };
        context.Users.AddRange(users);
        context.SaveChanges();

        var manuscripts = new List<Manuscript>
        {
            new() { ManuscriptNumber = "JSE-202604-0001", JournalId = journals[0].Id, AuthorId = users[5].Id, Title = "A Novel Approach to Agile Testing", Abstract = "This paper presents...", Keywords = "agile, testing, software", Status = ManuscriptStatus.Submitted },
            new() { ManuscriptNumber = "JSE-202604-0002", JournalId = journals[0].Id, AuthorId = users[6].Id, Title = "Machine Learning in Code Review", Abstract = "We explore...", Keywords = "ML, code review, automation", Status = ManuscriptStatus.UnderReview },
            new() { ManuscriptNumber = "IJAI-202604-0001", JournalId = journals[1].Id, AuthorId = users[5].Id, Title = "Neural Networks for NLP", Abstract = "This study...", Keywords = "neural networks, NLP, deep learning", Status = ManuscriptStatus.Draft },
            new() { ManuscriptNumber = "OAC-202604-0001", JournalId = journals[2].Id, AuthorId = users[6].Id, Title = "Cloud Computing Security", Abstract = "Security in...", Keywords = "cloud, security, distributed", Status = ManuscriptStatus.Accepted }
        };
        context.Manuscripts.AddRange(manuscripts);
        context.SaveChanges();

        var assignments = new List<Assignment>
        {
            new() { ManuscriptId = manuscripts[0].Id, AssigneeId = users[2].Id, AssignedById = users[0].Id, TaskType = TaskType.Copyediting, Status = AssignmentStatus.Assigned, SlaHours = 168, Deadline = DateTime.UtcNow.AddDays(7) },
            new() { ManuscriptId = manuscripts[1].Id, AssigneeId = users[3].Id, AssignedById = users[0].Id, TaskType = TaskType.TEReview, Status = AssignmentStatus.InProgress, SlaHours = 72, Deadline = DateTime.UtcNow.AddDays(3), StartedAt = DateTime.UtcNow.AddDays(-1) },
            new() { ManuscriptId = manuscripts[3].Id, AssigneeId = users[2].Id, AssignedById = users[0].Id, TaskType = TaskType.ProofReading, Status = AssignmentStatus.Completed, SlaHours = 120, Deadline = DateTime.UtcNow.AddDays(-1), StartedAt = DateTime.UtcNow.AddDays(-3), CompletedAt = DateTime.UtcNow.AddDays(-1) }
        };
        context.Assignments.AddRange(assignments);
        
        var notifications = new List<Notification>
        {
            new() { UserId = users[0].Id, Type = "assignment", Title = "New Assignment", Message = "New manuscript awaiting assignment", Link = "/manager/queue" },
            new() { UserId = users[2].Id, Type = "task", Title = "Task Assigned", Message = "You have been assigned a copyediting task", Link = "/te/dashboard" }
        };
        context.Notifications.AddRange(notifications);
        context.SaveChanges();
    }
}