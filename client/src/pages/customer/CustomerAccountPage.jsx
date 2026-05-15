import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { customerApi } from '../../api/customer.api';
import '../../styles/customer.css';

const STATUS_COLORS = {
  Pending:        { bg:'rgba(99,102,241,0.1)',  color:'#4F46E5' },
  Accepted:       { bg:'rgba(22,163,74,0.1)',   color:'#16A34A' },
  Preparing:      { bg:'rgba(245,158,11,0.1)',  color:'#D97706' },
  Ready:          { bg:'rgba(59,130,246,0.1)',  color:'#2563EB' },
  OutForDelivery: { bg:'rgba(168,85,247,0.1)',  color:'#7C3AED' },
  Completed:      { bg:'rgba(22,163,74,0.1)',   color:'#16A34A' },
  Cancelled:      { bg:'rgba(220,38,38,0.1)',   color:'#DC2626' },
};

function formatDate(str) {
  if (!str) return '';
  return new Date(str).toLocaleDateString('en-PK', { day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' });
}

function OrdersTab({ user }) {
  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user?.restaurantId) { setLoading(false); return; }
    customerApi.getMyOrders(user.restaurantId)
      .then(res => setOrders(res.data?.data || res.data || []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) return <div className="c-spinner-wrap"><div className="c-spinner"/>Loading orders...</div>;

  if (orders.length === 0) return (
    <div className="c-empty" style={{paddingTop:40}}>
      <div className="c-empty-icon">📋</div>
      <strong>No orders yet</strong>
      <p>Your order history will appear here.</p>
    </div>
  );

  return (
    <div className="c-account-body">
      {orders.map(order => {
        const sc = STATUS_COLORS[order.status] || { bg:'#f3f4f6', color:'#374151' };
        const preview = order.items?.slice(0,2).map(i=>`${i.quantity}× ${i.name}`).join(', ');
        return (
          <div
            key={order._id}
            className="c-order-card"
            onClick={() => navigate(`/menu/${user.restaurantId}/track/${order._id}`)}
          >
            <div className="c-order-card-head">
              <span className="c-order-id">#{order._id?.slice(-6).toUpperCase()}</span>
              <span className="c-order-status-pill" style={{background:sc.bg,color:sc.color}}>
                {order.status}
              </span>
            </div>
            <div className="c-order-items-preview">{preview}{order.items?.length > 2 ? ` +${order.items.length - 2} more` : ''}</div>
            <div className="c-order-card-foot">
              <span className="c-order-total">Rs {order.totalAmount?.toLocaleString()}</span>
              <span className="c-order-date">{formatDate(order.createdAt)}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ProfileTab({ user, updateUser, logout }) {
  const [name, setName]       = useState(user?.name || '');
  const [phone, setPhone]     = useState(user?.phone || '');
  const [saved, setSaved]     = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    updateUser({ name, phone });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="c-account-body">
      <form className="c-profile-form" onSubmit={handleSave}>
        <div>
          <div className="c-field-label">Full Name</div>
          <input className="c-field-input" value={name} onChange={e=>setName(e.target.value)} placeholder="Your name" />
        </div>
        <div>
          <div className="c-field-label">Email</div>
          <input className="c-field-input" value={user?.email || ''} disabled style={{opacity:0.6,cursor:'not-allowed'}} />
        </div>
        <div>
          <div className="c-field-label">Phone (optional)</div>
          <input className="c-field-input" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="03xx-xxxxxxx" type="tel" />
        </div>
        <button type="submit" className="c-btn-primary">
          {saved ? '✅ Saved!' : 'Save Changes'}
        </button>
      </form>

      <button className="c-logout-btn" onClick={logout} style={{marginTop:20}}>
        🚪 Sign Out
      </button>
    </div>
  );
}

export default function CustomerAccountPage() {
  const { user, logout, updateUser, isHydrated } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('orders');

  // Don't hard-redirect — show a friendly prompt instead
  if (!isHydrated) {
    return (
      <div className="customer-root" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div className="c-spinner" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="customer-root c-auth-wrap">
        <div className="c-auth-card">
          <div className="c-auth-logo">👤</div>
          <h1 className="c-auth-title">Your Account</h1>
          <p className="c-auth-sub">Sign in to view your order history and manage your profile.</p>
          <button
            className="c-btn-primary"
            style={{ marginTop: 8 }}
            onClick={() => navigate('/customer/login')}
          >
            → Sign In / Create Account
          </button>
          <div style={{ marginTop: 20, textAlign: 'center' }}>
            <Link to="/" style={{ fontSize: 13, color: 'var(--c-text-muted)', fontWeight: 600 }}>← Back to Home</Link>
          </div>
        </div>
      </div>
    );
  }

  const initial = (user.name || 'U').charAt(0).toUpperCase();

  return (
    <div className="customer-root c-account-wrap">
      {/* Hero */}
      <div className="c-account-hero">
        <div style={{display:'flex',alignItems:'center',gap:16}}>
          <div className="c-account-avatar">{initial}</div>
          <div>
            <div className="c-account-name">{user.name || 'Customer'}</div>
            <div className="c-account-email">{user.email}</div>
          </div>
        </div>
        <div style={{marginTop:16}}>
          <Link to="/" style={{color:'rgba(255,255,255,0.85)',fontSize:13,fontWeight:600,textDecoration:'none'}}>← Home</Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="c-account-tabs">
        <button className={`c-account-tab${tab==='orders'?' active':''}`} onClick={()=>setTab('orders')}>
          📋 My Orders
        </button>
        <button className={`c-account-tab${tab==='profile'?' active':''}`} onClick={()=>setTab('profile')}>
          👤 Profile
        </button>
      </div>

      {tab==='orders'  && <OrdersTab user={user} />}
      {tab==='profile' && <ProfileTab user={user} updateUser={updateUser} logout={()=>{logout();navigate('/');}} />}
    </div>
  );
}
