import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { eventService } from './eventService';
import { authService } from './authService';
import { bookingService } from './bookingService';
import { recommendationService } from './recommendationService';
import NotificationBell from './components/NotificationBell';
import Login from './pages/Login';
import Register from './pages/Register';

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

const CATEGORY_OPTIONS = ['Conference', 'Workshop', 'Meeting', 'Shows', 'Other'];
const INTEREST_OPTIONS = ['Technology', 'Science', 'Entertainment', 'Business', 'Sports', 'Art & Culture', 'Health & Wellness', 'Education'];

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

function EventCard({ event, onRegister, reason }) {
  const title = event.title || event.name;
  const rawDate = event.date || event.startDateTime || event.StartDateTime;
  const dateObj = rawDate ? new Date(rawDate) : null;
  const day = dateObj && !isNaN(dateObj) ? dateObj.getDate() : '—';
  const month = dateObj && !isNaN(dateObj) ? dateObj.toLocaleDateString(undefined, { month: 'short' }).toUpperCase() : 'TBA';
  const organizer = event.organizer || event.Organizer || 'General Host';
  const category = event.category || event.Category;
  const seatsRemaining = event.seatsRemaining ?? event.SeatsRemaining;
  const isFull = seatsRemaining === 0;

  return (
    <div className="es-card" style={{ background: colors.card, borderRadius: '18px', boxShadow: '0 6px 20px rgba(127,19,48,0.06)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {reason && (
        <div style={{ background: colors.wine, color: '#fff', fontSize: '11px', fontWeight: 700, padding: '6px 16px', letterSpacing: '0.3px' }}>
          ✨ {reason}
        </div>
      )}
      <div style={{ padding: '22px 24px 18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px', flexWrap: 'wrap', gap: '6px' }}>
          <span style={{ background: colors.roseSoft, color: colors.wine, padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600 }}>
            🏛️ {organizer}
          </span>
          {typeof seatsRemaining === 'number' && (
            <span style={{
              background: isFull ? '#FEE2E2' : '#DCFCE7',
              color: isFull ? '#991B1B' : '#166534',
              padding: '4px 10px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: 700,
            }}>
              {isFull ? 'Sold Out' : `${seatsRemaining} seat${seatsRemaining === 1 ? '' : 's'} left`}
            </span>
          )}
        </div>
        {category && (
          <span style={{ display: 'inline-block', background: colors.teal, color: '#fff', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, marginBottom: '10px', letterSpacing: '0.3px' }}>
            {category.toUpperCase()}
          </span>
        )}
        <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', marginBottom: '14px' }}>
          <div style={{ flexShrink: 0, width: '52px', height: '52px', borderRadius: '12px', background: colors.amber, color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>
            <span style={{ fontSize: '18px', fontWeight: 700, fontFamily: fontDisplay }}>{day}</span>
            <span style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.5px' }}>{month}</span>
          </div>
          <h4 style={{ margin: '4px 0 0 0', color: colors.ink, fontFamily: fontDisplay, fontSize: '19px', fontWeight: 600, lineHeight: 1.3 }}>
            {title}
          </h4>
        </div>
        <p style={{ color: colors.muted, fontFamily: fontBody, fontSize: '14px', lineHeight: 1.65, margin: 0, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: '68px' }}>
          {event.description}
        </p>
      </div>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: colors.bg, marginLeft: '-11px', flexShrink: 0 }} />
        <div style={{ flex: 1, borderTop: `2px dashed ${colors.roseSoft}` }} />
        <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: colors.bg, marginRight: '-11px', flexShrink: 0 }} />
      </div>
      <div style={{ padding: '18px 24px 24px' }}>
        <button
          onClick={() => onRegister(event)}
          disabled={isFull}
          className="es-register-btn"
          style={{
            width: '100%',
            padding: '12px',
            background: isFull ? '#B0B0B0' : colors.wine,
            color: '#fff',
            border: 'none',
            borderRadius: '10px',
            cursor: isFull ? 'not-allowed' : 'pointer',
            fontFamily: fontBody,
            fontWeight: 600,
            fontSize: '14px',
          }}
        >
          {isFull ? 'Sold Out' : 'Reserve a Spot'}
        </button>
      </div>
    </div>
  );
}

