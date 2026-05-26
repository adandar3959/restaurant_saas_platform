

export function formatCurrency(amount, currency) {
  let selectedCurrency = currency;
  let shouldConvert = false;

  // If we are on the SuperAdmin portal, always render in USD ($)
  if (typeof window !== 'undefined' && window.location.pathname.startsWith('/superadmin')) {
    selectedCurrency = 'USD';
  } else if (!selectedCurrency) {
    shouldConvert = true;
    try {
      const saved = localStorage.getItem('rms_system_settings');
      if (saved) {
        selectedCurrency = JSON.parse(saved).platformCurrency;
      }
    } catch (e) {
      // ignore
    }
  }
  if (!selectedCurrency) selectedCurrency = 'USD';

  // Base database price currency is PKR
  let convertedAmount = amount;
  if (shouldConvert) {
    if (selectedCurrency === 'USD') {
      convertedAmount = amount / 278; // 1 USD = 278 PKR
    } else if (selectedCurrency === 'EUR') {
      convertedAmount = amount / 301; // 1 EUR = 301 PKR
    }
  }

  if (selectedCurrency === 'PKR') {
    return `Rs ${new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(convertedAmount)}`;
  }

  // Format other currencies (USD, EUR) with 2 decimal places (e.g. $3.55)
  return new Intl.NumberFormat('en-US', { 
    style: 'currency', 
    currency: selectedCurrency, 
    minimumFractionDigits: 2,
    maximumFractionDigits: 2 
  }).format(convertedAmount);
}

export function formatDate(date, opts = {}) {
  if (!date) return '—';
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', ...opts }).format(new Date(date));
}

export function formatDateTime(date) {
  if (!date) return '—';
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(date));
}

export function timeAgo(date) {
  if (!date) return '—';
  const seconds = Math.floor((Date.now() - new Date(date)) / 1000);
  if (seconds < 60)  return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function truncate(str, n = 40) {
  if (!str) return '';
  return str.length > n ? str.slice(0, n) + '…' : str;
}

export function getInitials(name = '') {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

export function restaurantPath(restaurantId, path) {
  return `/restaurants/${restaurantId}${path}`;
}
