import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Global emergency interceptor: Overrides ALL separate axios instances instantly!
const originalOpen = XMLHttpRequest.prototype.open;
XMLHttpRequest.prototype.open = function() {
  this.addEventListener('load', function() {
    if (this.status === 403 && this.responseText.includes('RESTAURANT_SUSPENDED')) {
      localStorage.removeItem('rms_token');
      localStorage.removeItem('rms_user');
      window.location.href = '/suspended';
    }
  });
  originalOpen.apply(this, arguments);
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
