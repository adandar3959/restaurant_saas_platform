import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Eye, EyeOff, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import AuthLayout from '../../components/layout/AuthLayout';

export default function SignupPage() {
  const { register, isLoading, error, clearError, getDashboardRoute } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [showPass, setShowPass] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  const set = (key, val) => setForm(p => ({ ...p, [key]: val }));
  const clearErr = key => setFormErrors(p => ({ ...p, [key]: '' }));

  // Password strength
  const strength = (() => {
    const p = form.password;
    if (!p) return 0;
    let s = 0;
    if (p.length >= 6)           s++;
    if (p.length >= 10)          s++;
    if (/[A-Z]/.test(p))        s++;
    if (/[0-9]/.test(p))        s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return Math.min(s, 4);
  })();

  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][strength];
  const strengthColor = ['', '#EF4444', '#F59E0B', '#3B82F6', '#10B981'][strength];

  const validate = () => {
    const errs = {};
    if (!form.name.trim())              errs.name = 'Full name is required';
    if (!form.email.trim())             errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Enter a valid email';
    if (!form.password)                 errs.password = 'Password is required';
    else if (form.password.length < 6)  errs.password = 'Minimum 6 characters';
    if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    if (!agreed)                        errs.agreed = 'Please agree to the terms';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    clearError();
    if (!validate()) return;

    const result = await register(form.name, form.email, form.password);
    if (result.success) {
      navigate(getDashboardRoute('Customer', null));
    }
  };

  return (
    <AuthLayout
      title="Create Account"
      subtitle="Join thousands of food lovers on DineFlow"
      footerText="Already have an account?"
      footerLink="/login"
      footerLinkText="Sign in"
    >
      <form onSubmit={handleSubmit} noValidate>
        <div className="flex flex-col gap-4">
          {error && (
            <div className="alert alert-error">
              <span>⚠️</span> {error}
            </div>
          )}

          {/* Name */}
          <div className="form-group">
            <label htmlFor="signup-name" className="form-label">Full Name</label>
            <div className="form-input-icon">
              <User size={16} className="input-icon" />
              <input
                id="signup-name"
                type="text"
                className="form-input"
                placeholder="John Smith"
                value={form.name}
                autoComplete="name"
                onChange={e => { set('name', e.target.value); clearErr('name'); }}
              />
            </div>
            {formErrors.name && <span className="form-error">{formErrors.name}</span>}
          </div>

          {/* Email */}
          <div className="form-group">
            <label htmlFor="signup-email" className="form-label">Email Address</label>
            <div className="form-input-icon">
              <Mail size={16} className="input-icon" />
              <input
                id="signup-email"
                type="email"
                className="form-input"
                placeholder="you@example.com"
                value={form.email}
                autoComplete="email"
                onChange={e => { set('email', e.target.value); clearErr('email'); }}
              />
            </div>
            {formErrors.email && <span className="form-error">{formErrors.email}</span>}
          </div>

          {/* Password */}
          <div className="form-group">
            <label htmlFor="signup-password" className="form-label">Password</label>
            <div className="form-input-icon" style={{ position: 'relative' }}>
              <Lock size={16} className="input-icon" />
              <input
                id="signup-password"
                type={showPass ? 'text' : 'password'}
                className="form-input"
                placeholder="Min. 6 characters"
                value={form.password}
                autoComplete="new-password"
                onChange={e => { set('password', e.target.value); clearErr('password'); }}
              />
              <button type="button" className="input-action" onClick={() => setShowPass(v => !v)} tabIndex={-1}>
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {form.password && (
              <div style={{ marginTop: 6 }}>
                <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                  {[1,2,3,4].map(i => (
                    <div key={i} style={{
                      flex: 1, height: 3, borderRadius: 2,
                      background: i <= strength ? strengthColor : 'var(--border)',
                      transition: 'background 0.3s',
                    }} />
                  ))}
                </div>
                <span style={{ fontSize: 12, color: strengthColor, fontWeight: 600 }}>
                  {strengthLabel}
                </span>
              </div>
            )}
            {formErrors.password && <span className="form-error">{formErrors.password}</span>}
          </div>

          {/* Confirm password */}
          <div className="form-group">
            <label htmlFor="signup-confirm" className="form-label">Confirm Password</label>
            <div className="form-input-icon">
              <Lock size={16} className="input-icon" />
              <input
                id="signup-confirm"
                type={showPass ? 'text' : 'password'}
                className="form-input"
                placeholder="Repeat your password"
                value={form.confirmPassword}
                autoComplete="new-password"
                onChange={e => { set('confirmPassword', e.target.value); clearErr('confirmPassword'); }}
              />
            </div>
            {formErrors.confirmPassword && <span className="form-error">{formErrors.confirmPassword}</span>}
          </div>

          {/* Terms */}
          <div>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={agreed}
                onChange={e => { setAgreed(e.target.checked); clearErr('agreed'); }}
              />
              <span>
                I agree to the{' '}
                <Link to="#" className="text-primary" style={{ fontWeight: 600 }}>Terms of Service</Link>
                {' '}and{' '}
                <Link to="#" className="text-primary" style={{ fontWeight: 600 }}>Privacy Policy</Link>
              </span>
            </label>
            {formErrors.agreed && <span className="form-error">{formErrors.agreed}</span>}
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="btn btn-primary w-full btn-lg"
            disabled={isLoading}
            style={{ marginTop: 4 }}
          >
            {isLoading ? (
              <><div className="spinner" /> Creating account...</>
            ) : (
              'Create Account'
            )}
          </button>
        </div>
      </form>

      {/* Staff note */}
      <div style={{
        background: 'var(--bg-surface-2)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        padding: 'var(--space-4)',
        fontSize: 13,
        color: 'var(--text-muted)',
        display: 'flex',
        gap: 'var(--space-3)',
        alignItems: 'flex-start',
      }}>
        <span style={{ fontSize: 18, flexShrink: 0 }}>👋</span>
        <div>
          <strong style={{ color: 'var(--text)', display: 'block', marginBottom: 2 }}>
            Restaurant owner?
          </strong>
          <Link to="/onboarding" className="text-primary" style={{ fontWeight: 600 }}>
            Start your restaurant here →
          </Link>
          <br />
          <span>Staff accounts are created by your restaurant admin.</span>
        </div>
      </div>
    </AuthLayout>
  );
}
