import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Plus, X, AlertTriangle, Pencil, Trash2, PackageCheck, PackageX, CheckCircle, ChefHat, Info } from 'lucide-react';
import { inventoryApi } from '../../api/inventory.api';
import { menuApi } from '../../api/menu.api';
import { UNITS } from '../../lib/constants';
import UpgradeGate from '../../components/common/UpgradeGate';

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
  const [activeMainTab, setActiveMainTab] = useState('ingredients'); // 'ingredients' | 'recipes'
  
  // Ingredients State
  const [ingredients, setIngredients] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState(null);

  // Recipes State
  const [recipes, setRecipes] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [recipeModal, setRecipeModal] = useState(false);
  const [recipeForm, setRecipeForm] = useState({ ingredients: [{ ingredientId: '', quantity: 1 }] });

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  };

  const load = async () => {
    setLoading(true);
    try {
      const [ing, low, rec, items] = await Promise.all([
        inventoryApi.getIngredients(restaurantId),
        inventoryApi.getLowStock(restaurantId),
        inventoryApi.getRecipes(restaurantId),
        menuApi.getItems(restaurantId, { limit: 1000 }),
      ]);
      setIngredients(ing.data?.data?.ingredients || ing.data?.data || []);
      setLowStock(low.data?.data?.ingredients || low.data?.data || []);
      setRecipes(rec.data?.data || []);
      setMenuItems(items.data?.data?.items || items.data?.data || []);
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

  // Recipe-specific operations
  const handleEditRecipe = (recipe) => {
    setRecipeForm({
      _id: recipe._id,
      menuItemId: recipe.menuItemId?._id || recipe.menuItemId,
      yield: recipe.yield || 1,
      preparationNotes: recipe.preparationNotes || '',
      ingredients: recipe.ingredients.map(i => ({
        ingredientId: i.ingredientId?._id || i.ingredientId,
        quantity: i.quantity,
      })),
    });
    setRecipeModal(true);
  };

  const handleSaveRecipe = async () => {
    if (!recipeForm.menuItemId) { showToast('error', 'Please select a product'); return; }
    
    // Validate ingredients
    const selectedItem = menuItems.find(item => item._id === recipeForm.menuItemId);
    const enrichedIngredients = recipeForm.ingredients
      .filter(ing => ing.ingredientId && ing.quantity > 0)
      .map(ing => {
        const matchingIng = ingredients.find(i => i._id === ing.ingredientId);
        return {
          ingredientId: ing.ingredientId,
          ingredientName: matchingIng?.name || '',
          quantity: parseFloat(ing.quantity),
          unit: matchingIng?.unit || '',
        };
      });

    if (enrichedIngredients.length === 0) {
      showToast('error', 'Please add at least one ingredient');
      return;
    }

    const payload = {
      menuItemId: recipeForm.menuItemId,
      menuItemName: selectedItem?.name || '',
      ingredients: enrichedIngredients,
      yield: parseFloat(recipeForm.yield || 1),
      preparationNotes: recipeForm.preparationNotes || '',
    };

    setSaving(true);
    try {
      if (recipeForm._id) {
        await inventoryApi.updateRecipe(restaurantId, recipeForm._id, payload);
      } else {
        await inventoryApi.createRecipe(restaurantId, payload);
      }
      setRecipeModal(false);
      setRecipeForm({ ingredients: [{ ingredientId: '', quantity: 1 }] });
      load();
      showToast('success', recipeForm._id ? 'Recipe updated' : 'Recipe created');
    } catch (e) {
      showToast('error', e?.response?.data?.message || 'Failed to save recipe');
    } finally { setSaving(false); }
  };

  const displayList = (tab === 'lowstock' ? lowStock : ingredients)
    .filter(i => !search || i.name?.toLowerCase().includes(search.toLowerCase()));

  const stockPct = (ing) => {
    if (!ing.reorderLevel || ing.reorderLevel === 0) return null;
    return Math.min(100, Math.round((ing.currentStock / (ing.reorderLevel * 3)) * 100));
  };

  return (
    <UpgradeGate featureKey="inventory" requiredPlanName="Pro">
      <div>
        <Toast toast={toast} />

      <div className="page-header">
        <div>
          <h1 className="page-title">Inventory & Recipes</h1>
          <p className="page-subtitle">
            {ingredients.length} raw ingredients · {recipes.length} active recipes
          </p>
        </div>

        {activeMainTab === 'ingredients' ? (
          <button className="btn btn-primary btn-sm" onClick={() => { setForm({}); setModal(true); }}>
            <Plus size={15} /> Add Ingredient
          </button>
        ) : (
          <button className="btn btn-primary btn-sm" onClick={() => { setRecipeForm({ yield: 1, preparationNotes: '', ingredients: [{ ingredientId: '', quantity: 1 }] }); setRecipeModal(true); }}>
            <Plus size={15} /> Add Recipe
          </button>
        )}
      </div>

      {/* Main Tabs Switcher */}
      <div className="orders-tabs" style={{ marginBottom: 'var(--space-6)', borderBottom: '1px solid var(--border)', display: 'flex', gap: 8 }}>
        <button 
          className={`orders-tab ${activeMainTab === 'ingredients' ? 'active' : ''}`} 
          onClick={() => setActiveMainTab('ingredients')}
          style={{ display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <PackageCheck size={16} /> Raw Ingredients
        </button>
        <button 
          className={`orders-tab ${activeMainTab === 'recipes' ? 'active' : ''}`} 
          onClick={() => setActiveMainTab('recipes')}
          style={{ display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <ChefHat size={16} /> Recipes
        </button>
      </div>

      {activeMainTab === 'ingredients' ? (
        <>
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
        </>
      ) : (
        /* Recipes Tab */
        <>
          {loading ? (
            <div className="page-loading"><div className="spinner-lg" /></div>
          ) : (
            <div className="data-table-wrap glass-panel animate-fade-up" style={{ animationDelay: '200ms' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Product Name</th>
                    <th>Ingredients Included</th>
                    <th>Yield</th>
                    <th>Preparation Notes</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {recipes.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: 'var(--space-10)', color: 'var(--text-muted)' }}>
                        <div style={{ fontSize: 32, marginBottom: 8 }}>🍳</div>
                        <div>No recipes created yet. Link ingredients to menu items!</div>
                      </td>
                    </tr>
                  ) : recipes.map(recipe => (
                    <tr key={recipe._id}>
                      <td>
                        <span className="font-semi" style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                          <ChefHat size={16} />
                          {recipe.menuItemId?.name || recipe.menuItemName || 'Unknown Product'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {recipe.ingredients?.map((ing, idx) => (
                            <span 
                              key={idx} 
                              style={{ 
                                padding: '4px 10px', 
                                background: 'rgba(255,255,255,0.05)', 
                                border: '1px solid var(--border)', 
                                borderRadius: 6, 
                                fontSize: 11,
                                color: 'var(--text)'
                              }}
                            >
                              <strong>{ing.quantity} {ing.unit || ing.ingredientId?.unitOfMeasurement}</strong> {ing.ingredientName || ing.ingredientId?.ingredientName}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="text-muted">{recipe.yield || 1} portion(s)</td>
                      <td className="text-muted" style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {recipe.preparationNotes || '—'}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button className="btn btn-ghost btn-xs" style={{ color: 'var(--neon-cyan)' }} onClick={() => handleEditRecipe(recipe)}>
                            <Pencil size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Ingredient Modal */}
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

      {/* Recipe Modal */}
      {recipeModal && (
        <div className="modal-overlay" onClick={() => setRecipeModal(false)}>
          <div className="modal" style={{ maxWidth: 650 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{recipeForm._id ? 'Edit' : 'Add'} Product Recipe</h3>
              <button className="modal-close" onClick={() => setRecipeModal(false)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-4)' }}>
                <div className="form-group">
                  <label className="form-label">Select Menu Product *</label>
                  <select 
                    className="form-select" 
                    value={recipeForm.menuItemId || ''} 
                    onChange={e => setRecipeForm(p => ({ ...p, menuItemId: e.target.value }))}
                    disabled={!!recipeForm._id}
                  >
                    <option value="">Select menu item...</option>
                    {menuItems.map(item => (
                      <option key={item._id} value={item._id}>{item.name} (${item.price})</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Yield (Portions)</label>
                  <input 
                    className="form-input" 
                    type="number" 
                    min="1" 
                    value={recipeForm.yield || 1} 
                    onChange={e => setRecipeForm(p => ({ ...p, yield: parseInt(e.target.value) }))} 
                  />
                </div>
              </div>

              {/* Recipe Ingredients Dynamic Row Adder */}
              <div style={{ marginTop: 'var(--space-4)', borderTop: '1px solid var(--border)', paddingTop: 'var(--space-4)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <label className="form-label" style={{ margin: 0 }}>Recipe Ingredients & Proportions *</label>
                  <button 
                    className="btn btn-outline btn-xs" 
                    style={{ color: 'var(--primary)' }}
                    onClick={() => setRecipeForm(p => ({ ...p, ingredients: [...p.ingredients, { ingredientId: '', quantity: 1 }] }))}
                  >
                    <Plus size={12} /> Add Ingredient Row
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 220, overflowY: 'auto', paddingRight: 4 }}>
                  {recipeForm.ingredients?.map((itemIng, index) => {
                    const matched = ingredients.find(i => i._id === itemIng.ingredientId);
                    return (
                      <div key={index} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        <select 
                          className="form-select" 
                          style={{ flex: 2 }}
                          value={itemIng.ingredientId || ''} 
                          onChange={e => {
                            const newIngs = [...recipeForm.ingredients];
                            newIngs[index].ingredientId = e.target.value;
                            setRecipeForm(p => ({ ...p, ingredients: newIngs }));
                          }}
                        >
                          <option value="">Select raw ingredient...</option>
                          {ingredients.map(ing => (
                            <option key={ing._id} value={ing._id}>{ing.name} (Stock: {ing.currentStock} {ing.unit})</option>
                          ))}
                        </select>

                        <input 
                          className="form-input" 
                          type="number" 
                          style={{ flex: 1 }}
                          min="0.001" 
                          step="0.001"
                          placeholder="Qty"
                          value={itemIng.quantity || ''} 
                          onChange={e => {
                            const newIngs = [...recipeForm.ingredients];
                            newIngs[index].quantity = e.target.value;
                            setRecipeForm(p => ({ ...p, ingredients: newIngs }));
                          }}
                        />

                        <span style={{ width: 45, fontSize: 13, fontWeight: 700, color: 'var(--text-subtle)' }}>
                          {matched?.unit || '—'}
                        </span>

                        <button 
                          className="btn btn-ghost btn-xs" 
                          style={{ color: 'var(--error)' }}
                          onClick={() => {
                            const newIngs = recipeForm.ingredients.filter((_, idx) => idx !== index);
                            setRecipeForm(p => ({ ...p, ingredients: newIngs }));
                          }}
                          disabled={recipeForm.ingredients.length <= 1}
                        >
                          <X size={16} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="form-group" style={{ marginTop: 'var(--space-4)' }}>
                <label className="form-label">Preparation & Cooking Notes</label>
                <textarea 
                  className="form-input" 
                  style={{ minHeight: 60, resize: 'vertical' }}
                  placeholder="e.g. Bake dough at 400 degrees for 12 mins..."
                  value={recipeForm.preparationNotes || ''} 
                  onChange={e => setRecipeForm(p => ({ ...p, preparationNotes: e.target.value }))}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setRecipeModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSaveRecipe} disabled={saving}>
                {saving ? <div className="spinner" /> : null} {recipeForm._id ? 'Save Recipe' : 'Create Recipe'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </UpgradeGate>
  );
}
