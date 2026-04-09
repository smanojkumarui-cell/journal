using Microsoft.EntityFrameworkCore;
using TechEditor.Api.Models;

namespace TechEditor.Api.Data;

public class TechEditorDbContext : DbContext
{
    public TechEditorDbContext(DbContextOptions<TechEditorDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Journal> Journals => Set<Journal>();
    public DbSet<Manuscript> Manuscripts => Set<Manuscript>();
    public DbSet<ManuscriptVersion> ManuscriptVersions => Set<ManuscriptVersion>();
    public DbSet<Assignment> Assignments => Set<Assignment>();
    public DbSet<Review> Reviews => Set<Review>();
    public DbSet<Decision> Decisions => Set<Decision>();
    public DbSet<Publication> Publications => Set<Publication>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<InstructionDocument> InstructionDocuments => Set<InstructionDocument>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Email).IsUnique();
            entity.HasIndex(e => e.GoogleId);
            entity.Property(e => e.Role).HasConversion<string>();
            entity.Property(e => e.ResourceType).HasConversion<string>();
        });

        modelBuilder.Entity<Journal>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Slug).IsUnique();
        });

        modelBuilder.Entity<Manuscript>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.ManuscriptNumber).IsUnique();
            entity.Property(e => e.Status).HasConversion<string>();
            entity.HasOne(e => e.Author).WithMany(u => u.AuthoredManuscripts).HasForeignKey(e => e.AuthorId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.Journal).WithMany(j => j.Manuscripts).HasForeignKey(e => e.JournalId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<ManuscriptVersion>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.Manuscript).WithMany(m => m.Versions).HasForeignKey(e => e.ManuscriptId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.UploadedBy).WithMany().HasForeignKey(e => e.UploadedById).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Assignment>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.TaskType).HasConversion<string>();
            entity.Property(e => e.Status).HasConversion<string>();
            entity.HasOne(e => e.Manuscript).WithMany(m => m.Assignments).HasForeignKey(e => e.ManuscriptId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.Assignee).WithMany(u => u.AssignedTasks).HasForeignKey(e => e.AssigneeId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.AssignedBy).WithMany(u => u.Assignments).HasForeignKey(e => e.AssignedById).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Review>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.Manuscript).WithMany(m => m.Reviews).HasForeignKey(e => e.ManuscriptId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.Reviewer).WithMany().HasForeignKey(e => e.ReviewerId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Decision>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.Manuscript).WithOne(m => m.Decision).HasForeignKey<Decision>(e => e.ManuscriptId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.Editor).WithMany().HasForeignKey(e => e.EditorId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Publication>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Doi).IsUnique();
            entity.HasOne(e => e.Manuscript).WithOne(m => m.Publication).HasForeignKey<Publication>(e => e.ManuscriptId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Notification>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.User).WithMany().HasForeignKey(e => e.UserId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<AuditLog>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Timestamp);
            entity.HasIndex(e => e.UserId);
        });

        modelBuilder.Entity<InstructionDocument>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.UploadedBy).WithMany().HasForeignKey(e => e.UploadedById).OnDelete(DeleteBehavior.Restrict);
        });
    }
}