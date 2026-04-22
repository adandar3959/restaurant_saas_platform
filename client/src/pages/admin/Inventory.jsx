import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Plus, X, AlertTriangle, Pencil, Trash2, PackageCheck, PackageX, CheckCircle } from 'lucide-react';
import { inventoryApi } from '../../api/inventory.api';
import { UNITS } from '../../lib/constants';

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

export default function Inventory() {
  const { restaurantId } = useOutletContext();
  const [ingredients, setIngredients] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState(null);

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  };

  const load = async () => {
    setLoading(true);
    try {
      const [ing, low] = await Promise.all([
        inventoryApi.getIngredients(restaurantId),
        inventoryApi.getLowStock(restaurantId),
      ]);
      setIngredients(ing.data?.data?.ingredients || ing.data?.data || []);
      setLowStock(low.data?.data?.ingredients || low.data?.data || []);
    } catch { }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [restaurantId]);

  const handleSave = async () => {
    if (!form.name) { showToast('error', 'Name is required'); return; }
    setSaving(true);
    try {
      if (form._id) await inventoryApi.updateIngredient(restaurantId, form._id, form);
      else await inventoryApi.addIngredient(restaurantId, form);
      setModal(false);
      setForm({});
      load();
      showToast('success', form._id ? 'Ingredient updated' : 'Ingredient added');
    } catch (e) {
      showToast('error', e?.response?.data?.message || 'Failed to save');
    } finally { setSaving(false); }
  };

  const handleDelete = async (ing) => {
    if (!window.confirm(`Delete "${ing.name}"?`)) return;
    try {
      await inventoryApi.deleteIngredient(restaurantId, ing._id);
      load();
      showToast('success', `${ing.name} deleted`);
    } catch { showToast('error', 'Failed to delete'); }
  };

  const displayList = (tab === 'lowstock' ? lowStock : ingredients)
    .filter(i => !search || i.name?.toLowerCase().includes(search.toLowerCase()));

  const stockPct = (ing) => {
    if (!ing.reorderLevel || ing.reorderLevel === 0) return null;
    return Math.min(100, Math.round((ing.currentStock / (ing.reorderLevel * 3)) * 100));
  };

  return (
    <div>
      <Toast toast={toast} />

      <div className="page-header">
        <div>
          <h1 className="page-title">Inventory</h1>
          <p className="page-subtitle">
            {ingredients.length} ingredients
            {lowStock.length > 0 && (
              <span style={{ marginLeft: 8, background: '#7f1d1d', color: '#fff', padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 800, border: '1px solid #ef4444' }}>
                ⚠ {lowStock.length} LOW STOCK
              </span>
            )}
          </p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => { setForm({}); setModal(true); }}>
          <Plus size={15} /> Add Ingredient
        </button>
      </div>

      {}
      {lowStock.length > 0 && (
        <div style={{
          display: 'flex', gap: 12, alignItems: 'center',
          padding: '12px 16px', borderRadius: 10, marginBottom: 'var(--space-4)',
          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
          color: '#FCA5A5',
        }}>
          <AlertTriangle size={18} style={{ flexShrink: 0 }} />
          <span>
            <strong>{lowStock.length} items</strong> running low:{' '}
            {lowStock.slice(0, 3).map(i => i.name).join(', ')}
            {lowStock.length > 3 ? ` +${lowStock.length - 3} more` : ''}
          </span>
          <button className="btn btn-xs" style={{ marginLeft: 'auto', background: 'rgba(239,68,68,0.2)', color: '#FCA5A5', border: '1px solid rgba(239,68,68,0.3)' }}
            onClick={() => setTab('lowstock')}>
            View All
          </button>
        </div>
      )}

      {}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-6)', marginBottom: 'var(--space-8)' }}>
        {[
          { label: 'Total Items', value: ingredients.length, icon: PackageCheck, color: 'var(--neon-cyan)', delay: 0 },
          { label: 'Low Stock', value: lowStock.length, icon: AlertTriangle, color: 'var(--error)', delay: 100 },
          { label: 'Well Stocked', value: ingredients.length - lowStock.length, icon: CheckCircle, color: 'var(--neon-emerald)', delay: 200 },
        ].map(s => (
          <div key={s.label} className="stat-card glass-panel animate-fade-up" style={{ animationDelay: `${s.delay}ms` }}>
            <div className="stat-card-top">
              <div className="stat-card-icon" style={{ background: `rgba(56, 189, 248, 0.1)`, color: s.color }}>
                <s.icon size={22} />
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
      <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
        <div className="orders-tabs" style={{ margin: 0 }}>
          <button className={`orders-tab ${tab === 'all' ? 'active' : ''}`} onClick={() => setTab('all')}>
            All <span className="orders-tab-count">{ingredients.length}</span>
          </button>
          <button className={`orders-tab ${tab === 'lowstock' ? 'active' : ''}`} onClick={() => setTab('lowstock')}>
            Low Stock <span className="orders-tab-count">{lowStock.length}</span>
          </button>
        </div>
        <input
          className="form-input"
          style={{ flex: 1, maxWidth: 280 }}
          placeholder="Search ingredients..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="page-loading"><div className="spinner-lg" /></div>
      ) : (
        <div className="data-table-wrap glass-panel animate-fade-up" style={{ animationDelay: '300ms' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th><th>Category</th><th>Stock Level</th>
                <th>Unit</th><th>Reorder At</th><th>Cost/Unit</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayList.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: 'var(--space-10)', color: 'var(--text-muted)' }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>📦</div>
                    <div>No ingredients found</div>
                  </td>
                </tr>
              ) : displayList.map(ing => {
                const isLow = ing.currentStock <= ing.reorderLevel;
                const pct = stockPct(ing);
                return (
                  <tr key={ing._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {isLow
                          ? <PackageX size={18} style={{ color: 'var(--error)', flexShrink: 0 }} />
                          : <PackageCheck size={18} style={{ color: 'var(--neon-emerald)', flexShrink: 0 }} />
                        }
                        <span className="font-semi">{ing.name}</span>
                      </div>
                    </td>
                    <td className="text-muted">{ing.category || '—'}</td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <span style={{ fontWeight: 700, color: isLow ? 'var(--error)' : 'var(--neon-emerald)' }}>
                          {ing.currentStock} {ing.unit}
                        </span>
                        {pct !== null && (
                          <div style={{ width: 80, height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 99 }}>
                            <div style={{ width: `${pct}%`, height: '100%', borderRadius: 99, background: isLow ? 'var(--error)' : 'var(--neon-emerald)', boxShadow: isLow ? 'none' : '0 0 8px var(--neon-emerald-glow)', transition: 'width 0.4s' }} />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="text-muted">{ing.unit || '—'}</td>
                    <td className="text-muted">{ing.reorderLevel ?? '—'}</td>
                    <td className="font-semi" style={{ color: 'var(--text)' }}>{ing.costPerUnit ? `$${ing.costPerUnit}` : '—'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn btn-ghost btn-xs" style={{ color: 'var(--neon-cyan)' }} onClick={() => { setForm(ing); setModal(true); }}>
                          <Pencil size={14} />
                        </button>
                        <button className="btn btn-ghost btn-xs" style={{ color: 'var(--error)' }} onClick={() => handleDelete(ing)}>
                          <Trash2 size={14} />
                        </button>
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
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{form._id ? 'Edit' : 'Add'} Ingredient</h3>
              <button className="modal-close" onClick={() => setModal(false)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Name *</label>
                <input className="form-input" value={form.name || ''}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Tomatoes" />
              </div>
              <div className="form-group">
                <label className="form-label">Category</label>
                <input className="form-input" value={form.category || ''}
                  onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                  placeholder="e.g. Vegetables, Dairy, Meat" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                <div className="form-group">
                  <label className="form-label">Current Stock</label>
                  <input className="form-input" type="number" min="0" step="0.1"
                    value={form.currentStock ?? ''}
                    onChange={e => setForm(p => ({ ...p, currentStock: parseFloat(e.target.value) }))}
                    placeholder="0" />
                </div>
                <div className="form-group">
                  <label className="form-label">Unit</label>
                  <select className="form-select" value={form.unit || ''}
                    onChange={e => setForm(p => ({ ...p, unit: e.target.value }))}>
                    <option value="">Select unit</option>
                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Reorder Level</label>
                  <input className="form-input" type="number" min="0" step="0.1"
                    value={form.reorderLevel ?? ''}
                    onChange={e => setForm(p => ({ ...p, reorderLevel: parseFloat(e.target.value) }))}
                    placeholder="Alert below this" />
                </div>
                <div className="form-group">
                  <label className="form-label">Cost per Unit ($)</label>
                  <input className="form-input" type="number" min="0" step="0.01"
                    value={form.costPerUnit ?? ''}
                    onChange={e => setForm(p => ({ ...p, costPerUnit: parseFloat(e.target.value) }))}
                    placeholder="0.00" />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? <div className="spinner" /> : null} {form._id ? 'Save Changes' : 'Add Ingredient'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
