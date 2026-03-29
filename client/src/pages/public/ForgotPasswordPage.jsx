import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Send } from 'lucide-react';
import AuthLayout from '../../components/layout/AuthLayout';

export default function ForgotPasswordPage() {
  const [email, setSent] = useState('');
  const [sent, setIsSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const handleSubmit = async e => {
    e.preventDefault();
    setFormError('');
    if (!email.trim()) return setFormError('Email is required');
    if (!/\S+@\S+\.\S+/.test(email)) return setFormError('Enter a valid email');

    setLoading(true);
    // TODO: wire to real API when password reset endpoint is added
    await new Promise(r => setTimeout(r, 1200));
    setLoading(false);
    setIsSent(true);
  };

  return (
    <AuthLayout
      title={sent ? 'Check Your Email' : 'Forgot Password?'}
      subtitle={
        sent
          ? `We sent a reset link to ${email}`
          : 'Enter your email and we\'ll send you a reset link.'
      }
    >
      {!sent ? (
        <form onSubmit={handleSubmit} noValidate>
          <div className="flex flex-col gap-4">
            {formError && (
              <div className="alert alert-error">
                <span>⚠️</span> {formError}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="forgot-email" className="form-label">Email Address</label>
              <div className="form-input-icon">
                <Mail size={16} className="input-icon" />
                <input
                  id="forgot-email"
                  type="email"
                  className="form-input"
                  placeholder="you@restaurant.com"
                  value={email}
                  autoComplete="email"
                  onChange={e => { setSent(e.target.value); setFormError(''); }}
                />
              </div>
              {formError && <span className="form-error">{formError}</span>}
            </div>

            <button
              type="submit"
              className="btn btn-primary w-full btn-lg"
              disabled={loading}
            >
              {loading ? (
                <><div className="spinner" /> Sending...</>
              ) : (
                <><Send size={16} /> Send Reset Link</>
              )}
            </button>

            <Link to="/login" className="btn btn-ghost w-full text-center text-sm" style={{ gap: 8 }}>
              <ArrowLeft size={16} /> Back to Sign In
            </Link>
          </div>
        </form>
      ) : (
        <div className="flex flex-col gap-4" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 64, margin: '8px 0' }}>📬</div>

          <div style={{
            background: 'rgba(16,185,129,0.1)',
            border: '1px solid rgba(16,185,129,0.3)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-5)',
            color: 'var(--success)',
            fontSize: 14,
          }}>
            Check your inbox! If <strong>{email}</strong> exists in our system, you'll receive a reset link within a few minutes.
          </div>

          <p className="text-sm text-muted">
            Didn't receive it? Check your spam folder or{' '}
            <button
              className="text-primary"
              style={{ fontWeight: 600, fontSize: 'inherit' }}
              onClick={() => setIsSent(false)}
            >
              try again
            </button>
          </p>

          <Link to="/login" className="btn btn-outline w-full">
            <ArrowLeft size={16} /> Back to Sign In
          </Link>
        </div>
      )}
    </AuthLayout>
  );
}
