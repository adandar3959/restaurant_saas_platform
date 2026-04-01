import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { tablesApi } from '../../api/tables.api';
import { menuApi } from '../../api/menu.api';
import { ordersApi } from '../../api/orders.api';
import {
  LayoutDashboard, Bell, LogOut, CheckCircle, 
  Minus, Plus, ShoppingBag, Utensils, X, Clock, Coffee, User, BarChart2
} from 'lucide-react';
import './Waiter.css';

export default function WaiterLayout() {
  const { restaurantId } = useParams();
  const { user, logout, updateUser } = useAuth();
  
  const [activeTab, setActiveTab] = useState('tables'); // 'tables' or 'active'
  const [tables, setTables] = useState([]);
  const [orders, setOrders] = useState([]);
  const [allOrders, setAllOrders] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  const [loading, setLoading] = useState(true);
  const fetchRef = useRef(null);

  // POS State
  const [selectedTable, setSelectedTable] = useState(null); 
  const [cart, setCart] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Modifier Modal State
  const [activeItem, setActiveItem] = useState(null);
  const [modifierSelections, setModifierSelections] = useState({});

  // Settlement / Tip State
  const [settlingTable, setSettlingTable] = useState(null);
  const [tipAmount, setTipAmount] = useState('');

  // Profile Management State
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({ 
    name: user?.name || '', 
    phone: user?.phone || '', 
    email: user?.email || '',
    gender: user?.gender || 'Other' 
  });
  const [pwdForm, setPwdForm] = useState({ oldPassword: '', newPassword: '' });
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  const fetchData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [tRes, oRes, mRes, cRes] = await Promise.all([
        tablesApi.getTables(restaurantId, { limit: 100 }),
        ordersApi.getOrders(restaurantId, { limit: 100 }),
        menuApi.getItems(restaurantId, { limit: 200 }),
        menuApi.getCategories(restaurantId)
      ]);

      setTables(tRes.data?.data?.tables || tRes.data?.data || []);
      
      // Get all active orders (including KDS 'Ready' alerts for waiter to pick up)
      const fetchedOrders = oRes.data?.data?.orders || oRes.data?.data || [];
      setAllOrders(fetchedOrders);
      setOrders(fetchedOrders.filter(o => ['Pending', 'Accepted', 'Preparing', 'Ready'].includes(o.status)));
      
      if (!silent) {
        setMenuItems(mRes.data?.data?.items || mRes.data?.data || []);
        setCategories(cRes.data?.data?.categories || cRes.data?.data || []);
      }
    } catch (err) {
      console.error('Waiter fetch error:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Auto-poll to get updates on tables and orders from KDS
    fetchRef.current = setInterval(() => fetchData(true), 3000);
    return () => clearInterval(fetchRef.current);
  }, [restaurantId]);

  // POS Logic
  const openPOS = (table) => {
    setSelectedTable(table);
    setCart([]);
  };

  const closePOS = () => {
    setSelectedTable(null);
    setCart([]);
  };

  const handleItemClick = (item) => {
    // If item has modifiers/sizes, open the modal
    if (item.modifierGroups && item.modifierGroups.length > 0) {
      setActiveItem(item);
      const initialMods = {};
      item.modifierGroups.forEach(g => {
        initialMods[g._id] = [];
        // Auto-select defaults
        g.options.forEach(o => {
          if (o.isDefault) initialMods[g._id].push(o._id);
        });
      });
      setModifierSelections(initialMods);
      return;
    }
    // Otherwise add directly
    addToCart(item, [], 0);
  };

  const getCombinedCartId = (itemId, modsArray) => {
    if (!modsArray || modsArray.length === 0) return itemId;
    // Creates a unique hash/string so same item with different mods are split
    return `${itemId}_${modsArray.map(m => m._id).sort().join('_')}`;
  };

  const addToCart = (item, selectedMods = [], extraTotal = 0) => {
    setCart(prev => {
      const cartId = getCombinedCartId(item._id, selectedMods);
      const existing = prev.find(i => i.cartId === cartId);
      if (existing) {
        return prev.map(i => i.cartId === cartId ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { 
        cartId, 
        menuItemId: item._id, 
        name: item.name, 
        basePrice: item.price,
        unitPrice: item.price + extraTotal,
        quantity: 1,
        selectedModifiers: selectedMods // Need to send to backend
      }];
    });
    setActiveItem(null); // close modal
  };

  const updateQuantity = (cartId, delta) => {
    setCart(prev => prev.map(i => {
      if (i.cartId === cartId) {
        return { ...i, quantity: Math.max(0, i.quantity + delta) };
      }
      return i;
    }).filter(i => i.quantity > 0));
  };

  const confirmModifiers = () => {
    // Validate required groups
    for (let bg of activeItem.modifierGroups) {
      const selectedCount = modifierSelections[bg._id]?.length || 0;
      if (bg.isRequired && selectedCount < (bg.minSelections || 1)) {
        return alert(`Please select an option for: ${bg.groupName}`);
      }
    }

    // Build mod payload and calc price
    let flatMods = [];
    let extraCost = 0;
    activeItem.modifierGroups.forEach(g => {
       const selectedOptIds = modifierSelections[g._id] || [];
       g.options.forEach(o => {
         if (selectedOptIds.includes(o._id)) {
           flatMods.push({ groupId: g._id, optionId: o._id, groupName: g.groupName, optionName: o.name, extraPrice: o.extraPrice });
           extraCost += o.extraPrice;
         }
       });
    });

    addToCart(activeItem, flatMods, extraCost);
  };

  const toggleModifier = (group, option) => {
    setModifierSelections(prev => {
      const clone = { ...prev };
      const current = clone[group._id] || [];
      const isSingle = group.maxSelections === 1;

      if (current.includes(option._id)) {
         clone[group._id] = current.filter(id => id !== option._id);
      } else {
         if (isSingle) {
           clone[group._id] = [option._id]; // Replace completely
         } else {
           if (current.length >= group.maxSelections) return prev; // Limit hit
           clone[group._id] = [...current, option._id];
         }
      }
      return clone;
    });
  };

  const submitOrder = async () => {
    if (cart.length === 0) return alert('Cart is empty!');
    setIsSubmitting(true);
    try {
      const payload = {
        orderType: 'Dine-In',
        waiterId: user?._id,
        items: cart.map(i => ({ 
          menuItemId: i.menuItemId, 
          quantity: i.quantity,
          selectedModifiers: i.selectedModifiers?.length ? i.selectedModifiers.map(sm => ({
             groupId: sm.groupId,
             optionId: sm.optionId,
             name: sm.optionName,
             price: sm.extraPrice
          })) : []
        })),
        tableNumber: selectedTable.tableNumber,
        financials: { tipAmount: 0, discountAmount: 0 }
      };

      await ordersApi.placeOrder(restaurantId, payload);
      
      // Optimistically update table status if it was Available
      if (selectedTable.status === 'Available') {
         setTables(prev => prev.map(t => t._id === selectedTable._id ? { ...t, status: 'Occupied' } : t));
         // Need to call updateTableStatus ideally, assuming backend auto-updates or we do it
         await tablesApi.updateTableStatus(restaurantId, selectedTable._id, 'Occupied');
      }

      closePOS();
      fetchData(true);
      setActiveTab('active'); // Switch to active orders so they see the ticket sent
    } catch (e) {
      console.error(e);
      alert('Failed to place order.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Kitchen serving
  const markServed = async (orderId) => {
    try {
      // Opt UI Update
      setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: 'Completed' } : o));
      await ordersApi.updateStatus(restaurantId, orderId, 'Completed');
    } catch (e) {
      alert('Failed to update. Verify Server/Waiter Permissions.');
      fetchData(true);
    }
  };

  const setTableStatus = async (newStatus) => {
    try {
      await tablesApi.updateTableStatus(restaurantId, selectedTable._id, newStatus);
      setTables(prev => prev.map(t => t._id === selectedTable._id ? { ...t, status: newStatus } : t));
      closePOS(); // close the modal after freeing the table
    } catch (err) {
      alert('Failed to update table status');
    }
  };

  const handleSettleTable = async () => {
    setIsSubmitting(true);
    try {
      const numericTip = parseFloat(tipAmount);
      if (numericTip > 0) {
        // Apply tip to the most recent completed order for this table
        const tableOrders = allOrders
          .filter(o => o.tableNumber === settlingTable.tableNumber && o.status === 'Completed')
          .sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
        if (tableOrders.length > 0) {
          await ordersApi.addTip(restaurantId, tableOrders[0]._id, numericTip);
        }
      }
      
      await tablesApi.updateTableStatus(restaurantId, settlingTable._id, 'Available');
      setTables(prev => prev.map(t => t._id === settlingTable._id ? { ...t, status: 'Available' } : t));
      
      setSettlingTable(null);
      setTipAmount('');
      closePOS();
      fetchData(true);
    } catch (err) {
      alert('Failed to settle table.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Renderers
  const renderTables = () => {
    const availableTables = tables.filter(t => t.status === 'Available');
    const occupiedTables = tables.filter(t => t.status !== 'Available');
    
    const TableCard = ({ t }) => {
      const isAvail = t.status === 'Available';
      return (
        <button 
          key={t._id} 
          className={`waiter-table-card ${isAvail ? 'st-avail' : 'st-occ'}`}
          onClick={() => openPOS(t)}
        >
          <div className="tbl-head">
            <Utensils size={20} className="tbl-icon" />
            <span className="table-number">T{t.tableNumber}</span>
          </div>
          <div className="table-capacity">{t.capacity} Guests</div>
          <div className={`table-status ${isAvail ? 'bg-avail' : 'bg-occ'}`}>{t.status}</div>
        </button>
      );
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        {occupiedTables.length > 0 && (
          <div>
            <h3 style={{ color: '#94a3b8', fontSize: 16, marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 800 }}>
              Active Tables ({occupiedTables.length})
            </h3>
            <div className="waiter-grid">
               {occupiedTables.map(t => <TableCard key={t._id} t={t} />)}
            </div>
          </div>
        )}

        {availableTables.length > 0 && (
          <div>
            <h3 style={{ color: '#94a3b8', fontSize: 16, marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 800 }}>
              Open Tables ({availableTables.length})
            </h3>
            <div className="waiter-grid">
               {availableTables.map(t => <TableCard key={t._id} t={t} />)}
            </div>
          </div>
        )}

        {tables.length === 0 && !loading && (
          <div style={{ textAlign: 'center', marginTop: 40, color: '#94a3b8' }}>No tables configured.</div>
        )}
      </div>
    );
  };

  const renderActive = () => {
    const activeWaitersOrders = orders.filter(o => o.orderType === 'Dine-In');
    
    return (
      <div className="waiter-active-list">
        {activeWaitersOrders.length === 0 && <p style={{textAlign:'center', marginTop:100, color:'#94a3b8', fontSize:18, fontWeight:600}}>No active Dine-In orders.</p>}
        {activeWaitersOrders.map(o => {
           const isReady = o.status === 'Ready';
           return (
             <div key={o._id} className={`waiter-order-card ${isReady ? 'ready-pulse' : ''}`}>
               <div className="waiter-ord-header">
                 <div className="wo-left">
                   <div className="wo-table-badge">Table {o.tableNumber}</div>
                   <div className="wo-id">#{o._id.slice(-5).toUpperCase()}</div>
                 </div>
                 <div className={`wo-status-badge ${o.status.toLowerCase()}`}>
                   {isReady ? 'READY TO SERVE' : o.status.toUpperCase()}
                 </div>
               </div>
               
               <div className="wo-items">
                  {o.items.map((i, idx) => (
                    <div key={idx} className={`wo-item-row ${i.kitchenStatus === 'Ready' ? 'item-ready' : ''}`}>
                      <div className="wo-item-name">
                         <span className="wo-qty">{i.quantity}x</span> {i.name}
                      </div>
                      {i.kitchenStatus === 'Ready' && <CheckCircle size={16} color="#10b981" />}
                    </div>
                  ))}
               </div>
               
               {isReady && (
                 <div style={{padding: '0 16px 16px 16px'}}>
                   <button className="waiter-btn-serve" onClick={() => markServed(o._id)}>
                     <CheckCircle size={20} /> Mark as Served
                   </button>
                 </div>
               )}
             </div>
           );
        })}
      </div>
    );
  };

  const renderDashboard = () => {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    // LIFETIME METRICS
    const myLifetimeOrders = allOrders.filter(o => {
       const uId = user?._id;
       const matchWaiter = (o.waiterId?._id || o.waiterId) === uId;
       const matchCustomerFallback = (o.customerId?._id || o.customerId) === uId;
       return (matchWaiter || matchCustomerFallback) && o.status === 'Completed';
    });
    const lifeSales = myLifetimeOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const lifeTips = myLifetimeOrders.reduce((sum, o) => sum + (o.financials?.tipAmount || 0), 0);

    // TODAY METRICS
    const myServedOrders = myLifetimeOrders.filter(o => new Date(o.createdAt) >= startOfToday);
    const totalSales = myServedOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const totalTips = myServedOrders.reduce((sum, o) => sum + (o.financials?.tipAmount || 0), 0);

    return (
      <div className="waiter-dashboard fade-in">
        <div className="wd-header-glass">
           <div className="wd-avatar-neon"><User size={44} strokeWidth={2.5} /></div>
           <div className="wd-info">
             <h2>{user?.name || 'Waiter'}</h2>
             <p>{user?.email} • Waiter ID: {user?._id?.slice(-5).toUpperCase()}</p>
           </div>
        </div>

        <h3 className="wd-section-title">Today's Shift Performance</h3>
        <div className="wd-metrics-grid">
           <div className="wd-metric-glass card-blue">
              <div className="metric-glow"></div>
              <h4>Total Orders</h4>
              <div className="wd-val">{myServedOrders.length}</div>
           </div>
           <div className="wd-metric-glass card-purple">
              <div className="metric-glow"></div>
              <h4>Sales Generated</h4>
              <div className="wd-val">${totalSales.toFixed(2)}</div>
           </div>
           <div className="wd-metric-glass card-green">
              <div className="metric-glow"></div>
              <h4>Tips Earned</h4>
              <div className="wd-val">${totalTips.toFixed(2)}</div>
           </div>
        </div>

        <h3 className="wd-section-title" style={{marginTop: 32}}>All-Time Performance (Since Join)</h3>
        <div className="wd-metrics-grid">
           <div className="wd-metric-glass card-blue" style={{background: 'rgba(56, 189, 248, 0.05)'}}>
              <h4>Lifetime Orders</h4>
              <div className="wd-val">{myLifetimeOrders.length}</div>
           </div>
           <div className="wd-metric-glass card-purple" style={{background: 'rgba(192, 132, 252, 0.05)'}}>
              <h4>Lifetime Sales</h4>
              <div className="wd-val">${lifeSales.toFixed(2)}</div>
           </div>
           <div className="wd-metric-glass card-green" style={{background: 'rgba(16, 185, 129, 0.05)'}}>
              <h4>Lifetime Tips</h4>
              <div className="wd-val">${lifeTips.toFixed(2)}</div>
           </div>
        </div>

        <h3 className="wd-section-title" style={{marginTop: 32}}>Recent Orders</h3>
        <div className="wd-recent-list">
          {myLifetimeOrders.length === 0 && <p className="wd-empty-glass">No orders finished yet.</p>}
          {myLifetimeOrders.slice(0, 10).map(o => (
            <div key={o._id} className="wd-recent-glass-row">
              <div className="wrr-left">
                <div className="wrr-table">Table {o.tableNumber}</div>
                <div className="wrr-time">{new Date(o.createdAt).toLocaleDateString()} • {new Date(o.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
              </div>
              <div className="wrr-right">
                <div className="wrr-total">${(o.totalAmount || 0).toFixed(2)}</div>
                {o.financials?.tipAmount > 0 && <div className="wrr-tip">+${o.financials.tipAmount.toFixed(2)} Tip</div>}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="waiter-layout">
      {/* HEADER */}
      <header className="waiter-header">
        <div className="waiter-brand">
          <Coffee size={24} color="#f59e0b" />
          <span>Waiter View</span>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-ghost btn-circle" onClick={() => setProfileModalOpen(true)} style={{color: '#94a3b8'}} title="Profile Settings">
            <User size={20} />
          </button>
          <button className="btn btn-ghost btn-circle" onClick={logout} style={{color: '#ef4444'}} title="Logout">
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {/* MAIN CONTENT PORT */}
      <main className="waiter-main">
        {loading && tables.length===0 ? (
           <div className="waiter-loading">Loading floor plan...</div>
        ) : activeTab === 'tables' ? (
           renderTables()
        ) : activeTab === 'dashboard' ? (
           renderDashboard()
        ) : (
           renderActive()
        )}
      </main>

      {/* BOTTOM NAVIGATION */}
      <nav className="waiter-bottom-nav">
        <button className={`nav-item ${activeTab==='tables'?'active':''}`} onClick={()=>setActiveTab('tables')}>
          <LayoutDashboard size={24} />
          <span>Tables</span>
        </button>
        <button className={`nav-item ${activeTab==='active'?'active':''}`} onClick={()=>setActiveTab('active')}>
          <div style={{position:'relative'}}>
             <Bell size={24} />
             {orders.filter(o => o.status === 'Ready' && o.orderType === 'Dine-In').length > 0 && (
               <span className="nav-badge">!</span>
             )}
          </div>
          <span>Kitchen</span>
        </button>
        <button className={`nav-item ${activeTab==='dashboard'?'active':''}`} onClick={()=>setActiveTab('dashboard')}>
          <BarChart2 size={24} />
          <span>Dashboard</span>
        </button>
      </nav>

      {/* POS SLIDE OVER MODAL */}
      <div className={`waiter-pos-modal ${selectedTable ? 'open' : ''}`}>
        {selectedTable && (
          <>
            <div className="pos-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <h2>Table {selectedTable.tableNumber} Order</h2>
                {selectedTable.status !== 'Available' && (
                  (() => {
                    const unservedOrders = orders.filter(o => o.tableNumber === selectedTable.tableNumber);
                    const canClear = unservedOrders.length === 0;
                    
                    return (
                      <button 
                        className="btn btn-outline btn-sm" 
                        onClick={() => canClear && setSettlingTable(selectedTable)}
                        disabled={!canClear}
                        style={{ 
                          borderColor: canClear ? '#10b981' : '#64748b', 
                          color: canClear ? '#10b981' : '#64748b',
                          opacity: canClear ? 1 : 0.6
                        }}
                        title={!canClear ? "Cannot settle bill until kitchen finishes and food is served!" : ""}
                      >
                        {canClear ? 'Settle & Clear' : 'Unserved Orders Pending'}
                      </button>
                    );
                  })()
                )}
              </div>
              <button className="btn btn-ghost" onClick={closePOS}><X size={24}/></button>
            </div>
            <div className="pos-body">
              {/* Menu Area (Left Side) */}
              <div className="pos-menu-area">
                {/* Horizontal Category Bar */}
                <div className="pos-categories-bar">
                  <button 
                    className={`pos-cat-pill ${selectedCategory === 'All' ? 'active' : ''}`}
                    onClick={() => setSelectedCategory('All')}
                  >
                    All Items
                  </button>
                  {categories.map(c => (
                    <button 
                      key={c._id} 
                      className={`pos-cat-pill ${selectedCategory === c._id ? 'active' : ''}`}
                      onClick={() => setSelectedCategory(c._id)}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>

                {/* Menu Grid */}
                <div className="pos-menu">
                  {menuItems
                    .filter(item => selectedCategory === 'All' || (item.categoryId?._id || item.categoryId) === selectedCategory)
                    .map(item => {
                      const hasSizes = item.modifierGroups?.length > 0;
                      return (
                        <button key={item._id} className="pos-menu-btn" onClick={() => handleItemClick(item)}>
                          <div className="pos-menu-name">{item.name}</div>
                          <div className="pos-menu-price">${item.price.toFixed(2)}</div>
                          {hasSizes && <div className="pos-menu-mod-badge">Options</div>}
                        </button>
                      );
                  })}
                  {menuItems.filter(item => selectedCategory === 'All' || (item.categoryId?._id || item.categoryId) === selectedCategory).length === 0 && (
                    <p style={{ gridColumn: '1/-1', textAlign: 'center', marginTop: 40, color: '#94a3b8' }}>No items in this category.</p>
                  )}
                </div>
              </div>

              {/* Cart Pane (Right Side) */}
              <div className="pos-cart">
                <div className="pos-cart-items">
                  {cart.length === 0 ? <div className="empty-cart">Cart is empty</div> : null}
                  {cart.map(c => (
                    <div key={c.cartId} className="cart-item">
                      <div className="cart-item-info">
                        <strong>{c.name}</strong>
                        {c.selectedModifiers?.length > 0 && (
                           <div className="cart-item-mods">
                             {c.selectedModifiers.map((sm, sx) => (
                               <span key={sx}>{sm.optionName}{sm.extraPrice > 0 ? ` (+$${sm.extraPrice})` : ''}</span>
                             ))}
                           </div>
                        )}
                        <div className="cart-item-price">${(c.unitPrice * c.quantity).toFixed(2)}</div>
                      </div>
                      <div className="cart-item-qty">
                        <button onClick={() => updateQuantity(c.cartId, -1)}><Minus size={16}/></button>
                        <span>{c.quantity}</span>
                        <button onClick={() => updateQuantity(c.cartId, 1)}><Plus size={16}/></button>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="pos-cart-footer">
                  <div className="cart-total">
                    <span>Total</span>
                    <span>${cart.reduce((sum, c) => sum + (c.unitPrice * c.quantity), 0).toFixed(2)}</span>
                  </div>
                  <button 
                    className="btn btn-primary pos-submit-btn" 
                    disabled={cart.length === 0 || isSubmitting}
                    onClick={submitOrder}
                  >
                    {isSubmitting ? 'Sending...' : 'Send to Kitchen'}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* MODIFIER / SIZE SELECTION MODAL */}
      {activeItem && (
        <div className="waiter-modal-backdrop">
          <div className="waiter-modal">
            <div className="w-modal-header">
              <h3>{activeItem.name}</h3>
              <button className="btn btn-ghost" onClick={() => setActiveItem(null)}><X size={20}/></button>
            </div>
            <div className="w-modal-body">
              {activeItem.modifierGroups.map(group => {
                const isRadio = group.maxSelections === 1;
                return (
                  <div key={group._id} className="mod-group">
                    <div className="mod-group-title">
                      {group.groupName} 
                      {group.isRequired && <span className="req-badge">Required</span>}
                    </div>
                    <div className="mod-options">
                      {group.options.map(opt => {
                        const isSelected = (modifierSelections[group._id] || []).includes(opt._id);
                        return (
                          <div 
                            key={opt._id} 
                            className={`mod-opt-row ${isSelected ? 'selected' : ''}`}
                            onClick={() => toggleModifier(group, opt)}
                          >
                            <div className="mod-opt-left">
                               <div className={`mock-${isRadio ? 'radio' : 'checkbox'} ${isSelected ? 'checked' : ''}`} />
                               <span>{opt.name}</span>
                            </div>
                            {opt.extraPrice > 0 && <span className="mod-opt-price">+${opt.extraPrice.toFixed(2)}</span>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="w-modal-footer">
              <button className="btn btn-primary" onClick={confirmModifiers} style={{width: '100%', padding: 16, fontSize: 16}}>
                Add to Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TABLE SETTLEMENT MODAL */}
      {settlingTable && (
        <div className="waiter-modal-backdrop" style={{zIndex: 300}}>
          <div className="waiter-modal settle-modal">
             <div className="w-modal-header" style={{background: '#10b981'}}>
               <h3 style={{color: '#064e3b'}}>Settle Table {settlingTable.tableNumber}</h3>
             </div>
             <div className="w-modal-body" style={{padding: '24px'}}>
               <div style={{marginBottom: 20}}>
                 <h4 style={{color: '#e2e8f0', marginBottom: 8}}>Add Tip (Optional)</h4>
                 <input 
                   type="number" 
                   className="form-control" 
                   style={{background: '#0f172a', border: '1px solid #334155', color: '#fff', fontSize: 20, padding: 16}}
                   placeholder="Enter Tip Amount ($)" 
                   min="0" step="0.01"
                   value={tipAmount} 
                   onChange={e => setTipAmount(e.target.value)}
                 />
               </div>
               <p style={{color: '#94a3b8', fontSize: 13}}>
                 Completing payment will mark the table as Available and attribute any tips to your daily Waiter report.
               </p>
             </div>
             <div className="w-modal-footer" style={{display: 'flex', gap: 12}}>
               <button className="btn btn-ghost" onClick={() => setSettlingTable(null)} style={{flex: 1}}>Cancel</button>
               <button className="btn btn-primary" onClick={handleSettleTable} disabled={isSubmitting} style={{flex: 2, background: '#10b981', color: '#064e3b'}}>
                 {isSubmitting ? 'Processing...' : 'Complete Payment'}
               </button>
             </div>
          </div>
        </div>
      )}

      {/* FULL SCREEN PROFILE MANAGEMENT MODAL */}
      {profileModalOpen && (
        <div className="waiter-modal-backdrop fade-in" style={{zIndex: 400}}>
          <div className="waiter-modal profile-settings-modal glass-panel">
            <div className="w-modal-header glass-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <h3 className="gradient-text">Profile Settings</h3>
               <button className="btn btn-ghost btn-circle" onClick={() => setProfileModalOpen(false)} style={{color: '#94a3b8'}}>
                 <X size={24} />
               </button>
            </div>
            
            <div className="w-modal-body" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '32px', maxHeight: '70vh', overflowY: 'auto' }}>
              
              {/* PERSONAL DETAILS FORM */}
              <form onSubmit={async (e) => {
                e.preventDefault();
                try {
                  const payload = { ...profileForm };
                  
                  // Validation: No changes made
                  const isNoChange = 
                    payload.name === user?.name &&
                    payload.email === user?.email &&
                    (payload.phone || '') === (user?.phone || '') &&
                    (payload.gender || 'Other') === (user?.gender || 'Other');

                  if (isNoChange) {
                    alert('Your profile is already up to date!');
                    return;
                  }

                  if (!payload.phone || payload.phone.trim() === '') {
                     delete payload.phone;
                  }
                  
                  const res = await axios.patch(`http://localhost:5000/api/v1/auth/me`, payload);
                  
                  // Update AuthContext so changes persist after refresh
                  if (res.data?.data) {
                    updateUser(res.data.data);
                  } else {
                    updateUser(payload);
                  }

                  alert('Profile details updated successfully!');
                } catch (err) {
                  let msg = err.response?.data?.message || 'Failed to update profile';
                  if (err.response?.data?.errors?.length > 0) {
                     msg = err.response.data.errors.map(errObj => errObj.message).join(' | ');
                  }
                  alert(msg);
                }
              }} className="wd-edit-form">
                <h4 style={{ color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px', marginBottom: '8px' }}>Personal Details</h4>
                
                <div className="wd-input-group">
                  <label>Email</label>
                  <input type="email" value={profileForm.email} onChange={e => setProfileForm({...profileForm, email: e.target.value})} />
                </div>
                
                <div className="wd-input-group">
                  <label>Full Name</label>
                  <input type="text" value={profileForm.name} onChange={e => setProfileForm({...profileForm, name: e.target.value})} required />
                </div>
                
                <div className="wd-input-group">
                  <label>Contact No</label>
                  <input type="text" value={profileForm.phone} onChange={e => setProfileForm({...profileForm, phone: e.target.value})} />
                </div>
                
                <div className="wd-input-group">
                  <label>Gender</label>
                  <select 
                    value={profileForm.gender} 
                    onChange={e => setProfileForm({...profileForm, gender: e.target.value})}
                    style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.1)', padding: '14px', borderRadius: '12px', color: '#fff', fontSize: '16px', outline: 'none' }}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="wd-input-group" style={{ marginTop: '16px', borderTop: '1px dashed rgba(255,255,255,0.1)', paddingTop: '16px' }}>
                  <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    Password
                    <button type="button" onClick={() => setShowPasswordForm(!showPasswordForm)} style={{ background: 'transparent', border: '1px solid #38bdf8', color: '#38bdf8', padding: '4px 12px', borderRadius: '12px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}>
                      {showPasswordForm ? 'Cancel Password Change' : 'Change Password'}
                    </button>
                  </label>
                </div>

                {showPasswordForm && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '16px', borderRadius: '12px', marginTop: '8px' }}>
                    <div className="wd-input-group">
                      <label style={{ color: '#ef4444' }}>Current Password</label>
                      <input type="password" value={pwdForm.oldPassword} onChange={e => setPwdForm({...pwdForm, oldPassword: e.target.value})} placeholder="Enter current password" />
                    </div>
                    <div className="wd-input-group">
                      <label style={{ color: '#ef4444' }}>New Password</label>
                      <input type="password" value={pwdForm.newPassword} onChange={e => setPwdForm({...pwdForm, newPassword: e.target.value})} placeholder="Enter new password" />
                    </div>
                    <button type="button" onClick={async () => {
                      if (!pwdForm.oldPassword || !pwdForm.newPassword) return alert('Both passwords are required');
                      
                      if (pwdForm.newPassword === pwdForm.oldPassword) {
                        alert('New password cannot be the same as your old password! Please choose a different one.');
                        return;
                      }

                      try {
                        await axios.patch(`http://localhost:5000/api/v1/auth/me/change-password`, pwdForm);
                        alert('Password updated successfully!');
                        setPwdForm({ oldPassword: '', newPassword: '' });
                        setShowPasswordForm(false);
                      } catch (err) {
                        alert(err.response?.data?.message || 'Failed to update password');
                      }
                    }} style={{ alignSelf: 'flex-start', padding: '10px 24px', fontSize: '14px', background: 'linear-gradient(135deg, #ef4444, #b91c1c)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                      Update Secure Password
                    </button>
                  </div>
                )}

                <button type="submit" className="btn-glow-cyan" style={{ alignSelf: 'flex-start', padding: '12px 32px', fontSize: '16px', marginTop: '24px' }}>Save All Changes</button>
              </form>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
