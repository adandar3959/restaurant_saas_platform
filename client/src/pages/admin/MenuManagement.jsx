import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, X, Search, ChefHat, AlertCircle, CheckCircle } from 'lucide-react';
import { menuApi } from '../../api/menu.api';
import { truncate } from '../../lib/utils';
import './MenuManagement.css';

function Toast({ toast }) {
  if (!toast) return null;
  const isErr = toast.type === 'error';
  return (
    <div style={{
      position: 'fixed', top: 24, right: 24, zIndex: 9999,
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '12px 18px', borderRadius: 10, fontWeight: 700, fontSize: 13,
      background: isErr ? '#7f1d1d' : 'var(--bg-surface-2)',
      border: `1px solid ${isErr ? '#ef4444' : 'var(--primary)'}`,
      color: '#fff',
      boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
    }}>
      {isErr ? <AlertCircle size={16} /> : <CheckCircle size={16} />}
      {toast.msg}
    </div>
  );
}

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
  // sizes builder for menu items
  const [sizeRows,   setSizeRows]   = useState([]);
  const [toast,      setToast]      = useState(null);

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

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
      const existing = data.items?.length
        ? data.items.map(it => ({
            name:       it.name || '',
            quantity:   it.quantity || 1,
            menuItemId: it.menuItemId ? String(it.menuItemId?._id ?? it.menuItemId) : '',
            sizeName:   it.sizeName || '',
          }))
        : [{ name: '', quantity: 1, menuItemId: '', sizeName: '' }];
      setDealItems(existing);
    }
    if (type === 'item') {
      setSizeRows(data.sizes?.length ? data.sizes : []);
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
        // item — attach cleaned sizes
        const payload = { ...form, sizes: sizeRows.filter(s => s.name?.trim() && s.price >= 0) };
        if (form._id) await menuApi.updateItem(restaurantId, form._id, payload);
        else          await menuApi.createItem(restaurantId, payload);
      }
      setModal(null);
      load();
      showToast('success', 'Saved successfully');
    } catch (e) {
      showToast('error', e?.response?.data?.error || e?.response?.data?.message || 'Failed to save');
    }
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

  const addDealItem    = () => setDealItems(p => [...p, { name: '', quantity: 1, menuItemId: '', sizeName: '' }]);
  const removeDealItem  = (i) => setDealItems(p => p.filter((_, idx) => idx !== i));
  const updateDealItem  = (i, field, val) => setDealItems(p => p.map((it, idx) => idx === i ? { ...it, [field]: val } : it));

  const addSizeRow    = () => setSizeRows(p => [...p, { name: '', price: '' }]);
  const removeSizeRow  = (i) => setSizeRows(p => p.filter((_, idx) => idx !== i));
  const updateSizeRow  = (i, field, val) => setSizeRows(p => p.map((s, idx) => idx === i ? { ...s, [field]: val } : s));

  const filteredItems = items.filter(i => {
    const matchCat = selCat === 'all' || getId(i.categoryId) === selCat;
    const matchSearch = !search || i.name?.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div>
      <Toast toast={toast} />
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
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, marginTop: -4 }}>
                      Select items from your menu. If an item has sizes, pick the size too.
                    </p>
                    {dealItems.map((dealItem, i) => {
                      // Find the full menu item object to check if it has sizes
                      const menuItem = items.find(m => m._id === dealItem.menuItemId);
                      const hasSizes = menuItem?.sizes?.length > 0;

                      return (
                        <div key={i} style={{ marginBottom: 10 }}>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            {/* Item select */}
                            <select
                              className="form-select"
                              style={{ flex: 1 }}
                              value={dealItem.menuItemId || ''}
                              onChange={e => {
                                const selected = items.find(m => m._id === e.target.value);
                                if (selected) {
                                  // If item has sizes, don't set name yet — wait for size selection
                                  const baseName = selected.sizes?.length > 0 ? '' : selected.name;
                                  updateDealItem(i, 'menuItemId', selected._id);
                                  updateDealItem(i, 'name', baseName);
                                  updateDealItem(i, 'sizeName', ''); // reset size
                                } else {
                                  updateDealItem(i, 'menuItemId', '');
                                  updateDealItem(i, 'name', '');
                                  updateDealItem(i, 'sizeName', '');
                                }
                              }}
                            >
                              <option value="">— Select a menu item —</option>
                              {categories.map(cat => {
                                const catItems = items.filter(m => getId(m.categoryId) === cat._id);
                                if (catItems.length === 0) return null;
                                return (
                                  <optgroup key={cat._id} label={cat.name}>
                                    {catItems.map(m => (
                                      <option key={m._id} value={m._id}>
                                        {m.name}{m.sizes?.length > 0 ? ' (has sizes)' : ` — Rs ${m.price?.toLocaleString()}`}
                                      </option>
                                    ))}
                                  </optgroup>
                                );
                              })}
                              {items.filter(m => !categories.some(c => c._id === getId(m.categoryId))).length > 0 && (
                                <optgroup label="Other">
                                  {items.filter(m => !categories.some(c => c._id === getId(m.categoryId))).map(m => (
                                    <option key={m._id} value={m._id}>
                                      {m.name}{m.sizes?.length > 0 ? ' (has sizes)' : ` — Rs ${m.price?.toLocaleString()}`}
                                    </option>
                                  ))}
                                </optgroup>
                              )}
                            </select>

                            {/* Quantity */}
                            <input
                              className="form-input"
                              type="number" min="1"
                              style={{ width: 68, flexShrink: 0 }}
                              value={dealItem.quantity}
                              onChange={e => updateDealItem(i, 'quantity', parseInt(e.target.value) || 1)}
                              title="Quantity"
                            />
                            <button
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--error)', flexShrink: 0 }}
                              onClick={() => removeDealItem(i)}
                              disabled={dealItems.length === 1}
                            ><Trash2 size={15} /></button>
                          </div>


                          {/* Size pill selector — appears only when selected item has sizes */}
                          {hasSizes && (
                            <div style={{ marginTop: 8, paddingLeft: 4 }}>
                              <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 6 }}>
                                Pick size for <strong>{menuItem.name}</strong>:
                              </div>
                              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                {menuItem.sizes.map(s => {
                                  const selected = dealItem.sizeName === s.name;
                                  return (
                                    <button
                                      key={s.name}
                                      type="button"
                                      onClick={() => {
                                        updateDealItem(i, 'sizeName', s.name);
                                        updateDealItem(i, 'name', `${menuItem.name} (${s.name})`);
                                      }}
                                      style={{
                                        padding: '6px 14px',
                                        border: `2px solid ${selected ? 'var(--primary)' : 'var(--border)'}`,
                                        borderRadius: 9999,
                                        background: selected ? 'var(--primary)' : 'var(--bg-card)',
                                        color: selected ? '#fff' : 'var(--text-secondary)',
                                        fontWeight: 700, fontSize: 13,
                                        cursor: 'pointer', fontFamily: 'inherit',
                                        transition: 'all 0.18s ease',
                                        display: 'flex', flexDirection: 'column',
                                        alignItems: 'center', gap: 1,
                                        lineHeight: 1.3,
                                      }}
                                    >
                                      <span>{s.name}</span>
                                      <span style={{ fontSize: 11, fontWeight: 600, opacity: selected ? 0.9 : 0.65 }}>
                                        Rs {s.price?.toLocaleString()}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                              {!dealItem.sizeName && (
                                <div style={{ fontSize: 11, color: 'var(--error)', marginTop: 4 }}>⚠ Please pick a size</div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
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
                          <label className="form-label">Base Price (Rs) *</label>
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

                      {/* ── SIZES ── */}
                      <div className="form-group">
                        <label className="form-label">
                          Size Options{' '}
                          <span style={{ fontWeight: 500, color: 'var(--text-muted)' }}>(optional)</span>
                        </label>
                        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10, marginTop: -4 }}>
                          Define sizes below. Customer picks one before adding to cart.
                        </p>

                        {/* Input rows to define sizes */}
                        {sizeRows.map((s, i) => (
                          <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                            <input
                              className="form-input"
                              style={{ flex: 1 }}
                              placeholder="Size name (e.g. Regular, Large)"
                              value={s.name}
                              onChange={e => updateSizeRow(i, 'name', e.target.value)}
                            />
                            <input
                              className="form-input"
                              type="number" min="0"
                              style={{ width: 110, flexShrink: 0 }}
                              placeholder="Rs Price"
                              value={s.price}
                              onChange={e => updateSizeRow(i, 'price', parseFloat(e.target.value) || 0)}
                            />
                            <button
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--error)', flexShrink: 0 }}
                              onClick={() => removeSizeRow(i)}
                            ><Trash2 size={15} /></button>
                          </div>
                        ))}
                        <button className="btn btn-outline btn-sm" onClick={addSizeRow} style={{ marginTop: 2 }}>
                          <Plus size={14} /> Add Size
                        </button>

                        {/* Live pill preview */}
                        {sizeRows.filter(s => s.name?.trim()).length > 0 && (
                          <div style={{ marginTop: 14 }}>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 8 }}>
                              Preview (how customer sees it):
                            </div>
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                              {sizeRows.filter(s => s.name?.trim()).map((s, idx) => (
                                <div
                                  key={idx}
                                  style={{
                                    padding: '8px 18px',
                                    border: `2px solid ${idx === 0 ? 'var(--primary)' : 'var(--border)'}`,
                                    borderRadius: 9999,
                                    background: idx === 0 ? 'var(--primary)' : 'var(--bg-card)',
                                    color: idx === 0 ? '#fff' : 'var(--text-secondary)',
                                    display: 'flex', flexDirection: 'column',
                                    alignItems: 'center', gap: 2, lineHeight: 1.3,
                                    opacity: idx === 0 ? 1 : 0.75,
                                  }}
                                >
                                  <span style={{ fontWeight: 800, fontSize: 13 }}>{s.name}</span>
                                  <span style={{ fontWeight: 700, fontSize: 12 }}>Rs {Number(s.price || 0).toLocaleString()}</span>
                                </div>
                              ))}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>First option is selected by default</div>
                          </div>
                        )}
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
