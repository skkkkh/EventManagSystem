import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationService } from '../notificationService';

const colors = {
  wine: '#7F1330',
  roseSoft: '#F3DDE3',
  ink: '#2D2326',
  muted: '#8A7478',
  card: '#FFFFFF',
};

const REVIEW_PROMPT_TYPE = 7;
const EVENT_MARKER_RE = /^\[\[EVENT:\d+\]\]/;

function displayMessage(message) {
  return message.replace(EVENT_MARKER_RE, '');
}

export default function NotificationBell({ currentUser }) {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const userId = currentUser?.userId;

  const fetchNotifications = () => {
    if (!userId) return;
    notificationService.getUnreadForUser(userId)
      .then((data) => setNotifications(data.filter((n) => !n.isRead)))
      .catch(() => {});
  };

  useEffect(() => {
    if (!userId) return;
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // poll every 30s
    return () => clearInterval(interval);
  }, [userId]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch {
      // silently ignore — will retry on next poll
    }
  };

  const handleNotificationClick = (n) => {
    handleMarkRead(n.id);
    if (n.type === REVIEW_PROMPT_TYPE) {
      setIsOpen(false);
      navigate('/rate-events');
    }
  };

  if (!userId) return null;

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen((o) => !o)}
        style={{
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          position: 'relative',
          fontSize: '20px',
          padding: '6px',
        }}
        aria-label="Notifications"
      >
        🔔
        {notifications.length > 0 && (
          <span
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              background: '#b3261e',
              color: '#fff',
              borderRadius: '50%',
              width: '16px',
              height: '16px',
              fontSize: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
            }}
          >
            {notifications.length > 9 ? '9+' : notifications.length}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: '36px',
            width: '320px',
            maxHeight: '400px',
            overflowY: 'auto',
            background: colors.card,
            border: `1px solid ${colors.roseSoft}`,
            borderRadius: '12px',
            boxShadow: '0 10px 30px rgba(127,19,48,0.15)',
            zIndex: 100,
          }}
        >
          <div style={{ padding: '14px 16px', borderBottom: `1px solid ${colors.roseSoft}`, fontWeight: 700, color: colors.ink, fontSize: '14px' }}>
            Notifications
          </div>

          {notifications.length === 0 && (
            <div style={{ padding: '20px 16px', color: colors.muted, fontSize: '13px', textAlign: 'center' }}>
              You're all caught up.
            </div>
          )}

          {notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => handleNotificationClick(n)}
              style={{
                padding: '12px 16px',
                borderBottom: `1px solid ${colors.roseSoft}`,
                cursor: 'pointer',
                fontSize: '13px',
                color: colors.ink,
              }}
            >
              <div>{n.type === REVIEW_PROMPT_TYPE ? '⭐ ' : ''}{displayMessage(n.message)}</div>
              <div style={{ fontSize: '11px', color: colors.muted, marginTop: '4px' }}>
                {new Date(n.createdAt).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}