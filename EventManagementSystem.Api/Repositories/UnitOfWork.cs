using EventManagementSystem.Api.Data;
using EventManagementSystem.Api.Models;

namespace EventManagementSystem.Api.Repositories;

public class UnitOfWork : IUnitOfWork
{
    private readonly AppDbContext _context;
    private readonly Dictionary<Type, object> _repositories = new();

    private IRepository<Event>? _events;
    private IRepository<EventTemplate>? _eventTemplates;
    private IRepository<CustomField>? _customFields;
    private IRepository<EventFieldValue>? _eventFieldValues;

    // Booking & Payment module repositories
    private IRepository<Registration>? _registrations;
    private IRepository<TicketType>? _ticketTypes;
    private IRepository<Booking>? _bookings;
    private IRepository<Payment>? _payments;

    // Users / Notifications
    private IRepository<User>? _users;
    private IRepository<Notification>? _notifications;

    public UnitOfWork(AppDbContext context)
    {
        _context = context;
    }

    public IRepository<Event> Events =>
        _events ??= new Repository<Event>(_context);

    public IRepository<EventTemplate> EventTemplates =>
        _eventTemplates ??= new Repository<EventTemplate>(_context);

    public IRepository<CustomField> CustomFields =>
        _customFields ??= new Repository<CustomField>(_context);

    public IRepository<EventFieldValue> EventFieldValues =>
        _eventFieldValues ??= new Repository<EventFieldValue>(_context);

    // Booking & Payment module
    public IRepository<Registration> Registrations =>
        _registrations ??= new Repository<Registration>(_context);

    public IRepository<TicketType> TicketTypes =>
        _ticketTypes ??= new Repository<TicketType>(_context);

    public IRepository<Booking> Bookings =>
        _bookings ??= new Repository<Booking>(_context);

    public IRepository<Payment> Payments =>
        _payments ??= new Repository<Payment>(_context);

    // Users / Notifications
    public IRepository<User> Users =>
        _users ??= new Repository<User>(_context);

    public IRepository<Notification> Notifications =>
        _notifications ??= new Repository<Notification>(_context);

    /// <summary>
    /// Generic access for entities that don't have a named property.
    /// </summary>
    public IRepository<T> Repository<T>() where T : class
    {
        var type = typeof(T);

        if (!_repositories.ContainsKey(type))
        {
            _repositories[type] = new Repository<T>(_context);
        }

        return (IRepository<T>)_repositories[type];
    }

    public async Task<int> SaveChangesAsync()
    {
        return await _context.SaveChangesAsync();
    }

    public void Dispose()
    {
        _context.Dispose();
        GC.SuppressFinalize(this);
    }
}