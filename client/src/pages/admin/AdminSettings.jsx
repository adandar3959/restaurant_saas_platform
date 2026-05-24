import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Save, Store, Clock, Palette, CreditCard, CheckCircle, Loader, Crown } from 'lucide-react';
import { tenantApi } from '../../api/tenant.api';
import { usePlans } from '../../hooks/usePlans';

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const DEFAULT_HOURS = DAYS.reduce((acc, d) => ({ ...acc, [d]: { open: '09:00', close: '22:00', isOpen: true } }), {});

const PLAN_CONFIG = [
  {
    plan: 'Free', price: '$0', color: '#9CA3AF', details: 'Basic',
    features: ['1 Staff account', '5 Menu categories', '50 Menu items', '100 Orders/month'],
  },
  {
    plan: 'Pro', price: '$49', color: '#38BDF8', details: 'Most Popular',
    features: ['5 Staff accounts', 'Unlimited Menu items', '1,000 Orders/month', 'KDS + Tables + Inventory'],
  },
  {
    plan: 'Enterprise', price: '$149', color: '#A78BFA', details: 'Scale-up',
    features: ['Unlimited Staff', 'Unlimited Orders', 'Delivery Management', 'CRM & Loyalty', 'Full analytics'],
  },
];

const PLAN_ICONS = { Free: '🆓', Pro: '⚡', Enterprise: '🚀' };
const STATUS_COLORS = {
  Active: { bg: 'rgba(16,185,129,0.15)', color: '#10B981' },
  Pending: { bg: 'rgba(245,158,11,0.15)', color: '#F59E0B' },
  Trial: { bg: 'rgba(59,130,246,0.15)', color: '#3B82F6' },
  Suspended: { bg: 'rgba(239,68,68,0.15)', color: '#EF4444' },
  Expired: { bg: 'rgba(239,68,68,0.15)', color: '#EF4444' },
};

