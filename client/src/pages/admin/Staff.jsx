import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Plus, Trash2, X, Shield, ChefHat, Coffee, Truck } from 'lucide-react';
import { authApi } from '../../api/tenant.api';
import { getInitials, formatDate } from '../../lib/utils';
import { STAFF_ROLES } from '../../lib/constants';
import { useAuth } from '../../context/AuthContext';
import './Staff.css';

const ROLE_META = {
  Manager: { icon: Shield,   color: '#6366F1', label: 'Manager'  },
  Chef:    { icon: ChefHat,  color: '#F59E0B', label: 'Chef'     },
  Waiter:  { icon: Coffee,   color: '#10B981', label: 'Waiter'   },
  Driver:  { icon: Truck,    color: '#3B82F6', label: 'Driver'   },
};

function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div style={{
      position: 'fixed', top: 24, right: 24, zIndex: 9999,
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '12px 18px', borderRadius: 10, fontWeight: 700, fontSize: 13,
      background: toast.type === 'error' ? '#7f1d1d' : 'var(--bg-surface-2)',
      border: `1px solid ${toast.type === 'error' ? '#ef4444' : 'var(--primary)'}`,
      color: '#fff',
      boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
    }}>
      {toast.msg}
    </div>
  );
}

export default function Staff() {
  const { restaurantId } = useOutletContext();
  const { user } = useAuth();
  const isAdmin = (user?.role || '').toLowerCase() === 'admin';
  const [staff,   setStaff]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');
  const [toast,   setToast]   = useState(null);
  const [form,    setForm]    = useState({ name: '', email: '', password: '', role: 'Waiter' });
  const [filterRole, setFilterRole] = useState('All');

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  };

  const load = async () => {
    setLoading(true);
    try {
      const res = await authApi.getStaff({ restaurantId });
      setStaff(res.data?.data?.users || []);
    } catch { setStaff([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [restaurantId]);

  const handleCreate = async () => {
    setError('');
    if (!form.name || !form.email || !form.password) {
      setError('All fields are required');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setSaving(true);
    try {
      const payload = { ...form, passwordHash: form.password, restaurantId };
      delete payload.password;
      await authApi.createStaff(payload);
      setModal(false);
      setForm({ name: '', email: '', password: '', role: 'Waiter' });
      load();
      showToast('success', `${form.name} added as ${form.role}`);
    } catch (e) {
      const errorMsg = e?.response?.data?.error || e?.response?.data?.message || 'Validation failed';
      setError(errorMsg);
      showToast('error', errorMsg);
    } finally { setSaving(false); }
  };

  const handleDelete = async (s) => {
    if (!window.confirm(`Remove ${s.name} from staff?`)) return;
    try {
      await authApi.deleteUser(s._id);
      load();
      showToast('success', `${s.name} removed`);
    } catch { showToast('error', 'Failed to remove staff member'); }
  };

  const filtered = filterRole === 'All' ? staff : staff.filter(s => s.role === filterRole);

  const counts = STAFF_ROLES.reduce((acc, r) => ({ ...acc, [r]: staff.filter(s => s.role === r).length }), {});

  return (
    <div>
      <Toast toast={toast} />

      <div className="page-header">
        <div>
          <h1 className="page-title">Staff Management</h1>
          <p className="page-subtitle">{staff.length} staff members</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => { setError(''); setModal(true); }}>
          <Plus size={15} /> Add Staff
        </button>
      </div>

      {}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-6)', marginBottom: 'var(--space-8)' }}>
        {STAFF_ROLES.map((role, idx) => {
          const meta = ROLE_META[role] || {};
          const Icon = meta.icon || Shield;
          const isActive = filterRole === role;
          return (
            <div
              key={role}
              className={`stat-card glass-panel animate-fade-up ${isActive ? 'neon-border-cyan' : ''}`}
              style={{ cursor: 'pointer', animationDelay: `${idx * 100}ms` }}
              onClick={() => setFilterRole(isActive ? 'All' : role)}
            >
              <div className="stat-card-top">
                <div className="stat-card-icon" style={{ background: `rgba(56, 189, 248, 0.1)`, color: `var(--neon-cyan)` }}>
                  <Icon size={20} />
                </div>
              </div>
              <div>
                <div className="stat-card-label">{role}s</div>
                <div className="stat-card-value gradient-text-cyan">{counts[role] || 0}</div>
              </div>
            </div>
          );
        })}
      </div>

      {}
      <div className="orders-tabs" style={{ marginBottom: 'var(--space-5)' }}>
        <button className={`orders-tab ${filterRole === 'All' ? 'active' : ''}`} onClick={() => setFilterRole('All')}>
          All <span className="orders-tab-count">{staff.length}</span>
        </button>
        {STAFF_ROLES.map(r => (
          <button key={r} className={`orders-tab ${filterRole === r ? 'active' : ''}`} onClick={() => setFilterRole(r)}>
            {r} <span className="orders-tab-count">{counts[r] || 0}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="page-loading"><div className="spinner-lg" /></div>
      ) : filtered.length === 0 ? (
        <div className="glass-panel" style={{ padding: 'var(--space-20)', textAlign: 'center' }}>
          <div className="empty-state">
            <div className="empty-state-icon">👥</div>
            <div className="empty-state-title">
              {filterRole === 'All' ? 'No staff yet' : `No ${filterRole}s`}
            </div>
            <p>Add your first {filterRole === 'All' ? 'staff member' : filterRole.toLowerCase()} to get started.</p>
            <button className="btn btn-primary mt-4" onClick={() => { setError(''); setModal(true); }}>
              <Plus size={16} /> Add Staff
            </button>
          </div>
        </div>
      ) : (
        <div className="staff-grid">
          {filtered.map((s, idx) => {
            const meta  = ROLE_META[s.role] || { color: 'var(--neon-cyan)' };
            const Icon  = meta.icon || Shield;
            return (
              <div key={s._id} className="staff-card glass-panel animate-fade-up" style={{ animationDelay: `${idx * 50}ms` }}>
                <div className="staff-avatar-wrap">
                  <div className="staff-avatar" style={{ background: `rgba(56, 189, 248, 0.1)`, color: `var(--neon-cyan)` }}>
                    {getInitials(s.name)}
                  </div>
                  <div className={`staff-status-dot ${s.isActive ? 'online' : ''}`} style={{ borderColor: 'var(--glass-bg)' }} />
                </div>
                <div className="staff-info">
                  <div className="staff-name">{s.name}</div>
                  <div className="staff-email text-sm text-muted">{s.email}</div>
                </div>
                <span className="status-badge" style={{
                  background: `rgba(56, 189, 248, 0.1)`, color: `var(--neon-cyan)`,
                  border: `1px solid rgba(56, 189, 248, 0.2)`, alignSelf: 'flex-start',
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  fontSize: '11px', fontWeight: '800', letterSpacing: '0.04em'
                }}>
                  <Icon size={12} /> {s.role.toUpperCase()}
                </span>
                <div className="staff-meta text-xs text-subtle">
                  Started {formatDate(s.createdAt)}
                </div>
                <div className="staff-actions" style={{ marginTop: 'auto', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--glass-border)' }}>
                  <button
                    className="btn btn-ghost btn-xs"
                    style={{ color: 'var(--error)', width: '100%', fontSize: '12px' }}
                    onClick={() => handleDelete(s)}
                  >
                    <Trash2 size={13} /> Remove Member
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Add Staff Member</h3>
              <button className="modal-close" onClick={() => setModal(false)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              {error && (
                <div style={{
                  padding: '10px 14px', borderRadius: 8, marginBottom: 16,
                  background: 'rgba(239,68,68,0.12)', color: '#FCA5A5',
                  border: '1px solid rgba(239,68,68,0.3)', fontSize: 13
                }}>
                  {error}
                </div>
              )}
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input className="form-input" value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="John Smith" />
              </div>
              <div className="form-group">
                <label className="form-label">Email *</label>
                <input className="form-input" type="email" value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  placeholder="staff@restaurant.com" />
              </div>
              <div className="form-group">
                <label className="form-label">Temporary Password *</label>
                <input className="form-input" type="password" value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  placeholder="Min. 6 characters" />
              </div>
              <div className="form-group">
                <label className="form-label">Role</label>
                <select className="form-select" value={form.role}
                  onChange={e => setForm(p => ({ ...p, role: e.target.value }))}>
                  {}
                  {STAFF_ROLES.filter(r => isAdmin || !['Admin', 'Manager'].includes(r)).map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
                <p className="text-xs text-muted" style={{ marginTop: 6 }}>
                  {form.role === 'Chef' && 'Can manage kitchen orders'}
                  {form.role === 'Waiter' && 'Can manage table orders and mark completed'}
                  {form.role === 'Driver' && 'Can manage delivery dispatches'}
                  {form.role === 'Manager' && 'Full admin access except billing'}
                </p>
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
