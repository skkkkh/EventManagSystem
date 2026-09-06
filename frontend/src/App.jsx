import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { eventService } from './eventService';
import { authService } from './authService';
import { bookingService } from './bookingService';
import { reviewService } from './reviewService';
import { groupService } from './groupService';
import { userService } from './userService';
import { recommendationService } from './recommendationService';
import NotificationBell from './components/NotificationBell';
import { imageService } from './imageService';
import { savedEventsService } from './savedEventsService';
import { organizerProfileService } from './organizerProfileService';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

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
// Capacity is a real number in the database (it's used to calculate available
// seats), so "Unlimited" isn't stored as text — it's this large sentinel value
// instead. Anywhere capacity is displayed, a value at or above this shows
// "Unlimited" instead of the raw number.
const UNLIMITED_CAPACITY = 999999;
const INTEREST_OPTIONS = ['Technology', 'Science', 'Entertainment', 'Business', 'Sports', 'Art & Culture', 'Health & Wellness', 'Education'];

// Shared date+time formatter so every event listing (public cards, host
// control center rows, past events, etc.) shows the event's start time
// alongside its date, not just the date.
const formatEventDateTime = (value) => {
  if (!value) return 'Date & time TBA';
  const d = new Date(value);
  if (isNaN(d)) return 'Date & time TBA';
  return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
};

const formatEventTime = (value) => {
  if (!value) return '';
  const d = new Date(value);
  if (isNaN(d)) return '';
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
};

// --- Dummy card-payment helpers -------------------------------------------
// This app never talks to a real bank or wallet. These helpers back a mock
// "enter your card" step so the payment flow looks and feels real, while the
// actual booking still only records a human-readable note (e.g. "Card ending
// in 1234 (exp 09/28)") for the organiser to see — the full card number and
// CVV never leave the browser, and the CVV is never sent to the backend at
// all, even in this mocked form.
const formatCardNumberInput = (raw) => raw.replace(/\D/g, '').slice(0, 16);
const formatCvvInput = (raw) => raw.replace(/\D/g, '').slice(0, 3);
const formatExpiryInput = (raw) => {
  const digits = raw.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
};
const isValidCardNumber = (v) => /^\d{12}$/.test(v) || /^\d{16}$/.test(v);
const isValidCvv = (v) => /^\d{3}$/.test(v);
const isValidExpiry = (v) => {
  const match = /^(0[1-9]|1[0-2])\/(\d{2})$/.exec(v);
  if (!match) return false;
  const month = parseInt(match[1], 10);
  const year = 2000 + parseInt(match[2], 10);
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  if (year < currentYear) return false;
  if (year === currentYear && month < currentMonth) return false;
  return true;
};
const isCardDetailsValid = (cardNumber, cvv, expiry) =>
  isValidCardNumber(cardNumber) && isValidCvv(cvv) && isValidExpiry(expiry);
const buildCardPaymentSummary = (cardNumber, expiry) =>
  `Card ending in ${cardNumber.slice(-4)} (exp ${expiry})`;

// Shared mock card-entry fields, used everywhere a "how will you pay?" step
// used to just be a free-text box. Purely a UI mock: nothing here is
// processed as a real payment.
function CardPaymentFields({ cardNumber, cvv, expiry, onCardNumberChange, onCvvChange, onExpiryChange }) {
  const cardNumberTouched = cardNumber.length > 0;
  const cvvTouched = cvv.length > 0;
  const expiryTouched = expiry.length > 0;
  const inputStyle = {
    width: '100%',
    padding: '12px 14px',
    borderRadius: '10px',
    border: `1.5px solid ${colors.roseSoft}`,
    outline: 'none',
    fontSize: '14px',
    color: colors.ink,
  };
  return (
    <div style={{ marginBottom: '10px' }}>
      <p style={{ margin: '0 0 4px 0', fontSize: '11px', fontWeight: 700, color: colors.wine, letterSpacing: '0.3px' }}>
        CARD DETAILS (MOCK — NO REAL CHARGE)
      </p>
      <div style={{ marginBottom: '10px' }}>
        <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: colors.ink, marginBottom: '5px' }}>Card / Account Number</label>
        <input
          type="text"
          inputMode="numeric"
          value={cardNumber}
          onChange={(e) => onCardNumberChange(formatCardNumberInput(e.target.value))}
          placeholder="12 or 16 digits"
          style={{ ...inputStyle, borderColor: cardNumberTouched && !isValidCardNumber(cardNumber) ? '#C0392B' : colors.roseSoft }}
        />
        {cardNumberTouched && !isValidCardNumber(cardNumber) && (
          <p style={{ margin: '4px 0 0 0', fontSize: '11.5px', color: '#C0392B' }}>Enter exactly 12 or 16 digits.</p>
        )}
      </div>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '4px' }}>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: colors.ink, marginBottom: '5px' }}>Expiry (MM/YY)</label>
          <input
            type="text"
            inputMode="numeric"
            value={expiry}
            onChange={(e) => onExpiryChange(formatExpiryInput(e.target.value))}
            placeholder="MM/YY"
            style={{ ...inputStyle, borderColor: expiryTouched && !isValidExpiry(expiry) ? '#C0392B' : colors.roseSoft }}
          />
          {expiryTouched && !isValidExpiry(expiry) && (
            <p style={{ margin: '4px 0 0 0', fontSize: '11.5px', color: '#C0392B' }}>Use a valid, non-expired MM/YY.</p>
          )}
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: colors.ink, marginBottom: '5px' }}>CVV</label>
          <input
            type="password"
            inputMode="numeric"
            value={cvv}
            onChange={(e) => onCvvChange(formatCvvInput(e.target.value))}
            placeholder="3 digits"
            style={{ ...inputStyle, borderColor: cvvTouched && !isValidCvv(cvv) ? '#C0392B' : colors.roseSoft }}
          />
          {cvvTouched && !isValidCvv(cvv) && (
            <p style={{ margin: '4px 0 0 0', fontSize: '11.5px', color: '#C0392B' }}>3 digits.</p>
          )}
        </div>
      </div>
    </div>
  );
}

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

