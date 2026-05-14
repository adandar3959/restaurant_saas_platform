import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, X, Search, ChefHat } from 'lucide-react';
import { menuApi } from '../../api/menu.api';
import { truncate } from '../../lib/utils';
import './MenuManagement.css';

const getId = (ref) => (ref && typeof ref === 'object') ? String(ref._id) : String(ref ?? '');

export default function MenuManagement() {
  const { restaurantId } = useOutletContext();
  const [categories, setCategories] = useState([]);
  const [items,      setItems]      = useState([]);
  const [deals,      setDeals]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [activeTab,  setActiveTab]  = useState('items');
  const [selCat,     setSelCat]     = useState('all');
  const [search,     setSearch]     = useState('');
  const [modal,      setModal]      = useState(null);
  const [saving,     setSaving]     = useState(false);
  const [form,       setForm]       = useState({});
  // deal items builder
  const [dealItems,  setDealItems]  = useState([{ name: '', quantity: 1 }]);

  const load = async () => {
    setLoading(true);
    try {
      const [cRes, iRes, dRes] = await Promise.all([
        menuApi.getCategories(restaurantId),
        menuApi.getItems(restaurantId),
        menuApi.getDeals(restaurantId),
      ]);
      setCategories(cRes.data?.data || []);
      setItems(iRes.data?.data?.items || iRes.data?.data || []);
      setDeals(dRes.data?.data || []);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [restaurantId]);

  const openModal = (type, data = {}) => {
    setForm(data);
    if (type === 'deal') {
      setDealItems(data.items?.length ? data.items : [{ name: '', quantity: 1 }]);
    }
    setModal({ type, data });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (modal.type === 'category') {
        if (form._id) await menuApi.updateCategory(restaurantId, form._id, form);
        else          await menuApi.createCategory(restaurantId, form);
      } else if (modal.type === 'deal') {
        const payload = { ...form, items: dealItems.filter(i => i.name.trim()) };
        if (form._id) await menuApi.updateDeal(restaurantId, form._id, payload);
        else          await menuApi.createDeal(restaurantId, payload);
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
    if (!window.confirm('Delete this?')) return;
    try {
      if (type === 'category') await menuApi.deleteCategory(restaurantId, id);
      else if (type === 'deal') await menuApi.deleteDeal(restaurantId, id);
      else                     await menuApi.deleteItem(restaurantId, id);
      load();
    } catch {}
  };

  const handleToggle = async (id) => {
    try { await menuApi.toggleItem(restaurantId, id); load(); } catch {}
  };

  const handleToggleDeal = async (id) => {
    try { await menuApi.toggleDeal(restaurantId, id); load(); } catch {}
  };

  const addDealItem   = () => setDealItems(p => [...p, { name: '', quantity: 1 }]);
  const removeDealItem = (i) => setDealItems(p => p.filter((_, idx) => idx !== i));
  const updateDealItem = (i, field, val) => setDealItems(p => p.map((it, idx) => idx === i ? { ...it, [field]: val } : it));

  const filteredItems = items.filter(i => {
    const matchCat = selCat === 'all' || getId(i.categoryId) === selCat;
    const matchSearch = !search || i.name?.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Menu Management</h1>
          <p className="page-subtitle">{categories.length} categories · {items.length} items · {deals.length} deals</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          {activeTab === 'deals' ? (
            <button className="btn btn-primary btn-sm" onClick={() => openModal('deal')}>
              <Plus size={15} /> Add Deal
            </button>
          ) : (
            <>
              <button className="btn btn-outline btn-sm" onClick={() => openModal('category')}>
                <Plus size={15} /> Category
              </button>
              <button className="btn btn-primary btn-sm" onClick={() => openModal('item')}>
                <Plus size={15} /> Add Item
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tab switcher */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 'var(--space-5)', borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
        {[{ key: 'items', label: '🍽️ Items' }, { key: 'deals', label: '🔥 Deals' }, { key: 'categories', label: '📂 Categories' }].map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            style={{
              padding: '8px 18px', border: 'none', background: 'none', cursor: 'pointer',
              fontWeight: 700, fontSize: 14, fontFamily: 'inherit',
              color: activeTab === t.key ? 'var(--primary)' : 'var(--text-muted)',
              borderBottom: activeTab === t.key ? '2px solid var(--primary)' : '2px solid transparent',
              transition: 'all 0.2s',
            }}
          >{t.label}</button>
        ))}
      </div>


      {/* ── ITEMS TAB ───────────────────────────────── */}
      {activeTab === 'items' && <>
      <div className="cat-chips glass-panel" style={{ padding: '8px', marginBottom: 'var(--space-6)', display: 'flex', gap: '8px', overflowX: 'auto', border: '1px solid var(--glass-border)' }}>
        <button className={`cat-chip ${selCat === 'all' ? 'active' : ''}`} onClick={() => setSelCat('all')}>
          ALL ({items.length})
        </button>
        {categories.map(c => (
          <button
            key={c._id}
            className={`cat-chip ${selCat === c._id ? 'active' : ''}`}
            onClick={() => setSelCat(c._id)}
          >
            {c.name.toUpperCase()} ({items.filter(i => getId(i.categoryId) === c._id).length})
          </button>
        ))}
      </div>

      {}
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
          {filteredItems.map((item, idx) => {
            const cat = categories.find(c => c._id === getId(item.categoryId));
            return (
              <div key={item._id} className={`menu-item-card glass-panel animate-fade-up ${!item.isAvailable ? 'unavailable' : ''}`} style={{ animationDelay: `${idx * 50}ms` }}>
                <div className="mic-header">
                  <div className="mic-cat-tag" style={{ background: 'rgba(56,189,248,0.1)', color: 'var(--neon-cyan)', border: '1px solid rgba(56,189,248,0.2)', fontSize: '10px', fontWeight: '800' }}>
                    {cat?.name?.toUpperCase() || 'UNCATEGORIZED'}
                  </div>
                  <button
                    className="mic-toggle"
                    onClick={() => handleToggle(item._id)}
                  >
                    {item.isAvailable
                      ? <ToggleRight size={24} style={{ color: 'var(--neon-emerald)', filter: 'drop-shadow(0 0 5px var(--neon-emerald-glow))' }} />
                      : <ToggleLeft  size={24} style={{ color: 'var(--text-subtle)' }} />
                    }
                  </button>
                </div>
                <div className="mic-name gradient-text-cyan">{item.name}</div>
                {item.description && <p className="mic-desc text-sm text-muted">{truncate(item.description, 80)}</p>}
                <div className="mic-footer" style={{ marginTop: 'auto', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--glass-border)' }}>
                  <span className="mic-price" style={{ color: 'var(--neon-cyan)', fontWeight: '900', fontSize: '18px' }}>${item.price?.toFixed(2)}</span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn-ghost btn-xs" onClick={() => openModal('item', item)}>
                      <Pencil size={14} style={{ color: 'var(--neon-cyan)' }} />
                    </button>
                    <button className="btn btn-ghost btn-xs" style={{ color: 'var(--error)' }} onClick={() => handleDelete('item', item._id)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}</>}

      {/* ── DEALS TAB ───────────────────────────────── */}

      {activeTab === 'deals' && (
        <div>
          {deals.length === 0 ? (
            <div className="data-table-wrap"><div className="empty-state">
              <div className="empty-state-icon">🔥</div>
              <div className="empty-state-title">No deals yet</div>
              <p>Create combo deals to attract more customers.</p>
              <button className="btn btn-primary mt-4" onClick={() => openModal('deal')}><Plus size={16} /> Create First Deal</button>
            </div></div>
          ) : (
            <div className="data-table-wrap glass-panel animate-fade-up">
              <table className="data-table">
                <thead><tr><th>Deal Name</th><th>Includes</th><th>Deal Price</th><th>Original</th><th>Discount</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {deals.map(deal => {
                    const pct = deal.originalPrice && deal.originalPrice > deal.dealPrice
                      ? Math.round(((deal.originalPrice - deal.dealPrice) / deal.originalPrice) * 100) : 0;
                    return (
                      <tr key={deal._id}>
                        <td>
                          <div className="font-semi" style={{ color: 'var(--primary)' }}>{deal.name}</div>
                          {deal.tag && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>🏷️ {deal.tag}</div>}
                        </td>
                        <td className="text-sm text-muted">{deal.items?.map(i => `${i.quantity}× ${i.name}`).join(' + ') || '—'}</td>
                        <td><span style={{ fontWeight: 900, color: 'var(--primary)' }}>Rs {deal.dealPrice?.toLocaleString()}</span></td>
                        <td className="text-muted">{deal.originalPrice ? `Rs ${deal.originalPrice.toLocaleString()}` : '—'}</td>
                        <td>{pct > 0 ? <span style={{ background: 'rgba(5,150,105,0.1)', color: 'var(--success)', padding: '2px 8px', borderRadius: 9999, fontWeight: 700, fontSize: 12 }}>{pct}% OFF</span> : '—'}</td>
                        <td>
                          <button onClick={() => handleToggleDeal(deal._id)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                            {deal.isAvailable
                              ? <ToggleRight size={24} style={{ color: 'var(--success)' }} />
                              : <ToggleLeft  size={24} style={{ color: 'var(--text-subtle)' }} />}
                          </button>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button className="btn btn-ghost btn-xs" style={{ color: 'var(--neon-cyan)' }} onClick={() => openModal('deal', deal)}><Pencil size={14} /></button>
                            <button className="btn btn-ghost btn-xs" style={{ color: 'var(--error)' }} onClick={() => handleDelete('deal', deal._id)}><Trash2 size={14} /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── CATEGORIES TAB ──────────────────────────── */}
      {activeTab === 'categories' && (
        <div>
          <div className="data-table-wrap glass-panel animate-fade-up">
            <table className="data-table">
              <thead><tr><th>Name</th><th>Description</th><th>Items</th><th>Actions</th></tr></thead>
              <tbody>
                {categories.length === 0 ? (
                  <tr><td colSpan={4} style={{ textAlign: 'center', padding: 'var(--space-12)', color: 'var(--text-muted)' }}>No categories yet</td></tr>
                ) : categories.map(c => (
                  <tr key={c._id}>
                    <td className="font-semi"><span style={{ color: 'var(--neon-cyan)' }}>{c.name}</span></td>
                    <td className="text-muted text-sm">{truncate(c.description || '—', 80)}</td>
                    <td className="font-semi">{items.filter(i => getId(i.categoryId) === c._id).length}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn btn-ghost btn-xs" style={{ color: 'var(--neon-cyan)' }} onClick={() => openModal('category', c)}><Pencil size={14} /></button>
                        <button className="btn btn-ghost btn-xs" style={{ color: 'var(--error)' }} onClick={() => handleDelete('category', c._id)}><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" style={{ maxWidth: modal.type === 'deal' ? 560 : 480, maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {form._id ? 'Edit' : 'Add'}{' '}
                {modal.type === 'category' ? 'Category' : modal.type === 'deal' ? '🔥 Deal' : 'Menu Item'}
              </h3>
              <button className="modal-close" onClick={() => setModal(null)}><X size={18} /></button>
            </div>
            <div className="modal-body">

              {/* ── DEAL FORM ── */}
              {modal.type === 'deal' && (
                <>
                  <div className="form-group">
                    <label className="form-label">Deal Name *</label>
                    <input className="form-input" value={form.name || ''} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder='e.g. Deal 1, Family Deal' />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Tag (optional)</label>
                    <input className="form-input" value={form.tag || ''} onChange={e => setForm(p => ({ ...p, tag: e.target.value }))} placeholder='e.g. Best Seller, New, Hot 🔥' />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                    <div className="form-group">
                      <label className="form-label">Deal Price (Rs) *</label>
                      <input className="form-input" type="number" min="0" value={form.dealPrice || ''} onChange={e => setForm(p => ({ ...p, dealPrice: parseFloat(e.target.value) }))} placeholder='599' />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Original Price (Rs)</label>
                      <input className="form-input" type="number" min="0" value={form.originalPrice || ''} onChange={e => setForm(p => ({ ...p, originalPrice: parseFloat(e.target.value) }))} placeholder='950 (crossed-out)' />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">What's Included *</label>
                    {dealItems.map((item, i) => (
                      <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                        <input
                          className="form-input"
                          style={{ flex: 1 }}
                          placeholder={`Item ${i + 1} name, e.g. Zinger Burger`}
                          value={item.name}
                          onChange={e => updateDealItem(i, 'name', e.target.value)}
                        />
                        <input
                          className="form-input"
                          type="number" min="1"
                          style={{ width: 64 }}
                          value={item.quantity}
                          onChange={e => updateDealItem(i, 'quantity', parseInt(e.target.value) || 1)}
                          title="Quantity"
                        />
                        <button
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--error)', flexShrink: 0 }}
                          onClick={() => removeDealItem(i)}
                          disabled={dealItems.length === 1}
                        ><Trash2 size={15} /></button>
                      </div>
                    ))}
                    <button className="btn btn-outline btn-sm" onClick={addDealItem} style={{ marginTop: 4 }}>
                      <Plus size={14} /> Add Item
                    </button>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
                    <label className="form-label" style={{ margin: 0 }}>Featured (show at top)</label>
                    <input type="checkbox" checked={!!form.isFeatured} onChange={e => setForm(p => ({ ...p, isFeatured: e.target.checked }))} style={{ width: 18, height: 18, accentColor: 'var(--primary)', cursor: 'pointer' }} />
                  </div>
                </>
              )}

              {/* ── CATEGORY / ITEM FORM (unchanged) ── */}
              {modal.type !== 'deal' && (
                <>
                  <div className="form-group">
                    <label className="form-label">Name *</label>
                    <input className="form-input" value={form.name || ''} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Name" />
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
                          <select className="form-select" value={getId(form.categoryId)} onChange={e => setForm(p => ({ ...p, categoryId: e.target.value }))}>
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
