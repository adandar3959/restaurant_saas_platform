import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, X, Search, ChefHat } from 'lucide-react';
import { menuApi } from '../../api/menu.api';
import { truncate } from '../../lib/utils';
import './MenuManagement.css';

export default function MenuManagement() {
  const { restaurantId } = useOutletContext();
  const [categories, setCategories] = useState([]);
  const [items,      setItems]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [activeTab,  setActiveTab]  = useState('items'); // 'categories' | 'items'
  const [selCat,     setSelCat]     = useState('all');
  const [search,     setSearch]     = useState('');
  const [modal,      setModal]      = useState(null); // {type: 'category'|'item', data?: obj}
  const [saving,     setSaving]     = useState(false);
  const [form,       setForm]       = useState({});

  const load = async () => {
    setLoading(true);
    try {
      const [cRes, iRes] = await Promise.all([
        menuApi.getCategories(restaurantId),
        menuApi.getItems(restaurantId),
      ]);
      setCategories(cRes.data?.data || []);
      setItems(iRes.data?.data?.items || iRes.data?.data || []);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [restaurantId]);

  const openModal = (type, data = {}) => {
    setForm(data);
    setModal({ type, data });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (modal.type === 'category') {
        if (form._id) await menuApi.updateCategory(restaurantId, form._id, form);
        else          await menuApi.createCategory(restaurantId, form);
      } else {
        if (form._id) await menuApi.updateItem(restaurantId, form._id, form);
        else          await menuApi.createItem(restaurantId, form);
      }
      setModal(null);
      load();
    } catch {}
    finally { setSaving(false); }
  };

  const handleDelete = async (type, id) => {
    if (!window.confirm('Delete this item?')) return;
    try {
      if (type === 'category') await menuApi.deleteCategory(restaurantId, id);
      else                     await menuApi.deleteItem(restaurantId, id);
      load();
    } catch {}
  };

  const handleToggle = async (id) => {
    try {
      await menuApi.toggleItem(restaurantId, id);
      load();
    } catch {}
  };

  const filteredItems = items.filter(i => {
    const matchCat = selCat === 'all' || i.categoryId === selCat;
    const matchSearch = !search || i.name?.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Menu Management</h1>
          <p className="page-subtitle">{categories.length} categories · {items.length} items</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          <button className="btn btn-outline btn-sm" onClick={() => openModal('category')}>
            <Plus size={15} /> Category
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => openModal('item')}>
            <Plus size={15} /> Add Item
          </button>
        </div>
      </div>

      {/* Category filter chips */}
      <div className="cat-chips">
        <button className={`cat-chip ${selCat === 'all' ? 'active' : ''}`} onClick={() => setSelCat('all')}>
          All ({items.length})
        </button>
        {categories.map(c => (
          <button
            key={c._id}
            className={`cat-chip ${selCat === c._id ? 'active' : ''}`}
            onClick={() => setSelCat(c._id)}
          >
            {c.name} ({items.filter(i => i.categoryId === c._id).length})
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="orders-search" style={{ marginBottom: 'var(--space-4)' }}>
        <Search size={16} className="orders-search-icon" />
        <input
          type="text"
          className="form-input"
          style={{ paddingLeft: 40 }}
          placeholder="Search menu items..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="page-loading"><div className="spinner-lg" /></div>
      ) : filteredItems.length === 0 ? (
        <div className="data-table-wrap">
          <div className="empty-state">
            <div className="empty-state-icon">🍽️</div>
            <div className="empty-state-title">No menu items yet</div>
            <p>Add your first item to get started.</p>
            <button className="btn btn-primary mt-4" onClick={() => openModal('item')}>
              <Plus size={16} /> Add First Item
            </button>
          </div>
        </div>
      ) : (
        <div className="menu-grid">
          {filteredItems.map(item => {
            const cat = categories.find(c => c._id === item.categoryId);
            return (
              <div key={item._id} className={`menu-item-card card ${!item.isAvailable ? 'unavailable' : ''}`}>
                <div className="mic-header">
                  <div className="mic-cat-tag">{cat?.name || 'Uncategorized'}</div>
                  <button
                    className="mic-toggle"
                    onClick={() => handleToggle(item._id)}
                    title={item.isAvailable ? 'Disable item' : 'Enable item'}
                  >
                    {item.isAvailable
                      ? <ToggleRight size={22} style={{ color: 'var(--success)' }} />
                      : <ToggleLeft  size={22} style={{ color: 'var(--text-subtle)' }} />
                    }
                  </button>
                </div>
                <div className="mic-name">{item.name}</div>
                {item.description && <p className="mic-desc text-sm text-muted">{truncate(item.description, 60)}</p>}
                <div className="mic-footer">
                  <span className="mic-price">${item.price?.toFixed(2)}</span>
                  <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                    <button className="btn btn-ghost btn-xs" onClick={() => openModal('item', item)}>
                      <Pencil size={13} />
                    </button>
                    <button className="btn btn-ghost btn-xs" style={{ color: 'var(--error)' }} onClick={() => handleDelete('item', item._id)}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Categories section at bottom */}
      <div style={{ marginTop: 'var(--space-10)' }}>
        <div className="page-header">
          <h2 className="dash-section-title">Categories ({categories.length})</h2>
          <button className="btn btn-outline btn-sm" onClick={() => openModal('category')}>
            <Plus size={14} /> Add Category
          </button>
        </div>
        <div className="data-table-wrap" style={{ marginTop: 'var(--space-4)' }}>
          <table className="data-table">
            <thead><tr><th>Name</th><th>Description</th><th>Items</th><th>Actions</th></tr></thead>
            <tbody>
              {categories.length === 0 ? (
                <tr><td colSpan={4} style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--text-muted)' }}>No categories yet</td></tr>
              ) : categories.map(c => (
                <tr key={c._id}>
                  <td className="font-semi">{c.name}</td>
                  <td className="text-muted text-sm">{truncate(c.description || '—', 50)}</td>
                  <td>{items.filter(i => i.categoryId === c._id).length}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn-ghost btn-xs" onClick={() => openModal('category', c)}><Pencil size={13} /></button>
                      <button className="btn btn-ghost btn-xs" style={{ color: 'var(--error)' }} onClick={() => handleDelete('category', c._id)}><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {form._id ? 'Edit' : 'Add'} {modal.type === 'category' ? 'Category' : 'Menu Item'}
              </h3>
              <button className="modal-close" onClick={() => setModal(null)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Name *</label>
                <input className="form-input" value={form.name || ''} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Item name" />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-input" rows={3} value={form.description || ''} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Short description..." />
              </div>
              {modal.type === 'item' && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                    <div className="form-group">
                      <label className="form-label">Price *</label>
                      <input className="form-input" type="number" min="0" step="0.01" value={form.price || ''} onChange={e => setForm(p => ({ ...p, price: parseFloat(e.target.value) }))} placeholder="0.00" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Category</label>
                      <select className="form-select" value={form.categoryId || ''} onChange={e => setForm(p => ({ ...p, categoryId: e.target.value }))}>
                        <option value="">No category</option>
                        {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Preparation Time (min)</label>
                    <input className="form-input" type="number" min="1" value={form.preparationTime || ''} onChange={e => setForm(p => ({ ...p, preparationTime: parseInt(e.target.value) }))} placeholder="15" />
                  </div>
                </>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? <div className="spinner" /> : null}
                {form._id ? 'Save Changes' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
