import { useState, useEffect } from 'react';

function UserEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Fetch upcoming events from the backend API
    fetch('http://localhost:5080/api/events')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch events');
        return res.json();
      })
      .then(data => {
        setEvents(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <p>Loading upcoming events...</p>;
  if (error) return <p style={{ color: 'red' }}>Error: {error}</p>;

  return (
    <div style={{ padding: '20px' }}>
      <h2>Upcoming Events</h2>
      {events.length === 0 ? (
        <p>No events available right now. Check back later!</p>
      ) : (
        <div style={{ display: 'grid', gap: '15px', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
          {events.map(event => (
            <div key={event.id} style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '8px' }}>
              <h3>{event.title}</h3>
              <p>{event.description}</p>
              <p><strong>Date:</strong> {new Date(event.date).toLocaleDateString()}</p>
              <button style={{ padding: '8px 12px', background: '#007bff', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                Register / Book Ticket
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default UserEvents;