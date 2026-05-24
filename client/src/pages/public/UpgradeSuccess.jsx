import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, Loader, XCircle, ArrowRight } from 'lucide-react';
import api from '../../api/tenant.api';

export default function UpgradeSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading'); // loading | success | error
  const [planType, setPlanType] = useState('');
  const [error, setError] = useState('');

  const sessionId    = searchParams.get('session_id');
  const freePlan     = searchParams.get('plan');       // set for Free plan bypass
  const restaurantId = JSON.parse(localStorage.getItem('rms_user') || '{}')?.restaurantId;

  useEffect(() => {
    // ── Free plan bypass — no Stripe session, already activated in backend ──
    if (freePlan === 'Free') {
      setPlanType('Free');
      setStatus('success');
      return;
    }

    if (!sessionId || !restaurantId) {
      setStatus('error');
      setError('Invalid session. Please contact support.');
      return;
    }

    const verify = async () => {
      try {
        const res = await api.get(
          `/restaurants/${restaurantId}/payment/verify-subscription?session_id=${sessionId}`
        );
        const upgraded = res.data?.data?.planType;
        setPlanType(upgraded);

        // Update locally cached restaurant so dashboard reflects it immediately
        const stored = JSON.parse(localStorage.getItem('rms_restaurant') || '{}');
        if (stored?.subscription) {
          stored.subscription.planType = upgraded;
          stored.subscription.status   = 'Active';
          localStorage.setItem('rms_restaurant', JSON.stringify(stored));
        }

        setStatus('success');
      } catch (err) {
        const msg = err?.response?.data?.message || 'Verification failed. Please contact support.';
        setError(msg);
        setStatus('error');
      }
    };

    verify();
  }, [sessionId, restaurantId, freePlan]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-base, #0f0f10)',
      fontFamily: 'var(--font-body, Inter, sans-serif)',
      padding: 24,
    }}>
      <div style={{
        background: 'var(--bg-surface, #1a1a1f)',
        border: '1px solid var(--border, rgba(255,255,255,0.08))',
        borderRadius: 20,
        padding: '48px 40px',
        textAlign: 'center',
        maxWidth: 480,
        width: '100%',
        boxShadow: '0 32px 80px rgba(0,0,0,0.5)',
      }}>

        {status === 'loading' && (
          <>
            <Loader size={56} style={{ color: 'var(--primary, #7C3AED)', animation: 'spin 1s linear infinite', marginBottom: 24 }} />
            <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>Confirming your upgrade...</h2>
            <p style={{ color: 'var(--text-muted, #888)', fontSize: 15 }}>Please wait while we activate your new plan.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div style={{
              width: 80, height: 80, borderRadius: '50%',
              background: 'rgba(16,185,129,0.12)', display: 'flex',
              alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px'
            }}>
              <CheckCircle size={48} style={{ color: '#10B981' }} />
            </div>
            <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 12 }}>You're all set!</h2>
            <p style={{ color: 'var(--text-muted, #888)', fontSize: 16, marginBottom: 8 }}>
              Your plan has been upgraded to
            </p>
            <div style={{
              display: 'inline-block',
              background: 'linear-gradient(135deg, #7C3AED, #3B82F6)',
              color: '#fff',
              fontWeight: 800,
              fontSize: 22,
              borderRadius: 12,
              padding: '8px 28px',
              marginBottom: 32,
              letterSpacing: '0.03em',
            }}>
              {planType}
            </div>
            <p style={{ color: 'var(--text-muted, #888)', fontSize: 14, marginBottom: 32 }}>
              All your new features are now active. Go to your dashboard to start using them!
            </p>
            <button
              className="btn btn-primary btn-lg"
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              onClick={() => navigate(`/admin/${restaurantId}`)}
            >
              Go to Dashboard
              <ArrowRight size={18} />
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <div style={{
              width: 80, height: 80, borderRadius: '50%',
              background: 'rgba(239,68,68,0.12)', display: 'flex',
              alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px'
            }}>
              <XCircle size={48} style={{ color: '#EF4444' }} />
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>Something went wrong</h2>
            <p style={{ color: 'var(--text-muted, #888)', fontSize: 15, marginBottom: 32 }}>{error}</p>
            <button
              className="btn btn-outline btn-lg"
              style={{ width: '100%' }}
              onClick={() => navigate('/pricing')}
            >
              Back to Pricing
            </button>
          </>
        )}

      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
