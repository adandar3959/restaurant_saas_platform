import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Plus, Star, X, MessageSquare, Tag, CheckCircle, AlertCircle, Trash2, Pencil } from 'lucide-react';
import { crmApi } from '../../api/crm.api';
import { formatDate } from '../../lib/utils';

function Toast({ toast }) {
  if (!toast) return null;
  const isErr = toast.type === 'error';
  return (
    <div style={{
      position: 'fixed', top: 24, right: 24, zIndex: 9999,
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '12px 18px', borderRadius: 10, fontWeight: 600, fontSize: 14,
      background: isErr ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)',
      border: `1px solid ${isErr ? '#EF4444' : '#10B981'}`,
      color: isErr ? '#FCA5A5' : '#6EE7B7',
      backdropFilter: 'blur(8px)',
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

  // Stats
  const avgRating  = reviews.length ? (reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length) : 0;
  const ratingDist = [5, 4, 3, 2, 1].map(n => ({
    rating: n,
    count: reviews.filter(r => Math.round(r.rating) === n).length,
  }));
  const activeCoupons = coupons.filter(c => c.isActive).length;

  return (
    <div>
      <Toast toast={toast} />

      <div className="page-header">
        <div>
          <h1 className="page-title">CRM & Loyalty</h1>
          <p className="page-subtitle">
            {reviews.length} reviews · avg {avgRating.toFixed(1)}⭐ · {coupons.length} coupons
          </p>
        </div>
        {tab === 'coupons' && (
          <button className="btn btn-primary btn-sm" onClick={() => { setForm({ discountType: 'Percentage' }); setModal(true); }}>
            <Plus size={15} /> New Coupon
          </button>
        )}
      </div>

      {/* Rating summary (only on reviews tab) */}
      {tab === 'reviews' && reviews.length > 0 && (
        <div className="card" style={{ display: 'flex', gap: 'var(--space-8)', alignItems: 'center', marginBottom: 'var(--space-5)', flexWrap: 'wrap' }}>
          {/* Big average */}
          <div style={{ textAlign: 'center', minWidth: 100 }}>
            <div style={{ fontSize: 48, fontWeight: 900, color: '#F59E0B', lineHeight: 1 }}>{avgRating.toFixed(1)}</div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 2, margin: '6px 0' }}>
              {[1,2,3,4,5].map(n => (
                <Star key={n} size={14} fill={n <= Math.round(avgRating) ? '#F59E0B' : 'none'} color="#F59E0B" />
              ))}
            </div>
            <div className="text-xs text-muted">{reviews.length} reviews</div>
          </div>
          {/* Distribution bars */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6, minWidth: 200 }}>
            {ratingDist.map(r => (
              <StarRow key={r.rating} {...r} total={reviews.length} />
            ))}
          </div>
          {/* Stat cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)', minWidth: 200 }}>
            {[
              { label: 'Replied',    value: reviews.filter(r => r.response).length, color: '#10B981' },
              { label: 'Pending',    value: reviews.filter(r => !r.response).length, color: '#F59E0B' },
              { label: '5-Stars',    value: reviews.filter(r => r.rating >= 5).length, color: '#818CF8' },
              { label: 'Low Rated',  value: reviews.filter(r => r.rating <= 2).length, color: '#F87171' },
            ].map(s => (
              <div key={s.label} style={{ background: 'var(--bg-surface-2)', borderRadius: 8, padding: '8px 12px' }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
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
          {/* ── Reviews ─────────────────────────────────────────────────── */}
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                {reviews.map(r => (
                  <div key={r._id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
                        <div style={{
                          width: 38, height: 38, borderRadius: '50%', display: 'flex', alignItems: 'center',
                          justifyContent: 'center', fontWeight: 800, fontSize: 15,
                          background: 'rgba(99,102,241,0.15)', color: '#818CF8',
                        }}>
                          {(r.customerId?.name || 'C')[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semi">{r.customerId?.name || 'Customer'}</div>
                          <div className="text-xs text-muted">{formatDate(r.createdAt)}</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 2, background: 'rgba(245,158,11,0.12)', padding: '4px 10px', borderRadius: 20 }}>
                        {[1,2,3,4,5].map(n => (
                          <Star key={n} size={13} fill={n <= r.rating ? '#F59E0B' : 'none'} color="#F59E0B" />
                        ))}
                        <span style={{ marginLeft: 4, fontWeight: 700, color: '#F59E0B', fontSize: 13 }}>{r.rating}</span>
                      </div>
                    </div>

                    {r.comment && <p className="text-sm" style={{ color: 'var(--text)', lineHeight: 1.6 }}>{r.comment}</p>}

                    {r.response ? (
                      <div style={{ background: 'var(--bg-surface-2)', borderRadius: 'var(--radius-md)', padding: 'var(--space-3)', borderLeft: '3px solid var(--primary)' }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)', marginBottom: 4 }}>YOUR REPLY</div>
                        <p className="text-sm text-muted">{r.response}</p>
                      </div>
                    ) : (
                      replyId === r._id ? (
                        <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'flex-start' }}>
                          <textarea
                            className="form-input"
                            rows={2}
                            placeholder="Write a professional reply..."
                            value={reply}
                            onChange={e => setReply(e.target.value)}
                            style={{ flex: 1, resize: 'vertical' }}
                          />
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <button className="btn btn-primary btn-sm" onClick={() => handleReply(r._id)}>Send</button>
                            <button className="btn btn-ghost btn-sm" onClick={() => { setReplyId(null); setReply(''); }}>Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <button className="btn btn-ghost btn-xs" style={{ alignSelf: 'flex-start' }} onClick={() => setReplyId(r._id)}>
                          <MessageSquare size={13} /> Reply to review
                        </button>
                      )
                    )}
                  </div>
                ))}
              </div>
            )
          )}

          {/* ── Coupons ──────────────────────────────────────────────────── */}
          {tab === 'coupons' && (
            <div className="data-table-wrap">
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
                      <td colSpan={8} style={{ textAlign: 'center', padding: 'var(--space-10)', color: 'var(--text-muted)' }}>
                        <div style={{ fontSize: 32, marginBottom: 8 }}>🎟️</div>
                        No coupons yet —{' '}
                        <button className="btn btn-ghost btn-xs" onClick={() => { setForm({ discountType: 'Percentage' }); setModal(true); }}>
                          <Plus size={13} /> create one
                        </button>
                      </td>
                    </tr>
                  ) : coupons.map(c => (
                    <tr key={c._id}>
                      <td>
                        <code style={{ background: 'var(--primary-glow)', padding: '3px 10px', borderRadius: 6, fontSize: 13, fontWeight: 800, color: 'var(--primary)', letterSpacing: '0.08em' }}>
                          {c.code}
                        </code>
                      </td>
                      <td className="text-muted">{c.discountType}</td>
                      <td className="font-semi" style={{ color: 'var(--primary)' }}>
                        {c.discountType === 'Percentage' ? `${c.discountValue}%` : `$${c.discountValue}`}
                      </td>
                      <td className="text-muted">${c.minimumOrderAmount?.toFixed(2) || '0.00'}</td>
                      <td className="text-muted text-sm">{c.expiryDate ? formatDate(c.expiryDate) : '—'}</td>
                      <td className="text-muted">{c.usageCount ?? 0}/{c.usageLimit ?? '∞'}</td>
                      <td>
                        <span className="status-badge" style={{
                          background: c.isActive ? 'rgba(16,185,129,0.12)' : 'var(--bg-surface-2)',
                          color: c.isActive ? 'var(--success)' : 'var(--text-muted)',
                          border: `1px solid ${c.isActive ? 'rgba(16,185,129,0.3)' : 'transparent'}`,
                        }}>
                          {c.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-ghost btn-xs" onClick={() => { setForm(c); setModal(true); }}>
                            <Pencil size={13} />
                          </button>
                          <button className="btn btn-ghost btn-xs" style={{ color: 'var(--error)' }} onClick={() => handleDeleteCoupon(c)}>
                            <Trash2 size={13} />
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

      {/* ── Coupon Modal ──────────────────────────────────────────────────── */}
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
  );
}
