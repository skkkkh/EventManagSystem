using EventManagementSystem.Api.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace EventManagementSystem.Api.Data;

public class AppDbContext
    : IdentityDbContext<User, IdentityRole<int>, int>
{
    public AppDbContext(
        DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    // --------------------------------------------------
    // Events
    // --------------------------------------------------

    public DbSet<Event> Events => Set<Event>();

    public DbSet<EventTemplate> EventTemplates
        => Set<EventTemplate>();

    public DbSet<CustomField> CustomFields
        => Set<CustomField>();

    public DbSet<EventFieldValue> EventFieldValues
        => Set<EventFieldValue>();

    // --------------------------------------------------
    // Registration / Booking / Payment
    // --------------------------------------------------

    public DbSet<Registration> Registrations
        => Set<Registration>();

    public DbSet<TicketType> TicketTypes
        => Set<TicketType>();

    public DbSet<Booking> Bookings
        => Set<Booking>();

    public DbSet<Payment> Payments
        => Set<Payment>();

    // --------------------------------------------------
    // Notifications
    // --------------------------------------------------

    public DbSet<Notification> Notifications
        => Set<Notification>();
    // --------------------------------------------------
    // Groups
    // --------------------------------------------------

    public DbSet<Group> Groups
        => Set<Group>();

    public DbSet<GroupMember> GroupMembers
        => Set<GroupMember>();

    // ------------------------------------------------
    // Reviews
    // ------------------------------------------------

    public DbSet<Review> Reviews
        => Set<Review>();

    // --------------------------------------------------
    // Organizer "About Us" (public profile / leadership team)
    // --------------------------------------------------

    public DbSet<TeamMember> TeamMembers
        => Set<TeamMember>();

    // --------------------------------------------------
    // Saved Events (bookmarks)
    // --------------------------------------------------

    public DbSet<SavedEvent> SavedEvents
        => Set<SavedEvent>();

    protected override void OnModelCreating(
        ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // --------------------------------------------------
        // IMPORTANT:
        // Keep the existing Users table.
        // Identity will use it instead of creating AspNetUsers.
        // --------------------------------------------------

        modelBuilder.Entity<User>()
            .ToTable("Users");

        modelBuilder.Entity<User>()
            .Property(u => u.Role)
            .HasMaxLength(50);


        // --------------------------------------------------
        // EventTemplate 1 --- * CustomField
        // --------------------------------------------------

        modelBuilder.Entity<CustomField>()
            .HasOne(f => f.EventTemplate)
            .WithMany(t => t.CustomFields)
            .HasForeignKey(f => f.EventTemplateId)
            .OnDelete(DeleteBehavior.Cascade);


        // --------------------------------------------------
        // EventTemplate 1 --- * Event
        // --------------------------------------------------

        modelBuilder.Entity<Event>()
            .HasOne(e => e.EventTemplate)
            .WithMany(t => t.Events)
            .HasForeignKey(e => e.EventTemplateId)
            .OnDelete(DeleteBehavior.Restrict);


        // --------------------------------------------------
        // Event N --- 1 User (Organizer)  [NEW]
        // --------------------------------------------------

        modelBuilder.Entity<Event>()
            .HasOne(e => e.OrganizerUser)
            .WithMany()
            .HasForeignKey(e => e.OrganizerId)
            .OnDelete(DeleteBehavior.SetNull);


        // --------------------------------------------------
        // Event 1 --- * EventFieldValue
        // --------------------------------------------------

        modelBuilder.Entity<EventFieldValue>()
            .HasOne(v => v.Event)
            .WithMany(e => e.FieldValues)
            .HasForeignKey(v => v.EventId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<EventFieldValue>()
            .HasOne(v => v.CustomField)
            .WithMany()
            .HasForeignKey(v => v.CustomFieldId)
            .OnDelete(DeleteBehavior.Restrict);


        // --------------------------------------------------
        // Event
        // --------------------------------------------------

        modelBuilder.Entity<Event>()
            .Property(e => e.Title)
            .IsRequired();

        modelBuilder.Entity<Event>()
            .HasIndex(e => e.StartDateTime);


        // --------------------------------------------------
        // Event 1 --- * Registration
        // --------------------------------------------------

        modelBuilder.Entity<Registration>()
            .HasOne(r => r.Event)
            .WithMany()
            .HasForeignKey(r => r.EventId)
            .OnDelete(DeleteBehavior.Cascade);
        // --------------------------------------------------
        // Registration N --- 1 User  [NEW]
        // --------------------------------------------------

        modelBuilder.Entity<Registration>()
            .HasOne(r => r.User)
            .WithMany()
            .HasForeignKey(r => r.UserId)
            .OnDelete(DeleteBehavior.SetNull);

        // --------------------------------------------------
        // Event 1 --- * TicketType
        // --------------------------------------------------

        modelBuilder.Entity<TicketType>()
            .HasOne(t => t.Event)
            .WithMany()
            .HasForeignKey(t => t.EventId)
            .OnDelete(DeleteBehavior.Cascade);


        // --------------------------------------------------
        // Registration 1 --- * Booking
        // --------------------------------------------------

        modelBuilder.Entity<Booking>()
            .HasOne(b => b.Registration)
            .WithMany(r => r.Bookings)
            .HasForeignKey(b => b.RegistrationId)
            .OnDelete(DeleteBehavior.Restrict);


        // --------------------------------------------------
        // TicketType 1 --- * Booking
        // --------------------------------------------------

        modelBuilder.Entity<Booking>()
            .HasOne(b => b.TicketType)
            .WithMany(t => t.Bookings)
            .HasForeignKey(b => b.TicketTypeId)
            .OnDelete(DeleteBehavior.Restrict);


        // --------------------------------------------------
        // Booking 1 --- 1 Payment
        // --------------------------------------------------

        modelBuilder.Entity<Payment>()
            .HasOne(p => p.Booking)
            .WithOne(b => b.Payment)
            .HasForeignKey<Payment>(p => p.BookingId)
            .OnDelete(DeleteBehavior.Cascade);


        // --------------------------------------------------
        // User 1 --- * Notification
        // --------------------------------------------------

        modelBuilder.Entity<Notification>()
            .HasOne(n => n.User)
            .WithMany(u => u.Notifications)
            .HasForeignKey(n => n.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        // --------------------------------------------------
        // Group 1 --- * GroupMember, User 1 --- * GroupMember
        // --------------------------------------------------

        modelBuilder.Entity<GroupMember>()
            .HasOne(gm => gm.Group)
            .WithMany(g => g.Members)
            .HasForeignKey(gm => gm.GroupId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<GroupMember>()
            .HasOne(gm => gm.User)
            .WithMany()
            .HasForeignKey(gm => gm.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        // --------------------------------------------------
        // User (Organiser) 1 --- * Group
        // --------------------------------------------------

        modelBuilder.Entity<Group>()
            .HasOne(g => g.Organiser)
            .WithMany()
            .HasForeignKey(g => g.OrganiserId)
            .OnDelete(DeleteBehavior.Restrict);

        // --------------------------------------------------
        // Group 1 --- * Event (nullable, restricts visibility)
        // --------------------------------------------------

        modelBuilder.Entity<Event>()
            .HasOne(e => e.Group)
            .WithMany()
            .HasForeignKey(e => e.GroupId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<Review>()
            .HasIndex(r => new { r.EventId, r.UserId })
            .IsUnique();

        // --------------------------------------------------
        // User (Organizer) 1 --- * TeamMember
        // --------------------------------------------------

        modelBuilder.Entity<TeamMember>()
            .HasOne(t => t.Organizer)
            .WithMany()
            .HasForeignKey(t => t.OrganizerId)
            .OnDelete(DeleteBehavior.Cascade);

        // --------------------------------------------------
        // User 1 --- * SavedEvent, Event 1 --- * SavedEvent
        // --------------------------------------------------

        modelBuilder.Entity<SavedEvent>()
            .HasOne(s => s.User)
            .WithMany()
            .HasForeignKey(s => s.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<SavedEvent>()
            .HasOne(s => s.Event)
            .WithMany()
            .HasForeignKey(s => s.EventId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<SavedEvent>()
            .HasIndex(s => new { s.UserId, s.EventId })
            .IsUnique();
    }
}