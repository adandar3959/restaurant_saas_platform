import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { customerApi } from '../../api/customer.api';
import { crmApi } from '../../api/crm.api';
import '../../styles/customer.css';
import { formatCurrency } from '../../lib/utils';

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
              <span className="c-order-total">{formatCurrency(order.totalAmount)}</span>
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

function LoyaltyTab({ user }) {
  const [loyalty, setLoyalty] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const customerId = user?._id || user?.id;
    if (!user?.restaurantId || !customerId) {
      setLoading(false);
      return;
    }

    Promise.all([
      crmApi.getLoyalty(user.restaurantId, customerId),
      crmApi.getLoyaltyHistory(user.restaurantId, customerId)
    ])
      .then(([loyRes, histRes]) => {
        setLoyalty(loyRes.data?.data || loyRes.data || null);
        setHistory(histRes.data?.data || histRes.data || []);
      })
      .catch((e) => {
        console.error('Failed to load loyalty:', e);
      })
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) return <div className="c-spinner-wrap"><div className="c-spinner"/>Loading loyalty rewards...</div>;

  const currentPoints = loyalty?.points || 0;
  const lifetimeEarned = loyalty?.totalEarned || 0;
  const currentTier = loyalty?.tier || 'Bronze';
  const cashValue = Math.floor(currentPoints / 10); // 10 points = 1 base currency unit

  const TIER_CONFIG = {
    Bronze: { 
      name: 'Bronze Member', 
      bg: 'linear-gradient(135deg, #B45309, #D97706)', 
      nextTier: 'Silver', 
      nextGoal: 500, 
      desc: 'Earn 10 points for every Rs 100 spent.'
    },
    Silver: { 
      name: 'Silver VIP', 
      bg: 'linear-gradient(135deg, #64748B, #94A3B8)', 
      nextTier: 'Gold', 
      nextGoal: 1500, 
      desc: 'Exclusive access to member-only coupons!'
    },
    Gold: { 
      name: 'Gold Elite VIP', 
      bg: 'linear-gradient(135deg, #CA8A04, #EAB308)', 
      nextTier: 'Platinum', 
      nextGoal: 3000, 
      desc: 'VIP customer support & priority delivery!'
    },
    Platinum: { 
      name: 'Platinum Royal', 
      bg: 'linear-gradient(135deg, #1E1B4B, #4F46E5)', 
      nextTier: null, 
      nextGoal: 0, 
      desc: 'Ultimate status. Maximum priority & custom deals.'
    }
  };

  const tierInfo = TIER_CONFIG[currentTier] || TIER_CONFIG.Bronze;
  const progressPercent = tierInfo.nextGoal > 0 
    ? Math.min(100, Math.round((lifetimeEarned / tierInfo.nextGoal) * 100)) 
    : 100;

  return (
    <div className="c-account-body c-fade-up">
      {/* VIP Card */}
      <div 
        style={{
          background: tierInfo.bg,
          color: '#fff',
          borderRadius: 20,
          padding: 24,
          boxShadow: '0 12px 28px rgba(0,0,0,0.15)',
          position: 'relative',
          overflow: 'hidden',
          marginBottom: 24,
        }}
      >
        <div style={{
          position: 'absolute',
          top: '-20%',
          right: '-20%',
          width: 150,
          height: 150,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.12)',
          filter: 'blur(20px)',
          pointerEvents: 'none'
        }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <span style={{ 
              fontSize: 10, 
              fontWeight: 900, 
              letterSpacing: '0.15em', 
              textTransform: 'uppercase', 
              background: 'rgba(255,255,255,0.2)', 
              padding: '4px 10px', 
              borderRadius: 20 
            }}>
              {tierInfo.name}
            </span>
            <div style={{ fontSize: 22, fontWeight: 900, marginTop: 12 }}>{user?.name || 'Valued Customer'}</div>
            <div style={{ fontSize: 12, opacity: 0.85, marginTop: 4 }}>Member since {new Date(user?.createdAt || Date.now()).getFullYear()}</div>
          </div>
          <div style={{ fontSize: 32 }}>👑</div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 32 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Available Points</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <span style={{ fontSize: 36, fontWeight: 900 }}>{currentPoints}</span>
              <span style={{ fontSize: 14, fontWeight: 700, opacity: 0.9 }}>pts</span>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 10, fontWeight: 700, opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Redeemable Value</div>
            <div style={{ fontSize: 20, fontWeight: 900 }}>{formatCurrency(cashValue)}</div>
          </div>
        </div>
      </div>

      {/* Tier Progress Bar */}
      {tierInfo.nextTier && (
        <div style={{ background: '#fff', border: '1px solid var(--c-border)', borderRadius: 16, padding: 18, marginBottom: 24, boxShadow: 'var(--c-shadow-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 700, marginBottom: 8 }}>
            <span style={{ color: 'var(--c-text-muted)' }}>Progress to <strong style={{ color: 'var(--c-text)' }}>{tierInfo.nextTier} VIP</strong></span>
            <span>{lifetimeEarned} / {tierInfo.nextGoal} pts</span>
          </div>
          <div style={{ height: 8, background: '#f3f4f6', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{ width: `${progressPercent}%`, height: '100%', background: tierInfo.bg, borderRadius: 99, transition: 'width 0.5s' }} />
          </div>
          <p style={{ fontSize: 11, color: 'var(--c-text-muted)', marginTop: 8, fontWeight: 500, lineHeight: 1.5 }}>
            {tierInfo.desc} You need <strong>{tierInfo.nextGoal - lifetimeEarned}</strong> more points to upgrade.
          </p>
        </div>
      )}

      {/* Point Statistics Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
        <div style={{ background: '#fff', border: '1px solid var(--c-border)', borderRadius: 14, padding: 14, textAlign: 'center', boxShadow: 'var(--c-shadow-sm)' }}>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#16A34A' }}>+{lifetimeEarned}</div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--c-text-muted)', textTransform: 'uppercase', marginTop: 2 }}>Lifetime Earned</div>
        </div>
        <div style={{ background: '#fff', border: '1px solid var(--c-border)', borderRadius: 14, padding: 14, textAlign: 'center', boxShadow: 'var(--c-shadow-sm)' }}>
          <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--c-text-subtle)' }}>{loyalty?.totalRedeemed || 0}</div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--c-text-muted)', textTransform: 'uppercase', marginTop: 2 }}>Points Redeemed</div>
        </div>
      </div>

      {/* Transaction History Ledger */}
      <div>
        <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--c-text)', marginBottom: 12 }}>📜 Points History</h3>
        {history.length === 0 ? (
          <div style={{ background: '#fff', border: '1.5px dashed var(--c-border)', borderRadius: 14, padding: 32, textAlign: 'center', color: 'var(--c-text-muted)' }}>
            <div style={{ fontSize: 24, marginBottom: 4 }}>🪙</div>
            <div style={{ fontSize: 13, fontWeight: 700 }}>No points transactions yet</div>
            <p style={{ fontSize: 11, marginTop: 2 }}>Complete orders to earn points automatically!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {history.map((tx) => {
              const isEarn = tx.type === 'Earn';
              return (
                <div 
                  key={tx._id} 
                  style={{
                    background: '#fff',
                    border: '1px solid var(--c-border)',
                    borderRadius: 12,
                    padding: '12px 16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    boxShadow: 'var(--c-shadow-sm)'
                  }}
                >
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--c-text)' }}>
                      {tx.description || (isEarn ? 'Points Earned' : 'Points Redeemed')}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--c-text-subtle)', marginTop: 2, fontWeight: 600 }}>
                      {new Date(tx.createdAt).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                  <div style={{ 
                    fontSize: 15, 
                    fontWeight: 900, 
                    color: isEarn ? '#16A34A' : '#DC2626' 
                  }}>
                    {isEarn ? '+' : '-'}{tx.points}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function CustomerAccountPage() {
  const { user, logout, updateUser, isHydrated } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('orders');

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
        <button className={`c-account-tab${tab==='loyalty'?' active':''}`} onClick={()=>setTab('loyalty')}>
          🪙 Rewards
        </button>
        <button className={`c-account-tab${tab==='profile'?' active':''}`} onClick={()=>setTab('profile')}>
          👤 Profile
        </button>
      </div>

      {tab==='orders'  && <OrdersTab user={user} />}
      {tab==='loyalty' && <LoyaltyTab user={user} />}
      {tab==='profile' && <ProfileTab user={user} updateUser={updateUser} logout={()=>{logout();navigate('/');}} />}
    </div>
  );
}
