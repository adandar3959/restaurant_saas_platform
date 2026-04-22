import { Link } from 'react-router-dom';
import { UtensilsCrossed, ArrowRight } from 'lucide-react';
import './AuthLayout.css';

export default function AuthLayout({ children, title, subtitle, footerText, footerLink, footerLinkText }) {
  return (
    <div className="auth-page">
      {}
      <div className="auth-blob auth-blob-1" />
      <div className="auth-blob auth-blob-2" />

      <div className="auth-container">
        {}
        <Link to="/" className="auth-logo">
          <div className="nav-logo-icon">
            <UtensilsCrossed size={18} />
          </div>
          <span>DineFlow</span>
        </Link>

        {}
        <div className="auth-card glass">
          <div className="auth-card-header">
            <h1 className="auth-title">{title}</h1>
            {subtitle && <p className="auth-subtitle text-muted">{subtitle}</p>}
          </div>

          {children}

          {footerText && (
            <p className="auth-footer-text text-sm text-muted text-center">
              {footerText}{' '}
              <Link to={footerLink} className="auth-footer-link">
                {footerLinkText}
                <ArrowRight size={14} />
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
