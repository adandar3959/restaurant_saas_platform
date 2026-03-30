import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Plus, Pencil, Trash2, X, CalendarCheck, CalendarX, CheckCircle } from 'lucide-react';
import { tablesApi } from '../../api/tables.api';
import { formatDateTime } from '../../lib/utils';
import { TABLE_STATUS_COLORS } from '../../lib/constants';

const STATUS_OPTIONS = Object.keys(TABLE_STATUS_COLORS);
const RES_STATUS_COLORS = {
  Pending:   { bg: 'rgba(245,158,11,0.15)',  color: '#FCD34D' },
  Confirmed: { bg: 'rgba(16,185,129,0.15)',  color: '#34D399' },
  Cancelled: { bg: 'rgba(239,68,68,0.15)',   color: '#F87171' },
  Completed: { bg: 'rgba(99,102,241,0.15)',  color: '#818CF8' },
};

function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div style={{
      position: 'fixed', top: 24, right: 24, zIndex: 9999,
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '12px 18px', borderRadius: 10, fontWeight: 600, fontSize: 14,
      background: toast.type === 'error' ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)',
      border: `1px solid ${toast.type === 'error' ? '#EF4444' : '#10B981'}`,
      color: toast.type === 'error' ? '#FCA5A5' : '#6EE7B7',
      backdropFilter: 'blur(8px)',
    }}>
      {toast.msg}
    </div>
  );
}

