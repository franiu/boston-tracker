// cookie-store.js
// Manages the marathon start time cookie (marathon_start_time)

const COOKIE_NAME = 'marathon_start_time';
const EXPIRATION_DAYS = 7;

/**
 * Reads the start time from the browser cookie.
 * @returns {Date|null} The stored start time, or null if not set or invalid.
 */
export function getStartTime() {
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, ...valueParts] = cookie.trim().split('=');
    if (name === COOKIE_NAME) {
      const value = decodeURIComponent(valueParts.join('='));
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        return null;
      }
      return date;
    }
  }
  return null;
}

/**
 * Saves the start time to a browser cookie with 7-day expiration.
 * @param {Date} startTime
 */
export function setStartTime(startTime) {
  const value = encodeURIComponent(startTime.toISOString());
  const expires = new Date(Date.now() + EXPIRATION_DAYS * 24 * 60 * 60 * 1000);
  document.cookie = `${COOKIE_NAME}=${value}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
}

/**
 * Removes the start time cookie by setting it with an expired date.
 */
export function clearStartTime() {
  document.cookie = `${COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
}
