using EventManagementSystem.Api.Models;

namespace EventManagementSystem.Api.Repositories;

/// <summary>
/// Coordinates repositories that share one DbContext/transaction.
/// Exposes named repositories for the entities used by the application,
/// plus a generic repository for anything else.
/// </summary>
public interface IUnitOfWork : IDisposable
{
    // Events module
    IRepository<Event> Events { get; }
    IRepository<EventTemplate> EventTemplates { get; }
    IRepository<CustomField> CustomFields { get; }
    IRepository<EventFieldValue> EventFieldValues { get; }

    // Booking & Payment module
    IRepository<Registration> Registrations { get; }
    IRepository<TicketType> TicketTypes { get; }
    IRepository<Booking> Bookings { get; }
    IRepository<Payment> Payments { get; }

    // Users / Notifications
    IRepository<User> Users { get; }
    IRepository<Notification> Notifications { get; }

    // Generic repository
    IRepository<T> Repository<T>() where T : class;

    // Save all changes
    Task<int> SaveChangesAsync();
}