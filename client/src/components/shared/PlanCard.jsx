import { Check, Zap, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './PlanCard.css';

const planIcons = { Free: '🌱', Pro: '⚡', Enterprise: '🏢' };

export default function PlanCard({ plan, isPopular, selectedPlan, onSelect }) {
  const navigate = useNavigate();

  const handleCTA = () => {
    if (onSelect) {
      onSelect(plan.id);
    } else {
      navigate(`/onboarding?plan=${plan.id}`);
    }
  };

  const isSelected = selectedPlan === plan.id;

  return (
    <div className={`plan-card card ${isPopular ? 'plan-popular card-glow' : ''} ${isSelected ? 'plan-selected' : ''}`}>
      {isPopular && (
        <div className="plan-popular-badge">
          <Star size={12} fill="currentColor" />
          Most Popular
        </div>
      )}

      {}
      <div className="plan-header">
        <div className="plan-icon">{planIcons[plan.name] || '📦'}</div>
        <div>
          <h3 className="plan-name">{plan.name}</h3>
          <p className="plan-description text-sm text-muted">{plan.description}</p>
        </div>
      </div>

      {}
      <div className="plan-price">
        {plan.price === 0 ? (
          <span className="price-value">Free</span>
        ) : (
          <>
            <span className="price-currency">$</span>
            <span className="price-value">{plan.price}</span>
            <span className="price-period text-muted">/mo</span>
          </>
        )}
      </div>
      {plan.price > 0 && (
        <p className="price-trial text-sm text-muted">
          {plan.trialDays}-day free trial • No credit card required
        </p>
      )}

      {}
      <button
        className={`btn w-full mt-6 ${isPopular ? 'btn-primary' : 'btn-outline'} ${isSelected ? 'btn-selected' : ''}`}
        onClick={handleCTA}
      >
        {isSelected ? (
          <><Check size={16} /> Selected</>
        ) : plan.price === 0 ? (
          'Get Started Free'
        ) : (
          `Start ${plan.trialDays}-Day Trial`
        )}
      </button>

      {}
      <div className="plan-divider" />

      {}
      <ul className="plan-features">
        {plan.features.map((f, i) => (
          <li key={i} className={`plan-feature ${f.included ? '' : 'feature-disabled'}`}>
            <span className="feature-icon">
              {f.included ? <Check size={14} /> : <span className="feature-x">✕</span>}
            </span>
            <span>{f.label}</span>
          </li>
        ))}
      </ul>

      {}
      {plan.limits && (
        <div className="plan-limits">
          {plan.limits.map((l, i) => (
            <div key={i} className="plan-limit">
              <span className="limit-label text-muted text-sm">{l.label}</span>
              <span className="limit-value text-sm font-semi">{l.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
