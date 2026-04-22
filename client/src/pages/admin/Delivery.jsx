import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Plus, MapPin, X, Truck, RefreshCw, Pencil, Trash2, CheckCircle, AlertCircle, Users, Activity } from 'lucide-react';
import { deliveryApi } from '../../api/delivery.api';
import { DISPATCH_STATUS } from '../../lib/constants';
import { formatDateTime, getInitials } from '../../lib/utils';

const DISPATCH_COLORS = {
  Assigned:    { bg: 'rgba(99,102,241,0.15)',  color: '#818CF8' },
  PickedUp:    { bg: 'rgba(245,158,11,0.15)',  color: '#FCD34D' },
  InTransit:   { bg: 'rgba(59,130,246,0.15)',  color: '#60A5FA' },
  Delivered:   { bg: 'rgba(16,185,129,0.12)',  color: '#34D399' },
  Failed:      { bg: 'rgba(239,68,68,0.15)',   color: '#F87171' },
  Returned:    { bg: 'rgba(107,114,128,0.15)', color: '#9CA3AF' },
};
const DRIVER_STATUS_COLORS = {
  Available:   { bg: 'rgba(16,185,129,0.15)',  color: '#34D399' },
  OnDelivery:  { bg: 'rgba(245,158,11,0.15)',  color: '#FCD34D' },
  Offline:     { bg: 'rgba(107,114,128,0.15)', color: '#9CA3AF' },
};

const NEXT_DISPATCH = {
  Assigned: 'PickedUp', PickedUp: 'InTransit', InTransit: 'Delivered',
};

function Toast({ toast }) {
  if (!toast) return null;
  const isErr = toast.type === 'error';
  return (
    <div style={{
      position: 'fixed', top: 24, right: 24, zIndex: 9999,
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '12px 18px', borderRadius: 10, fontWeight: 600, fontSize: 14,
      background: isErr ? '#FEF2F2' : '#ECFDF5',
      border: `1px solid ${isErr ? '#FECACA' : '#A7F3D0'}`,
      color: isErr ? '#DC2626' : '#059669',
      boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
    }}>
      {isErr ? <AlertCircle size={16} /> : <CheckCircle size={16} />}
      {toast.msg}
    </div>
  );
}