function SubscriptionTab({ restaurantId, restaurant }) {
  const [upgrading, setUpgrading] = useState(null);
  const { plans: dbPlans, loading: plansLoading } = usePlans();

  // Merge DB prices into static PLAN_CONFIG
  const plans = PLAN_CONFIG.map(p => {
    const db = dbPlans.find(d => d.planId === p.plan);
    return {
      ...p,
      price: db ? `$${db.price}` : p.price,
      features: db?.features?.length ? db.features : p.features,
    };
  }); // end plan merge

  const currentPlan = restaurant?.subscription?.planType || 'Free';
  const currentStatus = restaurant?.subscription?.status || 'Active';
  const planIcon = PLAN_ICONS[currentPlan] || '🆓';
  const statusStyle = STATUS_COLORS[currentStatus] || STATUS_COLORS.Active;

  const handleUpgrade = async (targetPlan) => {
    if (targetPlan === currentPlan) return;
    try {
      setUpgrading(targetPlan);
      const res = await tenantApi.createSubscriptionSession(restaurantId, { planType: targetPlan });
      if (res.data?.data?.url) window.location.href = res.data.data.url;
    } catch {
      alert('Failed to start checkout. Please try again.');
    } finally {
      setUpgrading(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28, marginTop: 24 }}>
      {/* Current plan banner */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 20, padding: '20px 24px',
        background: 'rgba(56,189,248,0.05)', border: '1px solid rgba(56,189,248,0.3)',
        borderRadius: 16,
      }}>
        <div style={{ fontSize: 40 }}>{planIcon}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#38BDF8' }}>
            {currentPlan.toUpperCase()} PLAN
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
            <span style={{
              padding: '2px 10px', borderRadius: 99, fontSize: 10, fontWeight: 800,
              background: statusStyle.bg, color: statusStyle.color,
            }}>
              {currentStatus.toUpperCase()}
            </span>
            {restaurant?.subscription?.validUntil && (
              <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>
                RENEWS {new Date(restaurant.subscription.validUntil).toLocaleDateString().toUpperCase()}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Plan cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
        {plans.map(p => {
          const isCurrent = currentPlan === p.plan;
          const isLoading = upgrading === p.plan;
          return (
            <div key={p.plan} style={{
              padding: 24, borderRadius: 16,
              border: `1px solid ${isCurrent ? p.color : 'var(--glass-border, rgba(255,255,255,0.08))'}`,
              background: isCurrent ? `${p.color}10` : 'transparent',
              display: 'flex', flexDirection: 'column', gap: 16,
              transition: 'all 0.3s ease',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontWeight: 900, fontSize: 16, color: p.color }}>{p.plan.toUpperCase()}</div>
                <div style={{ fontSize: 10, color: p.color, fontWeight: 700, opacity: 0.7 }}>{p.details.toUpperCase()}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                <span style={{ fontSize: 32, fontWeight: 900 }}>{p.price}</span>
                <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>/mo</span>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                {p.features.map(f => (
                  <li key={f} style={{ fontSize: 13, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: isCurrent ? p.color : '#10B981' }}>✓</span> {f}
                  </li>
                ))}
              </ul>
              {isCurrent ? (
                <div style={{
                  textAlign: 'center', padding: '8px', borderRadius: 8, fontSize: 11, fontWeight: 800,
                  background: `${p.color}18`, color: p.color,
                }}>
                  CURRENT ACTIVE PLAN
                </div>
              ) : (
                <button
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    padding: '10px', borderRadius: 10, border: `1px solid ${p.color}`,
                    color: p.color, fontWeight: 800, fontSize: 12, background: 'transparent',
                    cursor: isLoading ? 'not-allowed' : 'pointer', opacity: isLoading ? 0.7 : 1,
                    transition: 'all 0.2s',
                  }}
                  disabled={!!upgrading}
                  onClick={() => handleUpgrade(p.plan)}
                >
                  {isLoading
                    ? <><Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> REDIRECTING...</>
                    : <><Crown size={14} /> UPGRADE TO {p.plan.toUpperCase()}</>
                  }
                </button>
              )}
            </div>
          );
        })}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function AdminSettings() {
  const { restaurantId, restaurant } = useOutletContext();
  const [form,   setForm]   = useState({});
  const [saving, setSaving] = useState(false);
  const [toast,  setToast]  = useState(null);
  const [tab,    setTab]    = useState('general');

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    if (restaurant) {
      setForm({
        restaurantName: restaurant.restaurantName || '',
        slug:           restaurant.slug || '',
        description:    restaurant.description || '',
        phone:          restaurant.contactInfo?.phone || '',
        email:          restaurant.contactInfo?.email || '',
        city:           restaurant.address?.city || '',
        country:        restaurant.address?.country || '',
        currency:       restaurant.settings?.currency || 'USD',
        taxRate:        restaurant.settings?.taxRate || 0,
        primaryColor:   restaurant.branding?.primaryColor || '#2D6A4F',
        secondaryColor: restaurant.branding?.secondaryColor || '#1B4332',
        cardColor:      restaurant.branding?.cardColor || '#8AAA78',
        hours:          restaurant.settings?.openingHours || DEFAULT_HOURS,
      });
    }
  }, [restaurant]);

  const set = (key, val) => setForm(p => ({ ...p, [key]: val }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        restaurantName: form.restaurantName,
        slug:           form.slug,
        description:    form.description,
        contactInfo: {
          ...(form.phone && { phone: form.phone }),
          ...(form.email && { email: form.email }),
        },
        settings: {
          currency:      form.currency,
          taxRate:       parseFloat(form.taxRate) || 0,
          openingHours:  form.hours,
        },
        branding: { 
          primaryColor: form.primaryColor,
          secondaryColor: form.secondaryColor,
          cardColor: form.cardColor,
        },
      };
      // Only include address fields if they have values
      if (form.city || form.country) {
        payload.address = {
          ...(form.city    && { city: form.city }),
          ...(form.country && { country: form.country }),
        };
      }
      await tenantApi.updateRestaurant(restaurantId, payload);
      showToast('success', 'Settings saved successfully');
    } catch (e) {
      showToast('error', e?.response?.data?.message || 'Failed to save settings');
    } finally { setSaving(false); }
  };

  return (
    <div>
      {}
      {toast && (
        <div style={{
          position: 'fixed', top: 24, right: 24, zIndex: 9999,
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '12px 18px', borderRadius: 10, fontWeight: 600, fontSize: 14,
          background: toast.type === 'error' ? '#FEF2F2' : '#ECFDF5',
          border: `1px solid ${toast.type === 'error' ? '#FECACA' : '#A7F3D0'}`,
          color: toast.type === 'error' ? '#DC2626' : '#059669',
          boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
        }}>
          <CheckCircle size={16} />
          {toast.msg}
        </div>
      )}

      <div className="page-header">
        <div>
          <h1 className="page-title gradient-text-cyan">Settings</h1>
          <p className="page-subtitle">Manage your restaurant configuration & subscription</p>
        </div>
        <button className="btn btn-primary btn-sm" style={{ background: 'var(--neon-cyan)', color: '#0f172a', fontWeight: 800, border: 'none', boxShadow: '0 0 15px rgba(56, 189, 248, 0.4)' }} onClick={handleSave} disabled={saving}>
          {saving ? <div className="spinner" /> : <Save size={15} />}
          SAVE CHANGES
        </button>
      </div>

      {}
      <div className="orders-tabs" style={{ marginBottom: 'var(--space-6)' }}>
        {[['general','General'], ['hours','Opening Hours'], ['branding','Branding'], ['subscription','Subscription']].map(([k,l]) => (
          <button key={k} className={`orders-tab ${tab === k ? 'active' : ''}`} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>

      {tab === 'general' && (
        <div className="glass-panel animate-fade-up" style={{ padding: 'var(--space-8)' }}>
          <div className="settings-section-title" style={{ color: 'var(--neon-cyan)', borderBottom: '1px solid var(--glass-border)' }}>
            <Store size={18} /> RESTAURANT INFO
          </div>
          <div className="settings-grid" style={{ marginTop: 'var(--space-6)' }}>
            <div className="form-group" style={{ gridColumn: '1/-1' }}>
              <label className="form-label" style={{ fontWeight: 700, fontSize: 11, letterSpacing: '0.05em' }}>RESTAURANT NAME</label>
              <input className="form-input" value={form.restaurantName || ''} onChange={e => set('restaurantName', e.target.value)} style={{ background: 'rgba(255,255,255,0.02)' }} />
            </div>
            <div className="form-group" style={{ gridColumn: '1/-1' }}>
              <label className="form-label" style={{ fontWeight: 700, fontSize: 11, letterSpacing: '0.05em' }}>RESTAURANT URL SLUG</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)', border: '1px solid var(--glass-border)', padding: '0 var(--space-3)' }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, whiteSpace: 'nowrap' }}>localhost:5173/r/</span>
                <input
                  className="form-input"
                  value={form.slug || ''}
                  onChange={e => set('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, ''))}
                  placeholder="my-restaurant"
                  style={{ background: 'transparent', border: 'none', flex: 1, padding: 'var(--space-2) 0' }}
                />
              </div>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 'var(--space-2)', fontWeight: 500 }}>
                💡 Share this URL with customers: <span style={{ color: 'var(--neon-cyan)', fontWeight: 700 }}>localhost:5173/r/{form.slug || 'your-slug'}</span>
              </p>
            </div>
            <div className="form-group" style={{ gridColumn: '1/-1' }}>
              <label className="form-label" style={{ fontWeight: 700, fontSize: 11, letterSpacing: '0.05em' }}>DESCRIPTION</label>
              <textarea className="form-input" rows={3} value={form.description || ''} onChange={e => set('description', e.target.value)} placeholder="Tell customers about your restaurant..." style={{ background: 'rgba(255,255,255,0.02)' }} />
            </div>
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 700, fontSize: 11, letterSpacing: '0.05em' }}>PHONE</label>
              <input className="form-input" value={form.phone || ''} onChange={e => set('phone', e.target.value)} style={{ background: 'rgba(255,255,255,0.02)' }} />
            </div>
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 700, fontSize: 11, letterSpacing: '0.05em' }}>EMAIL</label>
              <input className="form-input" type="email" value={form.email || ''} onChange={e => set('email', e.target.value)} style={{ background: 'rgba(255,255,255,0.02)' }} />
            </div>
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 700, fontSize: 11, letterSpacing: '0.05em' }}>CITY</label>
              <input className="form-input" value={form.city || ''} onChange={e => set('city', e.target.value)} style={{ background: 'rgba(255,255,255,0.02)' }} />
            </div>
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 700, fontSize: 11, letterSpacing: '0.05em' }}>COUNTRY</label>
              <input className="form-input" value={form.country || ''} onChange={e => set('country', e.target.value)} style={{ background: 'rgba(255,255,255,0.02)' }} />
            </div>
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 700, fontSize: 11, letterSpacing: '0.05em' }}>CURRENCY</label>
              <select className="form-select" value={form.currency || 'USD'} onChange={e => set('currency', e.target.value)} style={{ background: 'rgba(255,255,255,0.02)' }}>
                {['USD','PKR','EUR','GBP','AED','SAR','INR'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 700, fontSize: 11, letterSpacing: '0.05em' }}>TAX RATE (%)</label>
              <input className="form-input" type="number" min="0" max="100" step="0.1" value={form.taxRate || 0} onChange={e => set('taxRate', e.target.value)} style={{ background: 'rgba(255,255,255,0.02)' }} />
            </div>
          </div>
        </div>
      )}

      {tab === 'hours' && (
        <div className="glass-panel animate-fade-up" style={{ padding: 'var(--space-8)' }}>
          <div className="settings-section-title" style={{ color: 'var(--neon-emerald)', borderBottom: '1px solid var(--glass-border)' }}>
            <Clock size={18} /> OPENING HOURS
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', marginTop: 'var(--space-6)' }}>
            {DAYS.map(day => {
              const h = form.hours?.[day] || { open: '09:00', close: '22:00', isOpen: true };
              return (
                <div key={day} className="hours-row" style={{ borderBottom: '1px solid var(--glass-border)', padding: 'var(--space-2) 0' }}>
                  <label className="checkbox-label" style={{ width: 140 }}>
                    <input type="checkbox" checked={h.isOpen} onChange={e => set('hours', { ...form.hours, [day]: { ...h, isOpen: e.target.checked } })} />
                    <span className="font-semi" style={{ fontSize: 13 }}>{day.toUpperCase()}</span>
                  </label>
                  {h.isOpen ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <input className="form-input" type="time" value={h.open} style={{ width: 120, background: 'rgba(255,255,255,0.03)' }} onChange={e => set('hours', { ...form.hours, [day]: { ...h, open: e.target.value } })} />
                      <span className="text-muted" style={{ fontSize: 11, fontWeight: 800 }}>TO</span>
                      <input className="form-input" type="time" value={h.close} style={{ width: 120, background: 'rgba(255,255,255,0.03)' }} onChange={e => set('hours', { ...form.hours, [day]: { ...h, close: e.target.value } })} />
                    </div>
                  ) : (
                    <span className="status-badge" style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--error)', border: '1px solid rgba(239,68,68,0.2)', fontSize: 10, fontWeight: 800 }}>CLOSED</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {tab === 'branding' && (
        <div className="settings-card card">
          <div className="settings-section-title"><Palette size={18} /> Branding Settings</div>
          
          <div className="settings-grid" style={{ marginTop: 'var(--space-4)', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 700, fontSize: 11, letterSpacing: '0.05em' }}>PRIMARY COLOR (HIGHLIGHTS)</label>
              <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
                <input type="color" value={form.primaryColor || '#2D6A4F'} onChange={e => set('primaryColor', e.target.value)} style={{ width: 48, height: 48, border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)', cursor: 'pointer', background: 'none', padding: 2 }} />
                <input className="form-input" value={form.primaryColor || '#2D6A4F'} onChange={e => set('primaryColor', e.target.value)} style={{ fontFamily: 'monospace', flex: 1 }} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 700, fontSize: 11, letterSpacing: '0.05em' }}>BACKGROUND COLOR</label>
              <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
                <input type="color" value={form.secondaryColor || '#1B4332'} onChange={e => set('secondaryColor', e.target.value)} style={{ width: 48, height: 48, border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)', cursor: 'pointer', background: 'none', padding: 2 }} />
                <input className="form-input" value={form.secondaryColor || '#1B4332'} onChange={e => set('secondaryColor', e.target.value)} style={{ fontFamily: 'monospace', flex: 1 }} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 700, fontSize: 11, letterSpacing: '0.05em' }}>CATEGORY CARD COLOR</label>
              <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
                <input type="color" value={form.cardColor || '#8AAA78'} onChange={e => set('cardColor', e.target.value)} style={{ width: 48, height: 48, border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)', cursor: 'pointer', background: 'none', padding: 2 }} />
                <input className="form-input" value={form.cardColor || '#8AAA78'} onChange={e => set('cardColor', e.target.value)} style={{ fontFamily: 'monospace', flex: 1 }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'subscription' && (
        <div className="glass-panel animate-fade-up" style={{ padding: 'var(--space-8)' }}>
          <div className="settings-section-title" style={{ color: 'var(--neon-purple)', borderBottom: '1px solid var(--glass-border)' }}>
            <CreditCard size={18} /> SUBSCRIPTION PLAN
          </div>

          <SubscriptionTab restaurantId={restaurantId} restaurant={restaurant} />
        </div>
      )}

      <style>{`
        .settings-card { padding: var(--space-8); display: flex; flex-direction: column; gap: var(--space-6); }
        .settings-section-title { display: flex; align-items: center; gap: var(--space-3); font-size: 16px; font-weight: 700; padding-bottom: var(--space-4); border-bottom: 1px solid var(--border); }
        .settings-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-5); }
        .hours-row { display: flex; align-items: center; gap: var(--space-4); padding: var(--space-3) 0; border-bottom: 1px solid var(--border); }
      `}</style>
    </div>
  );
}

