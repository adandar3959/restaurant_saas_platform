import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Truck, Package, MapPin, CheckCircle, Clock, 
  DollarSign, LogOut, Navigation, Phone, 
  ChevronRight, ArrowLeft, Loader2, User
} from 'lucide-react';
import { ordersApi } from '../../api/orders.api';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, timeAgo } from '../../lib/utils';
import './DriverDashboard.css';

export default function DriverDashboard() {
  const { restaurantId } = useParams();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('deliveries'); // 'deliveries' | 'history'

  const fetchOrders = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      // Driver usually sees orders with type 'Delivery' and status Ready/OutForDelivery/Completed
      const res = await ordersApi.getOrders(restaurantId, { orderType: 'Delivery' });
      const all = res.data?.data?.orders || [];
      
      // Filter for those assigned to this driver (if backend supports assignment) 
      // or just all active deliveries for now if simplified
      setOrders(all);
    } catch (err) {
      setError('Failed to load deliveries');
      console.error(err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(() => fetchOrders(true), 10000);
    return () => clearInterval(interval);
  }, [restaurantId]);

  const updateDeliveryStatus = async (orderId, status) => {
    try {
      await ordersApi.updateStatus(restaurantId, orderId, status);
      fetchOrders(true);
      // Removed alert for smoother UX
    } catch (err) {
      console.error('Failed to update status', err);
    }
  };

  const activeDeliveries = orders.filter(o => ['Ready', 'Accepted', 'Preparing', 'OutForDelivery'].includes(o.status));
  const completedDeliveries = orders.filter(o => o.status === 'Completed');

  // Stats
  const earningsToday = completedDeliveries.reduce((sum, o) => sum + (o.tipAmount || 0), 0);

  if (loading && orders.length === 0) {
    return (
      <div className="driver-loading glass-panel">
        <Loader2 className="spin" size={40} color="var(--neon-cyan)" />
        <p>Loading Deliveries...</p>
      </div>
    );
  }

  return (
    <div className="driver-app fade-in">
      {/* ── Driver Navbar ── */}
      <nav className="driver-nav glass-header">
        <div className="driver-brand">
          <div className="driver-logo-neon">
            <Truck size={24} color="#fff" />
          </div>
          <div>
            <h2 className="gradient-text-cyan">Driver Port</h2>
            <span className="text-xs text-muted">Active Session</span>
          </div>
        </div>
        <div className="driver-nav-actions">
           <div className="driver-avatar-mini" title={user?.name}>{user?.name?.[0]}</div>
           <button className="btn-logout-driver" onClick={logout}><LogOut size={18} /></button>
        </div>
      </nav>

      {/* ── Driver Metrics Header ── */}
      <header className="driver-stats-header">
         <div className="d-stat-card glass-panel animate-fade-up">
            <span className="d-stat-label">Deliveries Today</span>
            <span className="d-stat-value gradient-text-cyan">{completedDeliveries.length}</span>
         </div>
         <div className="d-stat-card glass-panel neon-border-cyan animate-fade-up" style={{ animationDelay: '100ms' }}>
            <span className="d-stat-label">Tips Earned</span>
            <span className="d-stat-value gradient-text-cyan">{formatCurrency(earningsToday)}</span>
         </div>
      </header>

      {/* ── Main View ── */}
      <main className="driver-main">
        <div className="driver-tabs">
           <button className={`d-tab ${activeTab === 'deliveries' ? 'active' : ''}`} onClick={() => setActiveTab('deliveries')}>
             Active ({activeDeliveries.length})
           </button>
           <button className={`d-tab ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
             Completed
           </button>
        </div>

        <div className="delivery-list">
          {activeTab === 'deliveries' ? (
            activeDeliveries.length === 0 ? (
              <div className="empty-deliveries glass-panel animate-fade-up">
                <Package size={48} style={{ color: 'var(--neon-cyan)', opacity: 0.5 }} />
                <p className="text-muted">No active deliveries right now.</p>
                <button className="btn btn-outline btn-sm" onClick={() => fetchOrders()}>Refresh Queue</button>
              </div>
            ) : (
              activeDeliveries.map((order, idx) => (
                <DeliveryCard key={order._id} order={order} onUpdate={updateDeliveryStatus} delay={idx * 100} />
              ))
            )
          ) : (
            completedDeliveries.map((order, idx) => (
              <div key={order._id} className="delivery-card-mini glass-panel animate-fade-up" style={{ animationDelay: `${idx * 50}ms` }}>
                 <div className="d-mini-info">
                    <span className="d-mini-id">#{order._id.slice(-5).toUpperCase()}</span>
                    <span className="d-mini-time">{timeAgo(order.createdAt)}</span>
                 </div>
                 <div className="d-mini-status">
                    <CheckCircle size={14} color="var(--neon-emerald)" />
                    <span>DELIVERED</span>
                 </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}

function DeliveryCard({ order, onUpdate, delay = 0 }) {
  const isOut = order.status === 'OutForDelivery';

  return (
    <div className={`delivery-card glass-panel ${isOut ? 'neon-border-cyan glow-cyan' : ''} animate-fade-up`} style={{ animationDelay: `${delay}ms` }}>
      <div className="d-card-header">
        <div className="d-id-tag">ORDER #{order._id.slice(-5).toUpperCase()}</div>
        <div className={`d-status-pill ${order.status.toLowerCase()}`}>
          {order.status === 'OutForDelivery' ? '🚀 EN ROUTE' : `📦 ${order.status.toUpperCase()}`}
        </div>
      </div>

      <div className="d-card-body">
        <div className="d-info-row">
          <MapPin size={18} className="text-muted" />
          <div className="d-address">
            <p className="d-addr-main">{order.customer?.address || '123 Delivery Lane, City Center'}</p>
            <p className="d-addr-sub">Customer: {order.customer?.name || 'Guest User'}</p>
          </div>
        </div>
        
        <div className="d-info-row">
          <Clock size={18} className="text-muted" />
          <p className="text-sm">Placed {timeAgo(order.createdAt)}</p>
        </div>

        <div className="d-items-preview">
           {order.items?.map((it, idx) => (
             <span key={idx}>{it.quantity}x {it.name}{idx < order.items.length - 1 ? ', ' : ''}</span>
           ))}
        </div>
      </div>

      <div className="d-card-footer">
        <a href={`tel:${order.customer?.phone || ''}`} className="d-btn-icon" title="Call Customer">
          <Phone size={20} />
        </a>
        <button className="d-btn-icon" title="View Map">
          <Navigation size={20} />
        </button>
        
        {!isOut ? (
          <button className="d-btn-prime" onClick={() => onUpdate(order._id, 'OutForDelivery')}>
            Start Delivery <ChevronRight size={18} />
          </button>
        ) : (
          <button className="d-btn-prime complete" onClick={() => onUpdate(order._id, 'Completed')}>
            Confirm Delivery <CheckCircle size={18} />
          </button>
        )}
      </div>
    </div>
  );
}
