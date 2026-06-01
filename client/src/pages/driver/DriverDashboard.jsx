import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Truck, Package, MapPin, CheckCircle, Clock, 
  LogOut, Navigation, Phone, 
  ChevronRight, Loader2, ToggleLeft, ToggleRight,
  History, X
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
  const [showHistory, setShowHistory] = useState(false);

  const fetchData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const driverRes = await deliveryApi.getMyDriverProfile(restaurantId);
      setDriver(driverRes.data?.data);

      const dispatchRes = await deliveryApi.getMyDispatches(restaurantId);
      setDispatches(dispatchRes.data?.data?.dispatches || []);
    } catch (err) {
      if (err?.response?.status === 404) {
        setError('You are not registered as a driver for this restaurant.');
      } else {
        setError('Failed to load dashboard');
      }
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
      if (newStatus === 'Available') {
        setTimeout(() => fetchData(true), 1500); // give time for retroactive dispatch
      }
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
      <Loader2 className="spin" size={48} color="#8b5cf6" />
      <p style={{ fontWeight: 600 }}>Loading Dashboard...</p>
    </div>
  );

  if (error) return (
    <div className="driver-loading">
      <p style={{ color: '#ef4444', fontWeight: 600, fontSize: 18 }}>{error}</p>
      <button className="btn-logout-driver" style={{ marginTop: 16 }} onClick={() => logout()}>Logout</button>
    </div>
  );

  return (
    <div className="driver-app fade-in">
      <nav className="driver-nav">
        <div className="driver-brand">
          <div className="driver-logo-neon">
            <Truck size={24} color="#fff" />
          </div>
          <div>
            <h2 style={{ fontWeight: 800, color: '#0f172a', fontSize: 16, margin: 0 }}>Driver Port</h2>
            <div className="text-xs" style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', color: driver?.status === 'Available' ? '#10b981' : '#64748b', fontWeight: 600 }} onClick={toggleStatus}>
              {driver?.status === 'Available' ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
              {driver?.status === 'Available' ? 'ONLINE' : 'OFFLINE'}
            </div>
          </div>
        </div>
        <div className="driver-nav-actions">
           <button className="btn-icon-driver" onClick={() => setShowHistory(true)} title="View History">
             <History size={20} />
           </button>
           <div className="driver-avatar-mini" title={user?.name}>{user?.name?.[0]?.toUpperCase()}</div>
           <button className="btn-logout-driver" onClick={logout} title="Logout"><LogOut size={18} /></button>
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
        <div className="delivery-list">
          {activeDispatches.length === 0 ? (
            <div className="empty-deliveries animate-fade-up">
              <Package size={64} style={{ color: '#6366f1', opacity: 0.5 }} />
              <p style={{ color: '#64748b', fontWeight: 600, fontSize: 16 }}>No active assignments right now.</p>
              <button onClick={() => fetchData()} style={{ background: 'transparent', border: '1px solid #cbd5e1', color: '#64748b', padding: '10px 20px', borderRadius: 12, cursor: 'pointer', fontWeight: 600 }}>Refresh Queue</button>
            </div>
          ) : (
            activeDispatches.map((dispatch, idx) => (
              <DeliveryCard key={dispatch._id} dispatch={dispatch} onUpdate={updateDispatchStatus} delay={idx * 100} />
            ))
          )}
        </div>
      </main>

      {/* History Drawer */}
      <div className={`d-history-drawer ${showHistory ? 'open' : ''}`}>
        <div className="d-history-header">
          <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: '#0f172a', fontSize: 18 }}><CheckCircle size={20} color="#10b981" /> Completed</h3>
          <button className="btn-icon-driver" onClick={() => setShowHistory(false)} style={{ border: 'none' }}><X size={24} /></button>
        </div>
        <div className="d-history-body">
          {completedDispatches.length === 0 ? (
            <p style={{ color: '#64748b', textAlign: 'center', marginTop: 40, fontWeight: 600 }}>No completed deliveries today.</p>
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
      </div>
      {showHistory && <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 999 }} onClick={() => setShowHistory(false)} />}
    </div>
  );
}

function DeliveryCard({ dispatch, onUpdate, delay = 0 }) {
  const order = dispatch.orderId || {};
  const isPickedUp = dispatch.status === 'PickedUp' || dispatch.status === 'InTransit';
  const totalAmount = order.financials?.totalAmount || 0;
  const customerPhone = order.customerPhone || order.customerId?.phone || '';
  
  const rawCustName = order.customerId?.name || 'Guest User';
  const custName = rawCustName.toLowerCase() === 'admin' ? 'Guest User' : rawCustName;

  return (
    <div className={`delivery-card animate-fade-up`} style={{ animationDelay: `${delay}ms` }}>
      <div className="d-card-header">
        <div className="d-id-tag">#{order.orderNumber || dispatch._id.slice(-5).toUpperCase()}</div>
        <div className="d-price-tag">{formatCurrency(totalAmount)}</div>
      </div>

      <div className="d-card-body">
        <div className="d-info-row">
          <MapPin size={24} color="#a855f7" style={{ marginTop: 2 }} />
          <div className="d-address">
            <p className="d-addr-main">{order.deliveryAddress?.street || '123 Delivery Lane, City Center'}</p>
            <p className="d-addr-sub">Customer: <strong style={{ color: '#475569' }}>{custName}</strong></p>
          </div>
        </div>
        
        <div className="d-info-row">
          <Clock size={20} color="#94a3b8" style={{ marginTop: 2 }} />
          <div className="d-address">
            <p className="d-addr-main" style={{ fontSize: 14 }}>Assigned {timeAgo(dispatch.createdAt)}</p>
            <div className={`d-status-pill ${dispatch.status.toLowerCase()}`} style={{ display: 'inline-block', marginTop: 6 }}>
              {dispatch.status === 'Assigned' ? '📦 Waiting at Kitchen' : 
               dispatch.status === 'PickedUp' ? '🚀 Out For Delivery' : 
               dispatch.status.toUpperCase()}
            </div>
          </div>
        </div>

        <div className="d-items-list">
           {order.items?.map((it, idx) => (
             <div key={idx} className="d-item-row">
                <span className="d-item-qty">{it.quantity}x</span>
                <span className="d-item-name">{it.name}</span>
             </div>
           ))}
        </div>
      </div>

      <div className="d-card-footer">
        {customerPhone && (
          <a href={`tel:${customerPhone}`} className="d-contact-pill">
            <Phone size={18} color="#10b981" />
            {customerPhone}
          </a>
        )}
        
        <a href={`https://maps.google.com/?q=${encodeURIComponent(order.deliveryAddress?.street || '')}`} target="_blank" rel="noreferrer" className="d-contact-pill" style={{ background: 'rgba(59, 130, 246, 0.1)', borderColor: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa' }}>
          <Navigation size={18} />
          Map
        </a>
        
        {dispatch.status === 'Assigned' ? (
          <button className="d-btn-prime" onClick={() => onUpdate(dispatch._id, 'PickedUp')}>
            Mark Picked Up <ChevronRight size={20} />
          </button>
        ) : (
          <button className="d-btn-prime complete" onClick={() => onUpdate(dispatch._id, 'Delivered')}>
            Confirm Delivery <CheckCircle size={20} />
          </button>
        )}
      </div>
    </div>
  );
}
