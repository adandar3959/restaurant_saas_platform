// ─── Utility Functions ─────────────────────────────────────────────────────

/**
 * Format a number as currency
 * @param {number} amount
 * @param {string} currency - e.g. 'USD', 'PKR'
 */
export function formatCurrency(amount, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);
}

/**
 * Format date to readable string
 */
export function formatDate(date, opts = {}) {
  if (!date) return '—';
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', ...opts }).format(new Date(date));
}

/**
 * Format date + time
 */
export function formatDateTime(date) {
  if (!date) return '—';
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(date));
}

/**
 * Format time ago (e.g. "5 minutes ago")
 */
export function timeAgo(date) {
  if (!date) return '—';
  const seconds = Math.floor((Date.now() - new Date(date)) / 1000);
  if (seconds < 60)  return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

/**
 * Capitalize first letter
 */
export function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Truncate string
 */
export function truncate(str, n = 40) {
  if (!str) return '';
  return str.length > n ? str.slice(0, n) + '…' : str;
}

/**
 * Get initials from name (e.g. "John Smith" → "JS")
 */
export function getInitials(name = '') {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

/**
 * Build restaurant-scoped API path
 */
export function restaurantPath(restaurantId, path) {
  return `/restaurants/${restaurantId}${path}`;
}
