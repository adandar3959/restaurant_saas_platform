import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Loader } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AuthLayout from '../components/AuthLayout';

const ROLE_INFO = {
  SuperAdmin: { emoji: '👑', label: 'Platform Admin',    color: '#F59E0B' },
  Admin:      { emoji: '🏪', label: 'Restaurant Owner',  color: '#FF6B35' },
  Manager:    { emoji: '📋', label: 'Manager',           color: '#6366F1' },
  Chef:       { emoji: '👨‍🍳', label: 'Chef / Kitchen',    color: '#10B981' },
  Waiter:     { emoji: '🍽️', label: 'Waiter / Server',  color: '#3B82F6' },
  Driver:     { emoji: '🛵', label: 'Delivery Driver',   color: '#8B5CF6' },
  Customer:   { emoji: '👤', label: 'Customer',          color: '#EC4899' },
};

export default function LoginPage() {
  const { login, isLoading, error, clearError, getDashboardRoute } = useAuth();
  const navigate = useNavigate();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [formErrors, setFormErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!email.trim())      errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) errs.email = 'Enter a valid email';
    if (!password)          errs.password = 'Password is required';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    if (!validate()) return;

    const result = await login(email, password);
    if (result.success) {
      const route = getDashboardRoute(result.role, result.restaurantId);
      navigate(route);
    }
  };

  return (
    <AuthLayout
      title="Welcome Back"
      subtitle="Sign in to your DineFlow account"
      footerText="Don't have an account?"
      footerLink="/onboarding"
      footerLinkText="Start free trial"
    >
      <form onSubmit={handleSubmit} noValidate>
        <div className="flex flex-col gap-4">
          {error && (
            <div className="alert alert-error">
              <span>⚠️</span> {error}
            </div>
          )}

          {/* Email */}
          <div className="form-group">
            <label htmlFor="login-email" className="form-label">Email Address</label>
            <div className="form-input-icon">
              <Mail size={16} className="input-icon" />
              <input
                id="login-email"
                type="email"
                className="form-input"
                placeholder="you@restaurant.com"
                value={email}
                autoComplete="email"
                onChange={e => { setEmail(e.target.value); setFormErrors(p => ({ ...p, email: '' })); }}
              />
            </div>
            {formErrors.email && <span className="form-error">{formErrors.email}</span>}
          </div>

          {/* Password */}
          <div className="form-group">
            <div className="flex justify-between items-center">
              <label htmlFor="login-password" className="form-label">Password</label>
              <Link to="/forgot-password" className="text-xs text-primary" style={{ fontWeight: 600 }}>
                Forgot password?
              </Link>
            </div>
            <div className="form-input-icon" style={{ position: 'relative' }}>
              <Lock size={16} className="input-icon" />
              <input
                id="login-password"
                type={showPass ? 'text' : 'password'}
                className="form-input"
                placeholder="Enter your password"
                value={password}
                autoComplete="current-password"
                onChange={e => { setPassword(e.target.value); setFormErrors(p => ({ ...p, password: '' })); }}
              />
              <button type="button" className="input-action" onClick={() => setShowPass(v => !v)} tabIndex={-1}>
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {formErrors.password && <span className="form-error">{formErrors.password}</span>}
          </div>

          {/* Remember me */}
          <label className="checkbox-label">
            <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} />
            Remember me for 30 days
          </label>

          {/* Submit */}
          <button
            type="submit"
            className="btn btn-primary w-full btn-lg"
            disabled={isLoading}
            style={{ marginTop: 4 }}
          >
            {isLoading ? (
              <><div className="spinner" /> Signing in...</>
            ) : (
              'Sign In'
            )}
          </button>
        </div>
      </form>

      {/* Role hint */}
      <div className="divider">All roles</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
        {Object.entries(ROLE_INFO).map(([role, info]) => (
          <div
            key={role}
            title={info.label}
            style={{
              background: 'var(--bg-surface-2)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: '8px 4px',
              textAlign: 'center',
              fontSize: 10,
              color: 'var(--text-subtle)',
              cursor: 'default',
            }}
          >
            <div style={{ fontSize: 18, marginBottom: 2 }}>{info.emoji}</div>
            {info.label.split(' ')[0]}
          </div>
        ))}
      </div>
      <p className="text-xs text-subtle text-center">
        Staff accounts are created by restaurant admins
      </p>
    </AuthLayout>
  );
}