function InterestsBox({ currentUser, setCurrentUser, onSaved }) {
  const initialTags = (currentUser.interests || '').split(',').map((s) => s.trim()).filter(Boolean);
  const initialKnown = initialTags.filter((t) => INTEREST_OPTIONS.includes(t));
  const initialCustom = initialTags.filter((t) => !INTEREST_OPTIONS.includes(t)).join(', ');

  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState(initialKnown);
  const [customText, setCustomText] = useState(initialCustom);
  const [saving, setSaving] = useState(false);
  const dropdownRef = React.useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOption = (option) => {
    setSelected((prev) =>
      prev.includes(option) ? prev.filter((o) => o !== option) : [...prev, option]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const customTags = customText.split(',').map((s) => s.trim()).filter(Boolean);
      const combined = [...selected, ...customTags].join(', ');
      const updated = await authService.updateInterests(combined);
      setCurrentUser(updated);
      if (onSaved) onSaved();
      setIsOpen(false);
    } catch (err) {
      alert('Failed to update interests. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const allTags = [...selected, ...customText.split(',').map((s) => s.trim()).filter(Boolean)];

  return (
    <div style={{ position: 'relative', marginBottom: '24px' }} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen((o) => !o)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: colors.card,
          border: `1px solid ${colors.roseSoft}`,
          borderRadius: '12px',
          padding: '12px 18px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: 600,
          color: colors.ink,
        }}
      >
        🎯 Interests
        {allTags.length > 0 && (
          <span style={{ background: colors.wine, color: '#fff', borderRadius: '10px', padding: '2px 8px', fontSize: '11px', fontWeight: 700 }}>
            {allTags.length}
          </span>
        )}
        <span style={{ fontSize: '11px', color: colors.muted }}>{isOpen ? '▲' : '▼'}</span>
      </button>

      {allTags.length > 0 && !isOpen && (
        <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: colors.muted }}>
          {allTags.join(', ')}
        </p>
      )}

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '54px',
            left: 0,
            width: '340px',
            maxWidth: '90vw',
            background: colors.card,
            border: `1px solid ${colors.roseSoft}`,
            borderRadius: '14px',
            boxShadow: '0 12px 32px rgba(127,19,48,0.15)',
            padding: '18px',
            zIndex: 100,
          }}
        >
          <p style={{ margin: '0 0 12px 0', fontSize: '12px', fontWeight: 600, color: colors.muted }}>
            Select what you're interested in
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
            {INTEREST_OPTIONS.map((option) => (
              <label
                key={option}
                style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: colors.ink, cursor: 'pointer' }}
              >
                <input
                  type="checkbox"
                  checked={selected.includes(option)}
                  onChange={() => toggleOption(option)}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                {option}
              </label>
            ))}
          </div>

          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: colors.muted, marginBottom: '6px' }}>
            Write your own (comma-separated)
          </label>
          <input
            type="text"
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            placeholder="e.g. jazz, robotics, cooking"
            style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: `1px solid ${colors.roseSoft}`, outline: 'none', fontSize: '13px', marginBottom: '16px' }}
          />

          <button
            onClick={handleSave}
            disabled={saving}
            style={{ width: '100%', background: colors.wine, color: '#fff', border: 'none', padding: '11px', borderRadius: '10px', cursor: 'pointer', fontWeight: 600, fontSize: '14px' }}
          >
            {saving ? 'Saving...' : 'Save & Get Recommendations'}
          </button>
        </div>
      )}
    </div>
  );
}

