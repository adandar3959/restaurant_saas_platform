import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ordersApi } from '../../api/orders.api';
import {
  Clock, ChefHat, Play, CheckCircle, MonitorX, LogOut,
  UtensilsCrossed, Monitor, ShoppingBag, Truck,
  Bell, BellOff, History, CheckSquare, Square, X,
  BarChart2, User
} from 'lucide-react';
import './KDS.css';

// ─── Formatting helpers ───────────────────────────────────────────────────────
const formatTime = (dateObj) => {
  return dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

const getElapsedMins = (createdAt) => {
  if (!createdAt) return 0;
  return Math.floor((new Date() - new Date(createdAt)) / 60000);
};

// ─── Synthetic Audio Alert ────────────────────────────────────────────────────
const playDing = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
    osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.1); 
    gain.gain.setValueAtTime(1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  } catch (e) {
    console.log("AudioContext not supported or blocked");
  }
};

export default function KDS() {
  const { restaurantId } = useParams();
  const { user, logout, updateUser } = useAuth();
  
  const [orders, setOrders] = useState([]);
  const [historyOrders, setHistoryOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [time, setTime] = useState(new Date());

  // KDS Advanced States
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [activeStation, setActiveStation] = useState('All');
  const [showHistory, setShowHistory] = useState(false);
  
  // Dashboard & Profile UI States
  const [activeTab, setActiveTab] = useState('kds'); // 'kds' | 'dashboard'
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({ 
    name: user?.name || '', 
    phone: user?.phone || '', 
    email: user?.email || '',
    gender: user?.gender || 'Other' 
  });
  const [pwdForm, setPwdForm] = useState({ oldPassword: '', newPassword: '' });
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  // Refs for auto-refresh and sound tracking
  const fetchRef = useRef(null);
  const knownOrderIds = useRef(new Set());

  const fetchOrders = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await ordersApi.getOrders(restaurantId, { limit: 100 });
      const allOrders = res.data?.data?.orders || [];
      
      const active = allOrders.filter(o => ['Pending', 'Accepted', 'Preparing', 'Ready'].includes(o.status));
      const history = allOrders.filter(o => ['Completed', 'Cancelled'].includes(o.status));

      // Check for new orders to play sound
      let hasNewOrder = false;
      active.forEach(o => {
        if (!knownOrderIds.current.has(o._id)) {
          hasNewOrder = true;
          knownOrderIds.current.add(o._id);
        }
      });

      if (hasNewOrder && silent && soundEnabled) playDing();

      setOrders(active);
      setHistoryOrders(history);
    } catch (err) {
      console.error('KDS Fetch Error:', err);
      if (!silent) setError('Failed to load orders. Please refresh.');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(false);
    fetchRef.current = setInterval(() => { fetchOrders(true); }, 3000);
    const clockInterval = setInterval(() => { setTime(new Date()); }, 1000);
    return () => {
      clearInterval(fetchRef.current);
      clearInterval(clockInterval);
    };
  }, [restaurantId, soundEnabled]); // re-bind interval if soundEnabled changes

  // ─── Actions ─────────────────────────────────────────────────────────────────
  const updateStatus = async (orderId, newStatus) => {
    try {
      setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: newStatus } : o));
      await ordersApi.updateStatus(restaurantId, orderId, newStatus);
    } catch (e) {
      alert(`Failed to update to ${newStatus}. Requires Chef role permissions.`);
      fetchOrders(true);
    }
  };

  const handleItemToggle = async (orderId, itemId, currentStatus) => {
    // Toggle logic: if Ready, unset it to Pending. Otherwise set to Ready.
    const newStatus = currentStatus === 'Ready' ? 'Pending' : 'Ready';
    
    // Optimistic Update
    setOrders(prev => prev.map(o => {
      if (o._id !== orderId) return o;
      return {
        ...o,
        items: o.items.map(i => i._id === itemId ? { ...i, kitchenStatus: newStatus } : i)
      };
    }));

    try {
      await ordersApi.updateItemStatus(restaurantId, orderId, itemId, newStatus);
    } catch (e) {
      alert(`Error hitting DB: ${e?.response?.data?.message || e.message}`);
      console.error('Failed to update item status', e);
      fetchOrders(true); // revert
    }
  };

  // ─── Filtering & Routing ────────────────────────────────────────────────────
  // Extract unique stations from active orders
  const stations = new Set(['All']);
  orders.forEach(o => {
    o.items?.forEach(i => {
      if (i.prepStation) stations.add(i.prepStation);
    });
  });
  const stationTabs = Array.from(stations).sort();

  // Route active orders into columns
  const newOrders = orders.filter(o => ['Pending', 'Accepted'].includes(o.status));
  const prepOrders = orders.filter(o => o.status === 'Preparing');
  const readyOrders = orders.filter(o => o.status === 'Ready');

  if (loading && orders.length === 0) {
    return (
      <div className="kds-loading">
        <ChefHat size={48} className="spin" color="var(--primary)" />
        <p>Loading Kitchen Display...</p>
      </div>
    );
  }

  // ─── Render Dashboard ────────────────────────────────────────────────────────
  const renderDashboard = () => {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const allMyOrders = [...orders, ...historyOrders]; // Simplified approximation of lifetime since history pulls last 100
    
    // TODAY METRICS (Completed/Ready)
    const todayOrders = historyOrders.filter(o => new Date(o.createdAt) >= startOfToday && (o.status === 'Completed' || o.status === 'Ready'));
    
    // LIFETIME METRICS
    const lifetimeOrders = historyOrders.filter(o => o.status === 'Completed' || o.status === 'Ready');

    return (
      <div className="kds-dashboard animate-fade-in">
        <div className="kds-header-main animate-fade-up">
           <div className="kds-avatar-neon shadow-neon-purple"><User size={44} strokeWidth={2.5} /></div>
           <div className="kds-info">
             <h2>{user?.name?.toUpperCase() || 'CHEF'}</h2>
             <p className="text-muted">{user?.email} • ID: <span className="text-primary">{user?._id?.slice(-5).toUpperCase()}</span></p>
           </div>
        </div>

        <h3 className="kds-section-title" style={{marginTop: 32}}>Daily Performance</h3>
        <div className="kds-metrics-grid">
           <div className="kds-metric-card animate-fade-up">
              <h4>Orders Prepped Today</h4>
              <div className="kds-val">{todayOrders.length}</div>
           </div>
        </div>

        <h3 className="kds-section-title" style={{marginTop: 32}}>Lifetime Performance</h3>
        <div className="kds-metrics-grid">
           <div className="kds-metric-card accent-primary">
              <h4>Lifetime Orders Prepped</h4>
              <div className="kds-val">{lifetimeOrders.length}</div>
           </div>
        </div>

        <h3 className="kds-section-title" style={{marginTop: 32}}>Recent Completed Orders</h3>
        <div className="kds-recent-list">
          {lifetimeOrders.length === 0 && <p className="kds-empty-state">No orders finished yet.</p>}
          {lifetimeOrders.slice(0, 10).map(o => (
            <div key={o._id} className="kds-recent-row">
              <div className="kds-rr-left">
                <div className="kds-rr-table">Order #{o._id.slice(-5).toUpperCase()}</div>
                <div className="kds-rr-time">{new Date(o.createdAt).toLocaleDateString()} • {new Date(o.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
              </div>
              <div className="kds-rr-right">
                <div className="kds-rr-status">{o.status}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="kds-app-container">
      
      {/* GLOWING SIDEBAR */}
      <nav className="kds-sidebar">
        <div className="sidebar-top">
          <div className="sidebar-brand">
            <div className="driver-brand-icon">
              <UtensilsCrossed size={28} color="var(--primary)" />
            </div>
          </div>
          <button className={`sidebar-btn ${activeTab === 'kds' ? 'active' : ''}`} onClick={() => setActiveTab('kds')} title="Kitchen Display">
            <Monitor size={22} />
          </button>
          <button className={`sidebar-btn ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')} title="Chef Dashboard">
            <BarChart2 size={22} />
          </button>
        </div>
        
        <div className="sidebar-bottom">
          <button className="sidebar-btn sidebar-profile" onClick={() => setProfileModalOpen(true)} title="Profile Settings">
            <User size={22} />
          </button>
          <button className="sidebar-btn sidebar-logout" onClick={logout} title="Logout">
            <LogOut size={22} />
          </button>
        </div>
      </nav>

      <div className="kds-layout">
      {/* HEADER */}
      <header className="kds-header">
        <div className="kds-title">
          <Monitor color="var(--primary)" size={24} />
          <span style={{ color: 'var(--text)', fontWeight: 800 }}>KDS </span>
          <span style={{ color: 'var(--text-muted)', fontSize: 13, fontWeight: 600 }}>
             KITCHEN DISPLAY SYSTEM
          </span>
        </div>

        {/* Station Routing Tabs */}
        {stationTabs.length > 1 && (
          <div className="kds-station-tabs" style={{ padding: '4px', background: 'var(--bg-surface-2)', borderRadius: 24, border: '1px solid var(--border)' }}>
            {stationTabs.map(st => (
              <button 
                key={st}
                className={`kds-tab ${activeStation === st ? 'active' : ''}`}
                onClick={() => setActiveStation(st)}
              >
                {st.toUpperCase()}
              </button>
            ))}
          </div>
        )}

        {/* Right Nav */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-5)' }}>
          <button 
            className="btn btn-ghost btn-circle" 
            style={{ color: soundEnabled ? 'var(--neon-emerald)' : 'var(--text-subtle)' }} 
            onClick={() => setSoundEnabled(!soundEnabled)}
            title="Toggle Sound Alerts"
          >
            {soundEnabled ? <Bell size={20} /> : <BellOff size={20} />}
          </button>
          
          <button className="btn btn-ghost btn-sm" style={{ color: 'var(--text)', border: '1px solid var(--border)', background: 'var(--bg-surface-2)' }} onClick={() => setShowHistory(true)}>
            <History size={16} /> History
          </button>

          <div className="kds-clock">{formatTime(time)}</div>
          
          <button className="btn btn-ghost btn-circle" style={{ color: 'var(--error)' }} onClick={logout}>
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {error ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#f87171', fontSize: 20 }}>
          <MonitorX size={40} style={{ marginBottom: 16 }} />
          <div>{error}</div>
          <button className="btn btn-primary" style={{ marginTop: 24 }} onClick={() => fetchOrders(false)}>Retry</button>
        </div>
      ) : activeTab === 'dashboard' ? (
        <main className="kds-main-port" style={{overflowY: 'auto', padding: 24}}>
          {renderDashboard()}
        </main>
      ) : (
        /* KANBAN BOARD */
        <main className="kds-board">
          <KDSColumn
            title="New"
            orders={newOrders}
            icon={<ChefHat size={18} />}
            colColor="var(--neon-purple)"
            time={time}
            activeStation={activeStation}
            onAction={(o) => updateStatus(o._id, 'Preparing')}
            actionBtn={{ label: 'START PREP', icon: <Play size={14} />, className: 'kds-btn-start' }}
            onItemToggle={handleItemToggle}
          />
          <KDSColumn
            title="Preparing"
            orders={prepOrders}
            icon={<UtensilsCrossed size={18} />}
            colColor="var(--neon-cyan)"
            time={time}
            activeStation={activeStation}
            onAction={(o) => updateStatus(o._id, 'Ready')}
            actionBtn={{ label: 'MARK READY', icon: <CheckCircle size={14} />, className: 'kds-btn-ready' }}
            onItemToggle={handleItemToggle}
          />
          <KDSColumn
            title="Ready"
            orders={readyOrders}
            icon={<ShoppingBag size={18} />}
            colColor="var(--neon-emerald)"
            time={time}
            activeStation={activeStation}
            onAction={(o) => updateStatus(o._id, 'Completed')}
            actionBtn={{ label: 'DONE', icon: <CheckCircle size={14} />, className: 'kds-btn-done' }}
            onItemToggle={handleItemToggle}
          />
        </main>
      )}

      {/* HISTORY DRAWER */}
      <HistoryDrawer 
        isOpen={showHistory} 
        onClose={() => setShowHistory(false)} 
        historyOrders={historyOrders} 
      />
      </div>

      {/* FULL SCREEN PROFILE MANAGEMENT MODAL */}
      {profileModalOpen && (
        <div className="kds-modal-backdrop fade-in" style={{zIndex: 9999}}>
          <div className="kds-profile-settings-modal glass-panel">
            <div className="kds-glass-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 24 }}>
               <h3 className="gradient-text" style={{margin:0}}>Profile Settings</h3>
               <button className="btn btn-ghost btn-circle" onClick={() => setProfileModalOpen(false)} style={{color: '#94a3b8'}}>
                 <X size={24} />
               </button>
            </div>
            
            <div className="w-modal-body" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '32px', maxHeight: '70vh', overflowY: 'auto' }}>
              
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
              }} className="kds-edit-form">
                <h4 style={{ color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px', marginBottom: '8px', marginTop: 0 }}>Personal Details</h4>
                
                <div className="kds-input-group">
                  <label>Email</label>
                  <input type="email" value={profileForm.email} onChange={e => setProfileForm({...profileForm, email: e.target.value})} />
                </div>
                
                <div className="kds-input-group">
                  <label>Full Name</label>
                  <input type="text" value={profileForm.name} onChange={e => setProfileForm({...profileForm, name: e.target.value})} required />
                </div>
                
                <div className="kds-input-group">
                  <label>Contact No</label>
                  <input type="text" value={profileForm.phone} onChange={e => setProfileForm({...profileForm, phone: e.target.value})} />
                </div>
                
                <div className="kds-input-group">
                  <label>Gender</label>
                  <select 
                    value={profileForm.gender} 
                    onChange={e => setProfileForm({...profileForm, gender: e.target.value})}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="kds-input-group" style={{ marginTop: '16px', borderTop: '1px dashed rgba(255,255,255,0.1)', paddingTop: '16px' }}>
                  <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    Password
                    <button type="button" onClick={() => setShowPasswordForm(!showPasswordForm)} style={{ background: 'transparent', border: '1px solid #38bdf8', color: '#38bdf8', padding: '4px 12px', borderRadius: '12px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}>
                      {showPasswordForm ? 'Cancel Password Change' : 'Change Password'}
                    </button>
                  </label>
                </div>

                {showPasswordForm && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '16px', borderRadius: '12px', marginTop: '8px' }}>
                    <div className="kds-input-group">
                      <label style={{ color: '#ef4444' }}>Current Password</label>
                      <input type="password" value={pwdForm.oldPassword} onChange={e => setPwdForm({...pwdForm, oldPassword: e.target.value})} placeholder="Enter current password" />
                    </div>
                    <div className="kds-input-group">
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

// ─── SUB-COMPONENT: Column ────────────────────────────────────────────────────
function KDSColumn({ title, orders, icon, colColor, time, activeStation, onAction, actionBtn, onItemToggle }) {
  // Filter out orders that have NO items belonging to the activeStation
  const filteredOrders = orders.filter(o => {
    if (activeStation === 'All') return true;
    return o.items?.some(i => i.prepStation === activeStation);
  });

  const sorted = [...filteredOrders].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  return (
    <div className="kds-column glass-panel" style={{ borderTop: `4px solid ${colColor}` }}>
      <div className="kds-col-header" style={{ borderBottom: '1px solid var(--glass-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {icon}
          <span className="kds-col-title" style={{ color: colColor }}>{title}</span>
        </div>
        <div className="kds-col-count" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-main)', border: '1px solid var(--glass-border)' }}>{filteredOrders.length}</div>
      </div>
      <div className="kds-col-body">
        {sorted.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#475569', marginTop: 40, fontWeight: 700 }}>
            No {activeStation !== 'All' ? `${activeStation} ` : ''}Orders
          </div>
        ) : (
          sorted.map(order => (
            <OrderCard
              key={order._id}
              order={order}
              time={time}
              activeStation={activeStation}
              onAction={() => onAction(order)}
              actionBtn={actionBtn}
              onItemToggle={onItemToggle}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ─── SUB-COMPONENT: Order Card ────────────────────────────────────────────────
function OrderCard({ order, time, activeStation, onAction, actionBtn, onItemToggle }) {
  const mins = getElapsedMins(order.createdAt);
  
  let timeClass = 'normal';
  if (mins >= 30) timeClass = 'urgent';
  else if (mins >= 15) timeClass = 'warning';

  const typeIcon = order.orderType === 'Delivery' ? <Truck size={14} /> : order.orderType === 'Dine-In' ? <Monitor size={14} /> : <ShoppingBag size={14} />;

  // Filter items if a specific station is selected
  const displayItems = activeStation === 'All' 
    ? order.items 
    : order.items.filter(i => i.prepStation === activeStation);

  // Check if ALL items in this specific card/station are checked off
  const allItemsReady = displayItems.every(i => i.kitchenStatus === 'Ready');
  
  // Only the Preparing column needs item-level checkboxes
  const isPreparingCol = actionBtn.label.includes('Ready');
  const canProceed = !isPreparingCol || allItemsReady;

  const isReadyCol = actionBtn.label.includes('Clear');
  const hideAction = isReadyCol && order.orderType === 'Dine-In';

  return (
    <div className={`kds-card ${mins === 0 ? 'new-arrival neon-border-purple' : ''} animate-fade-up`}>
      <div className="kds-card-header" style={{ borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span className="kds-card-title">#{order._id?.slice(-5).toUpperCase()}</span>
          <span className="kds-type-badge" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)' }}>{typeIcon} {order.orderType?.toUpperCase()}</span>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
          <span className={`kds-card-time ${timeClass}`} style={{ background: 'rgba(0,0,0,0.4)', padding: '2px 10px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <Clock size={14} /> {mins}m 
          </span>
          {order.orderType === 'Dine-In' && order.tableNumber && (
            <span className="kds-table-badge" style={{ background: 'var(--primary)', color: '#fff', fontSize: '12px' }}>T{order.tableNumber}</span>
          )}
        </div>
      </div>

      <div className="kds-card-items">
        {displayItems?.map((item, idx) => {
          const isDone = item.kitchenStatus === 'Ready';
          return (
            <div 
              key={item._id || idx} 
              className={`kds-item ${isDone && isPreparingCol ? 'done' : ''}`}
            >
              {/* Checkbox Toggle ONLY in Preparing Column */}
              {isPreparingCol && (
                <button 
                  className="kds-item-toggle" 
                  onClick={(e) => {
                    e.stopPropagation();
                    onItemToggle(order._id, item._id, item.kitchenStatus);
                  }}
                >
                  {isDone ? <CheckSquare size={20} color="#10b981" /> : <Square size={20} color="#475569" />}
                </button>
              )}

              <div className="kds-item-qty">{item.quantity}x</div>
              <div 
                style={{ flex: 1, cursor: isPreparingCol ? 'pointer' : 'default' }} 
                onClick={(e) => {
                  if (isPreparingCol) onItemToggle(order._id, item._id, item.kitchenStatus);
                }}
              >
                <div className="kds-item-name" style={{ textDecoration: isDone && isPreparingCol ? 'line-through' : 'none' }}>
                  {item.name}
                </div>
                
                {item.selectedModifiers?.length > 0 && (
                  <div className="kds-item-mods">
                    + {item.selectedModifiers.map(m => m.name).join(', ')}
                  </div>
                )}
                
                {item.specialInstructions && (
                  <div className="kds-item-note">
                    " {item.specialInstructions} "
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="kds-card-actions">
        {hideAction ? (
          <div style={{ color: '#94a3b8', fontSize: 13, fontWeight: 700, padding: 8, textAlign: 'center', width: '100%' }}>
            Waiting for Waiter to serve...
          </div>
        ) : (
          <button 
            className={`kds-btn ${actionBtn.className}`} 
            onClick={onAction}
            disabled={!canProceed}
            title={!canProceed ? 'Cross off all items first' : ''}
          >
            {actionBtn.icon} {actionBtn.label}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── SUB-COMPONENT: History Drawer ────────────────────────────────────────────
function HistoryDrawer({ isOpen, onClose, historyOrders }) {
  return (
    <div className={`kds-history-drawer ${isOpen ? 'open' : ''}`}>
      <div className="kds-history-header">
        <h3><History size={20}/> Recently Completed</h3>
        <button className="btn btn-ghost btn-circle" onClick={onClose} style={{ color: '#f8fafc' }}><X size={20}/></button>
      </div>
      <div className="kds-history-body">
        {historyOrders.length === 0 ? (
          <p style={{ color: '#475569', textAlign: 'center', marginTop: 40 }}>No completed orders today.</p>
        ) : (
          historyOrders.map(o => (
             <div key={o._id} className="kds-history-card">
               <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                 <strong>#{o._id.slice(-5).toUpperCase()}</strong>
                 <span style={{ color: '#10b981' }}>{o.status}</span>
               </div>
               <div style={{ color: '#94a3b8', fontSize: 13, display: 'flex', justifyContent: 'space-between' }}>
                 <span>{o.orderType} {o.tableNumber ? `(T${o.tableNumber})` : ''}</span>
                 <span>{formatTime(new Date(o.updatedAt))}</span>
               </div>
               <div style={{ marginTop: 12, borderTop: '1px solid #334155', paddingTop: 8 }}>
                  {o.items.map((i, idx) => (
                    <div key={idx} style={{ fontSize: 14, color: '#e2e8f0' }}>{i.quantity}x {i.name}</div>
                  ))}
               </div>
             </div>
          ))
        )}
      </div>
    </div>
  );
}
