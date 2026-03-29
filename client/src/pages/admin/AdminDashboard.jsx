import { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import {
  ShoppingBag, DollarSign, Clock, CheckCircle, TrendingUp,
  Users, UtensilsCrossed, ArrowRight, RefreshCw, Package
} from 'lucide-react';
import { ordersApi } from '../../api/orders.api';
import { formatCurrency, formatDateTime, timeAgo } from '../../lib/utils';
import { ORDER_STATUS_COLORS } from '../../lib/constants';
import './AdminDashboard.css';

const QUICK_ACTIONS = [
  { label: 'New Order',    icon: ShoppingBag,     path: 'orders',    color: '#FF6B35' },
  { label: 'Add Menu Item',icon: UtensilsCrossed, path: 'menu',      color: '#6366F1' },
  { label: 'View Staff',   icon: Users,            path: 'staff',     color: '#10B981' },
  { label: 'Inventory',    icon: Package,          path: 'inventory', color: '#F59E0B' },
];

export default function AdminDashboard() {
  const { restaurantId, restaurant } = useOutletContext();
  const navigate = useNavigate();

  const [orders,   setOrders]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = async (silent = false) => {
    if (!restaurantId) return;
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const res = await ordersApi.getOrders(restaurantId, { limit: 20, page: 1 });
      setOrders(res.data?.data?.orders || []);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchOrders(); }, [restaurantId]);

  // ── Derived stats ──────────────────────────────────────────────
  const todayOrders = orders.filter(o => {
    const d = new Date(o.createdAt);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  });

  const todayRevenue = todayOrders
    .filter(o => o.paymentStatus === 'Paid')
    .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  const pending   = orders.filter(o => ['Pending','Accepted','Preparing'].includes(o.status));
  const completed = orders.filter(o => o.status === 'Completed');

  const stats = [
    {
      label: 'Today\'s Orders',
      value: todayOrders.length,
      icon: ShoppingBag,
      iconBg: 'rgba(255,107,53,0.15)',
      iconColor: '#FF6B35',
      change: 'vs yesterday',
    },
    {
      label: 'Today\'s Revenue',
      value: formatCurrency(todayRevenue),
      icon: DollarSign,
      iconBg: 'rgba(16,185,129,0.15)',
      iconColor: '#10B981',
      change: 'paid orders only',
      up: true,
    },
    {
      label: 'Active Orders',
      value: pending.length,
      icon: Clock,
      iconBg: 'rgba(245,158,11,0.15)',
      iconColor: '#F59E0B',
      change: 'need attention',
    },
    {
      label: 'Completed',
      value: completed.length,
      icon: CheckCircle,
      iconBg: 'rgba(99,102,241,0.15)',
      iconColor: '#6366F1',
      change: 'all time',
      up: true,
    },
  ];

  if (loading) {
    return (
      <div className="page-loading">
        <div className="spinner-lg" />
        <span>Loading dashboard...</span>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      {/* Page header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            Dashboard
            {restaurant && <span className="dash-restaurant-name"> · {restaurant.restaurantName}</span>}
          </h1>
          <p className="page-subtitle">Welcome back! Here's what's happening today.</p>
        </div>
        <button
          className="btn btn-outline btn-sm"
          onClick={() => fetchOrders(true)}
          disabled={refreshing}
        >
          <RefreshCw size={15} className={refreshing ? 'spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Stats grid */}
      <div className="dash-stats-grid">
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="stat-card">
              <div className="stat-card-top">
                <div className="stat-card-icon" style={{ background: s.iconBg, color: s.iconColor }}>
                  <Icon size={20} />
                </div>
                <TrendingUp size={16} style={{ color: 'var(--text-subtle)' }} />
              </div>
              <div>
                <div className="stat-card-label">{s.label}</div>
                <div className="stat-card-value">{s.value}</div>
                <div className={`stat-card-change ${s.up ? 'up' : ''}`}>{s.change}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick actions */}
      <div className="dash-section">
        <h2 className="dash-section-title">Quick Actions</h2>
        <div className="quick-actions-grid">
          {QUICK_ACTIONS.map((a, i) => {
            const Icon = a.icon;
            return (
              <button
                key={i}
                className="quick-action-card"
                onClick={() => navigate(`/admin/${restaurantId}/${a.path}`)}
                style={{ '--qa-color': a.color }}
              >
                <div className="qa-icon" style={{ background: `${a.color}20`, color: a.color }}>
                  <Icon size={22} />
                </div>
                <span className="qa-label">{a.label}</span>
                <ArrowRight size={14} className="qa-arrow" />
              </button>
            );
          })}
        </div>
      </div>

      {/* Recent orders */}
      <div className="dash-section">
        <div className="dash-section-header">
          <h2 className="dash-section-title">Recent Orders</h2>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => navigate(`/admin/${restaurantId}/orders`)}
          >
            View all <ArrowRight size={14} />
          </button>
        </div>

        {orders.length === 0 ? (
          <div className="data-table-wrap">
            <div className="empty-state">
              <div className="empty-state-icon">📋</div>
              <div className="empty-state-title">No orders yet</div>
              <p>Orders will appear here once customers start placing them.</p>
            </div>
          </div>
        ) : (
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Type</th>
                  <th>Items</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {orders.slice(0, 10).map(order => {
                  const sc = ORDER_STATUS_COLORS[order.status] || {};
                  return (
                    <tr key={order._id} style={{ cursor: 'pointer' }}>
                      <td>
                        <span className="order-id">#{order._id?.slice(-6).toUpperCase()}</span>
                      </td>
                      <td>
                        <span className="order-type-badge">{order.orderType}</span>
                      </td>
                      <td>
                        <span className="text-muted">{order.items?.length || 0} items</span>
                      </td>
                      <td>
                        <span className="font-semi">{formatCurrency(order.totalAmount)}</span>
                      </td>
                      <td>
                        <span
                          className="status-badge"
                          style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.color}33` }}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td>
                        <span className="text-muted text-sm">{timeAgo(order.createdAt)}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order type breakdown */}
      {orders.length > 0 && (
        <div className="dash-section">
          <h2 className="dash-section-title">Order Type Breakdown</h2>
          <div className="order-type-cards">
            {['Dine-In', 'Takeaway', 'Delivery'].map(type => {
              const count = orders.filter(o => o.orderType === type).length;
              const pct = orders.length ? Math.round((count / orders.length) * 100) : 0;
              const colors = { 'Dine-In': '#FF6B35', 'Takeaway': '#6366F1', 'Delivery': '#10B981' };
              return (
                <div key={type} className="order-type-card card">
                  <div className="otc-top">
                    <span className="otc-type">{type}</span>
                    <span className="otc-pct" style={{ color: colors[type] }}>{pct}%</span>
                  </div>
                  <div className="otc-count">{count} orders</div>
                  <div className="otc-bar-bg">
                    <div className="otc-bar" style={{ width: `${pct}%`, background: colors[type] }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
