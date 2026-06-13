import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { customerApi } from '../../api/customer.api';
import { crmApi } from '../../api/crm.api';
import '../../styles/customer.css';
import { formatCurrency } from '../../lib/utils';

const STATUS_COLORS = {
  Pending: { bg: 'rgba(99,102,241,0.1)', color: '#4F46E5' },
  Accepted: { bg: 'rgba(22,163,74,0.1)', color: '#16A34A' },
  Preparing: { bg: 'rgba(245,158,11,0.1)', color: '#D97706' },
  Ready: { bg: 'rgba(59,130,246,0.1)', color: '#2563EB' },
  OutForDelivery: { bg: 'rgba(168,85,247,0.1)', color: '#7C3AED' },
  Completed: { bg: 'rgba(22,163,74,0.1)', color: '#16A34A' },
  Cancelled: { bg: 'rgba(220,38,38,0.1)', color: '#DC2626' },
};

function formatDate(str) {
  if (!str) return '';
  return new Date(str).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function OrdersDrawer({ isOpen, onClose, orders, loading, restaurantId }) {
  const navigate = useNavigate();

  return (
    <div
      className={`mz-cart-sidebar-overlay${isOpen ? ' open' : ''}`}
      onClick={onClose}
      style={{ zIndex: 1000 }}
    >
      <div
        className="mz-cart-sidebar"
        onClick={(e) => e.stopPropagation()}
        style={{
          boxShadow: '-10px 0 30px rgba(0,0,0,0.15)'
        }}
      >
        <div className="mz-cart-header" style={{ background: 'var(--mz-dark)', padding: '20px 24px' }}>
          <h3 className="mz-cart-title" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, fontWeight: 700 }}>My Orders</h3>
          <button className="mz-cart-close" onClick={onClose} style={{ fontSize: 18 }}>✕</button>
        </div>
        <div className="mz-cart-body" style={{ background: 'var(--mz-off)', padding: '20px 16px', overflowY: 'auto', height: 'calc(100% - 70px)' }}>
          {loading ? (
            <div className="c-spinner-wrap" style={{ height: '50vh' }}>
              <div className="c-spinner" />
              Loading orders...
            </div>
          ) : orders.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: '#666' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
              <h4 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 700, color: 'var(--mz-dark)' }}>No orders placed yet</h4>
              <p style={{ fontSize: 13, color: '#777', fontFamily: "'Raleway', sans-serif", marginTop: 4 }}>Your order history for this restaurant will appear here.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {orders.map(order => {
                const sc = STATUS_COLORS[order.status] || { bg: '#f3f4f6', color: '#374151' };
                const preview = order.items?.slice(0, 2).map(i => `${i.quantity}× ${i.name}`).join(', ');
                return (
                  <div
                    key={order._id}
                    className="c-order-card"
                    style={{
                      background: '#fff',
                      border: '1px solid rgba(0,0,0,0.06)',
                      borderRadius: 12,
                      padding: 16,
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                      transition: 'all 0.2s'
                    }}
                    onClick={() => {
                      onClose();
                      navigate(`/menu/${restaurantId}/track/${order._id}`);
                    }}
                  >
                    <div className="c-order-card-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span className="c-order-id" style={{ fontFamily: "'Raleway', sans-serif", fontSize: 12, fontWeight: 700, color: 'var(--mz-mid)' }}>#{order._id?.slice(-6).toUpperCase()}</span>
                      <span className="c-order-status-pill" style={{ background: sc.bg, color: sc.color, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 800 }}>
                        {order.status}
                      </span>
                    </div>
                    <div className="c-order-items-preview" style={{ fontFamily: "'Raleway', sans-serif", fontSize: 13, color: '#333', marginBottom: 12 }}>
                      {preview}{order.items?.length > 2 ? ` +${order.items.length - 2} more` : ''}
                    </div>
                    <div className="c-order-card-foot" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="c-order-total" style={{ fontFamily: "'Raleway', sans-serif", fontSize: 15, fontWeight: 900, color: 'var(--mz-dark)' }}>{formatCurrency(order.totalAmount)}</span>
                      <span className="c-order-date" style={{ fontSize: 11, color: '#777', fontWeight: 600 }}>{formatDate(order.createdAt)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function RewardSection({ loyalty, history, loading, user }) {
  if (loading) {
    return (
      <div style={{ background: '#fff', padding: 24, borderRadius: 16, border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 4px 20px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
        <div className="c-spinner" />
        <p style={{ marginTop: 12, color: '#666', fontSize: 14 }}>Loading loyalty rewards...</p>
      </div>
    );
  }

  const currentPoints = loyalty?.points || 0;
  const lifetimeEarned = loyalty?.totalEarned || 0;
  const currentTier = loyalty?.tier || 'Bronze';
  const cashValue = Math.floor(currentPoints / 10);

  const TIER_CONFIG = {
    Bronze: {
      name: 'Bronze Member',
      bg: 'linear-gradient(135deg, #8B5A2B, #B45309)',
      nextTier: 'Silver',
      nextGoal: 500,
      desc: 'Earn 10 points for every Rs 100 spent.'
    },
    Silver: {
      name: 'Silver VIP',
      bg: 'linear-gradient(135deg, #5A6B7C, #7A9E7E)',
      nextTier: 'Gold',
      nextGoal: 1500,
      desc: 'Exclusive access to member-only coupons!'
    },
    Gold: {
      name: 'Gold Elite VIP',
      bg: 'linear-gradient(135deg, #A88734, #D4AF37)',
      nextTier: 'Platinum',
      nextGoal: 3000,
      desc: 'VIP customer support & priority delivery!'
    },
    Platinum: {
      name: 'Platinum Royal',
      bg: 'linear-gradient(135deg, #12221A, #1B4332)',
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* VIP Card */}
      <div
        style={{
          background: tierInfo.bg,
          color: '#fff',
          borderRadius: 16,
          padding: 24,
          boxShadow: '0 12px 28px rgba(0,0,0,0.12)',
          position: 'relative',
          overflow: 'hidden',
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
              borderRadius: 20,
              fontFamily: "'Raleway', sans-serif"
            }}>
              {tierInfo.name}
            </span>
            <div style={{ fontSize: 24, fontFamily: "'Cormorant Garamond', serif", fontWeight: 700, marginTop: 12 }}>{user?.name || 'Valued Customer'}</div>
            <div style={{ fontSize: 12, opacity: 0.85, marginTop: 4, fontFamily: "'Raleway', sans-serif" }}>Member since {new Date(user?.createdAt || Date.now()).getFullYear()}</div>
          </div>
          <div style={{ fontSize: 32 }}>👑</div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 32 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: "'Raleway', sans-serif" }}>Available Points</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <span style={{ fontSize: 36, fontWeight: 900, fontFamily: "'Raleway', sans-serif" }}>{currentPoints}</span>
              <span style={{ fontSize: 14, fontWeight: 700, opacity: 0.9 }}>pts</span>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 10, fontWeight: 700, opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: "'Raleway', sans-serif" }}>Redeemable Value</div>
            <div style={{ fontSize: 20, fontWeight: 900, fontFamily: "'Raleway', sans-serif" }}>{formatCurrency(cashValue)}</div>
          </div>
        </div>
      </div>

      {/* Tier Progress Bar */}
      {tierInfo.nextTier && (
        <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 16, padding: 20, boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 700, marginBottom: 8, fontFamily: "'Raleway', sans-serif" }}>
            <span style={{ color: 'var(--mz-mid)' }}>Progress to <strong style={{ color: 'var(--mz-dark)' }}>{tierInfo.nextTier} VIP</strong></span>
            <span style={{ color: 'var(--mz-dark)' }}>{lifetimeEarned} / {tierInfo.nextGoal} pts</span>
          </div>
          <div style={{ height: 8, background: '#f0ede6', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{ width: `${progressPercent}%`, height: '100%', background: tierInfo.bg, borderRadius: 99, transition: 'width 0.5s' }} />
          </div>
          <p style={{ fontSize: 12, color: '#666', marginTop: 10, fontWeight: 500, lineHeight: 1.5 }}>
            {tierInfo.desc} You need <strong style={{ color: 'var(--mz-dark)' }}>{tierInfo.nextGoal - lifetimeEarned}</strong> more points to upgrade.
          </p>
        </div>
      )}

      {/* Point Statistics Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 12, padding: 16, textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--mz-mid)', fontFamily: "'Raleway', sans-serif" }}>+{lifetimeEarned}</div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#666', textTransform: 'uppercase', marginTop: 2, letterSpacing: '0.05em' }}>Lifetime Earned</div>
        </div>
        <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 12, padding: 16, textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#777', fontFamily: "'Raleway', sans-serif" }}>{loyalty?.totalRedeemed || 0}</div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#666', textTransform: 'uppercase', marginTop: 2, letterSpacing: '0.05em' }}>Points Redeemed</div>
        </div>
      </div>

      {/* Transaction History Ledger */}
      <div>
        <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 700, color: 'var(--mz-dark)', marginBottom: 14 }}>📜 Points History</h3>
        {history.length === 0 ? (
          <div style={{ background: '#fff', border: '1.5px dashed rgba(0,0,0,0.08)', borderRadius: 14, padding: 36, textAlign: 'center', color: '#666' }}>
            <div style={{ fontSize: 28, marginBottom: 6 }}>🪙</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--mz-dark)' }}>No points transactions yet</div>
            <p style={{ fontSize: 12, marginTop: 4, color: '#777' }}>Complete orders to earn points automatically!</p>
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
                    border: '1px solid rgba(0,0,0,0.05)',
                    borderRadius: 12,
                    padding: '14px 16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                  }}
                >
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--mz-dark)' }}>
                      {tx.description || (isEarn ? 'Points Earned' : 'Points Redeemed')}
                    </div>
                    <div style={{ fontSize: 11, color: '#777', marginTop: 2, fontWeight: 600 }}>
                      {new Date(tx.createdAt).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                  <div style={{
                    fontSize: 16,
                    fontWeight: 900,
                    fontFamily: "'Raleway', sans-serif",
                    color: isEarn ? 'var(--mz-mid)' : '#ef4444'
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

function ProfileSection({ user, updateUser, logout }) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [saved, setSaved] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    const res = await updateUser({ name, phone });
    if (res?.success) {
      setSaved(true);
      setIsEditing(false);
      setTimeout(() => setSaved(false), 2500);
    }
  };

  return (
    <div
      style={{
        background: '#fff',
        padding: 24,
        borderRadius: 16,
        border: '1px solid rgba(0,0,0,0.06)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.04)'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 700, color: 'var(--mz-dark)', margin: 0 }}>
          Account Details
        </h3>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--mz-mid)',
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
              fontFamily: "'Raleway', sans-serif"
            }}
          >
            ✏️ Edit Profile
          </button>
        )}
      </div>

      {isEditing ? (
        <form className="c-profile-form" onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <div className="c-field-label" style={{ color: 'var(--mz-mid)', fontWeight: 700, fontSize: 12, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 6 }}>Full Name</div>
            <input
              className="c-field-input"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Your name"
              style={{
                borderColor: 'rgba(0,0,0,0.15)',
                borderRadius: 8,
                padding: '12px 14px',
                fontFamily: "'Raleway', sans-serif",
                fontSize: 14,
                width: '100%',
                boxSizing: 'border-box'
              }}
            />
          </div>
          <div>
            <div className="c-field-label" style={{ color: 'var(--mz-mid)', fontWeight: 700, fontSize: 12, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 6 }}>Email Address</div>
            <input
              className="c-field-input"
              value={user?.email || ''}
              disabled
              style={{
                borderColor: 'rgba(0,0,0,0.1)',
                background: '#f9f9f9',
                borderRadius: 8,
                padding: '12px 14px',
                fontFamily: "'Raleway', sans-serif",
                fontSize: 14,
                opacity: 0.7,
                cursor: 'not-allowed',
                width: '100%',
                boxSizing: 'border-box'
              }}
            />
          </div>
          <div>
            <div className="c-field-label" style={{ color: 'var(--mz-mid)', fontWeight: 700, fontSize: 12, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 6 }}>Phone Number (Optional)</div>
            <input
              className="c-field-input"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="03xx-xxxxxxx"
              type="tel"
              style={{
                borderColor: 'rgba(0,0,0,0.15)',
                borderRadius: 8,
                padding: '12px 14px',
                fontFamily: "'Raleway', sans-serif",
                fontSize: 14,
                width: '100%',
                boxSizing: 'border-box'
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              style={{
                background: 'transparent',
                color: '#666',
                borderRadius: 8,
                padding: '12px',
                fontSize: 12,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                border: '1px solid rgba(0,0,0,0.15)',
                cursor: 'pointer',
                flex: 1
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="mz-modal-add-btn"
              style={{
                background: 'var(--mz-dark)',
                color: '#fff',
                borderRadius: 8,
                padding: '12px',
                fontSize: 12,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                border: 'none',
                cursor: 'pointer',
                flex: 1.5
              }}
            >
              Save Details
            </button>
          </div>
        </form>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, paddingBottom: 12, borderBottom: '1px dashed rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: 20 }}>👤</div>
            <div>
              <div style={{ fontSize: 11, color: '#888', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: "'Raleway', sans-serif" }}>Full Name</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--mz-dark)', fontFamily: "'Raleway', sans-serif", marginTop: 2 }}>{user?.name || 'Not provided'}</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, paddingBottom: 12, borderBottom: '1px dashed rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: 20 }}>✉️</div>
            <div>
              <div style={{ fontSize: 11, color: '#888', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: "'Raleway', sans-serif" }}>Email Address</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--mz-dark)', fontFamily: "'Raleway', sans-serif", marginTop: 2 }}>{user?.email}</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, paddingBottom: 4 }}>
            <div style={{ fontSize: 20 }}>📞</div>
            <div>
              <div style={{ fontSize: 11, color: '#888', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: "'Raleway', sans-serif" }}>Phone Number</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--mz-dark)', fontFamily: "'Raleway', sans-serif", marginTop: 2 }}>{user?.phone || 'Not provided'}</div>
            </div>
          </div>

          <button
            className="c-logout-btn"
            onClick={logout}
            style={{
              marginTop: 16,
              background: 'rgba(239, 68, 68, 0.05)',
              border: '1px solid rgba(239, 68, 68, 0.15)',
              color: '#ef4444',
              borderRadius: 8,
              padding: '12px',
              fontWeight: 700,
              fontSize: 13,
              letterSpacing: '0.05em',
              cursor: 'pointer',
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8
            }}
          >
            🚪 Sign Out of Account
          </button>
        </div>
      )}
    </div>
  );
}

