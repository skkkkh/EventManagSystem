import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { eventService } from './eventService';
import { parseUtcString, formatEventDateTime, toLocalInputValue } from './utils/dateUtils';
import { authService } from './authService';

const colors = {
  bg: '#FFF8F4',
  card: '#FFFFFF',
  wine: '#7F1330',
  wineHover: '#6B0F27',
  rose: '#D893A4',
  roseSoft: '#F3DDE3',
  teal: '#003744',
  amber: '#CE8127',
  ink: '#2D2326',
  muted: '#8A7478',
};

const fontDisplay = "'Fraunces', Georgia, serif";
const fontBody = "'Inter', 'Segoe UI', sans-serif";

function GlobalStyle() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,500;0,9..144,600;0,9..144,700;0,9..144,900;1,9..144,600&family=Inter:wght@400;500;600;700&display=swap');
      * { box-sizing: border-box; }
      .es-nav-link { transition: opacity .2s ease; }
      .es-nav-link:hover { opacity: 0.65; }
      .es-cta:hover { background: ${colors.wineHover} !important; transform: translateY(-2px); }
      .es-cta { transition: transform .2s ease, background .2s ease; }
      .es-card { transition: transform .25s ease, box-shadow .25s ease; }
      .es-card:hover { transform: translateY(-6px); box-shadow: 0 18px 44px rgba(127,19,48,0.16); }
      .es-register-btn { transition: background .2s ease; }
      .es-register-btn:hover { background: ${colors.wineHover} !important; }
      .es-choice-card { transition: all .3s ease; }
      .es-choice-card:hover { transform: translateY(-6px); border-color: ${colors.wine} !important; box-shadow: 0 20px 40px rgba(127,19,48,0.12); }
    `}</style>
  );
}

function LandingPage() {
  return (
    <div style={{ fontFamily: fontBody, background: colors.bg, minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '24px' }}>
      <GlobalStyle />
      <div style={{ textAlign: 'center', maxWidth: '700px', marginBottom: '40px' }}>
        <h1 style={{ fontFamily: fontDisplay, fontSize: '52px', color: colors.ink, margin: '0 0 12px 0', fontWeight: 700 }}>
          Welcome to <span style={{ color: colors.wine, fontStyle: 'italic' }}>EventSphere</span>
        </h1>
        <p style={{ color: colors.muted, fontSize: '16px', lineHeight: '1.6' }}>
          Please select how you would like to use the platform today:
        </p>
      </div>

         

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', width: '100%', maxWidth: '700px' }}>
        <Link to="/events" className="es-choice-card" style={{ textDecoration: 'none', background: colors.card, padding: '36px 28px', borderRadius: '20px', border: `2px solid ${colors.roseSoft}`, textAlign: 'center', display: 'block' }}>
          <div style={{ fontSize: '36px', marginBottom: '16px' }}>🎟️</div>
          <h3 style={{ fontFamily: fontDisplay, fontSize: '22px', color: colors.ink, margin: '0 0 10px 0' }}>Looking at Events</h3>
          <p style={{ color: colors.muted, fontSize: '14px', lineHeight: '1.5', margin: 0 }}>
            Browse upcoming community gatherings, view details, and register with your email.
          </p>
        </Link>

        <Link to="/admin" className="es-choice-card" style={{ textDecoration: 'none', background: colors.card, padding: '36px 28px', borderRadius: '20px', border: `2px solid ${colors.roseSoft}`, textAlign: 'center', display: 'block' }}>
          <div style={{ fontSize: '36px', marginBottom: '16px' }}>🛠️</div>
          <h3 style={{ fontFamily: fontDisplay, fontSize: '22px', color: colors.ink, margin: '0 0 10px 0' }}>Host an Event</h3>
          <p style={{ color: colors.muted, fontSize: '14px', lineHeight: '1.5', margin: 0 }}>
            Log in with organization credentials to create, modify, and manage events.
          </p>
        </Link>
      </div>
    </div>
  );
}

function EventCard({ event, onRegister }) {
  const [showCheckout, setShowCheckout] = useState(false);
  const [fullName, setFullName] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [loadingCheckout, setLoadingCheckout] = useState(false);
  const title = event.title || event.name;
  const rawDate = event.date || event.startDateTime || event.StartDateTime;
  const dateObj = parseUtcString(rawDate);
  const day = dateObj ? dateObj.getDate() : '—';
  const month = dateObj ? dateObj.toLocaleDateString(undefined, { month: 'short' }).toUpperCase() : 'TBA';

  return (
    <div className="es-card" style={{ background: colors.card, borderRadius: '18px', boxShadow: '0 6px 20px rgba(127,19,48,0.06)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '22px 24px 18px' }}>
        <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', marginBottom: '14px' }}>
          <div style={{ flexShrink: 0, width: '52px', height: '52px', borderRadius: '12px', background: colors.amber, color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>
            <span style={{ fontSize: '18px', fontWeight: 700, fontFamily: fontDisplay }}>{day}</span>
            <span style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.5px' }}>{month}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h4 style={{ margin: 0, color: colors.ink, fontFamily: fontDisplay, fontSize: '19px', fontWeight: 600, lineHeight: 1.2 }}>{title}</h4>
              {/* Category + Expired badges */}
              <div style={{ marginLeft: '8px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                <div style={{ background: colors.roseSoft, color: colors.wine, padding: '4px 8px', borderRadius: '999px', fontSize: '12px', fontWeight: 700, height: '24px', display: 'inline-flex', alignItems: 'center' }}>{event.category || event.Category || 'Other'}</div>
                {(event.isExpired || event.IsExpired) && (
                  <div style={{ background: '#E5E7EB', color: '#6B7280', padding: '4px 8px', borderRadius: '999px', fontSize: '12px', fontWeight: 700, height: '24px', display: 'inline-flex', alignItems: 'center' }}>Expired</div>
                )}
              </div>
            </div>
          </div>
        </div>
        <p style={{ color: colors.muted, fontFamily: fontBody, fontSize: '14px', lineHeight: 1.65, margin: 0, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: '68px' }}>
          {event.description}
        </p>
        <div style={{ marginTop: '12px', fontSize: '13px', color: colors.ink, display: 'flex', flexDirection: 'column', gap: '8px', lineHeight: 1.4 }}>
          {/* Date */}
          {(() => {
            const startRaw = event.startDateTime || event.StartDateTime;
            const endRaw = event.endDateTime || event.EndDateTime;
            const startFmt = formatEventDateTime(startRaw);
            const endFmt = formatEventDateTime(endRaw);
            const end = endRaw ? new Date(endRaw) : null;
            const dateStr = startFmt.dateStr;
            const timeStr = (startRaw && endRaw) ? `${startFmt.timeStr} — ${endFmt.timeStr}` : (startRaw ? startFmt.timeStr : 'TBA');
            const location = event.location || event.Location || 'TBA';
            const price = (event.price ?? event.Price) ? `$${(event.price ?? event.Price).toFixed(2)}` : 'Free';
            const seatsRemaining = event.seatsRemaining ?? event.SeatsRemaining ?? '—';
            const capacityVal = event.capacity ?? event.Capacity ?? '—';

            return (
              <>
                <div style={{ color: colors.muted, display: 'flex', gap: '8px', alignItems: 'center' }}>📅 <span style={{ marginLeft: '6px' }}>{dateStr}</span></div>
                <div style={{ color: colors.muted, display: 'flex', gap: '8px', alignItems: 'center' }}>🕐 <span style={{ marginLeft: '6px' }}>{timeStr}</span></div>
                <div style={{ color: colors.muted, display: 'flex', gap: '8px', alignItems: 'center' }}>📍 <span style={{ marginLeft: '6px' }}>{location}</span></div>
                <div style={{ color: colors.muted, display: 'flex', gap: '8px', alignItems: 'center' }}>🎟️ <span style={{ marginLeft: '6px' }}>{price}</span></div>
                <div style={{ color: colors.muted, display: 'flex', gap: '8px', alignItems: 'center' }}>💺 <span style={{ marginLeft: '6px' }}>{seatsRemaining} remaining of {capacityVal}</span></div>
              </>
            );
          })()}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: colors.bg, marginLeft: '-11px', flexShrink: 0 }} />
        <div style={{ flex: 1, borderTop: `2px dashed ${colors.roseSoft}` }} />
        <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: colors.bg, marginRight: '-11px', flexShrink: 0 }} />
      </div>
        <div style={{ padding: '18px 24px 24px' }}>
        {((event.isExpired || event.IsExpired)) ? (
          <div style={{ width: '100%', padding: '12px', background: '#F3F4F6', color: '#6B7280', border: 'none', borderRadius: '10px', textAlign: 'center', fontWeight: 700 }}>Event Ended</div>
        ) : (
          !showCheckout && (
            <button onClick={() => setShowCheckout(true)} className="es-register-btn" style={{ width: '100%', padding: '12px', background: colors.wine, color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontFamily: fontBody, fontWeight: 600, fontSize: '14px' }}>
              Reserve a Spot
            </button>
          )
        )}

        {showCheckout && (
          <form onSubmit={async (e) => {
            e.preventDefault();
            setLoadingCheckout(true);
            try {
              const payload = {
                fullName: fullName || 'Guest',
                email: emailInput || 'guest@example.com',
                phone: '',
                eventId: event.id || event.eventId,
                quantity: 1,
                cardNumber,
                cardName,
                cardExpiry
              };

              const res = await fetch('/api/bookings/guest-checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
              });

              if (!res.ok) {
                const txt = await res.text();
                throw new Error(txt || 'Checkout failed');
              }

              const data = await res.json();
              alert('Booking confirmed and marked paid. Booking ID: ' + data.id);
              setShowCheckout(false);
              // Optionally notify parent
              if (onRegister) onRegister(title);
            } catch (err) {
              alert('Checkout error: ' + err.message);
            } finally {
              setLoadingCheckout(false);
            }
          }} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <input required placeholder="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: `1px solid ${colors.roseSoft}` }} />
            <input required type="email" placeholder="Email" value={emailInput} onChange={(e) => setEmailInput(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: `1px solid ${colors.roseSoft}` }} />
            <input placeholder="Card number (mock)" value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: `1px solid ${colors.roseSoft}` }} />
            <div style={{ display: 'flex', gap: '8px' }}>
              <input placeholder="Name on card" value={cardName} onChange={(e) => setCardName(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: `1px solid ${colors.roseSoft}`, flex: 1 }} />
              <input placeholder="MM/YY" value={cardExpiry} onChange={(e) => setCardExpiry(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: `1px solid ${colors.roseSoft}`, width: '110px' }} />
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="submit" disabled={loadingCheckout} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: colors.wine, color: '#fff' }}>{loadingCheckout ? 'Processing...' : 'Confirm & Pay (mock)'}</button>
              <button type="button" onClick={() => setShowCheckout(false)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ddd', background: '#fff' }}>Cancel</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function AttendeePortal() {
  const [events, setEvents] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    eventService.getAllEvents()
      .then((data) => { setEvents(data); setLoading(false); })
      .catch(() => { setError('Failed to connect to backend API.'); setLoading(false); });
  }, []);

  return (
    <div style={{ fontFamily: fontBody, background: colors.bg, minHeight: '100vh', paddingBottom: '60px' }}>
      <GlobalStyle />
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '28px 0' }}>
          <Link to="/" style={{ textDecoration: 'none', color: colors.wine, fontFamily: fontDisplay, fontWeight: 700, fontSize: '22px' }}>← Home</Link>
          <span style={{ fontSize: '14px', color: colors.muted, fontWeight: 600 }}>Attendee Portal 🎟️</span>
        </div>
        <div style={{ padding: '20px 0 40px' }}>
          <h1 style={{ margin: '0 0 10px 0', fontFamily: fontDisplay, fontSize: '42px', color: colors.ink, fontWeight: 600 }}>
            Upcoming <span style={{ fontStyle: 'italic', color: colors.wine }}>Public Events</span>
          </h1>
          <div style={{ marginTop: '12px', display: 'flex', gap: '12px', alignItems: 'center' }}>
            <label style={{ color: colors.muted, fontSize: '14px', marginRight: '8px' }}>Category:</label>
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} style={{ padding: '8px 10px', borderRadius: '8px', border: `1px solid ${colors.roseSoft}` }}>
              <option value="All">All</option>
              <option value="Conference">Conference</option>
              <option value="Ceremony">Ceremony</option>
              <option value="Workshop">Workshop</option>
              <option value="Seminar">Seminar</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>
        {loading && <p style={{ color: colors.muted }}>Loading events...</p>}
        {error && <p style={{ color: '#b3261e' }}>{error}</p>}
        <div style={{ display: 'grid', gap: '26px', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
          {events
            .filter(ev => categoryFilter === 'All' || (ev.category || ev.Category || ev.Category === categoryFilter || (ev.category && ev.category === categoryFilter) || (ev.Category && ev.Category === categoryFilter) ? true : (ev.category || ev.Category) === categoryFilter))
            .map((event) => (
              <EventCard key={event.id || event.eventId} event={event} onRegister={(title) => alert(`Successfully reserved spot for: ${title}`)} />
            ))}
        </div>
      </div>
    </div>
  );
}

function CreateEventView() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [capacity, setCapacity] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('Other');
  const [startDateTime, setStartDateTime] = useState('');
  const [endDateTime, setEndDateTime] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate numeric inputs on client-side
      const capVal = capacity ? parseInt(capacity, 10) : 0;
      const priceVal = price ? parseFloat(price) : 0;
      if (capVal < 0 || priceVal < 0) {
        setError('Capacity and Price must be 0 or greater.');
        setLoading(false);
        return;
      }
      const payload = {
        title,
        description,
        location: location || 'Default Location',
          capacity: capacity ? parseInt(capacity, 10) : 100,
          price: price ? parseFloat(price) : 0,
          category: category,
        startDateTime: startDateTime ? new Date(startDateTime).toISOString() : new Date().toISOString(),
        endDateTime: endDateTime ? new Date(endDateTime).toISOString() : new Date(Date.now() + 86400000).toISOString(),
        eventTemplateId: 1, // Handled automatically, no manual ID entry required
        isPublished: true,
      };

      await eventService.createEvent(payload);
      alert('Event created successfully! 🎉');
      navigate('/admin');
    } catch (err) {
      console.error(err);
      setError('Failed to create event. Please verify backend requirements.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ fontFamily: fontBody, background: colors.bg, minHeight: '100vh', padding: '40px 24px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <GlobalStyle />
      <div style={{ background: colors.card, padding: '40px', borderRadius: '20px', width: '100%', maxWidth: '500px', boxShadow: '0 15px 35px rgba(127,19,48,0.08)', border: `1px solid ${colors.roseSoft}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontFamily: fontDisplay, color: colors.wine, margin: 0, fontSize: '26px' }}>Create New Event</h2>
          <Link to="/admin" style={{ color: colors.muted, textDecoration: 'none', fontSize: '14px', fontWeight: 600 }}>← Back</Link>
        </div>

        {error && <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '12px', borderRadius: '8px', fontSize: '13px', marginBottom: '20px', textAlign: 'center' }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: colors.ink, marginBottom: '6px' }}>Event Title *</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Tech Innovation Summit" required style={{ width: '100%', padding: '12px', borderRadius: '10px', border: `1px solid ${colors.roseSoft}`, outline: 'none' }} />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: colors.ink, marginBottom: '6px' }}>Description *</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Provide details about the event..." required rows={3} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: `1px solid ${colors.roseSoft}`, outline: 'none', fontFamily: fontBody }} />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: colors.ink, marginBottom: '6px' }}>Location</label>
            <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Auditorium A / Online" style={{ width: '100%', padding: '12px', borderRadius: '10px', border: `1px solid ${colors.roseSoft}`, outline: 'none' }} />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: colors.ink, marginBottom: '6px' }}>Capacity</label>
            <input type="number" min="0" value={capacity} onChange={(e) => setCapacity(e.target.value)} placeholder="e.g. 150" style={{ width: '100%', padding: '12px', borderRadius: '10px', border: `1px solid ${colors.roseSoft}`, outline: 'none' }} />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: colors.ink, marginBottom: '6px' }}>Price (USD)</label>
            <input type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="e.g. 25.00" style={{ width: '100%', padding: '12px', borderRadius: '10px', border: `1px solid ${colors.roseSoft}`, outline: 'none' }} />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: colors.ink, marginBottom: '6px' }}>Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: `1px solid ${colors.roseSoft}` }}>
              <option value="Conference">Conference</option>
              <option value="Ceremony">Ceremony</option>
              <option value="Workshop">Workshop</option>
              <option value="Seminar">Seminar</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: colors.ink, marginBottom: '6px' }}>Start Date & Time</label>
              <input type="datetime-local" value={startDateTime} onChange={(e) => setStartDateTime(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: `1px solid ${colors.roseSoft}`, outline: 'none', fontFamily: fontBody }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: colors.ink, marginBottom: '6px' }}>End Date & Time</label>
              <input type="datetime-local" value={endDateTime} onChange={(e) => setEndDateTime(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: `1px solid ${colors.roseSoft}`, outline: 'none', fontFamily: fontBody }} />
            </div>
          </div>

          <button type="submit" disabled={loading} style={{ background: colors.wine, color: '#fff', border: 'none', padding: '14px', borderRadius: '10px', fontWeight: 600, cursor: 'pointer', marginTop: '10px' }}>
            {loading ? 'Creating...' : 'Publish Event'}
          </button>
        </form>
      </div>
    </div>
  );
}

