import { Lock, Crown } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import { hasFeatureAccess } from '../../lib/planLimits';

export default function UpgradeGate({ featureKey, requiredPlanName = 'Pro', children }) {
  const { restaurant } = useOutletContext() || {};
  const planType = restaurant?.subscription?.planType || 'Free';

  // If the restaurant hasn't loaded yet, return null to avoid flashing the lock screen
  if (!restaurant) return null;

  const isAllowed = hasFeatureAccess(planType, featureKey);

  if (isAllowed) {
    return children;
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      background: 'var(--bg-surface)',
      borderRadius: 'var(--radius-lg)',
      border: '1px dashed var(--border)',
      padding: 40,
      textAlign: 'center',
      margin: 20
    }}>
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 64,
        height: 64,
        borderRadius: '50%',
        background: 'rgba(245, 158, 11, 0.1)',
        color: '#F59E0B',
        marginBottom: 20
      }}>
        <Lock size={32} />
      </div>

      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>
        Feature Locked
      </h2>
      
      <p style={{ color: 'var(--text-subtle)', maxWidth: 400, marginBottom: 32, lineHeight: 1.6 }}>
        This feature is only available on the <strong>{requiredPlanName} Plan</strong>. Upgrade your restaurant's subscription to unlock powerful new tools and grow your business.
      </p>

      <button className="btn btn-primary btn-lg" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Crown size={18} />
        Upgrade to {requiredPlanName}
      </button>
    </div>
  );
}