function AttendeePortal({ currentUser, setCurrentUser }) {
  const [events, setEvents] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [booking, setBooking] = useState(false);
  const [activeTab, setActiveTab] = useState('interests');
  const navigate = useNavigate();

  useEffect(() => {
    eventService.getAllEvents()
      .then((data) => { setEvents(data); setLoading(false); })
      .catch(() => { setError('Failed to connect to backend API.'); setLoading(false); });
  }, []);

  const fetchRecommendations = () => {
    if (!currentUser?.userId) {
      setRecommendations([]);
      return;
    }
    recommendationService.getForUser(currentUser.userId)
      .then((data) => setRecommendations(data))
      .catch(() => setRecommendations([]));
  };

  useEffect(() => {
    fetchRecommendations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  const filteredEvents = events.filter((event) => {
    const org = event.organizer || event.Organizer || '';
    return org.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const refreshAll = async () => {
    const refreshedEvents = await eventService.getAllEvents();
    setEvents(refreshedEvents);
    fetchRecommendations();
  };

  const handleReserve = async (event) => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    const eventId = event.id || event.eventId;
    const title = event.title || event.name;

    setBooking(true);
    try {
      await bookingService.guestCheckout({
        fullName: currentUser.name,
        email: currentUser.email,
        phone: '',
        eventId,
        quantity: 1,
        cardNumber: '',
        cardName: '',
        cardExpiry: '',
      });
      await refreshAll();
      alert(`Successfully reserved spot for: ${title}`);
    } catch (err) {
      const msg = err.response?.data || 'Failed to reserve spot. Please try again.';
      alert(typeof msg === 'string' ? msg : 'Failed to reserve spot. Please try again.');
    } finally {
      setBooking(false);
    }
  };

  return (
    <div style={{ fontFamily: fontBody, background: colors.bg, minHeight: '100vh', paddingBottom: '60px' }}>
      <GlobalStyle />
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '28px 0' }}>
          <Link to="/" style={{ textDecoration: 'none', color: colors.wine, fontFamily: fontDisplay, fontWeight: 700, fontSize: '22px' }}>← Home</Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {currentUser ? (
              <>
                <NotificationBell currentUser={currentUser} />
                <span style={{ fontSize: '13px', color: colors.muted }}>Hi, <strong>{currentUser.name}</strong></span>
                <button
                  onClick={() => { authService.logout(); setCurrentUser(null); }}
                  style={{ background: 'transparent', color: colors.muted, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '13px' }}
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" style={{ color: colors.wine, textDecoration: 'none', fontWeight: 600, fontSize: '13px' }}>Log In</Link>
                <Link to="/register" style={{ color: '#fff', background: colors.wine, textDecoration: 'none', fontWeight: 600, fontSize: '13px', padding: '8px 16px', borderRadius: '8px' }}>Sign Up</Link>
              </>
            )}
          </div>
        </div>

        {currentUser && (
          <InterestsBox currentUser={currentUser} setCurrentUser={setCurrentUser} onSaved={fetchRecommendations} />
        )}

        {currentUser && (
          <div style={{ display: 'flex', gap: '10px', marginBottom: '28px' }}>
            <button
              onClick={() => setActiveTab('interests')}
              style={{
                padding: '10px 20px',
                borderRadius: '10px',
                border: `1.5px solid ${activeTab === 'interests' ? colors.wine : colors.roseSoft}`,
                background: activeTab === 'interests' ? colors.wine : '#fff',
                color: activeTab === 'interests' ? '#fff' : colors.ink,
                fontWeight: 600,
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              ✨ Your Interests
            </button>
            <button
              onClick={() => setActiveTab('all')}
              style={{
                padding: '10px 20px',
                borderRadius: '10px',
                border: `1.5px solid ${activeTab === 'all' ? colors.wine : colors.roseSoft}`,
                background: activeTab === 'all' ? colors.wine : '#fff',
                color: activeTab === 'all' ? '#fff' : colors.ink,
                fontWeight: 600,
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              All Events
            </button>
          </div>
        )}

        {(!currentUser || activeTab === 'all') && (
          <div style={{ padding: '10px 0 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '20px' }}>
            <div>
              <h1 style={{ margin: '0 0 10px 0', fontFamily: fontDisplay, fontSize: '42px', color: colors.ink, fontWeight: 600 }}>
                Upcoming <span style={{ fontStyle: 'italic', color: colors.wine }}>Public Events</span>
              </h1>
            </div>

            <div style={{ width: '100%', maxWidth: '350px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: colors.muted, marginBottom: '6px' }}>SEARCH BY SOCIETY / ORGANIZER</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="e.g. Ushers, ACM, IEEE..."
                style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: `1px solid ${colors.roseSoft}`, background: colors.card, outline: 'none', fontSize: '14px' }}
              />
            </div>
          </div>
        )}

        {loading && <p style={{ color: colors.muted }}>Loading events...</p>}
        {error && <p style={{ color: '#b3261e' }}>{error}</p>}
        {booking && <p style={{ color: colors.wine, fontWeight: 600 }}>Reserving your spot...</p>}

        {currentUser && activeTab === 'interests' && (
          <>
            <h1 style={{ margin: '0 0 6px 0', fontFamily: fontDisplay, fontSize: '32px', color: colors.ink, fontWeight: 600 }}>
              Recommended <span style={{ fontStyle: 'italic', color: colors.wine }}>for You</span>
            </h1>
            <p style={{ margin: '0 0 24px 0', color: colors.muted, fontSize: '13px' }}>
              Based on your interests and events you've attended before
            </p>
            {recommendations.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', background: colors.card, borderRadius: '16px', border: `1px solid ${colors.roseSoft}` }}>
                <p style={{ color: colors.muted, fontSize: '15px', margin: 0 }}>
                  No recommendations yet — set your interests above, or check back after booking your first event.
                </p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '26px', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
                {recommendations.map((rec) => (
                  <EventCard
                    key={rec.event.id || rec.event.eventId}
                    event={rec.event}
                    reason={rec.reason}
                    onRegister={handleReserve}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {(!currentUser || activeTab === 'all') && (
          <>
            {!loading && filteredEvents.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px', background: colors.card, borderRadius: '16px', border: `1px solid ${colors.roseSoft}` }}>
                <p style={{ color: colors.muted, fontSize: '15px', margin: 0 }}>No events found for organizer: <strong>"{searchTerm}"</strong></p>
              </div>
            )}
            <div style={{ display: 'grid', gap: '26px', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
              {filteredEvents.map((event) => (
                <EventCard key={event.id || event.eventId} event={event} onRegister={handleReserve} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function CreateEventView() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [organizer, setOrganizer] = useState('');
  const [location, setLocation] = useState('');
  const [capacity, setCapacity] = useState('');
  const [category, setCategory] = useState('Conference');
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
      const payload = {
        title,
        description,
        organizer: organizer || 'General Society',
        location: location || 'Default Location',
        capacity: capacity ? parseInt(capacity, 10) : 100,
        category,
        startDateTime: startDateTime ? new Date(startDateTime).toISOString() : new Date().toISOString(),
        endDateTime: endDateTime ? new Date(endDateTime).toISOString() : new Date(Date.now() + 86400000).toISOString(),
        eventTemplateId: 1,
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
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: colors.ink, marginBottom: '6px' }}>Organizer / Society Name *</label>
            <input type="text" value={organizer} onChange={(e) => setOrganizer(e.target.value)} placeholder="e.g. Ushers, ACM Society" required style={{ width: '100%', padding: '12px', borderRadius: '10px', border: `1px solid ${colors.roseSoft}`, outline: 'none' }} />
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
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: colors.ink, marginBottom: '6px' }}>Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={{ width: '100%', padding: '12px', borderRadius: '10px', border: `1px solid ${colors.roseSoft}`, outline: 'none', fontFamily: fontBody }}
            >
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: colors.ink, marginBottom: '6px' }}>Capacity</label>
            <input type="number" value={capacity} onChange={(e) => setCapacity(e.target.value)} placeholder="e.g. 150" style={{ width: '100%', padding: '12px', borderRadius: '10px', border: `1px solid ${colors.roseSoft}`, outline: 'none' }} />
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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [editingEvent, setEditingEvent] = useState(null);
  const navigate = useNavigate();

  const fetchEvents = () => {
    eventService.getAllEvents()
      .then((data) => { setEvents(data); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    if (currentUser) {
      fetchEvents();
    }
  }, [currentUser]);

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
    const formatLocalDateTime = (dateStr) => {
      if (!dateStr) return '';
      const d = new Date(dateStr);
      if (isNaN(d)) return '';
      return d.toISOString().slice(0, 16);
    };

    setEditingEvent({
      ...event,
      title: event.title || event.name || '',
      description: event.description || '',
      organizer: event.organizer || event.Organizer || '',
      location: event.location || '',
      capacity: event.capacity || 100,
      category: event.category || event.Category || 'Other',
      startDateTime: formatLocalDateTime(event.startDateTime || event.StartDateTime),
      endDateTime: formatLocalDateTime(event.endDateTime || event.EndDateTime),
    });
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    try {
      const eventId = editingEvent.id || editingEvent.eventId;
      const payload = {
        id: eventId,
        title: editingEvent.title,
        description: editingEvent.description,
        organizer: editingEvent.organizer || 'General Society',
        location: editingEvent.location || 'Default Location',
        capacity: editingEvent.capacity ? parseInt(editingEvent.capacity, 10) : 100,
        category: editingEvent.category,
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
            <NotificationBell currentUser={currentUser} />
            <button onClick={() => { authService.logout(); setCurrentUser(null); }} style={{ background: 'transparent', color: colors.muted, border: 'none', cursor: 'pointer', fontWeight: 600 }}>Sign Out</button>
            <Link to="/" style={{ color: colors.wine, textDecoration: 'none', fontWeight: 600 }}>Home</Link>
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
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: colors.ink, marginBottom: '6px' }}>Organizer / Society Name *</label>
                <input type="text" value={editingEvent.organizer} onChange={(e) => setEditingEvent({ ...editingEvent, organizer: e.target.value })} placeholder="Organizer Name" required style={{ width: '100%', padding: '12px', borderRadius: '10px', border: `1px solid ${colors.roseSoft}`, outline: 'none' }} />
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
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: colors.ink, marginBottom: '6px' }}>Category</label>
                <select
                  value={editingEvent.category}
                  onChange={(e) => setEditingEvent({ ...editingEvent, category: e.target.value })}
                  style={{ width: '100%', padding: '12px', borderRadius: '10px', border: `1px solid ${colors.roseSoft}`, outline: 'none', fontFamily: fontBody }}
                >
                  {CATEGORY_OPTIONS.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: colors.ink, marginBottom: '6px' }}>Capacity</label>
                <input type="number" value={editingEvent.capacity} onChange={(e) => setEditingEvent({ ...editingEvent, capacity: e.target.value })} placeholder="Capacity" style={{ width: '100%', padding: '12px', borderRadius: '10px', border: `1px solid ${colors.roseSoft}`, outline: 'none' }} />
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

          {loading && <p style={{ color: colors.muted }}>Loading...</p>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {events.map((event) => {
              const eventId = event.id || event.eventId;
              const org = event.organizer || event.Organizer;
              return (
                <div key={eventId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', border: `1px solid ${colors.roseSoft}`, borderRadius: '10px', background: colors.bg }}>
                  <div>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '4px' }}>
                      <h4 style={{ margin: 0, fontSize: '16px', color: colors.ink, fontFamily: fontDisplay }}>{event.title || event.name}</h4>
                      {org && <span style={{ fontSize: '11px', background: colors.roseSoft, color: colors.wine, padding: '2px 8px', borderRadius: '10px', fontWeight: 600 }}>{org}</span>}
                    </div>
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
        <Route path="/events" element={<AttendeePortal currentUser={currentUser} setCurrentUser={setCurrentUser} />} />
        <Route path="/login" element={<Login setCurrentUser={setCurrentUser} />} />
        <Route path="/register" element={<Register setCurrentUser={setCurrentUser} />} />
        <Route path="/admin" element={<AdminPanel currentUser={currentUser} setCurrentUser={setCurrentUser} />} />
        <Route path="/create-event" element={<CreateEventView />} />
      </Routes>
    </Router>
  );
}