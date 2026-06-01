import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Truck, Package, MapPin, CheckCircle, Clock, 
  DollarSign, LogOut, Navigation, Phone, 
  ChevronRight, ArrowLeft, Loader2, User, ToggleLeft, ToggleRight
} from 'lucide-react';
import { deliveryApi } from '../../api/delivery.api';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, timeAgo } from '../../lib/utils';
import './DriverDashboard.css';

export default function DriverDashboard() {
  const { restaurantId } = useParams();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [driver, setDriver] = useState(null);
  const [dispatches, setDispatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('active');

  const fetchData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      // 1. Get driver profile
      const driverRes = await deliveryApi.getMyDriverProfile(restaurantId);
      setDriver(driverRes.data?.data);

      // 2. Get dispatches
      const dispatchRes = await deliveryApi.getMyDispatches(restaurantId);
      setDispatches(dispatchRes.data?.data?.dispatches || []);
    } catch (err) {
      if (err?.response?.status === 404) {
        setError('You are not registered as a driver for this restaurant.');
      } else {
        setError('Failed to load dashboard');
      }
      console.error(err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(true), 10000);
    return () => clearInterval(interval);
  }, [restaurantId]);

  const toggleStatus = async () => {
    if (!driver) return;
    const newStatus = driver.status === 'Available' ? 'Offline' : 'Available';
    try {
      await deliveryApi.updateDriverStatus(restaurantId, driver._id, newStatus);
      setDriver(p => ({ ...p, status: newStatus }));
    } catch (err) {
      console.error('Failed to toggle status', err);
    }
  };

  const updateDispatchStatus = async (dispatchId, status) => {
    try {
      await deliveryApi.updateDispatch(restaurantId, dispatchId, status);
      fetchData(true);
    } catch (err) {
      console.error('Failed to update status', err);
    }
  };

  const activeDispatches = dispatches.filter(d => ['Assigned', 'PickedUp', 'InTransit'].includes(d.status));
  const completedDispatches = dispatches.filter(d => d.status === 'Delivered');

  const earningsToday = completedDispatches.reduce((sum, d) => sum + (d.orderId?.financials?.tipAmount || 0) + (d.deliveryFee || 0), 0);

  if (loading) return (
    <div className="driver-loading">
      <Loader2 className="spin" size={40} color="var(--primary)" />
      <p>Loading Dashboard...</p>
    </div>
  );

  if (error) return (
    <div className="driver-loading">
      <p style={{ color: 'var(--error)', fontWeight: 600 }}>{error}</p>
      <button className="btn btn-primary btn-sm" style={{ marginTop: 12 }} onClick={() => logout()}>Logout</button>
    </div>
  );

  return (
    <div className="driver-app fade-in">
      <nav className="driver-nav glass-header">
        <div className="driver-brand">
          <div className="driver-logo-neon">
            <Truck size={24} color="#fff" />
          </div>
          <div>
            <h2 style={{ fontWeight: 700, color: 'var(--text)', fontSize: 16 }}>Driver Port</h2>
            <div className="text-xs text-muted" style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }} onClick={toggleStatus}>
              {driver?.status === 'Available' ? <ToggleRight size={16} color="var(--success)" /> : <ToggleLeft size={16} color="var(--text-muted)" />}
              {driver?.status === 'Available' ? 'Online' : 'Offline'}
            </div>
          </div>
        </div>
        <div className="driver-nav-actions">
           <div className="driver-avatar-mini" title={user?.name}>{user?.name?.[0]}</div>
           <button className="btn-logout-driver" onClick={logout}><LogOut size={18} /></button>
        </div>
      </nav>

      <header className="driver-stats-header">
         <div className="d-stat-card animate-fade-up">
            <span className="d-stat-label">Deliveries Today</span>
            <span className="d-stat-value">{completedDispatches.length}</span>
         </div>
         <div className="d-stat-card animate-fade-up" style={{ animationDelay: '100ms' }}>
            <span className="d-stat-label">Tips Earned</span>
            <span className="d-stat-value">{formatCurrency(earningsToday)}</span>
         </div>
      </header>

      <main className="driver-main">
        <div className="driver-tabs">
           <button className={`d-tab ${activeTab === 'active' ? 'active' : ''}`} onClick={() => setActiveTab('active')}>
             Active ({activeDispatches.length})
           </button>
           <button className={`d-tab ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
             Completed
           </button>
        </div>

        <div className="delivery-list">
          {activeTab === 'active' ? (
            activeDispatches.length === 0 ? (
              <div className="empty-deliveries animate-fade-up">
                <Package size={48} style={{ color: 'var(--primary)', opacity: 0.5 }} />
                <p className="text-muted">No active assignments right now.</p>
                <button className="btn btn-outline btn-sm" onClick={() => fetchData()}>Refresh Queue</button>
              </div>
            ) : (
              activeDispatches.map((dispatch, idx) => (
                <DeliveryCard key={dispatch._id} dispatch={dispatch} onUpdate={updateDispatchStatus} delay={idx * 100} />
              ))
            )
          ) : (
            completedDispatches.map((dispatch, idx) => (
              <div key={dispatch._id} className="delivery-card-mini animate-fade-up" style={{ animationDelay: `${idx * 50}ms` }}>
                 <div className="d-mini-info">
                    <span className="d-mini-id">#{dispatch.orderId?.orderNumber || dispatch._id.slice(-5).toUpperCase()}</span>
                    <span className="d-mini-time">{timeAgo(dispatch.deliveredAt || dispatch.updatedAt)}</span>
                 </div>
                 <div className="d-mini-status">
                    <CheckCircle size={14} color="#10b981" />
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

function DeliveryCard({ dispatch, onUpdate, delay = 0 }) {
  const order = dispatch.orderId || {};
  const isPickedUp = dispatch.status === 'PickedUp' || dispatch.status === 'InTransit';

  return (
    <div className={`delivery-card animate-fade-up`} style={{ animationDelay: `${delay}ms` }}>
      <div className="d-card-header">
        <div className="d-id-tag">ORDER #{order.orderNumber || dispatch._id.slice(-5).toUpperCase()}</div>
        <div className={`d-status-pill ${dispatch.status.toLowerCase()}`}>
          {dispatch.status === 'Assigned' ? '📦 ASSIGNED' : 
           dispatch.status === 'PickedUp' ? '🚀 EN ROUTE' : 
           `🚀 ${dispatch.status.toUpperCase()}`}
        </div>
      </div>

      <div className="d-card-body">
        <div className="d-info-row">
          <MapPin size={18} className="text-muted" />
          <div className="d-address">
            <p className="d-addr-main">{order.deliveryAddress?.street || '123 Delivery Lane, City Center'}</p>
            <p className="d-addr-sub">Customer: {order.customerId?.name || 'Guest User'}</p>
          </div>
        </div>
        
        <div className="d-info-row">
          <Clock size={18} className="text-muted" />
          <p className="text-sm">Assigned {timeAgo(dispatch.createdAt)}</p>
        </div>

        <div className="d-items-preview">
           {order.items?.map((it, idx) => (
             <span key={idx}>{it.quantity}x {it.name}{idx < order.items.length - 1 ? ', ' : ''}</span>
           ))}
        </div>
      </div>

      <div className="d-card-footer">
        <a href={`tel:${order.customerPhone || order.customerId?.phone || ''}`} className="d-btn-icon" title="Call Customer">
          <Phone size={20} />
        </a>
        <button className="d-btn-icon" title="View Map">
          <Navigation size={20} />
        </button>
        
        {dispatch.status === 'Assigned' ? (
          <button className="d-btn-prime" onClick={() => onUpdate(dispatch._id, 'PickedUp')}>
            Mark Picked Up <ChevronRight size={18} />
          </button>
        ) : (
          <button className="d-btn-prime complete" onClick={() => onUpdate(dispatch._id, 'Delivered')}>
            Confirm Delivery <CheckCircle size={18} />
          </button>
        )}
      </div>
    </div>
  );
}
