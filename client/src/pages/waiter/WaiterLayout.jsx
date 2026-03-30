import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { tablesApi } from '../../api/tables.api';
import { menuApi } from '../../api/menu.api';
import { ordersApi } from '../../api/orders.api';
import {
  LayoutDashboard, Bell, LogOut, CheckCircle, 
  Minus, Plus, ShoppingBag, Utensils, X, Clock, Coffee
} from 'lucide-react';
import './Waiter.css';

export default function WaiterLayout() {
  const { restaurantId } = useParams();
  const { user, logout } = useAuth();
  
  const [activeTab, setActiveTab] = useState('tables'); // 'tables' or 'active'
  const [tables, setTables] = useState([]);
  const [orders, setOrders] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const fetchRef = useRef(null);

  // POS State
  const [selectedTable, setSelectedTable] = useState(null); 
  const [cart, setCart] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [tRes, oRes, mRes] = await Promise.all([
        tablesApi.getTables(restaurantId, { limit: 100 }),
        ordersApi.getOrders(restaurantId, { limit: 100 }),
        menuApi.getItems(restaurantId, { limit: 200 })
      ]);

      setTables(tRes.data?.data?.tables || tRes.data?.data || []);
      
      // Get all active orders (including KDS 'Ready' alerts for waiter to pick up)
      const allOrders = oRes.data?.data?.orders || oRes.data?.data || [];
      setOrders(allOrders.filter(o => ['Pending', 'Accepted', 'Preparing', 'Ready'].includes(o.status)));
      
      if (!silent) {
        setMenuItems(mRes.data?.data?.items || mRes.data?.data || []);
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

  const addToCart = (item) => {
    setCart(prev => {
      const existing = prev.find(i => i.menuItemId === item._id);
      if (existing) {
        return prev.map(i => i.menuItemId === item._id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { menuItemId: item._id, name: item.name, price: item.price, quantity: 1 }];
    });
  };

  const updateQuantity = (id, delta) => {
    setCart(prev => prev.map(i => {
      if (i.menuItemId === id) {
        return { ...i, quantity: Math.max(0, i.quantity + delta) };
      }
      return i;
    }).filter(i => i.quantity > 0));
  };

  const submitOrder = async () => {
    if (cart.length === 0) return alert('Cart is empty!');
    setIsSubmitting(true);
    try {
      const payload = {
        orderType: 'Dine-In',
        // In a real app customerId could be null for walk-ins, backend handles Waiter placing it
        items: cart.map(i => ({ menuItemId: i.menuItemId, quantity: i.quantity })),
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

  // Renderers
  const renderTables = () => (
    <div className="waiter-grid">
      {tables.map(t => (
        <button 
          key={t._id} 
          className={`waiter-table-card status-${t.status.toLowerCase()}`}
          onClick={() => openPOS(t)}
        >
          <div className="table-number">T{t.tableNumber}</div>
          <div className="table-capacity">Seats {t.capacity}</div>
          <div className="table-status">{t.status}</div>
        </button>
      ))}
      {tables.length === 0 && !loading && <div style={{gridColumn:'1/-1', textAlign:'center', marginTop:40}}>No tables configured.</div>}
    </div>
  );

  const renderActive = () => {
    const activeWaitersOrders = orders.filter(o => o.orderType === 'Dine-In');
    
    return (
      <div className="waiter-active-list">
        {activeWaitersOrders.length === 0 && <p style={{textAlign:'center', marginTop:40}}>No active Dine-In orders.</p>}
        {activeWaitersOrders.map(o => {
           const isReady = o.status === 'Ready';
           return (
             <div key={o._id} className={`waiter-order-card ${isReady ? 'ready-pulse' : ''}`}>
               <div className="order-header">
                 <div>
                   <span className="order-tn">T{o.tableNumber}</span>
                   <span className="order-id">#{o._id.slice(-5).toUpperCase()}</span>
                 </div>
                 <div className={`order-status badge-${o.status.toLowerCase()}`}>{o.status}</div>
               </div>
               <div className="order-items">
                  {o.items.map((i, idx) => (
                    <div key={idx} className="order-item-row">
                      <span>{i.quantity}x {i.name}</span>
                      {i.kitchenStatus === 'Ready' && <CheckCircle size={14} color="#10b981" />}
                    </div>
                  ))}
               </div>
               {isReady && (
                 <button className="waiter-btn-serve" onClick={() => markServed(o._id)}>
                   <CheckCircle size={18} /> Mark Served
                 </button>
               )}
             </div>
           );
        })}
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
        <button className="btn btn-ghost btn-circle" onClick={logout} style={{color: '#ef4444'}}>
          <LogOut size={20} />
        </button>
      </header>

      {/* MAIN CONTENT PORT */}
      <main className="waiter-main">
        {loading && tables.length===0 ? (
           <div className="waiter-loading">Loading floor plan...</div>
        ) : (
           activeTab === 'tables' ? renderTables() : renderActive()
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
      </nav>

      {/* POS SLIDE OVER MODAL */}
      <div className={`waiter-pos-modal ${selectedTable ? 'open' : ''}`}>
        {selectedTable && (
          <>
            <div className="pos-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <h2>Table {selectedTable.tableNumber} Order</h2>
                {selectedTable.status !== 'Available' && (
                  <button 
                    className="btn btn-outline btn-sm" 
                    onClick={() => setTableStatus('Available')}
                    style={{ borderColor: '#10b981', color: '#10b981' }}
                  >
                    Clear Table (Paid)
                  </button>
                )}
              </div>
              <button className="btn btn-ghost" onClick={closePOS}><X size={24}/></button>
            </div>
            <div className="pos-body">
              {/* Menu Grid */}
              <div className="pos-menu">
                {menuItems.map(item => (
                  <button key={item._id} className="pos-menu-btn" onClick={() => addToCart(item)}>
                    <div className="pos-menu-name">{item.name}</div>
                    <div className="pos-menu-price">${item.price.toFixed(2)}</div>
                  </button>
                ))}
                {menuItems.length === 0 && <p style={{gridColumn:'1/-1', textAlign:'center'}}>No active menu items.</p>}
              </div>

              {/* Cart Pane */}
              <div className="pos-cart">
                <div className="pos-cart-items">
                  {cart.length === 0 ? <p className="empty-cart">Tap items to add</p> : null}
                  {cart.map(c => (
                    <div key={c.menuItemId} className="cart-item">
                      <div className="cart-item-info">
                        <strong>{c.name}</strong>
                        <div>${(c.price * c.quantity).toFixed(2)}</div>
                      </div>
                      <div className="cart-item-qty">
                        <button onClick={() => updateQuantity(c.menuItemId, -1)}><Minus size={16}/></button>
                        <span>{c.quantity}</span>
                        <button onClick={() => updateQuantity(c.menuItemId, 1)}><Plus size={16}/></button>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="pos-cart-footer">
                  <div className="cart-total">
                    <span>Total</span>
                    <span>${cart.reduce((sum, c) => sum + (c.price * c.quantity), 0).toFixed(2)}</span>
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
    </div>
  );
}
