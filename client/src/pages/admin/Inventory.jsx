import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Plus, X, AlertTriangle } from 'lucide-react';
import { inventoryApi } from '../../api/inventory.api';
import { UNITS } from '../../lib/constants';

export default function Inventory() {
  const { restaurantId } = useOutletContext();
  const [ingredients, setIngredients] = useState([]);
  const [lowStock,    setLowStock]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [tab,         setTab]         = useState('ingredients');
  const [modal,       setModal]       = useState(false);
  const [form,        setForm]        = useState({});
  const [saving,      setSaving]      = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [ing, low] = await Promise.all([
        inventoryApi.getIngredients(restaurantId),
        inventoryApi.getLowStock(restaurantId),
      ]);
      setIngredients(ing.data?.data?.ingredients || ing.data?.data || []);
      setLowStock(low.data?.data?.ingredients || low.data?.data || []);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [restaurantId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (form._id) await inventoryApi.updateIngredient(restaurantId, form._id, form);
      else          await inventoryApi.addIngredient(restaurantId, form);
      setModal(false);
      load();
    } catch {}
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete ingredient?')) return;
    try { await inventoryApi.deleteIngredient(restaurantId, id); load(); } catch {}
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Inventory</h1>
          <p className="page-subtitle">{ingredients.length} ingredients · {lowStock.length} low stock</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => { setForm({}); setModal(true); }}>
          <Plus size={15} /> Add Ingredient
        </button>
      </div>

      {/* Low stock alert */}
      {lowStock.length > 0 && (
        <div className="alert alert-warning" style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
          <AlertTriangle size={18} />
          <span><strong>{lowStock.length} items</strong> are running low on stock: {lowStock.slice(0,3).map(i => i.name).join(', ')}{lowStock.length > 3 ? ` +${lowStock.length - 3} more` : ''}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="orders-tabs" style={{ marginBottom: 'var(--space-4)' }}>
        <button className={`orders-tab ${tab === 'ingredients' ? 'active' : ''}`} onClick={() => setTab('ingredients')}>Ingredients</button>
        <button className={`orders-tab ${tab === 'lowstock' ? 'active' : ''}`} onClick={() => setTab('lowstock')}>
          Low Stock <span className="orders-tab-count">{lowStock.length}</span>
        </button>
      </div>

      {loading ? <div className="page-loading"><div className="spinner-lg" /></div> : (
        <div className="data-table-wrap">
          <table className="data-table">
            <thead><tr><th>Name</th><th>Category</th><th>Stock</th><th>Unit</th><th>Reorder Level</th><th>Actions</th></tr></thead>
            <tbody>
              {(tab === 'ingredients' ? ingredients : lowStock).length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--text-muted)' }}>No items found</td></tr>
              ) : (tab === 'ingredients' ? ingredients : lowStock).map(ing => (
                <tr key={ing._id}>
                  <td className="font-semi">{ing.name}</td>
                  <td className="text-muted">{ing.category || '—'}</td>
                  <td>
                    <span style={{ color: ing.currentStock <= ing.reorderLevel ? 'var(--error)' : 'var(--success)', fontWeight: 700 }}>
                      {ing.currentStock}
                    </span>
                  </td>
                  <td className="text-muted">{ing.unit}</td>
                  <td className="text-muted">{ing.reorderLevel}</td>
                  <td>
                    <button className="btn btn-ghost btn-xs" onClick={() => { setForm(ing); setModal(true); }}>Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{form._id ? 'Edit' : 'Add'} Ingredient</h3>
              <button className="modal-close" onClick={() => setModal(false)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Name</label>
                <input className="form-input" value={form.name || ''} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                <div className="form-group">
                  <label className="form-label">Current Stock</label>
                  <input className="form-input" type="number" value={form.currentStock || ''} onChange={e => setForm(p => ({ ...p, currentStock: parseFloat(e.target.value) }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Unit</label>
                  <select className="form-select" value={form.unit || ''} onChange={e => setForm(p => ({ ...p, unit: e.target.value }))}>
                    <option value="">Select</option>
                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Reorder Level</label>
                  <input className="form-input" type="number" value={form.reorderLevel || ''} onChange={e => setForm(p => ({ ...p, reorderLevel: parseFloat(e.target.value) }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Cost per Unit ($)</label>
                  <input className="form-input" type="number" value={form.costPerUnit || ''} onChange={e => setForm(p => ({ ...p, costPerUnit: parseFloat(e.target.value) }))} />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? <div className="spinner" /> : null} {form._id ? 'Save' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
