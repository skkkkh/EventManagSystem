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
    }
}