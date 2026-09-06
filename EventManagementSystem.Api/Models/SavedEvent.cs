namespace EventManagementSystem.Api.Models;

// A user's bookmark on an event — powers the "Saved Events" list in Profile.
public class SavedEvent
{
    public int Id { get; set; }

    public int UserId { get; set; }
    public User? User { get; set; }

    public int EventId { get; set; }
    public Event? Event { get; set; }

    public DateTime SavedAt { get; set; } = DateTime.UtcNow;
}
