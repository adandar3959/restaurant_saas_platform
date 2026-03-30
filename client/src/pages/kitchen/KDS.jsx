import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ordersApi } from '../../api/orders.api';
import {
  Clock, ChefHat, Play, CheckCircle, MonitorX, LogOut,
  UtensilsCrossed, Monitor, ShoppingBag, Truck,
  Bell, BellOff, History, CheckSquare, Square, X
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
  const { user, logout } = useAuth();
  
  const [orders, setOrders] = useState([]);
  const [historyOrders, setHistoryOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [time, setTime] = useState(new Date());

  // KDS Advanced States
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [activeStation, setActiveStation] = useState('All');
  const [showHistory, setShowHistory] = useState(false);

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
        <ChefHat size={48} className="spin" color="#3b82f6" />
        <p>Loading Kitchen Display...</p>
      </div>
    );
  }

  return (
    <div className="kds-layout">
      {/* HEADER */}
      <header className="kds-header">
        <div className="kds-title">
          <Monitor color="#38bdf8" size={24} />
          <span>KDS </span>
          <span style={{ color: '#64748b', fontSize: 16, fontWeight: 500, display: 'flex', gap: 16 }}>
            | Kitchen Display System
          </span>
        </div>

        {/* Station Routing Tabs */}
        {stationTabs.length > 1 && (
          <div className="kds-station-tabs">
            {stationTabs.map(st => (
              <button 
                key={st}
                className={`kds-tab ${activeStation === st ? 'active' : ''}`}
                onClick={() => setActiveStation(st)}
              >
                {st}
              </button>
            ))}
          </div>
        )}

        {/* Right Nav */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <button 
            className="btn btn-ghost btn-sm" 
            style={{ color: soundEnabled ? '#a3e635' : '#64748b' }} 
            onClick={() => setSoundEnabled(!soundEnabled)}
            title="Toggle Sound Alerts"
          >
            {soundEnabled ? <Bell size={18} /> : <BellOff size={18} />}
          </button>
          
          <button className="btn btn-ghost btn-sm" style={{ color: '#f8fafc' }} onClick={() => setShowHistory(true)}>
            <History size={18} /> History
          </button>

          <div className="kds-clock">{formatTime(time)}</div>
          
          <button className="btn btn-ghost btn-sm" style={{ color: '#f87171' }} onClick={logout}>
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
      ) : (
        /* KANBAN BOARD */
        <main className="kds-board">
          <KDSColumn
            title="New Orders"
            orders={newOrders}
            icon={<ChefHat size={20} />}
            colColor="#334155"
            time={time}
            activeStation={activeStation}
            onAction={(o) => updateStatus(o._id, 'Preparing')}
            actionBtn={{ label: 'Start Prep', icon: <Play size={16} />, className: 'kds-btn-start' }}
            onItemToggle={handleItemToggle}
          />
          <KDSColumn
            title="Preparing"
            orders={prepOrders}
            icon={<UtensilsCrossed size={18} />}
            colColor="#0284c7"
            time={time}
            activeStation={activeStation}
            onAction={(o) => updateStatus(o._id, 'Ready')}
            actionBtn={{ label: 'Mark Ready', icon: <CheckCircle size={16} />, className: 'kds-btn-ready' }}
            onItemToggle={handleItemToggle}
          />
          <KDSColumn
            title="Ready for Pickup"
            orders={readyOrders}
            icon={<ShoppingBag size={18} />}
            colColor="#10b981"
            time={time}
            activeStation={activeStation}
            onAction={(o) => updateStatus(o._id, 'Completed')}
            actionBtn={{ label: 'Clear (Done)', icon: <CheckCircle size={16} />, className: 'kds-btn-done' }}
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
    <div className="kds-column" style={{ borderTop: `4px solid ${colColor}` }}>
      <div className="kds-col-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {icon}
          <span className="kds-col-title">{title}</span>
        </div>
        <div className="kds-col-count">{filteredOrders.length}</div>
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
    <div className={`kds-card ${mins === 0 ? 'new-arrival' : ''}`}>
      <div className="kds-card-header">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span className="kds-card-title">#{order._id?.slice(-5).toUpperCase()}</span>
          <span className="kds-type-badge">{typeIcon} {order.orderType}</span>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
          <span className={`kds-card-time ${timeClass}`}>
            <Clock size={16} /> {mins}m 
          </span>
          {order.orderType === 'Dine-In' && order.tableNumber && (
            <span className="kds-table-badge">T{order.tableNumber}</span>
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
