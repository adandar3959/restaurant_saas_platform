import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Plus, Pencil, Trash2, X, UserCheck, UserX } from 'lucide-react';
import { authApi } from '../../api/tenant.api';
import { getInitials, formatDate } from '../../lib/utils';
import { STAFF_ROLES } from '../../lib/constants';

export default function Staff() {
  const { restaurantId } = useOutletContext();
  const [staff,   setStaff]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');
  const [form,    setForm]    = useState({ name: '', email: '', password: '', role: 'Waiter' });

  const load = async () => {
    setLoading(true);
    try {
      const res = await authApi.getStaff({ restaurantId });
      setStaff(res.data?.data || []);
    } catch { setStaff([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [restaurantId]);

  const handleCreate = async () => {
    setError('');
    if (!form.name || !form.email || !form.password) { setError('All fields required'); return; }
    setSaving(true);
    try {
      await authApi.createStaff({ ...form, restaurantId });
      setModal(false);
      setForm({ name: '', email: '', password: '', role: 'Waiter' });
      load();
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to create staff');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this staff member?')) return;
    try { await authApi.deleteUser(id); load(); } catch {}
  };

  const ROLE_COLORS = {
    Manager: '#6366F1', Chef: '#F59E0B', Waiter: '#10B981', Driver: '#3B82F6',
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Staff Management</h1>
          <p className="page-subtitle">{staff.length} staff members</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setModal(true)}>
          <Plus size={15} /> Add Staff
        </button>
      </div>

      {loading ? (
        <div className="page-loading"><div className="spinner-lg" /></div>
      ) : staff.length === 0 ? (
        <div className="data-table-wrap">
          <div className="empty-state">
            <div className="empty-state-icon">👥</div>
            <div className="empty-state-title">No staff yet</div>
            <p>Add your first staff member to get started.</p>
            <button className="btn btn-primary mt-4" onClick={() => setModal(true)}><Plus size={16} /> Add Staff</button>
          </div>
        </div>
      ) : (
        <div className="staff-grid">
          {staff.map(s => (
            <div key={s._id} className="staff-card card">
              <div className="staff-avatar-wrap">
                <div className="staff-avatar" style={{ background: `${ROLE_COLORS[s.role] || '#FF6B35'}25`, color: ROLE_COLORS[s.role] || '#FF6B35' }}>
                  {getInitials(s.name)}
                </div>
                <div className={`staff-status-dot ${s.isActive ? 'online' : ''}`} />
              </div>
              <div className="staff-info">
                <div className="staff-name">{s.name}</div>
                <div className="staff-email text-sm text-muted">{s.email}</div>
              </div>
              <span className="status-badge" style={{ background: `${ROLE_COLORS[s.role] || '#FF6B35'}20`, color: ROLE_COLORS[s.role] || '#FF6B35', border: 'none', alignSelf: 'flex-start' }}>
                {s.role}
              </span>
              <div className="staff-meta text-xs text-subtle">
                Joined {formatDate(s.createdAt)}
              </div>
              <div className="staff-actions">
                <button className="btn btn-ghost btn-xs" style={{ color: 'var(--error)' }} onClick={() => handleDelete(s._id)}>
                  <Trash2 size={13} /> Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add staff modal */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Add Staff Member</h3>
              <button className="modal-close" onClick={() => setModal(false)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              {error && <div className="alert alert-error">{error}</div>}
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input className="form-input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="John Smith" />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="form-input" type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="staff@restaurant.com" />
              </div>
              <div className="form-group">
                <label className="form-label">Temporary Password</label>
                <input className="form-input" type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} placeholder="Min. 6 characters" />
              </div>
              <div className="form-group">
                <label className="form-label">Role</label>
                <select className="form-select" value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}>
                  {STAFF_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCreate} disabled={saving}>
                {saving ? <div className="spinner" /> : <Plus size={15} />} Create Staff
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
