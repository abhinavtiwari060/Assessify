/**
 * Date and Time utilities for Test scheduling and display
 */

/**
 * Formats a Date/timestamp into '14 September 2026' style string
 * @param {string|Date} dateValue
 * @returns {string} e.g. "14 September 2026"
 */
export const formatTestDate = (dateValue) => {
  if (!dateValue) return 'N/A';
  const d = new Date(dateValue);
  if (isNaN(d.getTime())) return 'N/A';

  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

/**
 * Formats a Date/timestamp into '10:30 AM' style string
 * @param {string|Date} dateValue
 * @returns {string} e.g. "10:30 AM"
 */
export const formatTestTime = (dateValue) => {
  if (!dateValue) return 'N/A';
  const d = new Date(dateValue);
  if (isNaN(d.getTime())) return 'N/A';

  return d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

/**
 * Formats a Date into 'YYYY-MM-DD' for HTML date input
 * @param {string|Date} dateValue
 * @returns {string} e.g. "2026-09-14"
 */
export const formatDateForInput = (dateValue) => {
  const d = dateValue ? new Date(dateValue) : new Date();
  if (isNaN(d.getTime())) return new Date().toISOString().split('T')[0];
  
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Formats a Date into 'HH:MM' (24-hour) for HTML time input
 * @param {string|Date} dateValue
 * @returns {string} e.g. "10:30"
 */
export const formatTimeForInput = (dateValue) => {
  const d = dateValue ? new Date(dateValue) : new Date();
  if (isNaN(d.getTime())) return '10:00';

  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

/**
 * Combines date string (YYYY-MM-DD) and time string (HH:MM) into an ISO Date string
 * @param {string} dateStr
 * @param {string} timeStr
 * @returns {string} ISO Date string
 */
export const combineDateAndTime = (dateStr, timeStr) => {
  if (!dateStr) dateStr = formatDateForInput(new Date());
  if (!timeStr) timeStr = '10:00';

  // Construct ISO-compatible date time: YYYY-MM-DDTHH:MM:00
  const combined = new Date(`${dateStr}T${timeStr}:00`);
  if (isNaN(combined.getTime())) {
    return new Date().toISOString();
  }
  return combined.toISOString();
};
