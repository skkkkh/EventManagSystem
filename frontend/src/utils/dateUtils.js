// dateUtils.js
// Utilities for parsing backend UTC date strings (which may lack the trailing Z)
// and formatting them for display in the user's local timezone.

function parseUtcString(utcString) {
  if (!utcString) return null;
  try {
    const s = utcString.endsWith('Z') ? utcString : utcString + 'Z';
    const d = new Date(s);
    if (isNaN(d)) return null;
    return d;
  } catch {
    return null;
  }
}

function formatEventDateTime(utcString) {
  const d = parseUtcString(utcString);
  if (!d) return { dateStr: 'TBA', timeStr: 'TBA' };

  const dateStr = d.toLocaleDateString(undefined, { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
  const timeStr = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true });

  return { dateStr, timeStr };
}

// Convert a backend UTC string to a value suitable for <input type="datetime-local" />
// The returned string is local datetime in the form YYYY-MM-DDTHH:mm
function toLocalInputValue(utcString) {
  const d = parseUtcString(utcString);
  if (!d) return '';

  // Shift the moment to local by applying the timezone offset, then ISO and slice
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

export { parseUtcString, formatEventDateTime, toLocalInputValue };
