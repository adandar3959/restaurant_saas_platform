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
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 24, right: 24, zIndex: 9999,
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '12px 18px', borderRadius: 10, fontWeight: 600, fontSize: 14,
          background: toast.type === 'error' ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)',
          border: `1px solid ${toast.type === 'error' ? '#EF4444' : '#10B981'}`,
          color: toast.type === 'error' ? '#FCA5A5' : '#6EE7B7',
          backdropFilter: 'blur(8px)',
        }}>
          <CheckCircle size={16} />
          {toast.msg}
        </div>
      )}

      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Manage your restaurant configuration</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
          {saving ? <div className="spinner" /> : <Save size={15} />}
          Save Changes
        </button>
      </div>

      {/* Settings tabs */}
      <div className="orders-tabs" style={{ marginBottom: 'var(--space-6)' }}>
        {[['general','General'], ['hours','Opening Hours'], ['branding','Branding'], ['subscription','Subscription']].map(([k,l]) => (
          <button key={k} className={`orders-tab ${tab === k ? 'active' : ''}`} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>

      {tab === 'general' && (
        <div className="settings-card card">
          <div className="settings-section-title"><Store size={18} /> Restaurant Info</div>
          <div className="settings-grid">
            <div className="form-group" style={{ gridColumn: '1/-1' }}>
              <label className="form-label">Restaurant Name</label>
              <input className="form-input" value={form.restaurantName || ''} onChange={e => set('restaurantName', e.target.value)} />
            </div>
            <div className="form-group" style={{ gridColumn: '1/-1' }}>
              <label className="form-label">Description</label>
              <textarea className="form-input" rows={3} value={form.description || ''} onChange={e => set('description', e.target.value)} placeholder="Tell customers about your restaurant..." />
            </div>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input className="form-input" value={form.phone || ''} onChange={e => set('phone', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" type="email" value={form.email || ''} onChange={e => set('email', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">City</label>
              <input className="form-input" value={form.city || ''} onChange={e => set('city', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Country</label>
              <input className="form-input" value={form.country || ''} onChange={e => set('country', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Currency</label>
              <select className="form-select" value={form.currency || 'USD'} onChange={e => set('currency', e.target.value)}>
                {['USD','PKR','EUR','GBP','AED','SAR','INR'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Tax Rate (%)</label>
              <input className="form-input" type="number" min="0" max="100" step="0.1" value={form.taxRate || 0} onChange={e => set('taxRate', e.target.value)} />
            </div>
          </div>
        </div>
      )}

      {tab === 'hours' && (
        <div className="settings-card card">
          <div className="settings-section-title"><Clock size={18} /> Opening Hours</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {DAYS.map(day => {
              const h = form.hours?.[day] || { open: '09:00', close: '22:00', isOpen: true };
              return (
                <div key={day} className="hours-row">
                  <label className="checkbox-label" style={{ width: 120 }}>
                    <input type="checkbox" checked={h.isOpen} onChange={e => set('hours', { ...form.hours, [day]: { ...h, isOpen: e.target.checked } })} />
                    <span className="font-semi" style={{ fontSize: 14 }}>{day}</span>
                  </label>
                  {h.isOpen ? (
                    <>
                      <input className="form-input" type="time" value={h.open} style={{ width: 130 }} onChange={e => set('hours', { ...form.hours, [day]: { ...h, open: e.target.value } })} />
                      <span className="text-muted">to</span>
                      <input className="form-input" type="time" value={h.close} style={{ width: 130 }} onChange={e => set('hours', { ...form.hours, [day]: { ...h, close: e.target.value } })} />
                    </>
                  ) : (
                    <span className="text-muted text-sm">Closed</span>
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
        <div className="settings-card card">
          <div className="settings-section-title"><CreditCard size={18} /> Subscription</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
            {/* Current plan */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', padding: 'var(--space-5)', background: 'var(--primary-glow)', border: '1px solid var(--primary)', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ fontSize: 36 }}>
                {restaurant?.subscription?.plan === 'Pro' ? '⭐' : restaurant?.subscription?.plan === 'Enterprise' ? '🚀' : '🆓'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 20, fontWeight: 800 }}>
                  {restaurant?.subscription?.plan || 'Free'} Plan
                </div>
                <div className="text-sm text-muted">
                  Status: <strong style={{ color: restaurant?.subscription?.status === 'Active' ? 'var(--success)' : 'var(--error)' }}>
                    {restaurant?.subscription?.status || 'Active'}
                  </strong>
                </div>
                {restaurant?.subscription?.expiresAt && (
                  <div className="text-xs text-muted">
                    Renews {new Date(restaurant.subscription.expiresAt).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>

            {/* Plan features */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-4)' }}>
              {[
                { plan: 'Free',       price: '$0/mo',    features: ['1 location', '50 orders/mo', 'Basic reports', 'Email support'] },
                { plan: 'Pro',        price: '$49/mo',   features: ['5 locations', 'Unlimited orders', 'Advanced reports', 'Priority support', 'Custom branding'] },
                { plan: 'Enterprise', price: '$149/mo',  features: ['Unlimited locations', 'Unlimited orders', 'Full analytics', '24/7 support', 'API access', 'White-label'] },
              ].map(p => {
                const isCurrent = (restaurant?.subscription?.plan || 'Free') === p.plan;
                return (
                  <div key={p.plan} style={{
                    padding: 'var(--space-5)', borderRadius: 'var(--radius-lg)',
                    border: `1px solid ${isCurrent ? 'var(--primary)' : 'var(--border)'}`,
                    background: isCurrent ? 'var(--primary-glow)' : 'var(--bg-surface)',
                    display: 'flex', flexDirection: 'column', gap: 'var(--space-3)',
                  }}>
                    <div style={{ fontWeight: 800, fontSize: 16 }}>{p.plan}</div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--primary)' }}>{p.price}</div>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {p.features.map(f => (
                        <li key={f} style={{ fontSize: 13, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ color: 'var(--success)', fontSize: 14 }}>✓</span> {f}
                        </li>
                      ))}
                    </ul>
                    {!isCurrent && (
                      <button className="btn btn-outline btn-sm" style={{ marginTop: 'auto' }}>
                        Upgrade to {p.plan}
                      </button>
                    )}
                    {isCurrent && (
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)', textAlign: 'center' }}>
                        ✓ Current Plan
                      </span>
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

