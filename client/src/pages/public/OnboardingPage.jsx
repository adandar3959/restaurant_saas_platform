import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Check, ChevronRight, ChevronLeft, User, Mail, Lock, Store,
  MapPin, Phone, Loader
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/layout/Navbar';
import './OnboardingPage.css';

const PLANS = [
  {
    id: 'Free',
    name: 'Free',
    price: 0,
    tagline: 'Get started for free',
    highlights: ['50 menu items', '1 staff accounts', '100 orders/mo'],
  },
  {
    id: 'Pro',
    name: 'Pro',
    price: 49,
    tagline: 'Most popular for growing restaurants',
    popular: true,
    highlights: ['Unlimited items', '5 staff accounts', 'KDS + Inventory'],
  },
  {
    id: 'Enterprise',
    name: 'Enterprise',
    price: 149,
    tagline: 'For restaurant chains',
    highlights: ['Delivery Management', 'Advanced analytics', 'Loyalty Program'],
  },
];

const CUISINES = [
  'Pakistani', 'Italian', 'Chinese', 'Fast Food', 'Café & Bakery',
  'Indian', 'American', 'Mexican', 'Middle Eastern', 'Seafood', 'Other',
];

const STEP_LABELS = ['Choose Plan', 'Your Account', 'Payment Info', 'Restaurant Info', 'All Done!'];

