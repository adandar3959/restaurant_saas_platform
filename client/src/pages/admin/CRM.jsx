import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Plus, Star, X, MessageSquare, Tag, CheckCircle, AlertCircle, Trash2, Pencil } from 'lucide-react';
import { crmApi } from '../../api/crm.api';
import { formatDate } from '../../lib/utils';
import UpgradeGate from '../../components/common/UpgradeGate';

function Toast({ toast }) {
  if (!toast) return null;
  const isErr = toast.type === 'error';
  return (
    <div style={{
      position: 'fixed', top: 24, right: 24, zIndex: 9999,
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '12px 18px', borderRadius: 10, fontWeight: 700, fontSize: 13,
      background: isErr ? '#7f1d1d' : 'var(--bg-surface-2)',
      border: `1px solid ${isErr ? '#ef4444' : 'var(--primary)'}`,
      color: '#fff',
      boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
    }}>
      {isErr ? <AlertCircle size={16} /> : <CheckCircle size={16} />}
      {toast.msg}
    </div>
  );
}

function StarRow({ rating, count, total }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
      <span style={{ width: 8, color: 'var(--text-muted)', textAlign: 'right' }}>{rating}</span>
      <Star size={12} fill="#F59E0B" color="#F59E0B" />
      <div style={{ flex: 1, height: 6, background: 'var(--bg-surface-2)', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: '#F59E0B', borderRadius: 99, transition: 'width 0.5s' }} />
      </div>
      <span className="text-muted" style={{ width: 30, textAlign: 'right' }}>{count}</span>
    </div>
  );
}

