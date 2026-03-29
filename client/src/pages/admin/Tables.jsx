import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import { tablesApi } from '../../api/tables.api';
import { formatDateTime } from '../../lib/utils';
import { TABLE_STATUS, TABLE_STATUS_COLORS } from '../../lib/constants';

const STATUS_OPTIONS = Object.keys(TABLE_STATUS_COLORS);

export default function Tables() {
  const { restaurantId } = useOutletContext();
  const [tables,  setTables]  = useState([]);
  const [reservations, setRes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab,     setTab]     = useState('floor'); // 'floor' | 'reservations'
  const [modal,   setModal]   = useState(null);
  const [form,    setForm]    = useState({});
  const [saving,  setSaving]  = useState(false);

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

  const handleSaveTable = async () => {
    setSaving(true);
    try {
      if (form._id) await tablesApi.updateTable(restaurantId, form._id, form);
      else          await tablesApi.createTable(restaurantId, form);
      setModal(null);
      load();
    } catch {}
    finally { setSaving(false); }
  };

  const handleStatusChange = async (id, status) => {
    try { await tablesApi.updateTableStatus(restaurantId, id, status); load(); } catch {}
  };

  const handleDeleteTable = async (id) => {
    if (!window.confirm('Delete this table?')) return;
    try { await tablesApi.deleteTable(restaurantId, id); load(); } catch {}
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Tables & Reservations</h1>
          <p className="page-subtitle">{tables.length} tables · {reservations.length} reservations</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => { setForm({}); setModal('table'); }}>
          <Plus size={15} /> Add Table
        </button>
      </div>

      {/* Tabs */}
      <div className="orders-tabs" style={{ marginBottom: 'var(--space-6)' }}>
        <button className={`orders-tab ${tab === 'floor' ? 'active' : ''}`} onClick={() => setTab('floor')}>Floor Plan</button>
        <button className={`orders-tab ${tab === 'reservations' ? 'active' : ''}`} onClick={() => setTab('reservations')}>
          Reservations <span className="orders-tab-count">{reservations.length}</span>
        </button>
      </div>

      {loading ? <div className="page-loading"><div className="spinner-lg" /></div> : tab === 'floor' ? (
        tables.length === 0 ? (
          <div className="data-table-wrap"><div className="empty-state"><div className="empty-state-icon">🪑</div><div className="empty-state-title">No tables yet</div></div></div>
        ) : (
          <div className="floor-grid">
            {tables.map(t => {
              const color = TABLE_STATUS_COLORS[t.status] || '#6B7280';
              return (
                <div key={t._id} className="table-card" style={{ borderColor: `${color}55`, background: `${color}08` }}>
                  <div className="table-num">T-{t.tableNumber}</div>
                  <div className="table-cap">{t.capacity} seats</div>
                  <div className="table-status-dot" style={{ background: color }} />
                  <select
                    className="form-select"
                    style={{ fontSize: 12, padding: '4px 8px', marginTop: 'var(--space-2)' }}
                    value={t.status}
                    onChange={e => handleStatusChange(t._id, e.target.value)}
                  >
                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <div style={{ display: 'flex', gap: 6, marginTop: 'var(--space-2)' }}>
                    <button className="btn btn-ghost btn-xs" onClick={() => { setForm(t); setModal('table'); }}><Pencil size={12} /></button>
                    <button className="btn btn-ghost btn-xs" style={{ color: 'var(--error)' }} onClick={() => handleDeleteTable(t._id)}><Trash2 size={12} /></button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        <div className="data-table-wrap">
          <table className="data-table">
            <thead><tr><th>Guest</th><th>Table</th><th>Date & Time</th><th>Guests</th><th>Status</th></tr></thead>
            <tbody>
              {reservations.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--text-muted)' }}>No reservations</td></tr>
              ) : reservations.map(r => (
                <tr key={r._id}>
                  <td className="font-semi">{r.guestName || 'Guest'}</td>
                  <td>{r.tableId?.tableNumber ? `T-${r.tableId.tableNumber}` : '—'}</td>
                  <td className="text-muted text-sm">{formatDateTime(r.reservationTime)}</td>
                  <td>{r.guestCount}</td>
                  <td>
                    <span className="status-badge" style={{ background: 'var(--bg-surface-2)', color: 'var(--text-muted)' }}>{r.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Table Modal */}
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
                  <label className="form-label">Table Number</label>
                  <input className="form-input" type="number" value={form.tableNumber || ''} onChange={e => setForm(p => ({ ...p, tableNumber: parseInt(e.target.value) }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Capacity (seats)</label>
                  <input className="form-input" type="number" value={form.capacity || ''} onChange={e => setForm(p => ({ ...p, capacity: parseInt(e.target.value) }))} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Location / Zone</label>
                <input className="form-input" value={form.location || ''} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} placeholder="e.g. Indoor, Patio, Rooftop" />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSaveTable} disabled={saving}>
                {saving ? <div className="spinner" /> : null} {form._id ? 'Save' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .floor-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: var(--space-4); }
        .table-card { border: 2px solid; border-radius: var(--radius-lg); padding: var(--space-4); display: flex; flex-direction: column; align-items: center; gap: var(--space-1); text-align: center; transition: var(--transition); }
        .table-num { font-size: 22px; font-weight: 900; }
        .table-cap { font-size: 12px; color: var(--text-muted); }
        .table-status-dot { width: 10px; height: 10px; border-radius: 50%; margin: 4px auto; }
      `}</style>
    </div>
  );
}