export default function CustomerAccountPage() {
  const { user, logout, updateUser, isHydrated } = useAuth();
  const navigate = useNavigate();
  const [isOrdersOpen, setIsOrdersOpen] = useState(false);
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  const [loyalty, setLoyalty] = useState(null);
  const [history, setHistory] = useState([]);
  const [loyaltyLoading, setLoyaltyLoading] = useState(true);

  const restaurantId = user?.restaurantId || localStorage.getItem('rms_last_restaurant_id');

  // Load Orders
  useEffect(() => {
    if (!restaurantId) { setOrdersLoading(false); return; }
    customerApi.getMyOrders(restaurantId)
      .then(res => {
        const payload = res.data?.data;
        const ordersArray = Array.isArray(payload)
          ? payload
          : (payload && Array.isArray(payload.orders) ? payload.orders : (Array.isArray(res.data) ? res.data : []));
        setOrders(ordersArray);
      })
      .catch(() => setOrders([]))
      .finally(() => setOrdersLoading(false));
  }, [user, restaurantId]);

  // Load Loyalty
  useEffect(() => {
    const customerId = user?._id || user?.id;
    if (!restaurantId || !customerId) {
      setLoyaltyLoading(false);
      return;
    }

    Promise.all([
      crmApi.getLoyalty(restaurantId, customerId),
      crmApi.getLoyaltyHistory(restaurantId, customerId)
    ])
      .then(([loyRes, histRes]) => {
        setLoyalty(loyRes.data?.data || loyRes.data || null);
        const histData = histRes.data?.data || histRes.data || [];
        setHistory(Array.isArray(histData) ? histData : (histData && Array.isArray(histData.history) ? histData.history : []));
      })
      .catch((e) => {
        console.error('Failed to load loyalty:', e);
      })
      .finally(() => setLoyaltyLoading(false));
  }, [user, restaurantId]);

  if (!isHydrated) {
    return (
      <div className="customer-root" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--mz-dark)' }}>
        <div className="c-spinner" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="customer-root c-auth-wrap" style={{ background: 'var(--mz-cream)', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div className="c-auth-card" style={{ background: '#fff', padding: 32, borderRadius: 16, border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 8px 30px rgba(0,0,0,0.05)', maxWidth: 400, width: '90%', textAlign: 'center' }}>
          <div className="c-auth-logo" style={{ fontSize: 48, marginBottom: 12 }}>👤</div>
          <h1 className="c-auth-title" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 700, color: 'var(--mz-dark)', marginBottom: 8 }}>Your Account</h1>
          <p className="c-auth-sub" style={{ fontFamily: "'Raleway', sans-serif", fontSize: 14, color: '#666', lineHeight: 1.5, marginBottom: 24 }}>Sign in to view your order history and manage your profile.</p>
          <button
            className="mz-modal-add-btn"
            style={{
              background: 'var(--mz-dark)',
              color: '#fff',
              borderRadius: 8,
              padding: '14px',
              fontSize: 13,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              border: 'none',
              cursor: 'pointer',
              width: '100%'
            }}
            onClick={() => navigate('/customer/login')}
          >
            → Sign In / Create Account
          </button>
          <div style={{ marginTop: 24, textAlign: 'center' }}>
            <Link to={restaurantId ? `/menu/${restaurantId}` : '/'} style={{ fontSize: 13, color: 'var(--mz-mid)', fontWeight: 700, textDecoration: 'none', fontFamily: "'Raleway', sans-serif", letterSpacing: '0.05em' }}>← Menu</Link>
          </div>
        </div>
      </div>
    );
  }

  const initial = (user.name || 'U').charAt(0).toUpperCase();

  return (
    <div className="customer-root c-account-wrap" style={{ background: 'var(--mz-off)', minHeight: '100vh' }}>
      {/* Hero */}
      <div className="c-account-hero" style={{ background: 'var(--mz-dark)', padding: '32px 20px 24px', color: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div className="c-account-avatar" style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', border: '2px solid var(--mz-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 900 }}>{initial}</div>
          <div>
            <div className="c-account-name" style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 700, fontSize: 26, marginBottom: 2 }}>{user.name || 'Customer'}</div>
            <div className="c-account-email" style={{ fontFamily: "'Raleway', sans-serif", fontSize: 14, opacity: 0.85 }}>{user.email}</div>
          </div>
        </div>
        <div style={{ marginTop: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link to={restaurantId ? `/menu/${restaurantId}` : '/'} style={{ color: 'var(--mz-cream)', fontSize: 13, fontWeight: 700, textDecoration: 'none', fontFamily: "'Raleway', sans-serif", letterSpacing: '0.05em' }}>← Menu</Link>

        </div>
      </div>

      {/* Grid Dashboard */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 24,
          padding: '24px 20px',
          maxWidth: 1200,
          margin: '0 auto'
        }}
      >
        {/* Left Side: Rewards Dashboard */}
        <div>
          <RewardSection loyalty={loyalty} history={history} loading={loyaltyLoading} user={user} />
        </div>

        {/* Right Side: Profile & Quick Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Quick Order History Card */}
          <div style={{ background: '#fff', padding: 24, borderRadius: 16, border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
            <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 700, color: 'var(--mz-dark)', marginBottom: 8 }}>
              Order History
            </h3>
            <p style={{ fontSize: 13, color: '#666', fontFamily: "'Raleway', sans-serif", marginBottom: 16, lineHeight: 1.4 }}>
              Track active deliveries, check order details, or re-order from your previous meals.
            </p>
            <button
              onClick={() => setIsOrdersOpen(true)}
              className="mz-modal-add-btn"
              style={{
                background: 'var(--mz-dark)',
                color: '#fff',
                borderRadius: 8,
                padding: '14px',
                fontSize: 13,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                border: 'none',
                cursor: 'pointer',
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8
              }}
            >
              📋 View Order Logs ({orders.length})
            </button>
          </div>

          <ProfileSection user={user} updateUser={updateUser} logout={() => { logout(); navigate(restaurantId ? `/menu/${restaurantId}` : '/'); }} />
        </div>
      </div>

      {/* Sliding Drawer for Orders */}
      <OrdersDrawer isOpen={isOrdersOpen} onClose={() => setIsOrdersOpen(false)} orders={orders} loading={ordersLoading} restaurantId={restaurantId} />
    </div>
  );
}