function AdminPanel({ currentUser, setCurrentUser }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adminTab, setAdminTab] = useState('upcoming'); // 'upcoming' | 'past'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [editingEvent, setEditingEvent] = useState(null);
  const navigate = useNavigate();

  const fetchEvents = (includeExpired = false) => {
    setLoading(true);
    eventService.getAllEvents(includeExpired)
      .then((data) => { setEvents(data); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    if (currentUser) {
      fetchEvents(adminTab === 'past');
    }
  }, [currentUser, adminTab]);

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    try {
      const user = await authService.login(email, password);
      setCurrentUser(user);
    } catch (err) {
      setLoginError('Access Denied. Invalid credentials or insufficient permissions.');
    }
  };

  const handleDelete = async (eventId) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;
    try {
      await eventService.deleteEvent(eventId);
      alert('Event deleted successfully.');
      fetchEvents();
    } catch (err) {
      alert('Failed to delete event: ' + err.message);
    }
  };

  const handleStartEditing = (event) => {
    // Format backend UTC string into a value suitable for <input type="datetime-local" />
    const formatLocalDateTime = (dateStr) => {
      if (!dateStr) return '';
      return toLocalInputValue(dateStr);
    };

    setEditingEvent({
      ...event,
      title: event.title || event.name || '',
      description: event.description || '',
      location: event.location || '',
      capacity: event.capacity || 100,
      startDateTime: formatLocalDateTime(event.startDateTime || event.StartDateTime),
      endDateTime: formatLocalDateTime(event.endDateTime || event.EndDateTime),
    });
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    try {
      // Validate numeric inputs for edit form
      const capVal = editingEvent.capacity ? parseInt(editingEvent.capacity, 10) : 0;
      const priceVal = editingEvent.price ? parseFloat(editingEvent.price) : 0;
      if (capVal < 0 || priceVal < 0) {
        alert('Capacity and Price must be 0 or greater.');
        return;
      }
      const eventId = editingEvent.id || editingEvent.eventId;
        const payload = {
            id: parseInt(eventId, 10),
            title: editingEvent.title,
            description: editingEvent.description,
            location: editingEvent.location || 'Default Location',
            capacity: editingEvent.capacity ? parseInt(editingEvent.capacity, 10) : 100,
            price: editingEvent.price ? parseFloat(editingEvent.price) : 0,
            category: editingEvent.category || 'Other',
            startDateTime: editingEvent.startDateTime ? new Date(editingEvent.startDateTime).toISOString() : new Date().toISOString(),
            endDateTime: editingEvent.endDateTime ? new Date(editingEvent.endDateTime).toISOString() : new Date(Date.now() + 86400000).toISOString(),
            eventTemplateId: editingEvent.eventTemplateId ? parseInt(editingEvent.eventTemplateId, 10) : 1,
            isPublished: true,
        };

      await eventService.updateEvent(eventId, payload);
      alert('Event updated successfully! 🎉');
      setEditingEvent(null);
      fetchEvents();
    } catch (err) {
      alert('Failed to update event: ' + err.message);
    }
  };

  if (!currentUser) {
    return (
      <div style={{ fontFamily: fontBody, background: colors.bg, minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
        <GlobalStyle />
        <div style={{ background: colors.card, padding: '40px', borderRadius: '20px', width: '100%', maxWidth: '420px', boxShadow: '0 15px 35px rgba(127,19,48,0.08)', border: `1px solid ${colors.roseSoft}` }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div style={{ fontSize: '40px', marginBottom: '10px' }}>🔐</div>
            <h2 style={{ fontFamily: fontDisplay, color: colors.ink, margin: '0 0 8px 0', fontSize: '26px' }}>Host Portal Login</h2>
            <p style={{ fontSize: '13px', color: colors.muted }}>Use seeded admin: <strong>admin@ems.com</strong> / <strong>Admin123!</strong></p>
          </div>
          {loginError && <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '12px', borderRadius: '8px', fontSize: '13px', marginBottom: '20px', textAlign: 'center' }}>{loginError}</div>}
          <form onSubmit={handleAdminLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@ems.com" required style={{ width: '100%', padding: '12px', borderRadius: '10px', border: `1px solid ${colors.roseSoft}`, outline: 'none' }} />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required style={{ width: '100%', padding: '12px', borderRadius: '10px', border: `1px solid ${colors.roseSoft}`, outline: 'none' }} />
            <button type="submit" className="es-cta" style={{ background: colors.wine, color: '#fff', border: 'none', padding: '14px', borderRadius: '10px', fontWeight: 600, cursor: 'pointer' }}>Access Host Portal</button>
          </form>
          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <Link to="/" style={{ color: colors.wine, textDecoration: 'none', fontSize: '14px' }}>← Back to Home</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: fontBody, background: colors.bg, minHeight: '100vh', padding: '40px 24px' }}>
      <GlobalStyle />
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: colors.card, padding: '24px 30px', borderRadius: '16px', marginBottom: '30px', border: `1px solid ${colors.roseSoft}` }}>
          <div>
            <h2 style={{ margin: '0 0 5px 0', fontFamily: fontDisplay, color: colors.wine, fontSize: '24px' }}>Host Control Center 🛠️</h2>
            <p style={{ margin: 0, color: colors.muted, fontSize: '13px' }}>Logged in as: <strong>{currentUser.email || currentUser.userName}</strong></p>
          </div>
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            <button onClick={() => { authService.logout(); setCurrentUser(null); }} style={{ background: 'transparent', color: colors.muted, border: 'none', cursor: 'pointer', fontWeight: 600 }}>Sign Out</button>
            <button onClick={() => { authService.logout(); setCurrentUser(null); navigate('/admin'); }} style={{ background: 'transparent', color: colors.wine, border: 'none', cursor: 'pointer', fontWeight: 600, textDecoration: 'none' }}>Home</button>
          </div>
        </div>

        {editingEvent && (
          <div style={{ background: colors.card, padding: '30px', borderRadius: '16px', border: `1px solid ${colors.rose}`, marginBottom: '30px', boxShadow: '0 10px 30px rgba(127,19,48,0.06)' }}>
            <h3 style={{ margin: '0 0 20px 0', color: colors.wine, fontFamily: fontDisplay, fontSize: '20px' }}>Edit Event Details</h3>
            <form onSubmit={handleUpdateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: colors.ink, marginBottom: '6px' }}>Event Title *</label>
                <input type="text" value={editingEvent.title} onChange={(e) => setEditingEvent({ ...editingEvent, title: e.target.value })} placeholder="Event Title" required style={{ width: '100%', padding: '12px', borderRadius: '10px', border: `1px solid ${colors.roseSoft}`, outline: 'none' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: colors.ink, marginBottom: '6px' }}>Description *</label>
                <textarea value={editingEvent.description} onChange={(e) => setEditingEvent({ ...editingEvent, description: e.target.value })} placeholder="Description" required rows={3} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: `1px solid ${colors.roseSoft}`, outline: 'none', fontFamily: fontBody }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: colors.ink, marginBottom: '6px' }}>Location</label>
                <input type="text" value={editingEvent.location} onChange={(e) => setEditingEvent({ ...editingEvent, location: e.target.value })} placeholder="Location" style={{ width: '100%', padding: '12px', borderRadius: '10px', border: `1px solid ${colors.roseSoft}`, outline: 'none' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: colors.ink, marginBottom: '6px' }}>Capacity</label>
                <input type="number" min="0" value={editingEvent.capacity} onChange={(e) => setEditingEvent({ ...editingEvent, capacity: e.target.value })} placeholder="Capacity" style={{ width: '100%', padding: '12px', borderRadius: '10px', border: `1px solid ${colors.roseSoft}`, outline: 'none' }} />
              </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: colors.ink, marginBottom: '6px' }}>Price (USD)</label>
              <input type="number" min="0" step="0.01" value={editingEvent.price} onChange={(e) => setEditingEvent({ ...editingEvent, price: e.target.value })} placeholder="Price" style={{ width: '100%', padding: '12px', borderRadius: '10px', border: `1px solid ${colors.roseSoft}`, outline: 'none' }} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: colors.ink, marginBottom: '6px' }}>Category</label>
              <select value={editingEvent.category} onChange={(e) => setEditingEvent({ ...editingEvent, category: e.target.value })} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: `1px solid ${colors.roseSoft}` }}>
                <option value="Conference">Conference</option>
                <option value="Ceremony">Ceremony</option>
                <option value="Workshop">Workshop</option>
                <option value="Seminar">Seminar</option>
                <option value="Other">Other</option>
              </select>
            </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: colors.ink, marginBottom: '6px' }}>Start Date & Time</label>
                  <input type="datetime-local" value={editingEvent.startDateTime} onChange={(e) => setEditingEvent({ ...editingEvent, startDateTime: e.target.value })} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: `1px solid ${colors.roseSoft}`, outline: 'none', fontFamily: fontBody }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: colors.ink, marginBottom: '6px' }}>End Date & Time</label>
                  <input type="datetime-local" value={editingEvent.endDateTime} onChange={(e) => setEditingEvent({ ...editingEvent, endDateTime: e.target.value })} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: `1px solid ${colors.roseSoft}`, outline: 'none', fontFamily: fontBody }} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="submit" style={{ background: colors.wine, color: '#fff', border: 'none', padding: '12px 20px', borderRadius: '10px', cursor: 'pointer', fontWeight: 600 }}>Save Changes</button>
                <button type="button" onClick={() => setEditingEvent(null)} style={{ background: '#E5E7EB', color: colors.ink, border: 'none', padding: '12px 20px', borderRadius: '10px', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
              </div>
            </form>
          </div>
        )}

        <div style={{ background: colors.card, padding: '30px', borderRadius: '16px', border: `1px solid ${colors.roseSoft}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                      <h3 style={{ margin: 0, fontFamily: fontDisplay, fontSize: '20px', color: colors.ink }}>Manage Events Database</h3>
                      <button
                          onClick={() => navigate('/create-event')}
                          style={{ background: colors.wine, color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '14px' }}
                      >
                          + Add Event
                      </button>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                      <button onClick={() => setAdminTab('upcoming')} style={{ padding: '8px 12px', borderRadius: '8px', border: adminTab === 'upcoming' ? `2px solid ${colors.wine}` : `1px solid ${colors.roseSoft}`, background: adminTab === 'upcoming' ? colors.wine : 'transparent', color: adminTab === 'upcoming' ? '#fff' : colors.muted, fontWeight: 700, cursor: 'pointer' }}>Upcoming Events</button>
                      <button onClick={() => setAdminTab('past')} style={{ padding: '8px 12px', borderRadius: '8px', border: adminTab === 'past' ? `2px solid ${colors.wine}` : `1px solid ${colors.roseSoft}`, background: adminTab === 'past' ? colors.wine : 'transparent', color: adminTab === 'past' ? '#fff' : colors.muted, fontWeight: 700, cursor: 'pointer' }}>Past Events</button>
                  </div>

                  {loading && <p style={{ color: colors.muted }}>Loading...</p>}

          {loading && <p style={{ color: colors.muted }}>Loading...</p>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {events.map((event) => {
              const eventId = event.id || event.eventId;
              return (
                <div key={eventId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', border: `1px solid ${colors.roseSoft}`, borderRadius: '10px', background: colors.bg }}>
                  <div>
                    <h4 style={{ margin: '0 0 5px 0', fontSize: '16px', color: colors.ink, fontFamily: fontDisplay }}>{event.title || event.name}</h4>
                    <p style={{ margin: 0, fontSize: '13px', color: colors.muted }}>{event.description}</p>
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => handleStartEditing(event)} style={{ background: colors.teal, color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>Edit</button>
                    <button onClick={() => handleDelete(eventId)} style={{ background: '#b3261e', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>Delete</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => authService.getCurrentUser());

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/events" element={<AttendeePortal />} />
        <Route path="/admin" element={<AdminPanel currentUser={currentUser} setCurrentUser={setCurrentUser} />} />
        <Route path="/create-event" element={<CreateEventView />} />
      </Routes>
    </Router>
  );
}