export default function Delivery() {
  const { restaurantId } = useOutletContext();
  const [zones,      setZones]      = useState([]);
  const [drivers,    setDrivers]    = useState([]);
  const [dispatches, setDispatches] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [tab,        setTab]        = useState('dispatches');
  const [modal,      setModal]      = useState(null);
  const [form,       setForm]       = useState({});
  const [saving,     setSaving]     = useState(false);
  const [toast,      setToast]      = useState(null);

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  };

  const load = async () => {
    setLoading(true);
    try {
      const [z, d, dp] = await Promise.all([
        deliveryApi.getZones(restaurantId),
        deliveryApi.getDrivers(restaurantId),
        deliveryApi.getDispatches(restaurantId),
      ]);
      setZones(z.data?.data || []);
      setDrivers(d.data?.data || []);
      setDispatches(dp.data?.data?.dispatches || dp.data?.data || []);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [restaurantId]);

  const handleSaveZone = async () => {
    if (!form.name) { showToast('error', 'Zone name is required'); return; }
    setSaving(true);
    try {
      if (form._id) await deliveryApi.updateZone(restaurantId, form._id, form);
      else          await deliveryApi.createZone(restaurantId, form);
      setModal(null);
      load();
      showToast('success', form._id ? 'Zone updated' : 'Zone created');
    } catch (e) {
      showToast('error', e?.response?.data?.message || 'Failed to save zone');
    } finally { setSaving(false); }
  };

  const handleDeleteZone = async (zone) => {
    if (!window.confirm(`Delete zone "${zone.name}"?`)) return;
    try {
      await deliveryApi.deleteZone(restaurantId, zone._id);
      load();
      showToast('success', 'Zone deleted');
    } catch { showToast('error', 'Failed to delete zone'); }
  };

  const handleCreateDispatch = async () => {
    if (!form.orderId || !form.driverId) {
      showToast('error', 'Order ID and driver are required');
      return;
    }
    setSaving(true);
    try {
      await deliveryApi.createDispatch(restaurantId, form);
      setModal(null);
      setForm({});
      load();
      showToast('success', 'Dispatch created');
    } catch (e) {
      showToast('error', e?.response?.data?.message || 'Failed to create dispatch');
    } finally { setSaving(false); }
  };

  const handleDispatchStatus = async (id, status) => {
    try {
      await deliveryApi.updateDispatch(restaurantId, id, status);
      setDispatches(prev => prev.map(d => d._id === id ? { ...d, status } : d));
      showToast('success', `Dispatch marked as ${status}`);
    } catch { showToast('error', 'Failed to update dispatch status'); }
  };

  const activeDispatches   = dispatches.filter(d => !['Delivered','Failed','Returned'].includes(d.status));
  const deliveredToday     = dispatches.filter(d => d.status === 'Delivered').length;
  const availableDrivers   = drivers.filter(d => d.status === 'Available').length;

  return (
    <div>
      <Toast toast={toast} />

      <div className="page-header">
        <div>
          <h1 className="page-title">Delivery Management</h1>
          <p className="page-subtitle">
            {dispatches.length} dispatches · {drivers.length} drivers · {zones.length} zones
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          <button className="btn btn-outline btn-sm" onClick={load} disabled={loading}>
            <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh
          </button>
          {tab === 'zones' && (
            <button className="btn btn-outline btn-sm" onClick={() => { setForm({}); setModal('zone'); }}>
              <MapPin size={15} /> Add Zone
            </button>
          )}
          {tab === 'dispatches' && (
            <button className="btn btn-primary btn-sm" onClick={() => { setForm({}); setModal('dispatch'); }}>
              <Plus size={15} /> New Dispatch
            </button>
          )}
        </div>
      </div>

      {}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-6)', marginBottom: 'var(--space-8)' }}>
        {[
          { label: 'Active',         value: activeDispatches.length,   icon: Truck, color: 'var(--neon-cyan)', delay: 0 },
          { label: 'Delivered Today', value: deliveredToday,            icon: CheckCircle, color: 'var(--neon-emerald)', delay: 100 },
          { label: 'Total Drivers',   value: drivers.length,            icon: Users, color: 'var(--neon-purple)', delay: 200 },
          { label: 'Available Now',   value: availableDrivers,          icon: Activity, color: 'var(--neon-cyan)', delay: 300 },
        ].map(s => (
          <div key={s.label} className="stat-card glass-panel animate-fade-up" style={{ animationDelay: `${s.delay}ms` }}>
            <div className="stat-card-top">
              <div className="stat-card-icon" style={{ background: `rgba(56, 189, 248, 0.1)`, color: `var(--neon-cyan)` }}>
                <s.icon size={20} />
              </div>
            </div>
            <div>
              <div className="stat-card-label">{s.label}</div>
              <div className="stat-card-value gradient-text-cyan">{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      {}
      <div className="orders-tabs" style={{ marginBottom: 'var(--space-4)' }}>
        {[
          { key: 'dispatches', label: 'Dispatches', count: dispatches.length },
          { key: 'drivers',    label: 'Drivers',    count: drivers.length },
          { key: 'zones',      label: 'Zones',      count: zones.length },
        ].map(t => (
          <button key={t.key} className={`orders-tab ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>
            {t.label} <span className="orders-tab-count">{t.count}</span>
          </button>
        ))}
      </div>

      {loading ? <div className="page-loading"><div className="spinner-lg" /></div> : (
        <>
          {}
          {tab === 'dispatches' && (
            <div className="data-table-wrap glass-panel animate-fade-up">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Order ID</th><th>Driver</th><th>Zone</th>
                    <th>Status</th><th>Time</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {dispatches.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: 'var(--space-12)', color: 'var(--text-muted)' }}>
                        <div style={{ fontSize: 32, marginBottom: 8 }}>🛵</div>
                        <div>No dispatches yet — </div>
                        <button className="btn btn-ghost btn-xs" style={{ color: 'var(--neon-cyan)' }} onClick={() => { setForm({}); setModal('dispatch'); }}>
                          <Plus size={14} /> New Dispatch
                        </button>
                      </td>
                    </tr>
                  ) : dispatches.map(d => {
                    const sc   = DISPATCH_COLORS[d.status] || { bg: 'var(--bg-surface-2)', color: 'var(--text-muted)' };
                    const next = NEXT_DISPATCH[d.status];
                    return (
                      <tr key={d._id}>
                        <td>
                          <span className="order-id" style={{ background: 'rgba(56,189,248,0.1)', color: 'var(--neon-cyan)', border: '1px solid rgba(56,189,248,0.2)' }}>
                            #{(d.orderId?._id || d.orderId)?.toString().slice(-6).toUpperCase() || '—'}
                          </span>
                        </td>
                        <td>
                          <div className="font-semi">{d.driverId?.name || '—'}</div>
                        </td>
                        <td className="text-muted">{d.zoneId?.name || '—'}</td>
                        <td>
                          <span className="status-badge" style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.color}40`, fontWeight: 700, fontSize: 11 }}>
                            {d.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="text-muted text-sm">{formatDateTime(d.createdAt)}</td>
                        <td>
                          <div style={{ display: 'flex', gap: 6 }}>
                            {next && (
                              <button
                                className="btn btn-primary btn-xs"
                                style={{ background: 'var(--neon-cyan)', color: '#0f172a', fontWeight: 800, border: 'none' }}
                                onClick={() => handleDispatchStatus(d._id, next)}
                              >
                                <CheckCircle size={12} /> {next}
                              </button>
                            )}
                            {!next && !['InTransit','Delivered'].includes(d.status) && (
                              <span className="text-xs text-muted">—</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {}
          {tab === 'drivers' && (
            drivers.length === 0 ? (
              <div className="data-table-wrap">
                <div className="empty-state">
                  <div className="empty-state-icon">🛵</div>
                  <div className="empty-state-title">No drivers yet</div>
                  <p>Add staff members with the <strong>Driver</strong> role from the Staff page.</p>
                </div>
              </div>
            ) : (
              <div className="staff-grid">
                {drivers.map(d => {
                  const sc = DRIVER_STATUS_COLORS[d.status] || DRIVER_STATUS_COLORS.Offline;
                  return (
                    <div key={d._id} className="staff-card card">
                      <div className="staff-avatar-wrap">
                        <div className="staff-avatar" style={{ background: `${sc.color}20`, color: sc.color }}>
                          {getInitials(d.name || 'D')}
                        </div>
                        <div className="staff-status-dot" style={{ background: sc.color }} />
                      </div>
                      <div className="staff-info">
                        <div className="staff-name">{d.name || 'Driver'}</div>
                        <div className="staff-email text-sm text-muted">{d.email || '—'}</div>
                      </div>
                      <span className="status-badge" style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.color}33`, alignSelf: 'flex-start' }}>
                        {d.status || 'Offline'}
                      </span>
                      {(d.vehicleType || d.vehiclePlate) && (
                        <div className="text-xs text-muted">
                          <Truck size={11} style={{ display: 'inline', marginRight: 4 }} />
                          {d.vehicleType}{d.vehiclePlate ? ` · ${d.vehiclePlate}` : ''}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )
          )}

          {}
          {tab === 'zones' && (
            <div className="data-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Zone Name</th><th>Delivery Fee</th><th>Min Order</th>
                    <th>Est. Time</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {zones.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: 'var(--space-10)', color: 'var(--text-muted)' }}>
                        <div style={{ fontSize: 32, marginBottom: 8 }}>📍</div>
                        No delivery zones — define the areas you deliver to
                      </td>
                    </tr>
                  ) : zones.map(z => (
                    <tr key={z._id}>
                      <td>
                        <div className="font-semi">{z.name}</div>
                        {z.description && <div className="text-xs text-muted">{z.description}</div>}
                      </td>
                      <td className="font-semi">${z.deliveryFee?.toFixed(2) ?? '0.00'}</td>
                      <td className="text-muted">${z.minOrderAmount?.toFixed(2) ?? '0.00'}</td>
                      <td className="text-muted">{z.estimatedTime ?? '—'} min</td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-ghost btn-xs" onClick={() => { setForm(z); setModal('zone'); }}>
                            <Pencil size={13} /> Edit
                          </button>
                          <button className="btn btn-ghost btn-xs" style={{ color: 'var(--error)' }} onClick={() => handleDeleteZone(z)}>
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

      {}
      {modal === 'zone' && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{form._id ? 'Edit' : 'Add'} Delivery Zone</h3>
              <button className="modal-close" onClick={() => setModal(null)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Zone Name *</label>
                <input className="form-input" value={form.name || ''} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Downtown, North Side" />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <input className="form-input" value={form.description || ''} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Optional details" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-4)' }}>
                <div className="form-group">
                  <label className="form-label">Delivery Fee ($)</label>
                  <input className="form-input" type="number" min="0" step="0.5" value={form.deliveryFee ?? ''} onChange={e => setForm(p => ({ ...p, deliveryFee: parseFloat(e.target.value) }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Min Order ($)</label>
                  <input className="form-input" type="number" min="0" value={form.minOrderAmount ?? ''} onChange={e => setForm(p => ({ ...p, minOrderAmount: parseFloat(e.target.value) }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Est. Time (min)</label>
                  <input className="form-input" type="number" min="1" value={form.estimatedTime ?? ''} onChange={e => setForm(p => ({ ...p, estimatedTime: parseInt(e.target.value) }))} />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSaveZone} disabled={saving}>
                {saving ? <div className="spinner" /> : null} {form._id ? 'Save Changes' : 'Create Zone'}
              </button>
            </div>
          </div>
        </div>
      )}

      {}
      {modal === 'dispatch' && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">New Dispatch</h3>
              <button className="modal-close" onClick={() => setModal(null)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Order ID *</label>
                <input className="form-input" value={form.orderId || ''} onChange={e => setForm(p => ({ ...p, orderId: e.target.value }))} placeholder="Paste order ID" />
              </div>
              <div className="form-group">
                <label className="form-label">Assign Driver *</label>
                <select className="form-select" value={form.driverId || ''} onChange={e => setForm(p => ({ ...p, driverId: e.target.value }))}>
                  <option value="">Select driver</option>
                  {drivers.filter(d => d.status === 'Available').map(d => (
                    <option key={d._id} value={d._id}>{d.name} — {d.vehicleType || 'Driver'}</option>
                  ))}
                </select>
                {drivers.filter(d => d.status === 'Available').length === 0 && (
                  <p className="text-xs text-muted" style={{ marginTop: 6 }}>⚠ No available drivers right now</p>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">Zone</label>
                <select className="form-select" value={form.zoneId || ''} onChange={e => setForm(p => ({ ...p, zoneId: e.target.value }))}>
                  <option value="">No zone</option>
                  {zones.map(z => <option key={z._id} value={z._id}>{z.name} — ${z.deliveryFee}</option>)}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCreateDispatch} disabled={saving}>
                {saving ? <div className="spinner" /> : <Truck size={15} />} Create Dispatch
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