function EventCard({ event, onRegister, reason, currentUser, onSavedChange }) {
  const title = event.title || event.name;
  const rawDate = event.date || event.startDateTime || event.StartDateTime;
  const dateObj = rawDate ? new Date(rawDate) : null;
  const day = dateObj && !isNaN(dateObj) ? dateObj.getDate() : '—';
  const month = dateObj && !isNaN(dateObj) ? dateObj.toLocaleDateString(undefined, { month: 'short' }).toUpperCase() : 'TBA';
  const timeStr = formatEventTime(rawDate);
  const imageUrl = imageService.resolveImageUrl(event.imageUrl || event.ImageUrl);
  const organizer = event.organizer || event.Organizer || 'General Host';
  const organizerId = event.organizerId ?? event.OrganizerId;
  const category = event.category || event.Category;
  const seatsRemaining = event.seatsRemaining ?? event.SeatsRemaining;
  const capacity = event.capacity ?? event.Capacity;
  const isUnlimited = capacity >= UNLIMITED_CAPACITY;
  const isFull = seatsRemaining === 0;
  const price = event.price ?? event.Price;
  const isFree = !price || price <= 0;
  const eventId = event.id || event.eventId;

  const [saved, setSaved] = useState(false);
  const [savingBookmark, setSavingBookmark] = useState(false);
  const [showAbout, setShowAbout] = useState(false);

  useEffect(() => {
    if (!currentUser || !eventId) { setSaved(false); return; }
    let cancelled = false;
    savedEventsService.getStatus(eventId)
      .then((s) => { if (!cancelled) setSaved(!!s.isSaved); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [currentUser, eventId]);

  const toggleSaved = async (e) => {
    e.stopPropagation();
    if (!currentUser) { alert('Log in to save events for later.'); return; }
    setSavingBookmark(true);
    try {
      if (saved) {
        await savedEventsService.unsave(eventId);
        setSaved(false);
        if (onSavedChange) onSavedChange(eventId, false);
      } else {
        await savedEventsService.save(eventId);
        setSaved(true);
        if (onSavedChange) onSavedChange(eventId, true);
      }
    } catch (err) {
      alert('Failed to update saved events. Please try again.');
    } finally {
      setSavingBookmark(false);
    }
  };

  return (
    <div className="es-card" style={{ background: colors.card, borderRadius: '18px', boxShadow: '0 6px 20px rgba(127,19,48,0.06)', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
      {reason && (
        <div style={{ background: colors.wine, color: '#fff', fontSize: '11px', fontWeight: 700, padding: '6px 16px', letterSpacing: '0.3px' }}>
          ✨ {reason}
        </div>
      )}
      {currentUser && eventId && (
        <button
          onClick={toggleSaved}
          disabled={savingBookmark}
          title={saved ? 'Remove from saved events' : 'Save event'}
          style={{ position: 'absolute', top: '10px', right: '10px', width: '34px', height: '34px', borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.92)', cursor: savingBookmark ? 'not-allowed' : 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.18)', zIndex: 2 }}
        >
          {saved ? '🔖' : '📑'}
        </button>
      )}
      {imageUrl && (
        <img src={imageUrl} alt={title} style={{ width: '100%', height: '150px', objectFit: 'cover', display: 'block' }} />
      )}
      <div style={{ padding: '22px 24px 18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px', flexWrap: 'wrap', gap: '6px' }}>
          <span style={{ background: colors.roseSoft, color: colors.wine, padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600 }}>
            🏛️ {organizer}
          </span>
          {isUnlimited ? (
            <span style={{ background: '#DCFCE7', color: '#166534', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 700 }}>
              ♾️ Unlimited spots
            </span>
          ) : typeof seatsRemaining === 'number' && (
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
        {organizerId && (
          <button
            onClick={() => {
              if (!currentUser) { alert('Log in to view organizer profiles.'); return; }
              setShowAbout(true);
            }}
            style={{ background: 'transparent', border: 'none', padding: 0, color: colors.teal, fontSize: '12px', fontWeight: 600, cursor: 'pointer', marginBottom: '10px', textDecoration: 'underline' }}
          >
            ℹ️ About the Organizer
          </button>
        )}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
          {category && (
            <span style={{ display: 'inline-block', background: colors.teal, color: '#fff', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.3px' }}>
              {category.toUpperCase()}
            </span>
          )}
          <span style={{ display: 'inline-block', background: isFree ? colors.roseSoft : colors.amber, color: isFree ? colors.wine : '#fff', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.3px' }}>
            {isFree ? 'FREE' : `Rs. ${Number(price).toLocaleString()}`}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', marginBottom: '14px' }}>
          <div style={{ flexShrink: 0, width: '52px', height: '52px', borderRadius: '12px', background: colors.amber, color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>
            <span style={{ fontSize: '18px', fontWeight: 700, fontFamily: fontDisplay }}>{day}</span>
            <span style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.5px' }}>{month}</span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h4 style={{ margin: '4px 0 2px 0', color: colors.ink, fontFamily: fontDisplay, fontSize: '19px', fontWeight: 600, lineHeight: 1.3 }}>
              {title}
            </h4>
            {timeStr && (
              <p style={{ margin: 0, fontSize: '12px', color: colors.muted, fontWeight: 600 }}>
                🕒 {timeStr}
              </p>
            )}
          </div>
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
      {showAbout && (
        <OrganizerAboutModal organizerId={organizerId} organizerName={organizer} onClose={() => setShowAbout(false)} />
      )}
    </div>
  );
}

function OrganizerAboutModal({ organizerId, organizerName, onClose }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    organizerProfileService.getProfile(organizerId)
      .then((data) => { setProfile(data); setLoading(false); })
      .catch(() => { setError('Failed to load organizer profile.'); setLoading(false); });
  }, [organizerId]);

  return (
    <div
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(45,35,38,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}
      onClick={onClose}
    >
      <div
        style={{ background: colors.card, borderRadius: '18px', padding: '30px', width: '100%', maxWidth: '480px', maxHeight: '80vh', overflowY: 'auto', boxShadow: '0 20px 50px rgba(0,0,0,0.2)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <h3 style={{ margin: 0, fontFamily: fontDisplay, color: colors.wine, fontSize: '22px' }}>
            {profile?.organizerName || organizerName || 'About the Organizer'}
          </h3>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', fontSize: '20px', cursor: 'pointer', color: colors.muted, lineHeight: 1 }}>✕</button>
        </div>
        {loading && <p style={{ color: colors.muted }}>Loading...</p>}
        {error && <p style={{ color: '#b3261e' }}>{error}</p>}
        {profile && (
          <>
            <p style={{ color: colors.ink, fontSize: '14px', lineHeight: 1.6, whiteSpace: 'pre-wrap', marginBottom: '24px' }}>
              {profile.aboutUs || "This organizer hasn't added a bio yet."}
            </p>
            {profile.teamMembers?.length > 0 && (
              <>
                <p style={{ fontSize: '12px', fontWeight: 700, color: colors.muted, letterSpacing: '0.4px', marginBottom: '14px' }}>LEADERSHIP TEAM</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '18px', justifyContent: 'center' }}>
                  {profile.teamMembers.map((m) => (
                    <div key={m.id} style={{ textAlign: 'center', width: '96px' }}>
                      <div style={{ width: '72px', height: '72px', borderRadius: '50%', overflow: 'hidden', margin: '0 auto 8px', background: colors.roseSoft, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {m.photoUrl ? (
                          <img src={imageService.resolveImageUrl(m.photoUrl)} alt={m.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <span style={{ fontSize: '24px' }}>👤</span>
                        )}
                      </div>
                      <p style={{ margin: '0 0 2px 0', fontSize: '13px', fontWeight: 700, color: colors.ink }}>{m.name}</p>
                      <p style={{ margin: 0, fontSize: '11px', color: colors.muted }}>{m.title}</p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
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
  const [reserveModalEvent, setReserveModalEvent] = useState(null);
  const [cardNumber, setCardNumber] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filterCategory, setFilterCategory] = useState('');
  const [filterMinPrice, setFilterMinPrice] = useState('');
  const [filterMaxPrice, setFilterMaxPrice] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
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

  const matchesFilters = (event) => {
    const category = event.category || event.Category;
    const price = event.price ?? event.Price ?? 0;
    const rawDate = event.date || event.startDateTime || event.StartDateTime;
    const eventDate = rawDate ? new Date(rawDate) : null;

    if (filterCategory && category !== filterCategory) return false;
    if (filterMinPrice && price < parseFloat(filterMinPrice)) return false;
    if (filterMaxPrice && price > parseFloat(filterMaxPrice)) return false;
    if (filterStartDate && eventDate && !isNaN(eventDate) && eventDate < new Date(filterStartDate)) return false;
    if (filterEndDate && eventDate && !isNaN(eventDate) && eventDate > new Date(`${filterEndDate}T23:59:59`)) return false;
    return true;
  };

  const hasActiveFilters = !!(filterCategory || filterMinPrice || filterMaxPrice || filterStartDate || filterEndDate);
  const activeFilterCount = [filterCategory, (filterMinPrice || filterMaxPrice), (filterStartDate || filterEndDate)].filter(Boolean).length;

  const clearFilters = () => {
    setFilterCategory('');
    setFilterMinPrice('');
    setFilterMaxPrice('');
    setFilterStartDate('');
    setFilterEndDate('');
  };

  const filteredEvents = events.filter((event) => {
    const org = event.organizer || event.Organizer || '';
    return org.toLowerCase().includes(searchTerm.toLowerCase()) && matchesFilters(event);
  });

  const refreshAll = async () => {
    const refreshedEvents = await eventService.getAllEvents();
    setEvents(refreshedEvents);
    fetchRecommendations();
  };

  const handleReserve = (event) => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    setCardNumber('');
    setCardCvv('');
    setCardExpiry('');
    setReserveModalEvent(event);
  };

  const confirmReservation = async () => {
    const event = reserveModalEvent;
    const eventId = event.id || event.eventId;
    const title = event.title || event.name;
    const price = event.price ?? event.Price;
    const isFree = !price || price <= 0;

    if (!isFree && !isCardDetailsValid(cardNumber, cardCvv, cardExpiry)) {
      alert('Please enter a valid card number (12 or 16 digits), CVV (3 digits) and a non-expired MM/YY expiry.');
      return;
    }

    setBooking(true);
    try {
      await bookingService.guestCheckout({
        fullName: currentUser.name,
        email: currentUser.email,
        phone: '',
        eventId,
        quantity: 1,
        // Mock card details only — never a real charge. Only the last 4
        // digits are sent along (as a human-readable note for the
        // organiser); the CVV is never transmitted at all.
        cardNumber: isFree ? '' : cardNumber.slice(-4),
        cardName: '',
        cardExpiry: isFree ? '' : cardExpiry,
        paymentMethod: isFree ? null : buildCardPaymentSummary(cardNumber, cardExpiry),
      });

      await refreshAll();
      setReserveModalEvent(null);
      if (isFree) {
        alert(`Successfully reserved spot for: ${title}`);
      } else {
        alert(`Reservation submitted for: ${title}. Your payment is yet to be confirmed — the organiser will confirm it from their side, check My Bookings for status.`);
      }
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
                <Link to="/my-bookings" style={{ color: colors.wine, textDecoration: 'none', fontWeight: 600, fontSize: '13px' }}>My Bookings</Link>
                <Link to="/my-past-events" style={{ color: colors.wine, textDecoration: 'none', fontWeight: 600, fontSize: '13px' }}>Past Events</Link>
                <Link to="/rate-events" style={{ color: colors.wine, textDecoration: 'none', fontWeight: 600, fontSize: '13px' }}>Rate Events</Link>
                <Link to="/saved-events" style={{ color: colors.wine, textDecoration: 'none', fontWeight: 600, fontSize: '13px' }}>Saved Events</Link>
                <Link to="/profile" style={{ color: colors.wine, textDecoration: 'none', fontWeight: 600, fontSize: '13px' }}>Profile</Link>
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
          <>
          <div style={{ padding: '10px 0 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '20px' }}>
            <div>
              <h1 style={{ margin: '0 0 10px 0', fontFamily: fontDisplay, fontSize: '42px', color: colors.ink, fontWeight: 600 }}>
                Upcoming <span style={{ fontStyle: 'italic', color: colors.wine }}>Public Events</span>
              </h1>
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div style={{ width: '260px', maxWidth: '100%' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: colors.muted, marginBottom: '6px' }}>SEARCH BY SOCIETY / ORGANIZER</label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="e.g. Ushers, ACM, IEEE..."
                  style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: `1px solid ${colors.roseSoft}`, background: colors.card, outline: 'none', fontSize: '14px' }}
                />
              </div>
              <button
                onClick={() => setShowFilters((v) => !v)}
                style={{
                  padding: '12px 18px',
                  borderRadius: '12px',
                  border: `1.5px solid ${hasActiveFilters ? colors.wine : colors.roseSoft}`,
                  background: hasActiveFilters ? colors.wine : colors.card,
                  color: hasActiveFilters ? '#fff' : colors.ink,
                  fontWeight: 600,
                  fontSize: '14px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                🔍 Filters{hasActiveFilters ? ` (${activeFilterCount})` : ''}
              </button>
            </div>
          </div>

          {showFilters && (
            <div style={{ background: colors.card, border: `1px solid ${colors.roseSoft}`, borderRadius: '14px', padding: '20px', marginBottom: '16px', display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
              <div style={{ minWidth: '160px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: colors.muted, marginBottom: '6px' }}>CATEGORY</label>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: `1px solid ${colors.roseSoft}`, outline: 'none', fontFamily: fontBody }}
                >
                  <option value="">All categories</option>
                  {CATEGORY_OPTIONS.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div style={{ minWidth: '220px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: colors.muted, marginBottom: '6px' }}>PRICE RANGE (Rs.)</label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="number"
                    min="0"
                    value={filterMinPrice}
                    onChange={(e) => setFilterMinPrice(e.target.value)}
                    placeholder="Min"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: `1px solid ${colors.roseSoft}`, outline: 'none' }}
                  />
                  <span style={{ color: colors.muted }}>–</span>
                  <input
                    type="number"
                    min="0"
                    value={filterMaxPrice}
                    onChange={(e) => setFilterMaxPrice(e.target.value)}
                    placeholder="Max"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: `1px solid ${colors.roseSoft}`, outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ minWidth: '260px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: colors.muted, marginBottom: '6px' }}>DATE RANGE</label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="date"
                    value={filterStartDate}
                    onChange={(e) => setFilterStartDate(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: `1px solid ${colors.roseSoft}`, outline: 'none', fontFamily: fontBody }}
                  />
                  <span style={{ color: colors.muted }}>–</span>
                  <input
                    type="date"
                    value={filterEndDate}
                    onChange={(e) => setFilterEndDate(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: `1px solid ${colors.roseSoft}`, outline: 'none', fontFamily: fontBody }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <button
                  onClick={clearFilters}
                  disabled={!hasActiveFilters}
                  style={{ background: 'transparent', border: `1.5px solid ${colors.roseSoft}`, color: colors.muted, padding: '10px 16px', borderRadius: '10px', cursor: hasActiveFilters ? 'pointer' : 'not-allowed', fontWeight: 600, fontSize: '13px' }}
                >
                  Clear all
                </button>
              </div>
            </div>
          )}

          {hasActiveFilters && (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
              {filterCategory && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: colors.roseSoft, color: colors.wine, padding: '5px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600 }}>
                  {filterCategory}
                  <button onClick={() => setFilterCategory('')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: colors.wine, fontWeight: 700, padding: 0 }}>✕</button>
                </span>
              )}
              {(filterMinPrice || filterMaxPrice) && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: colors.roseSoft, color: colors.wine, padding: '5px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600 }}>
                  Rs. {filterMinPrice || '0'}–{filterMaxPrice || '∞'}
                  <button onClick={() => { setFilterMinPrice(''); setFilterMaxPrice(''); }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: colors.wine, fontWeight: 700, padding: 0 }}>✕</button>
                </span>
              )}
              {(filterStartDate || filterEndDate) && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: colors.roseSoft, color: colors.wine, padding: '5px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600 }}>
                  {filterStartDate || '…'} → {filterEndDate || '…'}
                  <button onClick={() => { setFilterStartDate(''); setFilterEndDate(''); }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: colors.wine, fontWeight: 700, padding: 0 }}>✕</button>
                </span>
              )}
              <button onClick={clearFilters} style={{ background: 'transparent', border: 'none', color: colors.muted, fontSize: '12px', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}>Clear all</button>
            </div>
          )}
          </>
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
                    currentUser={currentUser}
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
                <EventCard key={event.id || event.eventId} event={event} onRegister={handleReserve} currentUser={currentUser} />
              ))}
            </div>
          </>
        )}
      </div>

      {reserveModalEvent && (() => {
        const modalPrice = reserveModalEvent.price ?? reserveModalEvent.Price;
        const modalIsFree = !modalPrice || modalPrice <= 0;
        const canConfirm = modalIsFree || isCardDetailsValid(cardNumber, cardCvv, cardExpiry);
        return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(45,35,38,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ background: colors.card, borderRadius: '18px', padding: '30px', width: '100%', maxWidth: '400px', boxShadow: '0 20px 50px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 4px 0', fontFamily: fontDisplay, color: colors.wine, fontSize: '22px' }}>Confirm Reservation</h3>
            <p style={{ margin: '0 0 20px 0', color: colors.muted, fontSize: '14px' }}>
              {reserveModalEvent.title || reserveModalEvent.name}
            </p>

            {modalIsFree ? (
              <div style={{ background: colors.roseSoft, borderRadius: '10px', padding: '12px 14px', marginBottom: '20px' }}>
                <p style={{ margin: 0, fontSize: '13px', color: colors.ink }}>
                  🎉 This event is free — no payment needed. Click Confirm to reserve your spot.
                </p>
              </div>
            ) : (
              <>
                {(reserveModalEvent.paymentInstructions || reserveModalEvent.PaymentInstructions) && (
                  <div style={{ background: colors.roseSoft, borderRadius: '10px', padding: '12px 14px', marginBottom: '20px' }}>
                    <p style={{ margin: '0 0 4px 0', fontSize: '11px', fontWeight: 700, color: colors.wine, letterSpacing: '0.3px' }}>HOW TO PAY THE ORGANISER</p>
                    <p style={{ margin: 0, fontSize: '13px', color: colors.ink, whiteSpace: 'pre-wrap' }}>
                      {reserveModalEvent.paymentInstructions || reserveModalEvent.PaymentInstructions}
                    </p>
                  </div>
                )}

                <CardPaymentFields
                  cardNumber={cardNumber}
                  cvv={cardCvv}
                  expiry={cardExpiry}
                  onCardNumberChange={setCardNumber}
                  onCvvChange={setCardCvv}
                  onExpiryChange={setCardExpiry}
                />
                <p style={{ margin: '0 0 24px 0', fontSize: '12px', color: colors.muted }}>
                  This is a mock card entry — no bank account or wallet is ever charged or accessed. Your seat is confirmed once the organiser verifies your payment was actually received.
                </p>
              </>
            )}

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setReserveModalEvent(null)}
                disabled={booking}
                style={{ flex: 1, background: '#E5E7EB', color: colors.ink, border: 'none', padding: '12px', borderRadius: '10px', cursor: 'pointer', fontWeight: 600 }}
              >
                Cancel
              </button>
              <button
                onClick={confirmReservation}
                disabled={booking || !canConfirm}
                style={{ flex: 1, background: colors.wine, color: '#fff', border: 'none', padding: '12px', borderRadius: '10px', cursor: (booking || !canConfirm) ? 'not-allowed' : 'pointer', fontWeight: 600, opacity: (booking || !canConfirm) ? 0.6 : 1 }}
              >
                {booking ? 'Confirming...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
        );
      })()}
    </div>
  );
}

function CreateEventView() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [organizer, setOrganizer] = useState('');
  const [location, setLocation] = useState('');
  const [capacity, setCapacity] = useState('');
  const [unlimitedCapacity, setUnlimitedCapacity] = useState(false);
  const [price, setPrice] = useState('');
  const [paymentInstructions, setPaymentInstructions] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageError, setImageError] = useState('');
  const [category, setCategory] = useState('Conference');
  const [groups, setGroups] = useState([]);
  const [groupId, setGroupId] = useState('');
  const [startDateTime, setStartDateTime] = useState('');
  const [endDateTime, setEndDateTime] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    groupService.getMyGroups().then(setGroups).catch(() => {});
  }, []);

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageError('');
    setUploadingImage(true);
    try {
      const relativeUrl = await imageService.uploadImage(file);
      setImageUrl(relativeUrl);
    } catch (err) {
      console.error(err);
      setImageError('Failed to upload picture. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };

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
        capacity: unlimitedCapacity ? UNLIMITED_CAPACITY : (capacity ? parseInt(capacity, 10) : 100),
        price: price ? parseFloat(price) : 0,
        paymentInstructions: paymentInstructions.trim() || null,
        imageUrl: imageUrl || null,
        groupId: groupId ? parseInt(groupId, 10) : null,
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
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: colors.ink, marginBottom: '6px' }}>Restrict to Group (optional)</label>
            <select
              value={groupId}
              onChange={(e) => setGroupId(e.target.value)}
              style={{ width: '100%', padding: '12px', borderRadius: '10px', border: `1px solid ${colors.roseSoft}`, outline: 'none', fontFamily: fontBody }}
            >
              <option value="">Public — anyone can see and book</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: colors.ink, marginBottom: '6px' }}>Capacity</label>
            <input
              type="number"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              placeholder="e.g. 150"
              disabled={unlimitedCapacity}
              style={{ width: '100%', padding: '12px', borderRadius: '10px', border: `1px solid ${colors.roseSoft}`, outline: 'none', background: unlimitedCapacity ? '#F3F3F3' : '#fff', marginBottom: '8px' }}
            />
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: colors.muted, cursor: 'pointer' }}>
              <input type="checkbox" checked={unlimitedCapacity} onChange={(e) => setUnlimitedCapacity(e.target.checked)} />
              Unlimited (e.g. an open ground with no fixed seating)
            </label>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: colors.ink, marginBottom: '6px' }}>Price</label>
            <input type="number" step="0.01" min="0" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="e.g. 500 (leave blank for free)" style={{ width: '100%', padding: '12px', borderRadius: '10px', border: `1px solid ${colors.roseSoft}`, outline: 'none' }} />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: colors.ink, marginBottom: '6px' }}>Payment Instructions (only shown if the event isn't free)</label>
            <textarea
              value={paymentInstructions}
              onChange={(e) => setPaymentInstructions(e.target.value)}
              placeholder="e.g. Send to JazzCash 03XX-XXXXXXX (Ali Khan), or pay cash at the front desk before entry"
              rows={2}
              style={{ width: '100%', padding: '12px', borderRadius: '10px', border: `1px solid ${colors.roseSoft}`, outline: 'none', fontFamily: fontBody }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: colors.ink, marginBottom: '6px' }}>Event Picture</label>
            {imageUrl && (
              <img src={imageService.resolveImageUrl(imageUrl)} alt="Event preview" style={{ width: '100%', maxHeight: '160px', objectFit: 'cover', borderRadius: '10px', marginBottom: '8px' }} />
            )}
            <input type="file" accept="image/*" onChange={handleImageChange} disabled={uploadingImage} style={{ width: '100%' }} />
            {uploadingImage && <p style={{ margin: '6px 0 0 0', fontSize: '12px', color: colors.muted }}>Uploading...</p>}
            {imageError && <p style={{ margin: '6px 0 0 0', fontSize: '12px', color: '#b3261e' }}>{imageError}</p>}
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

function ProfileView({ currentUser, setCurrentUser }) {
  const [name, setName] = useState(currentUser?.name || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  if (!currentUser) {
    return (
      <div style={{ fontFamily: fontBody, background: colors.bg, minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
        <GlobalStyle />
        <div style={{ background: colors.card, padding: '40px', borderRadius: '20px', textAlign: 'center', border: `1px solid ${colors.roseSoft}` }}>
          <p style={{ color: colors.muted, marginBottom: '16px' }}>Please log in to view your profile.</p>
          <Link to="/login" style={{ color: colors.wine, fontWeight: 600, textDecoration: 'none' }}>Log In</Link>
        </div>
      </div>
    );
  }

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const updated = await authService.updateProfile(name.trim(), phone.trim() || null);
      setCurrentUser(updated);
      setMessage('Personal information updated.');
    } catch (err) {
      setError(err.response?.data || 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ fontFamily: fontBody, background: colors.bg, minHeight: '100vh', padding: '40px 24px' }}>
      <GlobalStyle />
      <div style={{ maxWidth: '480px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontFamily: fontDisplay, color: colors.wine, margin: 0, fontSize: '26px' }}>Personal Information</h2>
          <Link to="/events" style={{ color: colors.muted, textDecoration: 'none', fontSize: '14px', fontWeight: 600 }}>← Back</Link>
        </div>
        <div style={{ background: colors.card, padding: '30px', borderRadius: '18px', border: `1px solid ${colors.roseSoft}` }}>
          {message && <div style={{ background: '#DCFCE7', color: '#166534', padding: '12px', borderRadius: '8px', fontSize: '13px', marginBottom: '18px' }}>{message}</div>}
          {error && <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '12px', borderRadius: '8px', fontSize: '13px', marginBottom: '18px' }}>{typeof error === 'string' ? error : 'Failed to update profile.'}</div>}
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: colors.ink, marginBottom: '6px' }}>Email</label>
              <input type="email" value={currentUser.email || ''} disabled style={{ width: '100%', padding: '12px', borderRadius: '10px', border: `1px solid ${colors.roseSoft}`, outline: 'none', background: '#F3F3F3', color: colors.muted }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: colors.ink, marginBottom: '6px' }}>Full Name *</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} required style={{ width: '100%', padding: '12px', borderRadius: '10px', border: `1px solid ${colors.roseSoft}`, outline: 'none' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: colors.ink, marginBottom: '6px' }}>Phone</label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g. 03XX-XXXXXXX" style={{ width: '100%', padding: '12px', borderRadius: '10px', border: `1px solid ${colors.roseSoft}`, outline: 'none' }} />
            </div>
            <button type="submit" disabled={saving} style={{ background: colors.wine, color: '#fff', border: 'none', padding: '14px', borderRadius: '10px', fontWeight: 600, cursor: 'pointer', marginTop: '6px' }}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function SavedEventsView({ currentUser }) {
  const [savedEvents, setSavedEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [reserveModalEvent, setReserveModalEvent] = useState(null);
  const [cardNumber, setCardNumber] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');

  const fetchSaved = () => {
    savedEventsService.getMine()
      .then((data) => { setSavedEvents(data); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    if (currentUser) fetchSaved();
    else setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  const handleUnsaved = (eventId, isSaved) => {
    if (!isSaved) {
      setSavedEvents((prev) => prev.filter((e) => (e.id || e.eventId) !== eventId));
    }
  };

  const handleReserve = (event) => {
    setCardNumber('');
    setCardCvv('');
    setCardExpiry('');
    setReserveModalEvent(event);
  };

  const confirmReservation = async () => {
    const event = reserveModalEvent;
    const eventId = event.id || event.eventId;
    const title = event.title || event.name;
    const price = event.price ?? event.Price;
    const isFree = !price || price <= 0;

    if (!isFree && !isCardDetailsValid(cardNumber, cardCvv, cardExpiry)) {
      alert('Please enter a valid card number (12 or 16 digits), CVV (3 digits) and a non-expired MM/YY expiry.');
      return;
    }

    setBooking(true);
    try {
      await bookingService.guestCheckout({
        fullName: currentUser.name,
        email: currentUser.email,
        phone: '',
        eventId,
        quantity: 1,
        cardNumber: isFree ? '' : cardNumber.slice(-4),
        cardName: '',
        cardExpiry: isFree ? '' : cardExpiry,
        paymentMethod: isFree ? null : buildCardPaymentSummary(cardNumber, cardExpiry),
      });

      setReserveModalEvent(null);
      if (isFree) {
        alert(`Successfully reserved spot for: ${title}`);
      } else {
        alert(`Reservation submitted for: ${title}. Your payment is yet to be confirmed — the organiser will confirm it from their side, check My Bookings for status.`);
      }
    } catch (err) {
      const msg = err.response?.data || 'Failed to reserve spot. Please try again.';
      alert(typeof msg === 'string' ? msg : 'Failed to reserve spot. Please try again.');
    } finally {
      setBooking(false);
    }
  };

  if (!currentUser) {
    return (
      <div style={{ fontFamily: fontBody, background: colors.bg, minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
        <GlobalStyle />
        <div style={{ background: colors.card, padding: '40px', borderRadius: '20px', textAlign: 'center', border: `1px solid ${colors.roseSoft}` }}>
          <p style={{ color: colors.muted, marginBottom: '16px' }}>Please log in to view saved events.</p>
          <Link to="/login" style={{ color: colors.wine, fontWeight: 600, textDecoration: 'none' }}>Log In</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: fontBody, background: colors.bg, minHeight: '100vh', padding: '40px 24px' }}>
      <GlobalStyle />
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontFamily: fontDisplay, color: colors.wine, margin: 0, fontSize: '28px' }}>🔖 Saved Events</h2>
          <Link to="/events" style={{ color: colors.muted, textDecoration: 'none', fontSize: '14px', fontWeight: 600 }}>← Back</Link>
        </div>
        {loading && <p style={{ color: colors.muted }}>Loading...</p>}
        {!loading && savedEvents.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', background: colors.card, borderRadius: '16px', border: `1px solid ${colors.roseSoft}` }}>
            <p style={{ color: colors.muted, fontSize: '15px', margin: 0 }}>You haven't saved any events yet. Tap the bookmark icon on an event to save it here.</p>
          </div>
        )}
        <div style={{ display: 'grid', gap: '26px', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
          {savedEvents.map((event) => (
            <EventCard
              key={event.id || event.eventId}
              event={event}
              currentUser={currentUser}
              onRegister={handleReserve}
              onSavedChange={handleUnsaved}
            />
          ))}
        </div>
      </div>

      {reserveModalEvent && (() => {
        const modalPrice = reserveModalEvent.price ?? reserveModalEvent.Price;
        const modalIsFree = !modalPrice || modalPrice <= 0;
        const canConfirm = modalIsFree || isCardDetailsValid(cardNumber, cardCvv, cardExpiry);
        return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(45,35,38,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ background: colors.card, borderRadius: '18px', padding: '30px', width: '100%', maxWidth: '400px', boxShadow: '0 20px 50px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 4px 0', fontFamily: fontDisplay, color: colors.wine, fontSize: '22px' }}>Confirm Reservation</h3>
            <p style={{ margin: '0 0 20px 0', color: colors.muted, fontSize: '14px' }}>
              {reserveModalEvent.title || reserveModalEvent.name}
            </p>

            {modalIsFree ? (
              <div style={{ background: colors.roseSoft, borderRadius: '10px', padding: '12px 14px', marginBottom: '20px' }}>
                <p style={{ margin: 0, fontSize: '13px', color: colors.ink }}>
                  🎉 This event is free — no payment needed. Click Confirm to reserve your spot.
                </p>
              </div>
            ) : (
              <>
                {(reserveModalEvent.paymentInstructions || reserveModalEvent.PaymentInstructions) && (
                  <div style={{ background: colors.roseSoft, borderRadius: '10px', padding: '12px 14px', marginBottom: '20px' }}>
                    <p style={{ margin: '0 0 4px 0', fontSize: '11px', fontWeight: 700, color: colors.wine, letterSpacing: '0.3px' }}>HOW TO PAY THE ORGANISER</p>
                    <p style={{ margin: 0, fontSize: '13px', color: colors.ink, whiteSpace: 'pre-wrap' }}>
                      {reserveModalEvent.paymentInstructions || reserveModalEvent.PaymentInstructions}
                    </p>
                  </div>
                )}

                <CardPaymentFields
                  cardNumber={cardNumber}
                  cvv={cardCvv}
                  expiry={cardExpiry}
                  onCardNumberChange={setCardNumber}
                  onCvvChange={setCardCvv}
                  onExpiryChange={setCardExpiry}
                />
                <p style={{ margin: '0 0 24px 0', fontSize: '12px', color: colors.muted }}>
                  This is a mock card entry — no bank account or wallet is ever charged or accessed. Your seat is confirmed once the organiser verifies your payment was actually received.
                </p>
              </>
            )}

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setReserveModalEvent(null)}
                disabled={booking}
                style={{ flex: 1, background: '#E5E7EB', color: colors.ink, border: 'none', padding: '12px', borderRadius: '10px', cursor: 'pointer', fontWeight: 600 }}
              >
                Cancel
              </button>
              <button
                onClick={confirmReservation}
                disabled={booking || !canConfirm}
                style={{ flex: 1, background: colors.wine, color: '#fff', border: 'none', padding: '12px', borderRadius: '10px', cursor: (booking || !canConfirm) ? 'not-allowed' : 'pointer', fontWeight: 600, opacity: (booking || !canConfirm) ? 0.6 : 1 }}
              >
                {booking ? 'Confirming...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
        );
      })()}
    </div>
  );
}

function AdminPanel({ currentUser, setCurrentUser }) {
  const [events, setEvents] = useState([]);
  const [pastOrganizedEvents, setPastOrganizedEvents] = useState([]);
  const [pendingPayments, setPendingPayments] = useState([]);
  const [confirmingId, setConfirmingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [editingEvent, setEditingEvent] = useState(null);
  const [panelTab, setPanelTab] = useState('upcoming'); // 'upcoming' | 'past' | 'payments' | 'groups'
  const [editGroups, setEditGroups] = useState([]);
  const [uploadingEditImage, setUploadingEditImage] = useState(false);
  const [editImageError, setEditImageError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser) {
      groupService.getMyGroups().then(setEditGroups).catch(() => {});
    }
  }, [currentUser]);

  const fetchEvents = () => {
    eventService.getAllEvents()
      .then((data) => { setEvents(data); setLoading(false); })
      .catch(() => setLoading(false));
  };

  const fetchPastOrganizedEvents = () => {
    eventService.getAllEvents(true) // includeExpired — backend already returns only ended events for this flag
      .then((data) => {
        const myId = currentUser?.userId;
        setPastOrganizedEvents(data.filter((e) => (e.organizerId ?? e.OrganizerId) === myId));
      })
      .catch(() => {});
  };

  const fetchPendingPayments = () => {
    bookingService.getPendingPayments()
      .then(setPendingPayments)
      .catch(() => {});
  };

  useEffect(() => {
    if (currentUser) {
      fetchEvents();
      fetchPastOrganizedEvents();
      fetchPendingPayments();
    }
  }, [currentUser]);

  const handleConfirmPayment = async (bookingId) => {
    setConfirmingId(bookingId);
    try {
      await bookingService.confirmPayment(bookingId);
      fetchPendingPayments();
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data || 'Failed to confirm payment.';
      alert(typeof msg === 'string' ? msg : 'Failed to confirm payment.');
    } finally {
      setConfirmingId(null);
    }
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    try {
      const user = await authService.login(email, password);
      const roles = user.roles || [];
      if (!roles.includes('Admin') && !roles.includes('Organizer')) {
        authService.logout();
        setLoginError('Access Denied. Invalid credentials or insufficient permissions.');
        return;
      }
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
      fetchPastOrganizedEvents();
    } catch (err) {
      alert('Failed to delete event: ' + err.message);
    }
  };

  const handleEditImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setEditImageError('');
    setUploadingEditImage(true);
    try {
      const relativeUrl = await imageService.uploadImage(file);
      setEditingEvent((prev) => (prev ? { ...prev, imageUrl: relativeUrl } : prev));
    } catch (err) {
      console.error(err);
      setEditImageError('Failed to upload picture. Please try again.');
    } finally {
      setUploadingEditImage(false);
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
      capacity: (event.capacity || 100) >= UNLIMITED_CAPACITY ? '' : (event.capacity || 100),
      unlimitedCapacity: (event.capacity || 0) >= UNLIMITED_CAPACITY,
      price: event.price ?? event.Price ?? 0,
      paymentInstructions: event.paymentInstructions ?? event.PaymentInstructions ?? '',
      groupId: event.groupId ?? event.GroupId ?? '',
      category: event.category || event.Category || 'Other',
      imageUrl: event.imageUrl ?? event.ImageUrl ?? '',
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
        capacity: editingEvent.unlimitedCapacity ? UNLIMITED_CAPACITY : (editingEvent.capacity ? parseInt(editingEvent.capacity, 10) : 100),
        price: editingEvent.price ? parseFloat(editingEvent.price) : 0,
        paymentInstructions: (editingEvent.paymentInstructions || '').trim() || null,
        imageUrl: editingEvent.imageUrl || null,
        groupId: editingEvent.groupId ? parseInt(editingEvent.groupId, 10) : null,
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
      fetchPastOrganizedEvents();
    } catch (err) {
      alert('Failed to update event: ' + err.message);
    }
  };

  const isHostUser = !!currentUser && (currentUser.roles || []).some((r) => r === 'Admin' || r === 'Organizer');

  if (!isHostUser) {
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
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: colors.ink, marginBottom: '6px' }}>Restrict to Group (optional)</label>
                <select
                  value={editingEvent.groupId || ''}
                  onChange={(e) => setEditingEvent({ ...editingEvent, groupId: e.target.value })}
                  style={{ width: '100%', padding: '12px', borderRadius: '10px', border: `1px solid ${colors.roseSoft}`, outline: 'none', fontFamily: fontBody }}
                >
                  <option value="">Public — anyone can see and book</option>
                  {editGroups.map((g) => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: colors.ink, marginBottom: '6px' }}>Capacity</label>
                <input
                  type="number"
                  value={editingEvent.capacity}
                  onChange={(e) => setEditingEvent({ ...editingEvent, capacity: e.target.value })}
                  placeholder="Capacity"
                  disabled={editingEvent.unlimitedCapacity}
                  style={{ width: '100%', padding: '12px', borderRadius: '10px', border: `1px solid ${colors.roseSoft}`, outline: 'none', background: editingEvent.unlimitedCapacity ? '#F3F3F3' : '#fff', marginBottom: '8px' }}
                />
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: colors.muted, cursor: 'pointer' }}>
                  <input type="checkbox" checked={!!editingEvent.unlimitedCapacity} onChange={(e) => setEditingEvent({ ...editingEvent, unlimitedCapacity: e.target.checked })} />
                  Unlimited (e.g. an open ground with no fixed seating)
                </label>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: colors.ink, marginBottom: '6px' }}>Price</label>
                <input type="number" step="0.01" min="0" value={editingEvent.price} onChange={(e) => setEditingEvent({ ...editingEvent, price: e.target.value })} placeholder="e.g. 500 (leave blank for free)" style={{ width: '100%', padding: '12px', borderRadius: '10px', border: `1px solid ${colors.roseSoft}`, outline: 'none' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: colors.ink, marginBottom: '6px' }}>Payment Instructions</label>
                <textarea
                  value={editingEvent.paymentInstructions || ''}
                  onChange={(e) => setEditingEvent({ ...editingEvent, paymentInstructions: e.target.value })}
                  placeholder="e.g. Send to JazzCash 03XX-XXXXXXX (Ali Khan), or pay cash at the front desk before entry"
                  rows={2}
                  style={{ width: '100%', padding: '12px', borderRadius: '10px', border: `1px solid ${colors.roseSoft}`, outline: 'none', fontFamily: fontBody }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: colors.ink, marginBottom: '6px' }}>Event Picture</label>
                {editingEvent.imageUrl && (
                  <img src={imageService.resolveImageUrl(editingEvent.imageUrl)} alt="Event preview" style={{ width: '100%', maxHeight: '160px', objectFit: 'cover', borderRadius: '10px', marginBottom: '8px' }} />
                )}
                <input type="file" accept="image/*" onChange={handleEditImageChange} disabled={uploadingEditImage} style={{ width: '100%' }} />
                {uploadingEditImage && <p style={{ margin: '6px 0 0 0', fontSize: '12px', color: colors.muted }}>Uploading...</p>}
                {editImageError && <p style={{ margin: '6px 0 0 0', fontSize: '12px', color: '#b3261e' }}>{editImageError}</p>}
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
            <h3 style={{ margin: 0, fontFamily: fontDisplay, fontSize: '20px', color: colors.ink }}>Manage Events Database</h3>
            <button
              onClick={() => navigate('/create-event')}
              style={{ background: colors.wine, color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '14px' }}
            >
              + Add Event
            </button>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', flexWrap: 'wrap' }}>
            {[
              { key: 'upcoming', label: 'Upcoming Events' },
              { key: 'past', label: 'Past Events' },
              { key: 'payments', label: `Pending Payments${pendingPayments.length ? ` (${pendingPayments.length})` : ''}` },
              { key: 'groups', label: 'Groups' },
              ...((currentUser.roles || []).includes('Organizer') ? [{ key: 'aboutus', label: 'About Us' }] : []),
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => {
                  setPanelTab(t.key);
                  if (t.key === 'payments') fetchPendingPayments();
                  else if (t.key === 'past') fetchPastOrganizedEvents();
                  else if (t.key === 'upcoming') fetchEvents();
                }}
                style={{
                  padding: '9px 18px',
                  borderRadius: '8px',
                  border: 'none',
                  background: panelTab === t.key ? colors.wine : '#F3EDEF',
                  color: panelTab === t.key ? '#fff' : colors.ink,
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {panelTab === 'upcoming' && (
            <>
              {loading && <p style={{ color: colors.muted }}>Loading...</p>}
              {!loading && events.length === 0 && <EmptyPanelState text="No upcoming events yet." />}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {events.map((event) => (
                  <ManagedEventRow key={event.id || event.eventId} event={event} groups={editGroups} onEdit={handleStartEditing} onDelete={handleDelete} />
                ))}
              </div>
            </>
          )}

          {panelTab === 'past' && (
            <>
              {pastOrganizedEvents.length === 0 && <EmptyPanelState text="No past events you've organized yet." />}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {pastOrganizedEvents.map((event) => (
                  <ManagedEventRow key={event.id || event.eventId} event={event} groups={editGroups} onEdit={handleStartEditing} onDelete={handleDelete} />
                ))}
              </div>
            </>
          )}

          {panelTab === 'payments' && (
            <>
              {pendingPayments.length === 0 && <EmptyPanelState text="No bookings are waiting on payment confirmation." />}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {pendingPayments.map((p) => (
                  <div key={p.bookingId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', padding: '16px 20px', border: `1px solid ${colors.roseSoft}`, borderRadius: '10px', background: colors.bg }}>
                    <div>
                      <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', color: colors.ink, fontFamily: fontDisplay }}>{p.eventTitle}</h4>
                      <p style={{ margin: '0 0 2px 0', fontSize: '13px', color: colors.muted }}>
                        {p.attendeeName} ({p.attendeeEmail}) · Qty: {p.quantity} · Rs. {Number(p.totalAmount).toLocaleString()}
                      </p>
                      <p style={{ margin: 0, fontSize: '13px', color: colors.ink, fontWeight: 600 }}>
                        Declared payment method: {p.declaredPaymentMethod || 'not recorded'}
                      </p>
                    </div>
                    <button
                      onClick={() => handleConfirmPayment(p.bookingId)}
                      disabled={confirmingId === p.bookingId}
                      style={{ background: colors.wine, color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '8px', cursor: confirmingId === p.bookingId ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: '13px', opacity: confirmingId === p.bookingId ? 0.6 : 1 }}
                    >
                      {confirmingId === p.bookingId ? 'Confirming...' : 'Confirm Payment Received'}
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}

          {panelTab === 'groups' && <GroupsPanel />}

          {panelTab === 'aboutus' && <OrganizerAboutUsPanel currentUser={currentUser} />}
        </div>
      </div>
    </div>
  );
}

function EmptyPanelState({ text }) {
  return (
    <div style={{ textAlign: 'center', padding: '30px', background: colors.bg, borderRadius: '10px', border: `1px solid ${colors.roseSoft}` }}>
      <p style={{ color: colors.muted, fontSize: '14px', margin: 0 }}>{text}</p>
    </div>
  );
}

function ManagedEventRow({ event, groups, onEdit, onDelete }) {
  const eventId = event.id || event.eventId;
  const org = event.organizer || event.Organizer;
  const groupId = event.groupId ?? event.GroupId;
  const group = groupId ? (groups || []).find((g) => g.id === groupId) : null;
  const imageUrl = imageService.resolveImageUrl(event.imageUrl || event.ImageUrl);
  const startDateTime = event.startDateTime || event.StartDateTime;
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', border: `1px solid ${colors.roseSoft}`, borderRadius: '10px', background: colors.bg, gap: '16px' }}>
      <div style={{ display: 'flex', gap: '14px', alignItems: 'center', minWidth: 0 }}>
        {imageUrl && (
          <img src={imageUrl} alt={event.title || event.name} style={{ width: '56px', height: '56px', objectFit: 'cover', borderRadius: '8px', flexShrink: 0 }} />
        )}
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '4px', flexWrap: 'wrap' }}>
            <h4 style={{ margin: 0, fontSize: '16px', color: colors.ink, fontFamily: fontDisplay }}>{event.title || event.name}</h4>
            {org && <span style={{ fontSize: '11px', background: colors.roseSoft, color: colors.wine, padding: '2px 8px', borderRadius: '10px', fontWeight: 600 }}>{org}</span>}
            {groupId && (
              <span style={{ fontSize: '11px', background: colors.teal, color: '#fff', padding: '2px 8px', borderRadius: '10px', fontWeight: 600 }}>
                🔒 {group ? group.name : 'Restricted'}
              </span>
            )}
            <EventRatingBadge eventId={eventId} />
          </div>
          <p style={{ margin: '0 0 2px 0', fontSize: '12px', color: colors.muted, fontWeight: 600 }}>🕒 {formatEventDateTime(startDateTime)}</p>
          <p style={{ margin: 0, fontSize: '13px', color: colors.muted }}>{event.description}</p>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '10px', flexShrink: 0 }}>
        <button onClick={() => onEdit(event)} style={{ background: colors.teal, color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>Edit</button>
        <button onClick={() => onDelete(eventId)} style={{ background: '#b3261e', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>Delete</button>
      </div>
    </div>
  );
}

function OrganizerAboutUsPanel({ currentUser }) {
  const [aboutUs, setAboutUs] = useState('');
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingBio, setSavingBio] = useState(false);
  const [bioMessage, setBioMessage] = useState('');
  const [memberForm, setMemberForm] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [savingMember, setSavingMember] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const organizerId = currentUser.userId;

  const fetchProfile = () => {
    organizerProfileService.getProfile(organizerId)
      .then((data) => {
        setAboutUs(data.aboutUs || '');
        setTeamMembers((data.teamMembers || []).slice().sort((a, b) => a.displayOrder - b.displayOrder));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchProfile(); }, []);

  const handleSaveBio = async (e) => {
    e.preventDefault();
    setSavingBio(true);
    setBioMessage('');
    try {
      await organizerProfileService.updateAboutUs(aboutUs.trim() || null);
      setBioMessage('Bio saved.');
    } catch (err) {
      setBioMessage('Failed to save bio. Please try again.');
    } finally {
      setSavingBio(false);
    }
  };

  const openAddMember = () => setMemberForm({ name: '', title: '', photoUrl: '' });
  const openEditMember = (m) => setMemberForm({ id: m.id, name: m.name, title: m.title, photoUrl: m.photoUrl || '' });
  const closeMemberForm = () => setMemberForm(null);

  const handleMemberPhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const url = await imageService.uploadImage(file);
      setMemberForm((prev) => (prev ? { ...prev, photoUrl: url } : prev));
    } catch (err) {
      alert('Failed to upload photo. Please try again.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSaveMember = async (e) => {
    e.preventDefault();
    setSavingMember(true);
    try {
      const existing = memberForm.id ? teamMembers.find((m) => m.id === memberForm.id) : null;
      const payload = {
        name: memberForm.name.trim(),
        title: memberForm.title.trim(),
        photoUrl: memberForm.photoUrl || null,
        displayOrder: existing ? existing.displayOrder : teamMembers.length,
      };
      if (memberForm.id) {
        await organizerProfileService.updateTeamMember(memberForm.id, payload);
      } else {
        await organizerProfileService.addTeamMember(payload);
      }
      closeMemberForm();
      fetchProfile();
    } catch (err) {
      alert('Failed to save team member. Please try again.');
    } finally {
      setSavingMember(false);
    }
  };

  const handleDeleteMember = async (id) => {
    if (!window.confirm('Remove this team member?')) return;
    setDeletingId(id);
    try {
      await organizerProfileService.deleteTeamMember(id);
      fetchProfile();
    } catch (err) {
      alert('Failed to delete team member. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const moveMember = async (index, direction) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= teamMembers.length) return;
    const reordered = [...teamMembers];
    [reordered[index], reordered[newIndex]] = [reordered[newIndex], reordered[index]];
    setTeamMembers(reordered);
    try {
      await Promise.all(reordered.map((m, i) =>
        organizerProfileService.updateTeamMember(m.id, { name: m.name, title: m.title, photoUrl: m.photoUrl || null, displayOrder: i })
      ));
      fetchProfile();
    } catch (err) {
      fetchProfile();
    }
  };

  if (loading) return <p style={{ color: colors.muted }}>Loading...</p>;

  return (
    <div>
      <h3 style={{ margin: '0 0 14px 0', fontFamily: fontDisplay, color: colors.wine, fontSize: '18px' }}>Public Bio</h3>
      <form onSubmit={handleSaveBio} style={{ marginBottom: '30px' }}>
        <textarea
          value={aboutUs}
          onChange={(e) => setAboutUs(e.target.value)}
          rows={4}
          placeholder="Tell attendees about your organization..."
          style={{ width: '100%', padding: '12px', borderRadius: '10px', border: `1px solid ${colors.roseSoft}`, outline: 'none', fontFamily: fontBody, marginBottom: '10px' }}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button type="submit" disabled={savingBio} style={{ background: colors.wine, color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>
            {savingBio ? 'Saving...' : 'Save Bio'}
          </button>
          {bioMessage && <span style={{ fontSize: '13px', color: colors.muted }}>{bioMessage}</span>}
        </div>
      </form>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ margin: 0, fontFamily: fontDisplay, color: colors.wine, fontSize: '18px' }}>Leadership Team</h3>
        <button onClick={openAddMember} style={{ background: colors.teal, color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '13px' }}>+ Add Member</button>
      </div>

      {teamMembers.length === 0 && <EmptyPanelState text="No team members added yet." />}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {teamMembers.map((m, i) => (
          <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 18px', border: `1px solid ${colors.roseSoft}`, borderRadius: '10px', background: colors.bg, flexWrap: 'wrap' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0, background: colors.roseSoft, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {m.photoUrl ? (
                <img src={imageService.resolveImageUrl(m.photoUrl)} alt={m.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span>👤</span>
              )}
            </div>
            <div style={{ flex: 1, minWidth: '120px' }}>
              <p style={{ margin: '0 0 2px 0', fontWeight: 700, color: colors.ink, fontSize: '14px' }}>{m.name}</p>
              <p style={{ margin: 0, fontSize: '12px', color: colors.muted }}>{m.title}</p>
            </div>
            <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
              <button onClick={() => moveMember(i, -1)} disabled={i === 0} style={{ background: '#F3EDEF', color: colors.ink, border: 'none', width: '30px', height: '30px', borderRadius: '6px', cursor: i === 0 ? 'not-allowed' : 'pointer', opacity: i === 0 ? 0.5 : 1 }}>↑</button>
              <button onClick={() => moveMember(i, 1)} disabled={i === teamMembers.length - 1} style={{ background: '#F3EDEF', color: colors.ink, border: 'none', width: '30px', height: '30px', borderRadius: '6px', cursor: i === teamMembers.length - 1 ? 'not-allowed' : 'pointer', opacity: i === teamMembers.length - 1 ? 0.5 : 1 }}>↓</button>
              <button onClick={() => openEditMember(m)} style={{ background: colors.teal, color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>Edit</button>
              <button onClick={() => handleDeleteMember(m.id)} disabled={deletingId === m.id} style={{ background: '#b3261e', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>Delete</button>
            </div>
          </div>
        ))}
      </div>

      {memberForm && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(45,35,38,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ background: colors.card, borderRadius: '18px', padding: '30px', width: '100%', maxWidth: '400px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontFamily: fontDisplay, color: colors.wine }}>{memberForm.id ? 'Edit' : 'Add'} Team Member</h3>
            <form onSubmit={handleSaveMember} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <input
                type="text"
                placeholder="Name"
                required
                value={memberForm.name}
                onChange={(e) => setMemberForm({ ...memberForm, name: e.target.value })}
                style={{ width: '100%', padding: '12px', borderRadius: '10px', border: `1px solid ${colors.roseSoft}`, outline: 'none' }}
              />
              <input
                type="text"
                placeholder="Title (e.g. President)"
                required
                value={memberForm.title}
                onChange={(e) => setMemberForm({ ...memberForm, title: e.target.value })}
                style={{ width: '100%', padding: '12px', borderRadius: '10px', border: `1px solid ${colors.roseSoft}`, outline: 'none' }}
              />
              <div>
                {memberForm.photoUrl && (
                  <img src={imageService.resolveImageUrl(memberForm.photoUrl)} alt="" style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', marginBottom: '8px', display: 'block' }} />
                )}
                <input type="file" accept="image/*" onChange={handleMemberPhotoChange} disabled={uploadingPhoto} />
                {uploadingPhoto && <p style={{ margin: '6px 0 0 0', fontSize: '12px', color: colors.muted }}>Uploading...</p>}
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" onClick={closeMemberForm} style={{ flex: 1, background: '#E5E7EB', color: colors.ink, border: 'none', padding: '12px', borderRadius: '10px', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
                <button type="submit" disabled={savingMember || uploadingPhoto} style={{ flex: 1, background: colors.wine, color: '#fff', border: 'none', padding: '12px', borderRadius: '10px', cursor: 'pointer', fontWeight: 600 }}>
                  {savingMember ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function GroupsPanel() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newGroupName, setNewGroupName] = useState('');
  const [creating, setCreating] = useState(false);
  const [openGroupId, setOpenGroupId] = useState(null);
  const [editingGroupId, setEditingGroupId] = useState(null);
  const [editName, setEditName] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingGroupId, setDeletingGroupId] = useState(null);

  const fetchGroups = () => {
    groupService.getMyGroups()
      .then((data) => { setGroups(data); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchGroups(); }, []);

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    setCreating(true);
    try {
      await groupService.createGroup(newGroupName.trim());
      setNewGroupName('');
      fetchGroups();
    } catch (err) {
      const msg = err.response?.data || 'Failed to create group.';
      alert(typeof msg === 'string' ? msg : 'Failed to create group.');
    } finally {
      setCreating(false);
    }
  };

  const startEditing = (g) => {
    setEditingGroupId(g.id);
    setEditName(g.name);
    setOpenGroupId(null);
  };

  const cancelEditing = () => {
    setEditingGroupId(null);
    setEditName('');
  };

  const handleSaveEdit = async (groupId) => {
    if (!editName.trim()) return;
    setSavingEdit(true);
    try {
      await groupService.updateGroup(groupId, editName.trim());
      setEditingGroupId(null);
      setEditName('');
      fetchGroups();
    } catch (err) {
      const msg = err.response?.data || 'Failed to rename group.';
      alert(typeof msg === 'string' ? msg : 'Failed to rename group.');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteGroup = async (g) => {
    if (!window.confirm(`Delete the group "${g.name}"? Any events restricted to it will become public again.`)) return;
    setDeletingGroupId(g.id);
    try {
      await groupService.deleteGroup(g.id);
      fetchGroups();
    } catch (err) {
      const msg = err.response?.data || 'Failed to delete group.';
      alert(typeof msg === 'string' ? msg : 'Failed to delete group.');
    } finally {
      setDeletingGroupId(null);
    }
  };

  return (
    <div>
      <form onSubmit={handleCreateGroup} style={{ display: 'flex', gap: '10px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <input
          type="text"
          value={newGroupName}
          onChange={(e) => setNewGroupName(e.target.value)}
          placeholder="New group name, e.g. ACM Committee"
          style={{ flex: 1, minWidth: '220px', padding: '10px 14px', borderRadius: '8px', border: `1px solid ${colors.roseSoft}`, outline: 'none' }}
        />
        <button
          type="submit"
          disabled={creating || !newGroupName.trim()}
          style={{ background: colors.wine, color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '8px', cursor: (creating || !newGroupName.trim()) ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: '13px', opacity: (creating || !newGroupName.trim()) ? 0.6 : 1 }}
        >
          {creating ? 'Creating...' : '+ Add a Group'}
        </button>
      </form>

      {loading && <p style={{ color: colors.muted }}>Loading groups...</p>}
      {!loading && groups.length === 0 && (
        <EmptyPanelState text="No groups yet — create one above to restrict an event to a specific audience." />
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {groups.map((g) => (
          <div key={g.id} style={{ padding: '16px 20px', border: `1px solid ${colors.roseSoft}`, borderRadius: '10px', background: colors.bg }}>
            {editingGroupId === g.id ? (
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  autoFocus
                  style={{ flex: 1, minWidth: '180px', padding: '8px 12px', borderRadius: '8px', border: `1px solid ${colors.roseSoft}`, outline: 'none', fontSize: '14px' }}
                />
                <button
                  onClick={() => handleSaveEdit(g.id)}
                  disabled={savingEdit || !editName.trim()}
                  style={{ background: colors.wine, color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '6px', cursor: (savingEdit || !editName.trim()) ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: 600, opacity: (savingEdit || !editName.trim()) ? 0.6 : 1 }}
                >
                  {savingEdit ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={cancelEditing}
                  disabled={savingEdit}
                  style={{ background: '#E5E7EB', color: colors.ink, border: 'none', padding: '8px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <h4 style={{ margin: '0 0 2px 0', fontSize: '16px', color: colors.ink, fontFamily: fontDisplay }}>{g.name}</h4>
                  <p style={{ margin: 0, fontSize: '12px', color: colors.muted }}>{g.memberCount} member{g.memberCount === 1 ? '' : 's'}</p>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => setOpenGroupId(openGroupId === g.id ? null : g.id)}
                    style={{ background: colors.teal, color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}
                  >
                    {openGroupId === g.id ? 'Close' : '+ Add Members'}
                  </button>
                  <button
                    onClick={() => startEditing(g)}
                    style={{ background: '#fff', color: colors.ink, border: `1px solid ${colors.roseSoft}`, padding: '8px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteGroup(g)}
                    disabled={deletingGroupId === g.id}
                    style={{ background: '#FEE2E2', color: '#991B1B', border: 'none', padding: '8px 14px', borderRadius: '6px', cursor: deletingGroupId === g.id ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: 600, opacity: deletingGroupId === g.id ? 0.6 : 1 }}
                  >
                    {deletingGroupId === g.id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            )}

            {openGroupId === g.id && (
              <AddMembersPanel groupId={g.id} onMemberAdded={fetchGroups} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function AddMembersPanel({ groupId, onMemberAdded }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [members, setMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(true);
  const [addingUserId, setAddingUserId] = useState(null);

  const fetchMembers = () => {
    groupService.getMembers(groupId)
      .then((data) => { setMembers(data); setMembersLoading(false); })
      .catch(() => setMembersLoading(false));
  };

  useEffect(() => { fetchMembers(); }, [groupId]);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    setSearching(true);
    const handle = setTimeout(() => {
      userService.search(query.trim())
        .then((data) => setResults(data))
        .catch(() => setResults([]))
        .finally(() => setSearching(false));
    }, 300);
    return () => clearTimeout(handle);
  }, [query]);

  const handleAdd = async (userId) => {
    setAddingUserId(userId);
    try {
      await groupService.addMember(groupId, userId);
      setQuery('');
      setResults([]);
      fetchMembers();
      if (onMemberAdded) onMemberAdded();
    } catch (err) {
      const msg = err.response?.data || 'Failed to add member.';
      alert(typeof msg === 'string' ? msg : 'Failed to add member.');
    } finally {
      setAddingUserId(null);
    }
  };

  const memberUserIds = new Set(members.map((m) => m.userId));

  return (
    <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: `1px dashed ${colors.roseSoft}` }}>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by name or email to add..."
        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: `1px solid ${colors.roseSoft}`, outline: 'none', fontSize: '13px', marginBottom: '10px' }}
      />

      {searching && <p style={{ fontSize: '12px', color: colors.muted, margin: '0 0 10px 0' }}>Searching...</p>}

      {results.length > 0 && (
        <div style={{ marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {results.map((u) => (
            <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: colors.card, borderRadius: '6px', fontSize: '13px' }}>
              <span>{u.name} <span style={{ color: colors.muted }}>({u.email})</span></span>
              {memberUserIds.has(u.id) ? (
                <span style={{ fontSize: '11px', color: colors.muted }}>Already a member</span>
              ) : (
                <button
                  onClick={() => handleAdd(u.id)}
                  disabled={addingUserId === u.id}
                  style={{ background: colors.wine, color: '#fff', border: 'none', padding: '5px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}
                >
                  {addingUserId === u.id ? 'Adding...' : 'Add'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <p style={{ fontWeight: 600, fontSize: '13px', color: colors.ink, margin: '0 0 8px 0' }}>Current members ({members.length})</p>
      {membersLoading ? (
        <p style={{ fontSize: '13px', color: colors.muted }}>Loading...</p>
      ) : members.length === 0 ? (
        <p style={{ fontSize: '13px', color: colors.muted }}>No members yet.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {members.map((m) => (
            <p key={m.id} style={{ margin: 0, fontSize: '13px', color: colors.ink }}>
              {m.userName} <span style={{ color: colors.muted }}>({m.userEmail})</span>
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

function EventRatingBadge({ eventId }) {
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    let cancelled = false;
    reviewService.getSummary(eventId)
      .then((data) => { if (!cancelled) setSummary(data); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [eventId]);

  if (!summary) return null;

  if (summary.totalReviews === 0) {
    return (
      <span style={{ fontSize: '11px', color: colors.muted, fontWeight: 600 }}>
        No ratings yet
      </span>
    );
  }

  return (
    <span style={{ fontSize: '12px', color: colors.ink, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
      ⭐ {summary.averageRating.toFixed(1)}
      <span style={{ color: colors.muted, fontWeight: 500 }}>
        ({summary.totalReviews} review{summary.totalReviews === 1 ? '' : 's'})
      </span>
    </span>
  );
}

function MyBookingsView({ currentUser }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    bookingService.getMine()
      .then((data) => { setBookings(data); setLoading(false); })
      .catch(() => { setError('Failed to load your bookings.'); setLoading(false); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  const statusColor = (status) => {
    if (status === 'Confirmed') return { bg: '#DCFCE7', fg: '#166534' };
    if (status === 'Cancelled') return { bg: '#FEE2E2', fg: '#991B1B' };
    return { bg: '#FEF3C7', fg: '#92400E' }; // Pending
  };

  return (
    <div style={{ fontFamily: fontBody, background: colors.bg, minHeight: '100vh', padding: '40px 24px' }}>
      <GlobalStyle />
      <div style={{ maxWidth: '700px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontFamily: fontDisplay, color: colors.wine, margin: 0, fontSize: '28px' }}>My Bookings</h2>
          <Link to="/events" style={{ color: colors.muted, textDecoration: 'none', fontSize: '14px', fontWeight: 600 }}>← Back</Link>
        </div>

        {loading && <p style={{ color: colors.muted }}>Loading...</p>}
        {error && <p style={{ color: '#b3261e' }}>{error}</p>}

        {!loading && !error && bookings.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', background: colors.card, borderRadius: '16px', border: `1px solid ${colors.roseSoft}` }}>
            <p style={{ color: colors.muted, fontSize: '15px', margin: 0 }}>
              You haven't booked any events yet.
            </p>
          </div>
        )}

        {bookings.map((b) => {
          const sc = statusColor(b.status);
          return (
            <div key={b.bookingId} style={{ background: colors.card, borderRadius: '14px', padding: '20px 24px', border: `1px solid ${colors.roseSoft}`, marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', marginBottom: '8px' }}>
                <h4 style={{ margin: 0, fontFamily: fontDisplay, color: colors.ink, fontSize: '17px' }}>{b.eventTitle}</h4>
                <span style={{ background: sc.bg, color: sc.fg, padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, whiteSpace: 'nowrap' }}>
                  {b.status}
                </span>
              </div>
              <p style={{ margin: '0 0 4px 0', color: colors.muted, fontSize: '13px' }}>
                Event date: {new Date(b.eventStartDateTime).toLocaleString()}
              </p>
              <p style={{ margin: '0 0 4px 0', color: colors.muted, fontSize: '13px' }}>
                Booked on {new Date(b.bookedAt).toLocaleString()} · Qty: {b.quantity}
              </p>
              <p style={{ margin: 0, color: colors.ink, fontSize: '13px', fontWeight: 600 }}>
                {b.isPaid ? `Paid — ${b.paymentMethod || 'method not recorded'} · Total: Rs. ${Number(b.totalAmount).toLocaleString()}` : 'Not yet paid'}
              </p>
              {b.paymentInstructions && (
                <div style={{ background: colors.bg, borderRadius: '8px', padding: '10px 12px', marginTop: '10px' }}>
                  <p style={{ margin: '0 0 2px 0', fontSize: '10px', fontWeight: 700, color: colors.wine, letterSpacing: '0.3px' }}>HOW TO PAY THE ORGANISER</p>
                  <p style={{ margin: 0, fontSize: '12px', color: colors.ink, whiteSpace: 'pre-wrap' }}>{b.paymentInstructions}</p>
                </div>
              )}
              <p style={{ margin: '8px 0 0 0', color: colors.muted, fontSize: '11px' }}>
                Booking reference: #{b.bookingId}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StarRating({ value, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display: 'flex', gap: '4px' }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          onClick={() => onChange(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          style={{
            cursor: 'pointer',
            fontSize: '28px',
            color: (hover || value) >= star ? colors.amber : colors.roseSoft,
            lineHeight: 1,
            userSelect: 'none',
          }}
        >
          ★
        </span>
      ))}
    </div>
  );
}

function RateEventCard({ event, onSubmitted }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (rating < 1) {
      setError('Please select a star rating first.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await reviewService.submitReview(event.eventId, rating, comment.trim() || null);
      onSubmitted(event.eventId);
    } catch (err) {
      const msg = err.response?.data || 'Failed to submit review. Please try again.';
      setError(typeof msg === 'string' ? msg : 'Failed to submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ background: colors.card, borderRadius: '16px', padding: '24px', border: `1px solid ${colors.roseSoft}`, marginBottom: '20px' }}>
      <h4 style={{ margin: '0 0 4px 0', fontFamily: fontDisplay, color: colors.ink, fontSize: '18px' }}>{event.title}</h4>
      <p style={{ margin: '0 0 16px 0', color: colors.muted, fontSize: '13px' }}>
        Attended on {formatEventDateTime(event.endDateTime)}
      </p>

      <StarRating value={rating} onChange={setRating} />

      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Share a few words about the event (optional)"
        rows={2}
        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: `1px solid ${colors.roseSoft}`, outline: 'none', fontFamily: fontBody, fontSize: '13px', margin: '14px 0' }}
      />

      {error && <p style={{ color: '#b3261e', fontSize: '13px', margin: '0 0 10px 0' }}>{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={submitting}
        style={{ background: colors.wine, color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '8px', cursor: submitting ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: '13px', opacity: submitting ? 0.6 : 1 }}
      >
        {submitting ? 'Submitting...' : 'Submit Rating'}
      </button>
    </div>
  );
}

function RateEventsView({ currentUser }) {
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    reviewService.getPending()
      .then((data) => { setPending(data); setLoading(false); })
      .catch(() => { setError('Failed to load your attended events.'); setLoading(false); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  const handleSubmitted = (eventId) => {
    setPending((prev) => prev.filter((e) => e.eventId !== eventId));
  };

  return (
    <div style={{ fontFamily: fontBody, background: colors.bg, minHeight: '100vh', padding: '40px 24px' }}>
      <GlobalStyle />
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontFamily: fontDisplay, color: colors.wine, margin: 0, fontSize: '28px' }}>Rate Your Events</h2>
          <Link to="/events" style={{ color: colors.muted, textDecoration: 'none', fontSize: '14px', fontWeight: 600 }}>← Back</Link>
        </div>

        {loading && <p style={{ color: colors.muted }}>Loading...</p>}
        {error && <p style={{ color: '#b3261e' }}>{error}</p>}

        {!loading && !error && pending.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', background: colors.card, borderRadius: '16px', border: `1px solid ${colors.roseSoft}` }}>
            <p style={{ color: colors.muted, fontSize: '15px', margin: 0 }}>
              You're all caught up — no attended events waiting to be rated.
            </p>
          </div>
        )}

        {pending.map((event) => (
          <RateEventCard key={event.eventId} event={event} onSubmitted={handleSubmitted} />
        ))}
      </div>
    </div>
  );
}

function PastEventCard({ event, statusLabel, statusTone }) {
  const title = event.title || event.name;
  const rawDate = event.startDateTime || event.StartDateTime || event.date;
  const dateStr = formatEventDateTime(rawDate);
  const organizer = event.organizer || event.Organizer || 'General Host';
  return (
    <div style={{ background: colors.card, borderRadius: '14px', padding: '18px 22px', border: `1px solid ${colors.roseSoft}`, marginBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
      <div>
        <h4 style={{ margin: '0 0 4px 0', fontFamily: fontDisplay, color: colors.ink, fontSize: '16px' }}>{title}</h4>
        <p style={{ margin: 0, color: colors.muted, fontSize: '13px' }}>{organizer} · {dateStr}</p>
      </div>
      <span style={{ background: statusTone.bg, color: statusTone.fg, padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, whiteSpace: 'nowrap' }}>
        {statusLabel}
      </span>
    </div>
  );
}

function PastEventsView({ currentUser }) {
  const [attended, setAttended] = useState([]);
  const [notAttended, setNotAttended] = useState([]);
  const [subTab, setSubTab] = useState('attended'); // 'attended' | 'not-attended'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    Promise.all([bookingService.getMine(), eventService.getAllEvents(true)])
      .then(([bookings, pastEvents]) => {
        const now = new Date();
        const pastBookings = bookings.filter((b) => new Date(b.eventEndDateTime) < now && b.status !== 'Cancelled');
        const attendedTitles = new Set(pastBookings.map((b) => b.eventTitle));

        setAttended(pastBookings);
        setNotAttended(pastEvents.filter((e) => !attendedTitles.has(e.title || e.name)));
        setLoading(false);
      })
      .catch(() => { setError('Failed to load your past events.'); setLoading(false); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  return (
    <div style={{ fontFamily: fontBody, background: colors.bg, minHeight: '100vh', padding: '40px 24px' }}>
      <GlobalStyle />
      <div style={{ maxWidth: '700px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontFamily: fontDisplay, color: colors.wine, margin: 0, fontSize: '28px' }}>Past Events</h2>
          <Link to="/events" style={{ color: colors.muted, textDecoration: 'none', fontSize: '14px', fontWeight: 600 }}>← Back</Link>
        </div>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
          {[
            { key: 'attended', label: `Attended (${attended.length})` },
            { key: 'not-attended', label: `Not Attended (${notAttended.length})` },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setSubTab(t.key)}
              style={{
                padding: '9px 16px',
                borderRadius: '20px',
                border: `1.5px solid ${subTab === t.key ? colors.wine : colors.roseSoft}`,
                background: subTab === t.key ? colors.wine : '#fff',
                color: subTab === t.key ? '#fff' : colors.ink,
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {loading && <p style={{ color: colors.muted }}>Loading...</p>}
        {error && <p style={{ color: '#b3261e' }}>{error}</p>}

        {!loading && !error && subTab === 'attended' && (
          <>
            {attended.length === 0 && <EmptyPanelState text="You haven't attended any past events yet." />}
            {attended.map((b) => (
              <PastEventCard
                key={b.bookingId}
                event={{ title: b.eventTitle, startDateTime: b.eventStartDateTime }}
                statusLabel={b.isPaid ? 'Attended' : 'Booked (payment pending)'}
                statusTone={b.isPaid ? { bg: '#DCFCE7', fg: '#166534' } : { bg: '#FEF3C7', fg: '#92400E' }}
              />
            ))}
          </>
        )}

        {!loading && !error && subTab === 'not-attended' && (
          <>
            {notAttended.length === 0 && <EmptyPanelState text="No other past events found." />}
            {notAttended.map((event) => (
              <PastEventCard
                key={event.id || event.eventId}
                event={event}
                statusLabel="Not Attended"
                statusTone={{ bg: '#F3EDEF', fg: colors.muted }}
              />
            ))}
          </>
        )}
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
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/admin" element={<AdminPanel currentUser={currentUser} setCurrentUser={setCurrentUser} />} />
        <Route path="/create-event" element={<CreateEventView />} />
        <Route path="/rate-events" element={<RateEventsView currentUser={currentUser} />} />
        <Route path="/my-bookings" element={<MyBookingsView currentUser={currentUser} />} />
        <Route path="/my-past-events" element={<PastEventsView currentUser={currentUser} />} />
        <Route path="/profile" element={<ProfileView currentUser={currentUser} setCurrentUser={setCurrentUser} />} />
        <Route path="/saved-events" element={<SavedEventsView currentUser={currentUser} />} />
      </Routes>
    </Router>
  );
}