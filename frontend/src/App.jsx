import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { eventService } from './eventService';
import { authService } from './authService';
import CreateEvent from './pages/CreateEvent';
import Login from './pages/Login';
import Register from './pages/Register';

function Home() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const currentUser = authService.getCurrentUser();
  const navigate = useNavigate();

  useEffect(() => {
    eventService.getAllEvents()
      .then((data) => {
        setEvents(data);
        setLoading(false);
      })
      .catch((err) => {
        setError('Failed to connect to backend API.');
        setLoading(false);
      });
  }, []);

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial', maxWidth: '600px', margin: '0 auto', color: '#fff' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Event Management System</h2>
        <div>
          {currentUser ? (
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <span>Hi, {currentUser.name || currentUser.email}</span>
              <button onClick={handleLogout} style={{ background: '#dc3545', color: 'white', border: 'none', padding: '6px 10px', cursor: 'pointer', borderRadius: '4px' }}>
                Logout
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '10px' }}>
              <Link to="/login" style={{ color: '#4dabf7' }}>Login</Link>
              <Link to="/register" style={{ color: '#4dabf7' }}>Register</Link>
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3>Upcoming Events</h3>
        {currentUser && (
          <Link to="/create" style={{ background: '#28a745', color: 'white', padding: '8px 12px', textDecoration: 'none', borderRadius: '4px', fontSize: '14px' }}>
            Add New Event
          </Link>
        )}
      </div>

      {loading && <p>Loading events...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {!loading && !error && events.length === 0 && <p>No events found.</p>}
      
      <ul style={{ paddingLeft: '20px', marginTop: '15px' }}>
        {events.map((event) => (
          <li key={event.id || event.eventId} style={{ marginBottom: '10px' }}>
            <strong>{event.title || event.name}</strong>: {event.description}
          </li>
        ))}
      </ul>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/create" element={<CreateEvent />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </Router>
  );
}

export default App;