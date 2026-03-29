import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Plus, Truck, MapPin, X } from 'lucide-react';
import { deliveryApi } from '../../api/delivery.api';
import { DISPATCH_STATUS, VEHICLE_TYPES } from '../../lib/constants';
import { formatDateTime } from '../../lib/utils';

export default function Delivery() {
  const { restaurantId } = useOutletContext();
  const [zones,     setZones]     = useState([]);
  const [drivers,   setDrivers]   = useState([]);
  const [dispatches,setDispatches]= useState([]);
  const [loading,   setLoading]   = useState(true);
  const [tab,       setTab]       = useState('dispatches');
  const [modal,     setModal]     = useState(null);
  const [form,      setForm]      = useState({});
  const [saving,    setSaving]    = useState(false);

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
    setSaving(true);
    try {
      if (form._id) await deliveryApi.updateZone(restaurantId, form._id, form);
      else          await deliveryApi.createZone(restaurantId, form);
      setModal(null); load();
    } catch {}
    finally { setSaving(false); }
  };

  const DRIVER_STATUS_COLORS = { Available: '#10B981', OnDelivery: '#F59E0B', Offline: '#6B7280' };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Delivery Management</h1>
          <p className="page-subtitle">{drivers.length} drivers · {zones.length} zones</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          <button className="btn btn-outline btn-sm" onClick={() => { setForm({}); setModal('zone'); }}>
            <MapPin size={15} /> Add Zone
          </button>
        </div>
      </div>

      <div className="orders-tabs" style={{ marginBottom: 'var(--space-4)' }}>
        {['dispatches', 'drivers', 'zones'].map(t => (
          <button key={t} className={`orders-tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {loading ? <div className="page-loading"><div className="spinner-lg" /></div> : (
        <>
          {tab === 'dispatches' && (
            <div className="data-table-wrap">
              <table className="data-table">
                <thead><tr><th>Order</th><th>Driver</th><th>Status</th><th>Time</th></tr></thead>
                <tbody>
                  {dispatches.length === 0 ? <tr><td colSpan={4} style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--text-muted)' }}>No dispatches</td></tr>
                  : dispatches.map(d => (
                    <tr key={d._id}>
                      <td className="font-semi">#{d.orderId?.toString().slice(-6).toUpperCase() || '—'}</td>
                      <td>{d.driverId?.name || '—'}</td>
                      <td><span className="status-badge" style={{ background: 'var(--bg-surface-2)', color: 'var(--text-muted)' }}>{d.status}</span></td>
                      <td className="text-muted text-sm">{formatDateTime(d.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tab === 'drivers' && (
            <div className="staff-grid">
              {drivers.length === 0 ? (
                <div style={{ gridColumn: '1/-1' }}>
                  <div className="data-table-wrap"><div className="empty-state"><div className="empty-state-icon">🛵</div><div className="empty-state-title">No drivers yet</div><p>Drivers are staff accounts with the Driver role.</p></div></div>
                </div>
              ) : drivers.map(d => {
                const color = DRIVER_STATUS_COLORS[d.status] || '#6B7280';
                return (
                  <div key={d._id} className="staff-card card">
                    <div className="staff-avatar" style={{ background: `${color}20`, color }}>{d.name?.[0] || 'D'}</div>
                    <div className="staff-name">{d.name || 'Driver'}</div>
                    <span className="status-badge" style={{ background: `${color}18`, color, border: 'none' }}>{d.status || 'Unknown'}</span>
                    <div className="text-xs text-muted">{d.vehicleType} · {d.vehiclePlate}</div>
                  </div>
                );
              })}
            </div>
          )}

          {tab === 'zones' && (
            <div className="data-table-wrap">
              <table className="data-table">
                <thead><tr><th>Zone Name</th><th>Base Fee</th><th>Min Order</th><th>Est. Time</th><th>Actions</th></tr></thead>
                <tbody>
                  {zones.length === 0 ? <tr><td colSpan={5} style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--text-muted)' }}>No zones yet</td></tr>
                  : zones.map(z => (
                    <tr key={z._id}>
                      <td className="font-semi">{z.name}</td>
                      <td>${z.deliveryFee?.toFixed(2)}</td>
                      <td>${z.minOrderAmount?.toFixed(2)}</td>
                      <td>{z.estimatedTime} min</td>
                      <td><button className="btn btn-ghost btn-xs" onClick={() => { setForm(z); setModal('zone'); }}>Edit</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {modal === 'zone' && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{form._id ? 'Edit' : 'Add'} Zone</h3>
              <button className="modal-close" onClick={() => setModal(null)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group"><label className="form-label">Zone Name</label><input className="form-input" value={form.name || ''} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                <div className="form-group"><label className="form-label">Delivery Fee ($)</label><input className="form-input" type="number" value={form.deliveryFee || ''} onChange={e => setForm(p => ({ ...p, deliveryFee: parseFloat(e.target.value) }))} /></div>
                <div className="form-group"><label className="form-label">Min Order ($)</label><input className="form-input" type="number" value={form.minOrderAmount || ''} onChange={e => setForm(p => ({ ...p, minOrderAmount: parseFloat(e.target.value) }))} /></div>
                <div className="form-group"><label className="form-label">Est. Time (min)</label><input className="form-input" type="number" value={form.estimatedTime || ''} onChange={e => setForm(p => ({ ...p, estimatedTime: parseInt(e.target.value) }))} /></div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSaveZone} disabled={saving}>{saving ? <div className="spinner" /> : null} Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