export default function Tables() {
  const { restaurantId } = useOutletContext();
  const [tables,  setTables]  = useState([]);
  const [reservations, setRes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab,     setTab]     = useState('floor');
  const [modal,   setModal]   = useState(null); // 'table' | 'reservation'
  const [form,    setForm]    = useState({});
  const [saving,  setSaving]  = useState(false);
  const [toast,   setToast]   = useState(null);

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  };

  const load = async () => {
    setLoading(true);
    try {
      const [t, r] = await Promise.all([
        tablesApi.getTables(restaurantId),
        tablesApi.getReservations(restaurantId),
      ]);
      setTables(t.data?.data || []);
      setRes(r.data?.data?.reservations || r.data?.data || []);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [restaurantId]);

  // ── Table CRUD ────────────────────────────────────────────────────────────
  const handleSaveTable = async () => {
    if (!form.tableNumber || !form.capacity) {
      showToast('error', 'Table number and capacity are required');
      return;
    }
    setSaving(true);
    try {
      if (form._id) await tablesApi.updateTable(restaurantId, form._id, form);
      else          await tablesApi.createTable(restaurantId, form);
      setModal(null);
      load();
      showToast('success', form._id ? 'Table updated' : 'Table created');
    } catch (e) {
      showToast('error', e?.response?.data?.message || 'Failed to save table');
    } finally { setSaving(false); }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await tablesApi.updateTableStatus(restaurantId, id, status);
      setTables(prev => prev.map(t => t._id === id ? { ...t, status } : t));
    } catch {
      showToast('error', 'Could not update status');
    }
  };

  const handleDeleteTable = async (id) => {
    if (!window.confirm('Delete this table?')) return;
    try {
      await tablesApi.deleteTable(restaurantId, id);
      load();
      showToast('success', 'Table deleted');
    } catch { showToast('error', 'Failed to delete'); }
  };

  // ── Reservation CRUD ──────────────────────────────────────────────────────
  const handleSaveReservation = async () => {
    if (!form.guestName || !form.reservationTime || !form.guestCount) {
      showToast('error', 'Guest name, date/time, and guest count are required');
      return;
    }
    setSaving(true);
    try {
      await tablesApi.createReservation(restaurantId, form);
      setModal(null);
      setForm({});
      load();
      showToast('success', 'Reservation created');
    } catch (e) {
      showToast('error', e?.response?.data?.message || 'Failed to create reservation');
    } finally { setSaving(false); }
  };

  const handleResStatus = async (id, status) => {
    try {
      await tablesApi.updateReservationStatus(restaurantId, id, status);
      load();
      showToast('success', `Reservation ${status.toLowerCase()}`);
    } catch { showToast('error', 'Failed to update reservation'); }
  };

  const pendingRes   = reservations.filter(r => r.status === 'Pending');
  const confirmedRes = reservations.filter(r => r.status === 'Confirmed');

  return (
    <div>
      <Toast toast={toast} />

      <div className="page-header">
        <div>
          <h1 className="page-title">Tables & Reservations</h1>
          <p className="page-subtitle">
            {tables.length} tables · {reservations.length} reservations
            {pendingRes.length > 0 && (
              <span style={{ marginLeft: 8, background: 'rgba(245,158,11,0.2)', color: '#FCD34D', padding: '2px 8px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
                {pendingRes.length} pending
              </span>
            )}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          {tab === 'reservations' && (
            <button className="btn btn-outline btn-sm" onClick={() => { setForm({}); setModal('reservation'); }}>
              <Plus size={15} /> New Reservation
            </button>
          )}
          <button className="btn btn-primary btn-sm" onClick={() => { setForm({}); setModal('table'); }}>
            <Plus size={15} /> Add Table
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="orders-tabs" style={{ marginBottom: 'var(--space-6)' }}>
        <button className={`orders-tab ${tab === 'floor' ? 'active' : ''}`} onClick={() => setTab('floor')}>
          Floor Plan <span className="orders-tab-count">{tables.length}</span>
        </button>
        <button className={`orders-tab ${tab === 'reservations' ? 'active' : ''}`} onClick={() => setTab('reservations')}>
          Reservations <span className="orders-tab-count">{reservations.length}</span>
        </button>
      </div>

      {loading ? <div className="page-loading"><div className="spinner-lg" /></div> : tab === 'floor' ? (
        tables.length === 0 ? (
          <div className="data-table-wrap">
            <div className="empty-state">
              <div className="empty-state-icon">🪑</div>
              <div className="empty-state-title">No tables yet</div>
              <p>Add your first table to start managing your floor plan.</p>
              <button className="btn btn-primary mt-4" onClick={() => { setForm({}); setModal('table'); }}>
                <Plus size={16} /> Add Table
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Status legend */}
            <div style={{ display: 'flex', gap: 16, marginBottom: 'var(--space-4)', flexWrap: 'wrap' }}>
              {Object.entries(TABLE_STATUS_COLORS).map(([s, c]) => (
                <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />
                  <span className="text-muted">{s}</span>
                </div>
              ))}
            </div>
            <div className="floor-grid">
              {tables.map(t => {
                const color = TABLE_STATUS_COLORS[t.status] || '#6B7280';
                return (
                  <div key={t._id} className="table-card" style={{ borderColor: `${color}55`, background: `${color}08` }}>
                    <div className="table-num" style={{ color }}>T-{t.tableNumber}</div>
                    <div className="table-cap">{t.capacity} seats</div>
                    {t.location && <div className="text-xs text-subtle">{t.location}</div>}
                    <div className="table-status-dot" style={{ background: color }} />
                    <select
                      className="form-select"
                      style={{ fontSize: 12, padding: '4px 8px', marginTop: 'var(--space-2)', width: '100%' }}
                      value={t.status}
                      onChange={e => handleStatusChange(t._id, e.target.value)}
                    >
                      {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <div style={{ display: 'flex', gap: 6, marginTop: 'var(--space-2)' }}>
                      <button className="btn btn-ghost btn-xs" style={{ flex: 1 }} onClick={() => { setForm(t); setModal('table'); }}>
                        <Pencil size={12} /> Edit
                      </button>
                      <button className="btn btn-ghost btn-xs" style={{ color: 'var(--error)' }} onClick={() => handleDeleteTable(t._id)}>
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )
      ) : (
        // ── Reservations tab ─────────────────────────────────────────────────
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Guest</th><th>Table</th><th>Date & Time</th>
                <th>Guests</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reservations.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: 'var(--space-10)', color: 'var(--text-muted)' }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>📅</div>
                    No reservations yet —{' '}
                    <button className="btn btn-ghost btn-xs" onClick={() => { setForm({}); setModal('reservation'); }}>
                      <Plus size={13} /> create one
                    </button>
                  </td>
                </tr>
              ) : reservations.map(r => {
                const sc = RES_STATUS_COLORS[r.status] || { bg: 'var(--bg-surface-2)', color: 'var(--text-muted)' };
                return (
                  <tr key={r._id}>
                    <td>
                      <div className="font-semi">{r.guestName || 'Guest'}</div>
                      {r.guestPhone && <div className="text-xs text-muted">{r.guestPhone}</div>}
                    </td>
                    <td>{r.tableId?.tableNumber ? `T-${r.tableId.tableNumber}` : '—'}</td>
                    <td className="text-muted text-sm">{formatDateTime(r.reservationTime)}</td>
                    <td>{r.guestCount}</td>
                    <td>
                      <span className="status-badge" style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.color}33` }}>
                        {r.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {r.status === 'Pending' && (
                          <button
                            className="btn btn-xs"
                            style={{ background: 'rgba(16,185,129,0.12)', color: '#34D399', border: '1px solid rgba(16,185,129,0.3)', gap: 4, display: 'flex', alignItems: 'center' }}
                            onClick={() => handleResStatus(r._id, 'Confirmed')}
                          >
                            <CheckCircle size={12} /> Confirm
                          </button>
                        )}
                        {['Pending', 'Confirmed'].includes(r.status) && (
                          <button
                            className="btn btn-xs"
                            style={{ background: 'rgba(239,68,68,0.1)', color: '#F87171', border: '1px solid rgba(239,68,68,0.3)', gap: 4, display: 'flex', alignItems: 'center' }}
                            onClick={() => handleResStatus(r._id, 'Cancelled')}
                          >
                            <CalendarX size={12} /> Cancel
                          </button>
                        )}
                        {r.status === 'Confirmed' && (
                          <button
                            className="btn btn-xs"
                            style={{ background: 'rgba(99,102,241,0.12)', color: '#818CF8', border: '1px solid rgba(99,102,241,0.3)', gap: 4, display: 'flex', alignItems: 'center' }}
                            onClick={() => handleResStatus(r._id, 'Completed')}
                          >
                            <CalendarCheck size={12} /> Complete
                          </button>
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

      {/* ── Add/Edit Table Modal ─────────────────────────────────────────── */}
      {modal === 'table' && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{form._id ? 'Edit' : 'Add'} Table</h3>
              <button className="modal-close" onClick={() => setModal(null)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                <div className="form-group">
                  <label className="form-label">Table Number *</label>
                  <input className="form-input" type="number" min="1"
                    value={form.tableNumber || ''}
                    onChange={e => setForm(p => ({ ...p, tableNumber: parseInt(e.target.value) }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Capacity (seats) *</label>
                  <input className="form-input" type="number" min="1"
                    value={form.capacity || ''}
                    onChange={e => setForm(p => ({ ...p, capacity: parseInt(e.target.value) }))} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Location / Zone</label>
                <input className="form-input" value={form.location || ''}
                  onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
                  placeholder="e.g. Indoor, Patio, Rooftop" />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSaveTable} disabled={saving}>
                {saving ? <div className="spinner" /> : null} {form._id ? 'Save Changes' : 'Create Table'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── New Reservation Modal ────────────────────────────────────────── */}
      {modal === 'reservation' && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">New Reservation</h3>
              <button className="modal-close" onClick={() => setModal(null)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                <div className="form-group" style={{ gridColumn: '1/-1' }}>
                  <label className="form-label">Guest Name *</label>
                  <input className="form-input" value={form.guestName || ''}
                    onChange={e => setForm(p => ({ ...p, guestName: e.target.value }))}
                    placeholder="John Smith" />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input className="form-input" value={form.guestPhone || ''}
                    onChange={e => setForm(p => ({ ...p, guestPhone: e.target.value }))}
                    placeholder="+1 234 567 8900" />
                </div>
                <div className="form-group">
                  <label className="form-label">Number of Guests *</label>
                  <input className="form-input" type="number" min="1"
                    value={form.guestCount || ''}
                    onChange={e => setForm(p => ({ ...p, guestCount: parseInt(e.target.value) }))} />
                </div>
                <div className="form-group" style={{ gridColumn: '1/-1' }}>
                  <label className="form-label">Date & Time *</label>
                  <input className="form-input" type="datetime-local"
                    value={form.reservationTime || ''}
                    onChange={e => setForm(p => ({ ...p, reservationTime: e.target.value }))} />
                </div>
                <div className="form-group" style={{ gridColumn: '1/-1' }}>
                  <label className="form-label">Table (optional)</label>
                  <select className="form-select" value={form.tableId || ''}
                    onChange={e => setForm(p => ({ ...p, tableId: e.target.value }))}>
                    <option value="">Auto-assign</option>
                    {tables.filter(t => t.status === 'Available').map(t => (
                      <option key={t._id} value={t._id}>
                        Table T-{t.tableNumber} ({t.capacity} seats)
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSaveReservation} disabled={saving}>
                {saving ? <div className="spinner" /> : <CalendarCheck size={15} />} Create Reservation
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .floor-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: var(--space-4); }
        .table-card { border: 2px solid; border-radius: var(--radius-lg); padding: var(--space-4); display: flex; flex-direction: column; align-items: center; gap: var(--space-1); text-align: center; transition: var(--transition); }
        .table-card:hover { transform: translateY(-2px); }
        .table-num { font-size: 24px; font-weight: 900; }
        .table-cap { font-size: 12px; color: var(--text-muted); }
        .table-status-dot { width: 10px; height: 10px; border-radius: 50%; margin: 4px auto; }
      `}</style>
    </div>
  );
}
