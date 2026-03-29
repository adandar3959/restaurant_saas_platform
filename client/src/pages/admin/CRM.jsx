import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Plus, Star, X, Tag, MessageSquare } from 'lucide-react';
import { crmApi } from '../../api/crm.api';
import { formatDate } from '../../lib/utils';

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

  const handleCreateCoupon = async () => {
    setSaving(true);
    try {
      if (form._id) await crmApi.updateCoupon(restaurantId, form._id, form);
      else          await crmApi.createCoupon(restaurantId, form);
      setModal(false);
      load();
    } catch {}
    finally { setSaving(false); }
  };

  const handleDeleteCoupon = async (id) => {
    if (!window.confirm('Delete coupon?')) return;
    try { await crmApi.deleteCoupon(restaurantId, id); load(); } catch {}
  };

  const handleReply = async (reviewId) => {
    try { await crmApi.respondReview(restaurantId, reviewId, reply); setReplyId(null); setReply(''); load(); } catch {}
  };

  const avgRating = reviews.length ? (reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length).toFixed(1) : '—';

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">CRM & Loyalty</h1>
          <p className="page-subtitle">{reviews.length} reviews · avg {avgRating}⭐ · {coupons.length} coupons</p>
        </div>
        {tab === 'coupons' && (
          <button className="btn btn-primary btn-sm" onClick={() => { setForm({}); setModal(true); }}>
            <Plus size={15} /> New Coupon
          </button>
        )}
      </div>

      <div className="orders-tabs" style={{ marginBottom: 'var(--space-4)' }}>
        <button className={`orders-tab ${tab === 'reviews' ? 'active' : ''}`} onClick={() => setTab('reviews')}>
          Reviews <span className="orders-tab-count">{reviews.length}</span>
        </button>
        <button className={`orders-tab ${tab === 'coupons' ? 'active' : ''}`} onClick={() => setTab('coupons')}>
          Coupons <span className="orders-tab-count">{coupons.length}</span>
        </button>
      </div>

      {loading ? <div className="page-loading"><div className="spinner-lg" /></div> : (
        <>
          {tab === 'reviews' && (
            reviews.length === 0 ? (
              <div className="data-table-wrap"><div className="empty-state"><div className="empty-state-icon">⭐</div><div className="empty-state-title">No reviews yet</div><p>Reviews from customers will appear here.</p></div></div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                {reviews.map(r => (
                  <div key={r._id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div className="font-semi">{r.customerId?.name || 'Customer'}</div>
                        <div className="text-xs text-muted">{formatDate(r.createdAt)}</div>
                      </div>
                      <div style={{ display: 'flex', gap: 2 }}>
                        {[1,2,3,4,5].map(n => <Star key={n} size={14} fill={n <= r.rating ? '#F59E0B' : 'none'} color="#F59E0B" />)}
                      </div>
                    </div>
                    <p className="text-sm text-muted">{r.comment || '(No comment)'}</p>
                    {r.response ? (
                      <div style={{ background: 'var(--bg-surface-2)', borderRadius: 'var(--radius-md)', padding: 'var(--space-3)', borderLeft: '3px solid var(--primary)' }}>
                        <div className="text-xs font-semi text-primary mb-1">Your reply</div>
                        <p className="text-sm text-muted">{r.response}</p>
                      </div>
                    ) : (
                      replyId === r._id ? (
                        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                          <input className="form-input" placeholder="Write your reply..." value={reply} onChange={e => setReply(e.target.value)} />
                          <button className="btn btn-primary btn-sm" onClick={() => handleReply(r._id)}>Send</button>
                          <button className="btn btn-ghost btn-sm" onClick={() => setReplyId(null)}>Cancel</button>
                        </div>
                      ) : (
                        <button className="btn btn-ghost btn-xs" style={{ alignSelf: 'flex-start' }} onClick={() => setReplyId(r._id)}>
                          <MessageSquare size={13} /> Reply
                        </button>
                      )
                    )}
                  </div>
                ))}
              </div>
            )
          )}

          {tab === 'coupons' && (
            <div className="data-table-wrap">
              <table className="data-table">
                <thead><tr><th>Code</th><th>Type</th><th>Value</th><th>Min Order</th><th>Expires</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {coupons.length === 0 ? <tr><td colSpan={7} style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--text-muted)' }}>No coupons yet</td></tr>
                  : coupons.map(c => (
                    <tr key={c._id}>
                      <td><code style={{ background: 'var(--bg-surface-2)', padding: '2px 8px', borderRadius: 4, fontSize: 13, fontWeight: 700, color: 'var(--primary)' }}>{c.code}</code></td>
                      <td className="text-muted">{c.discountType}</td>
                      <td className="font-semi">{c.discountType === 'Percentage' ? `${c.discountValue}%` : `$${c.discountValue}`}</td>
                      <td className="text-muted">${c.minimumOrderAmount?.toFixed(2) || '0.00'}</td>
                      <td className="text-muted text-sm">{formatDate(c.expiryDate)}</td>
                      <td><span className={`status-badge ${c.isActive ? '' : ''}`} style={{ background: c.isActive ? 'rgba(16,185,129,0.12)' : 'var(--bg-surface-2)', color: c.isActive ? 'var(--success)' : 'var(--text-muted)' }}>{c.isActive ? 'Active' : 'Inactive'}</span></td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-ghost btn-xs" onClick={() => { setForm(c); setModal(true); }}>Edit</button>
                          <button className="btn btn-ghost btn-xs" style={{ color: 'var(--error)' }} onClick={() => handleDeleteCoupon(c._id)}>Delete</button>
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

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{form._id ? 'Edit' : 'Create'} Coupon</h3>
              <button className="modal-close" onClick={() => setModal(false)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group"><label className="form-label">Coupon Code</label><input className="form-input" style={{ textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.1em' }} value={form.code || ''} onChange={e => setForm(p => ({ ...p, code: e.target.value.toUpperCase() }))} placeholder="SAVE20" /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                <div className="form-group">
                  <label className="form-label">Discount Type</label>
                  <select className="form-select" value={form.discountType || 'Percentage'} onChange={e => setForm(p => ({ ...p, discountType: e.target.value }))}>
                    <option value="Percentage">Percentage (%)</option>
                    <option value="Fixed">Fixed Amount ($)</option>
                  </select>
                </div>
                <div className="form-group"><label className="form-label">Value</label><input className="form-input" type="number" value={form.discountValue || ''} onChange={e => setForm(p => ({ ...p, discountValue: parseFloat(e.target.value) }))} /></div>
                <div className="form-group"><label className="form-label">Min Order ($)</label><input className="form-input" type="number" value={form.minimumOrderAmount || ''} onChange={e => setForm(p => ({ ...p, minimumOrderAmount: parseFloat(e.target.value) }))} /></div>
                <div className="form-group"><label className="form-label">Usage Limit</label><input className="form-input" type="number" value={form.usageLimit || ''} onChange={e => setForm(p => ({ ...p, usageLimit: parseInt(e.target.value) }))} /></div>
                <div className="form-group" style={{ gridColumn: '1/-1' }}><label className="form-label">Expiry Date</label><input className="form-input" type="date" value={form.expiryDate?.slice(0,10) || ''} onChange={e => setForm(p => ({ ...p, expiryDate: e.target.value }))} /></div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCreateCoupon} disabled={saving}>{saving ? <div className="spinner" /> : null} {form._id ? 'Save' : 'Create'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