export default function OnboardingPage() {
  const [searchParams] = useSearchParams();
  const { onboard, isLoading, error, getDashboardRoute, user } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [showPass, setShowPass] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [restaurantIdAfterOnboard, setRestaurantIdAfterOnboard] = useState(null);

  const [form, setForm] = useState({
    planType: searchParams.get('plan') || 'Pro',
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    restaurantName: '',
    cuisine: '',
    phone: '',
    city: '',
  });

  const [errors, setErrors] = useState({});

  const set = (key, val) => setForm(p => ({ ...p, [key]: val }));
  const clearErr = (key) => setErrors(p => ({ ...p, [key]: '' }));

  const validate = () => {
    const errs = {};
    if (step === 2) {
      if (!form.name.trim()) errs.name = 'Full name is required';
      if (!form.email.trim()) errs.email = 'Email is required';
      else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Enter a valid email';
      if (!form.password) errs.password = 'Password is required';
      else if (form.password.length < 6) errs.password = 'Minimum 6 characters';
      if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    }
    if (step === 3) {
      if (!form.restaurantName.trim()) errs.restaurantName = 'Restaurant name is required';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    const result = await onboard({
      name: form.name,
      email: form.email,
      password: form.password,
      restaurantName: form.restaurantName,
      planType: form.planType,
    });
    if (result.success) {
      setRestaurantIdAfterOnboard(result.restaurantId);
      setStep(4);
      setCompleted(true);
    }
  };

  const next = () => {
    if (!validate()) return;
    setStep(s => s + 1);
  };
  const back = () => setStep(s => s - 1);

  const handleGoToDashboard = () => {
    const rid = restaurantIdAfterOnboard || user?.restaurantId;
    navigate(`/admin/${rid}`);
  };

  return (
    <div className="onboarding-page">
      <Navbar />
      <div className="onboarding-container">
        { }
        <div className="onboarding-header text-center">
          <h1 className="text-3xl font-black gradient-text">Set Up Your Restaurant</h1>
          <p className="text-muted mt-2">Takes less than 3 minutes. No credit card required.</p>
        </div>

        { }
        <div className="steps">
          {STEP_LABELS.map((label, i) => {
            const num = i + 1;
            const isDone = step > num;
            const isActive = step === num;
            return (
              <div key={i} className="step-item">
                <div className="step-indicator-wrap">
                  <div className={`step-circle ${isDone ? 'done' : isActive ? 'active' : ''}`}>
                    {isDone ? <Check size={14} /> : num}
                  </div>
                  <span className={`step-label ${isActive ? 'step-label-active' : ''}`}>{label}</span>
                </div>
                {i < STEP_LABELS.length - 1 && (
                  <div className={`step-line ${isDone ? 'done' : ''}`} />
                )}
              </div>
            );
          })}
        </div>

        { }
        <div className="onboarding-card glass">

          { }
          {step === 1 && (
            <div className="step-content animate-fade-up">
              <div className="step-heading">
                <h2>Choose Your Plan</h2>
                <p className="text-muted text-sm">You can upgrade or downgrade anytime.</p>
              </div>
              <div className="plan-selector">
                {PLANS.map(plan => (
                  <div
                    key={plan.id}
                    className={`plan-option ${form.planType === plan.id ? 'plan-option-selected' : ''} ${plan.popular ? 'plan-option-popular' : ''}`}
                    onClick={() => set('planType', plan.id)}
                  >
                    {plan.popular && <span className="plan-option-badge">Most Popular</span>}
                    <div className="plan-option-top">
                      <span className="plan-option-icon">{plan.icon}</span>
                      <div>
                        <div className="font-bold">{plan.name}</div>
                        <div className="text-xs text-muted">{plan.tagline}</div>
                      </div>
                      <div className="plan-option-price">
                        {plan.price === 0 ? <span className="font-bold">Free</span> : <><strong>${plan.price}</strong><span className="text-muted text-xs">/mo</span></>}
                      </div>
                    </div>
                    <ul className="plan-option-highlights">
                      {plan.highlights.map((h, i) => (
                        <li key={i}><Check size={12} style={{ color: 'var(--success)' }} />{h}</li>
                      ))}
                    </ul>
                    <div className={`plan-option-radio ${form.planType === plan.id ? 'selected' : ''}`}>
                      {form.planType === plan.id && <div className="radio-dot" />}
                    </div>
                  </div>
                ))}
              </div>
              <button className="btn btn-primary w-full btn-lg mt-6" onClick={next}>
                Continue <ChevronRight size={18} />
              </button>
            </div>
          )}

          { }
          {step === 2 && (
            <div className="step-content animate-fade-up">
              <div className="step-heading">
                <h2>Create Your Account</h2>
                <p className="text-muted text-sm">This will be your admin account for the restaurant.</p>
              </div>

              {error && <div className="alert alert-error">{error}</div>}

              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <div className="form-input-icon">
                    <User size={16} className="input-icon" />
                    <input
                      type="text"
                      className="form-input"
                      placeholder="John Smith"
                      value={form.name}
                      onChange={e => { set('name', e.target.value); clearErr('name'); }}
                    />
                  </div>
                  {errors.name && <span className="form-error">{errors.name}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <div className="form-input-icon">
                    <Mail size={16} className="input-icon" />
                    <input
                      type="email"
                      className="form-input"
                      placeholder="you@restaurant.com"
                      value={form.email}
                      onChange={e => { set('email', e.target.value); clearErr('email'); }}
                    />
                  </div>
                  {errors.email && <span className="form-error">{errors.email}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">Password</label>
                  <div className="form-input-icon" style={{ position: 'relative' }}>
                    <Lock size={16} className="input-icon" />
                    <input
                      type={showPass ? 'text' : 'password'}
                      className="form-input"
                      placeholder="Min. 6 characters"
                      value={form.password}
                      onChange={e => { set('password', e.target.value); clearErr('password'); }}
                    />
                    <button type="button" className="input-action" onClick={() => setShowPass(v => !v)}>
                      {showPass ? '🙈' : '👁'}
                    </button>
                  </div>
                  {errors.password && <span className="form-error">{errors.password}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">Confirm Password</label>
                  <div className="form-input-icon">
                    <Lock size={16} className="input-icon" />
                    <input
                      type={showPass ? 'text' : 'password'}
                      className="form-input"
                      placeholder="Repeat your password"
                      value={form.confirmPassword}
                      onChange={e => { set('confirmPassword', e.target.value); clearErr('confirmPassword'); }}
                    />
                  </div>
                  {errors.confirmPassword && <span className="form-error">{errors.confirmPassword}</span>}
                </div>
              </div>

              <div className="step-nav">
                <button className="btn btn-outline" onClick={back}>
                  <ChevronLeft size={18} /> Back
                </button>
                <button className="btn btn-primary" onClick={next}>
                  Continue <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}

          { }
          {step === 3 && (
            <div className="step-content animate-fade-up">
              <div className="step-heading">
                <h2>Restaurant Details</h2>
                <p className="text-muted text-sm">Tell us a bit about your restaurant. You can change this later.</p>
              </div>

              {error && <div className="alert alert-error">{error}</div>}

              <div className="form-grid">
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Restaurant Name *</label>
                  <div className="form-input-icon">
                    <Store size={16} className="input-icon" />
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Joe's Pizza"
                      value={form.restaurantName}
                      onChange={e => { set('restaurantName', e.target.value); clearErr('restaurantName'); }}
                    />
                  </div>
                  {errors.restaurantName && <span className="form-error">{errors.restaurantName}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">Cuisine Type</label>
                  <select
                    className="form-select"
                    value={form.cuisine}
                    onChange={e => set('cuisine', e.target.value)}
                  >
                    <option value="">Select cuisine...</option>
                    {CUISINES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <div className="form-input-icon">
                    <Phone size={16} className="input-icon" />
                    <input
                      type="tel"
                      className="form-input"
                      placeholder="+92 300 1234567"
                      value={form.phone}
                      onChange={e => set('phone', e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">City</label>
                  <div className="form-input-icon">
                    <MapPin size={16} className="input-icon" />
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Karachi"
                      value={form.city}
                      onChange={e => set('city', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="step-nav">
                <button className="btn btn-outline" onClick={back}>
                  <ChevronLeft size={18} /> Back
                </button>
                <button className="btn btn-primary" onClick={handleSubmit} disabled={isLoading}>
                  {isLoading ? (
                    <><div className="spinner" /> Creating Restaurant...</>
                  ) : (
                    <>Launch My Restaurant <ChevronRight size={18} /></>
                  )}
                </button>
              </div>
            </div>
          )}

          { }
          {step === 4 && (
            <div className="step-content text-center animate-fade-up">
              <div className="success-icon">🎉</div>
              <h2 className="text-3xl font-black">You're All Set!</h2>
              <p className="text-muted mt-4" style={{ maxWidth: 380, margin: '16px auto 0' }}>
                <strong style={{ color: 'var(--text)' }}>{form.restaurantName}</strong> is now live on DineFlow.
                Your {form.planType} plan is active.
              </p>

              <div className="success-checklist">
                {[
                  `${form.planType} plan activated`,
                  'Admin account created',
                  'Restaurant profile set up',
                  'Ready to accept orders',
                ].map((item, i) => (
                  <div key={i} className="success-check">
                    <Check size={16} style={{ color: 'var(--success)' }} />
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              <button className="btn btn-primary btn-lg w-full mt-8" onClick={handleGoToDashboard}>
                Go to Dashboard <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>

        { }
        <div className="onboarding-trust">
          {['🔒 256-bit SSL', '⚡ 99.9% Uptime', '💬 24/7 Support'].map(t => (
            <span key={t} className="trust-chip">{t}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
