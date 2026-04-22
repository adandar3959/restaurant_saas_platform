import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Save, Store, Clock, Palette, CreditCard, CheckCircle } from 'lucide-react';
import { tenantApi } from '../../api/tenant.api';

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const DEFAULT_HOURS = DAYS.reduce((acc, d) => ({ ...acc, [d]: { open: '09:00', close: '22:00', isOpen: true } }), {});

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
        description:    restaurant.description || '',
        phone:          restaurant.contactInfo?.phone || '',
        email:          restaurant.contactInfo?.email || '',
        city:           restaurant.address?.city || '',
        country:        restaurant.address?.country || '',
        currency:       restaurant.settings?.currency || 'USD',
        taxRate:        restaurant.settings?.taxRate || 0,
        primaryColor:   restaurant.branding?.primaryColor || '#FF6B35',
        hours:          restaurant.settings?.openingHours || DEFAULT_HOURS,
      });
    }
  }, [restaurant]);

  const set = (key, val) => setForm(p => ({ ...p, [key]: val }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await tenantApi.updateRestaurant(restaurantId, {
        restaurantName: form.restaurantName,
        description:    form.description,
        contactInfo: { phone: form.phone, email: form.email },
        address: { city: form.city, country: form.country },
        settings: { currency: form.currency, taxRate: parseFloat(form.taxRate), openingHours: form.hours },
        branding: { primaryColor: form.primaryColor },
      });
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
          <div className="settings-section-title"><Palette size={18} /> Branding</div>
          <div className="form-group" style={{ maxWidth: 320 }}>
            <label className="form-label">Primary Color</label>
            <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
              <input type="color" value={form.primaryColor || '#FF6B35'} onChange={e => set('primaryColor', e.target.value)} style={{ width: 48, height: 48, border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', cursor: 'pointer', background: 'none', padding: 2 }} />
              <input className="form-input" value={form.primaryColor || '#FF6B35'} onChange={e => set('primaryColor', e.target.value)} style={{ fontFamily: 'monospace', flex: 1 }} />
            </div>
          </div>
        </div>
      )}

      {tab === 'subscription' && (
        <div className="glass-panel animate-fade-up" style={{ padding: 'var(--space-8)' }}>
          <div className="settings-section-title" style={{ color: 'var(--neon-purple)', borderBottom: '1px solid var(--glass-border)' }}>
            <CreditCard size={18} /> SUBSCRIPTION PLAN
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)', marginTop: 'var(--space-6)' }}>
            {}
            <div style={{ 
              display: 'flex', alignItems: 'center', gap: 'var(--space-6)', padding: 'var(--space-6)', 
              background: 'rgba(56,189,248,0.05)', border: '1px solid var(--neon-cyan)', borderRadius: 16,
              boxShadow: '0 0 20px rgba(56,189,248,0.1)' 
            }}>
              <div style={{ fontSize: 42, filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.5))' }}>
                {restaurant?.subscription?.plan === 'Pro' ? '⭐' : restaurant?.subscription?.plan === 'Enterprise' ? '🚀' : '🆓'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--neon-cyan)', letterSpacing: '0.02em' }}>
                  {(restaurant?.subscription?.plan || 'Free').toUpperCase()} PLAN
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
                  <span className="status-badge" style={{ 
                    background: restaurant?.subscription?.status === 'Active' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                    color: restaurant?.subscription?.status === 'Active' ? 'var(--neon-emerald)' : 'var(--error)',
                    fontWeight: 800, fontSize: 10
                  }}>
                    {restaurant?.subscription?.status?.toUpperCase() || 'ACTIVE'}
                  </span>
                  {restaurant?.subscription?.expiresAt && (
                    <span className="text-muted" style={{ fontSize: 11, fontWeight: 600 }}>RENEWS {new Date(restaurant.subscription.expiresAt).toLocaleDateString().toUpperCase()}</span>
                  )}
                </div>
              </div>
            </div>

            {}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-6)' }}>
              {[
                { plan: 'Free',       price: '$0',    color: 'var(--text-muted)', details: 'Basic', features: ['1 location', '50 orders/mo', 'Basic reports', 'Email support'] },
                { plan: 'Pro',        price: '$49',   color: 'var(--neon-cyan)', details: 'Most Popular', features: ['5 locations', 'Unlimited orders', 'Advanced reports', 'Priority support', 'Custom branding'] },
                { plan: 'Enterprise', price: '$149',  color: 'var(--neon-purple)', details: 'Scale-up', features: ['Unlimited locations', 'Unlimited orders', 'Full analytics', '24/7 support', 'API access', 'White-label'] },
              ].map(p => {
                const isCurrent = (restaurant?.subscription?.plan || 'Free') === p.plan;
                return (
                  <div key={p.plan} className={`glass-panel ${isCurrent ? 'glow-cyan' : ''}`} style={{
                    padding: 'var(--space-6)', borderRadius: 20,
                    border: `1px solid ${isCurrent ? p.color : 'var(--glass-border)'}`,
                    display: 'flex', flexDirection: 'column', gap: 'var(--space-4)',
                    background: isCurrent ? 'rgba(255,255,255,0.02)' : 'none',
                    transition: 'all 0.3s ease'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontWeight: 900, fontSize: 18, color: p.color }}>{p.plan.toUpperCase()}</div>
                      <div className="text-xs" style={{ color: p.color, fontWeight: 800, opacity: 0.7 }}>{p.details.toUpperCase()}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                      <span style={{ fontSize: 36, fontWeight: 900, color: '#fff' }}>{p.price}</span>
                      <span className="text-muted" style={{ fontSize: 14 }}>/MO</span>
                    </div>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 'var(--space-2) 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {p.features.map(f => (
                        <li key={f} style={{ fontSize: 13, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ color: isCurrent ? p.color : 'var(--neon-emerald)', fontSize: 16 }}>✓</span> {f}
                        </li>
                      ))}
                    </ul>
                    {!isCurrent && (
                      <button className="btn btn-outline btn-sm" style={{ marginTop: 'auto', border: `1px solid ${p.color}`, color: p.color, fontWeight: 800 }}>
                        UPGRADE TO {p.plan.toUpperCase()}
                      </button>
                    )}
                    {isCurrent && (
                      <div style={{ marginTop: 'auto', textAlign: 'center', background: 'rgba(56,189,248,0.1)', padding: '6px', borderRadius: 8, color: 'var(--neon-cyan)', fontWeight: 800, fontSize: 11 }}>
                        CURRENT ACTIVE PLAN
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
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