export default function CRM() {
  const { restaurantId } = useOutletContext();
  const [reviews,  setReviews]  = useState([]);
  const [coupons,  setCoupons]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [tab,      setTab]      = useState('reviews');
  const [modal,    setModal]    = useState(false);
  const [form,     setForm]     = useState({});
  const [saving,   setSaving]   = useState(false);
  const [replyId,  setReplyId]  = useState(null);
  const [reply,    setReply]    = useState('');
  const [toast,    setToast]    = useState(null);

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  };

  const load = async () => {
    setLoading(true);
    try {
      const [r, c] = await Promise.all([
        crmApi.getReviews(restaurantId),
        crmApi.getCoupons(restaurantId),
      ]);
      setReviews(r.data?.data?.reviews || r.data?.data || []);
      setCoupons(c.data?.data || []);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [restaurantId]);

  const handleSaveCoupon = async () => {
    if (!form.code || !form.discountValue) {
      showToast('error', 'Code and discount value are required');
      return;
    }
    setSaving(true);
    try {
      if (form._id) await crmApi.updateCoupon(restaurantId, form._id, form);
      else          await crmApi.createCoupon(restaurantId, form);
      setModal(false);
      setForm({});
      load();
      showToast('success', form._id ? 'Coupon updated' : 'Coupon created');
    } catch (e) {
      showToast('error', e?.response?.data?.message || 'Failed to save coupon');
    } finally { setSaving(false); }
  };

  const handleDeleteCoupon = async (c) => {
    if (!window.confirm(`Delete coupon "${c.code}"?`)) return;
    try {
      await crmApi.deleteCoupon(restaurantId, c._id);
      load();
      showToast('success', `Coupon ${c.code} deleted`);
    } catch { showToast('error', 'Failed to delete coupon'); }
  };

  const handleReply = async (reviewId) => {
    if (!reply.trim()) return;
    try {
      await crmApi.respondReview(restaurantId, reviewId, reply);
      setReplyId(null);
      setReply('');
      load();
      showToast('success', 'Reply sent');
    } catch { showToast('error', 'Failed to send reply'); }
  };

  const avgRating  = reviews.length ? (reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length) : 0;
  const ratingDist = [5, 4, 3, 2, 1].map(n => ({
    rating: n,
    count: reviews.filter(r => Math.round(r.rating) === n).length,
  }));
  const activeCoupons = coupons.filter(c => c.isActive).length;

  return (
    <UpgradeGate featureKey="crm" requiredPlanName="Enterprise">
      <div>
        <Toast toast={toast} />

      <div className="page-header">
        <div>
          <h1 className="page-title gradient-text-cyan">CRM & Loyalty</h1>
          <p className="page-subtitle">
            {reviews.length} reviews · <span style={{ color: '#F59E0B', fontWeight: 800 }}>avg {avgRating.toFixed(1)}⭐</span> · {coupons.length} coupons
          </p>
        </div>
        {tab === 'coupons' && (
          <button className="btn btn-primary btn-sm" onClick={() => { setForm({ discountType: 'Percentage' }); setModal(true); }}>
            <Plus size={15} /> New Coupon
          </button>
        )}
      </div>

      {}
      {tab === 'reviews' && reviews.length > 0 && (
        <div className="glass-panel animate-fade-up" style={{ display: 'flex', gap: 'var(--space-8)', alignItems: 'center', marginBottom: 'var(--space-6)', padding: 'var(--space-6)', flexWrap: 'wrap' }}>
          {}
          <div style={{ textAlign: 'center', minWidth: 120 }}>
            <div style={{ fontSize: 64, fontWeight: 900, color: '#F59E0B', lineHeight: 1, textShadow: '0 0 20px rgba(245, 158, 11, 0.3)' }}>{avgRating.toFixed(1)}</div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 4, margin: '12px 0' }}>
              {[1,2,3,4,5].map(n => (
                <Star key={n} size={16} fill={n <= Math.round(avgRating) ? '#F59E0B' : 'none'} color="#F59E0B" />
              ))}
            </div>
            <div className="text-xs text-muted" style={{ fontWeight: 700, letterSpacing: '0.05em' }}>{reviews.length.toUpperCase()} REVIEWS</div>
          </div>
          {}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, minWidth: 200 }}>
            {ratingDist.map(r => (
              <StarRow key={r.rating} {...r} total={reviews.length} />
            ))}
          </div>
          {}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', minWidth: 240 }}>
            {[
              { label: 'Replied',    value: reviews.filter(r => r.response).length, color: 'var(--neon-emerald)' },
              { label: 'Pending',    value: reviews.filter(r => !r.response).length, color: '#F59E0B' },
              { label: '5-Stars',    value: reviews.filter(r => r.rating >= 5).length, color: 'var(--neon-cyan)' },
              { label: 'Low Rated',  value: reviews.filter(r => r.rating <= 2).length, color: 'var(--error)' },
            ].map(s => (
              <div key={s.label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', borderRadius: 12, padding: '12px 16px' }}>
                <div style={{ fontSize: 24, fontWeight: 900, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>{s.label.toUpperCase()}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {}
      <div className="orders-tabs" style={{ marginBottom: 'var(--space-4)' }}>
        <button className={`orders-tab ${tab === 'reviews' ? 'active' : ''}`} onClick={() => setTab('reviews')}>
          Reviews <span className="orders-tab-count">{reviews.length}</span>
        </button>
        <button className={`orders-tab ${tab === 'coupons' ? 'active' : ''}`} onClick={() => setTab('coupons')}>
          Coupons <span className="orders-tab-count">{coupons.length}</span>
          {activeCoupons > 0 && (
            <span className="orders-tab-count" style={{ background: 'rgba(16,185,129,0.2)', color: 'var(--success)' }}>{activeCoupons} active</span>
          )}
        </button>
      </div>

      {loading ? <div className="page-loading"><div className="spinner-lg" /></div> : (
        <>
          {}
          {tab === 'reviews' && (
            reviews.length === 0 ? (
              <div className="data-table-wrap">
                <div className="empty-state">
                  <div className="empty-state-icon">⭐</div>
                  <div className="empty-state-title">No reviews yet</div>
                  <p>Customer reviews will appear here once orders are completed.</p>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
                {reviews.map((r, idx) => (
                  <div key={r._id} className="glass-panel animate-fade-up" style={{ animationDelay: `${idx * 50}ms`, padding: 'var(--space-5)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'center' }}>
                        <div style={{
                          width: 42, height: 42, borderRadius: '50%', display: 'flex', alignItems: 'center',
                          justifyContent: 'center', fontWeight: 900, fontSize: 16,
                          background: 'rgba(56,189,248,0.1)', color: 'var(--neon-cyan)',
                          border: '1px solid rgba(56,189,248,0.2)'
                        }}>
                          {(r.customerId?.name || 'C')[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semi" style={{ color: 'var(--text)' }}>{r.customerId?.name || 'Anonymous Customer'}</div>
                          <div className="text-xs text-muted" style={{ fontWeight: 600 }}>{formatDate(r.createdAt).toUpperCase()}</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(245,158,11,0.1)', padding: '6px 12px', borderRadius: 20, border: '1px solid rgba(245,158,11,0.2)' }}>
                        {[1,2,3,4,5].map(n => (
                          <Star key={n} size={14} fill={n <= r.rating ? '#F59E0B' : 'none'} color="#F59E0B" />
                        ))}
                        <span style={{ marginLeft: 6, fontWeight: 900, color: '#F59E0B', fontSize: 14 }}>{r.rating}</span>
                      </div>
                    </div>

                    {r.comment && <p className="text-sm" style={{ color: 'var(--text-muted)', lineHeight: 1.7, marginTop: 'var(--space-3)', fontStyle: 'italic' }}>"{r.comment}"</p>}

                    {r.response ? (
                      <div style={{ background: 'rgba(56,189,248,0.05)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)', borderLeft: '4px solid var(--neon-cyan)', marginTop: 'var(--space-4)' }}>
                        <div style={{ fontSize: 10, fontWeight: 900, color: 'var(--neon-cyan)', marginBottom: 6, letterSpacing: '0.08em' }}>OFFICIAL RESPONSE</div>
                        <p className="text-sm" style={{ color: 'var(--text)', opacity: 0.9 }}>{r.response}</p>
                      </div>
                    ) : (
                      <div style={{ marginTop: 'var(--space-4)' }}>
                        {replyId === r._id ? (
                          <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'flex-start' }}>
                            <textarea
                              className="form-input"
                              rows={2}
                              placeholder="Type your professional response..."
                              value={reply}
                              onChange={e => setReply(e.target.value)}
                              style={{ flex: 1, resize: 'none', background: 'rgba(255,255,255,0.02)' }}
                            />
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                              <button className="btn btn-primary btn-sm" onClick={() => handleReply(r._id)}>SEND</button>
                              <button className="btn btn-ghost btn-sm" onClick={() => { setReplyId(null); setReply(''); }}>CANCEL</button>
                            </div>
                          </div>
                        ) : (
                          <button className="btn btn-ghost btn-xs" style={{ color: 'var(--neon-cyan)', fontWeight: 700 }} onClick={() => setReplyId(r._id)}>
                            <MessageSquare size={13} style={{ marginRight: 6 }} /> REPLY TO REVIEW
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )
          )}

          {}
          {tab === 'coupons' && (
            <div className="data-table-wrap glass-panel animate-fade-up">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Code</th><th>Type</th><th>Value</th><th>Min Order</th>
                    <th>Expires</th><th>Uses</th><th>Status</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {coupons.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: 'var(--space-12)', color: 'var(--text-muted)' }}>
                        <div style={{ fontSize: 32, marginBottom: 8 }}>🎟️</div>
                        <div>No coupons yet — </div>
                        <button className="btn btn-ghost btn-xs" style={{ color: 'var(--neon-cyan)' }} onClick={() => { setForm({ discountType: 'Percentage' }); setModal(true); }}>
                          <Plus size={14} /> New Coupon
                        </button>
                      </td>
                    </tr>
                  ) : coupons.map(c => (
                    <tr key={c._id}>
                      <td>
                        <code style={{ background: 'rgba(56,189,248,0.1)', padding: '4px 12px', borderRadius: 8, fontSize: 14, fontWeight: 900, color: 'var(--neon-cyan)', border: '1px solid rgba(56,189,248,0.2)', letterSpacing: '0.1em' }}>
                          {c.code}
                        </code>
                      </td>
                      <td className="text-muted">{c.discountType.toUpperCase()}</td>
                      <td className="font-semi" style={{ color: 'var(--neon-cyan)', fontSize: 16 }}>
                        {c.discountType === 'Percentage' ? `${c.discountValue}%` : `$${c.discountValue}`}
                      </td>
                      <td className="text-muted">${c.minimumOrderAmount?.toFixed(2) || '0.00'}</td>
                      <td className="text-muted text-sm">{c.expiryDate ? formatDate(c.expiryDate).toUpperCase() : '—'}</td>
                      <td className="text-muted font-semi">{c.usageCount ?? 0} <span style={{ opacity: 0.5 }}>/</span> {c.usageLimit ?? '∞'}</td>
                      <td>
                        <span className="status-badge" style={{
                          background: c.isActive ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.05)',
                          color: c.isActive ? 'var(--neon-emerald)' : 'var(--text-subtle)',
                          border: `1px solid ${c.isActive ? 'var(--neon-emerald-glow)33' : 'transparent'}`,
                          fontWeight: 800, fontSize: 10
                        }}>
                          {c.isActive ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button className="btn btn-ghost btn-xs" style={{ color: 'var(--neon-cyan)' }} onClick={() => { setForm(c); setModal(true); }}>
                            <Pencil size={14} />
                          </button>
                          <button className="btn btn-ghost btn-xs" style={{ color: 'var(--error)' }} onClick={() => handleDeleteCoupon(c)}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title"><Tag size={18} /> {form._id ? 'Edit' : 'Create'} Coupon</h3>
              <button className="modal-close" onClick={() => setModal(false)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Coupon Code *</label>
                <input
                  className="form-input"
                  style={{ textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.1em' }}
                  value={form.code || ''}
                  onChange={e => setForm(p => ({ ...p, code: e.target.value.toUpperCase() }))}
                  placeholder="SAVE20"
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                <div className="form-group">
                  <label className="form-label">Discount Type</label>
                  <select className="form-select" value={form.discountType || 'Percentage'} onChange={e => setForm(p => ({ ...p, discountType: e.target.value }))}>
                    <option value="Percentage">Percentage (%)</option>
                    <option value="Fixed">Fixed Amount ($)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Value *</label>
                  <input className="form-input" type="number" min="0"
                    value={form.discountValue || ''}
                    onChange={e => setForm(p => ({ ...p, discountValue: parseFloat(e.target.value) }))}
                    placeholder={form.discountType === 'Percentage' ? '20' : '5.00'} />
                </div>
                <div className="form-group">
                  <label className="form-label">Min Order ($)</label>
                  <input className="form-input" type="number" min="0"
                    value={form.minimumOrderAmount || ''}
                    onChange={e => setForm(p => ({ ...p, minimumOrderAmount: parseFloat(e.target.value) }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Usage Limit</label>
                  <input className="form-input" type="number" min="1"
                    value={form.usageLimit || ''}
                    onChange={e => setForm(p => ({ ...p, usageLimit: parseInt(e.target.value) }))}
                    placeholder="Unlimited" />
                </div>
                <div className="form-group" style={{ gridColumn: '1/-1' }}>
                  <label className="form-label">Expiry Date</label>
                  <input className="form-input" type="date"
                    value={form.expiryDate?.slice(0, 10) || ''}
                    onChange={e => setForm(p => ({ ...p, expiryDate: e.target.value }))} />
                </div>
                {form._id && (
                  <div className="form-group" style={{ gridColumn: '1/-1' }}>
                    <label className="checkbox-label">
                      <input type="checkbox" checked={!!form.isActive} onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))} />
                      <span>Coupon is Active</span>
                    </label>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSaveCoupon} disabled={saving}>
                {saving ? <div className="spinner" /> : <Tag size={15} />} {form._id ? 'Save Changes' : 'Create Coupon'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </UpgradeGate>
  );
}
