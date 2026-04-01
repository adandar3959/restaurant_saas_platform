import { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { RefreshCw, Search, Check, X, AlertCircle } from 'lucide-react';
import { ordersApi } from '../../api/orders.api';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, timeAgo } from '../../lib/utils';
import { ORDER_STATUS_COLORS } from '../../lib/constants';
import './Orders.css';

const STATUS_TABS = ['All', 'Pending', 'Accepted', 'Preparing', 'Ready', 'Completed', 'Cancelled'];

const ROLE_NEXT_STATUS = {
  admin:   { Pending: null, Accepted: null, Preparing: null, Ready: null },
  manager: { Pending: null, Accepted: null, Preparing: null, Ready: null },
  chef:    { Pending: 'Accepted', Accepted: 'Preparing', Preparing: 'Ready' },
  waiter:  { Ready: 'Completed' },
  driver:  { Ready: 'OutForDelivery', OutForDelivery: 'Completed' },
};

function getNextStatus(role, currentStatus) {
  const r = (role || '').toLowerCase();
  return ROLE_NEXT_STATUS[r]?.[currentStatus] ?? null;
}

function canCancel(role, status) {
  const r = (role || '').toLowerCase();
  if (!['admin', 'manager'].includes(r)) return false;
  return !['Completed', 'Cancelled'].includes(status);
}

export default function Orders() {
  const { restaurantId } = useOutletContext();
  const { user } = useAuth();
  const [orders,   setOrders]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [tab,      setTab]      = useState('All');
  const [search,   setSearch]   = useState('');
  const [updating, setUpdating] = useState(null);
  const [toast,    setToast]    = useState(null);

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchOrders = useCallback(async () => {
    if (!restaurantId) return;
    setLoading(true);
    try {
      const res = await ordersApi.getOrders(restaurantId);
      setOrders(res.data?.data?.orders || []);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const handleStatusUpdate = async (orderId, newStatus) => {
    setUpdating(orderId);
    try {
      await ordersApi.updateStatus(restaurantId, orderId, newStatus);
      setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: newStatus } : o));
      showToast('success', `Order marked as ${newStatus}`);
    } catch (err) {
      const msg = err?.response?.data?.message || 'Action not permitted for your role';
      showToast('error', msg);
    } finally {
      setUpdating(null);
    }
  };

  const filtered = orders.filter(o => {
    const matchTab    = tab === 'All' || o.status === tab;
    const matchSearch = !search || o._id?.includes(search) ||
      o.orderType?.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  return (
    <div style={{ position: 'relative' }}>
      {toast && (
        <div style={{
          position: 'fixed', top: 24, right: 24, zIndex: 9999,
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '12px 18px', borderRadius: 10, fontWeight: 600, fontSize: 14,
          background: toast.type === 'error' ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)',
          border: `1px solid ${toast.type === 'error' ? '#EF4444' : '#10B981'}`,
          color: toast.type === 'error' ? '#FCA5A5' : '#6EE7B7',
          backdropFilter: 'blur(8px)',
        }}>
          <AlertCircle size={16} />
          {toast.msg}
        </div>
      )}

      <div className="page-header">
        <div>
          <h1 className="page-title gradient-text-cyan">Order Management</h1>
          <p className="page-subtitle">{orders.length} total orders recorded</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn btn-outline btn-sm" onClick={fetchOrders} disabled={loading}>
            <RefreshCw size={15} className={loading ? 'spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      <div className="orders-tabs glass-panel">
        {STATUS_TABS.map(s => {
          const count = s === 'All' ? orders.length : orders.filter(o => o.status === s).length;
          return (
            <button key={s} className={`orders-tab ${tab === s ? 'active' : ''}`} onClick={() => setTab(s)}>
              {s.toUpperCase()}<span className="orders-tab-count">{count}</span>
            </button>
          );
        })}
      </div>

      <div className="orders-search glass-panel" style={{ padding: '4px', borderRadius: '12px', display: 'flex', alignItems: 'center' }}>
        <Search size={18} className="text-muted" style={{ marginLeft: 12 }} />
        <input
          type="text"
          className="form-input"
          style={{ background: 'transparent', border: 'none', boxShadow: 'none' }}
          placeholder="Search by ID or type..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="page-loading"><div className="spinner-lg" /></div>
      ) : (
        <div className="data-table-wrap glass-panel animate-fade-up">
          <table className="data-table">
            <thead>
              <tr>
                <th>Order ID</th><th>Type</th><th>Items</th><th>Amount</th><th>Status</th><th>Payment</th><th>Time</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: 'var(--space-12)', color: 'var(--text-muted)' }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
                    <div>No orders found in this category</div>
                  </td>
                </tr>
              ) : filtered.map(order => {
                const sc = ORDER_STATUS_COLORS[order.status] || {};
                const next = getNextStatus(user.role, order.status);
                const canCancelOrder = canCancel(user.role, order.status);
                const isUpdating = updating === order._id;

                return (
                  <tr key={order._id}>
                    <td><span className="order-id" style={{ background: 'rgba(56,189,248,0.1)', color: 'var(--neon-cyan)', border: '1px solid rgba(56,189,248,0.2)' }}>#{order._id?.slice(-6).toUpperCase()}</span></td>
                    <td className="font-semi">{order.orderType}</td>
                    <td className="text-muted">{order.items?.length || 0} items</td>
                    <td className="font-semi">{formatCurrency(order.totalAmount || 0)}</td>
                    <td>
                      <span className="status-badge" style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.color}40`, fontWeight: 700, fontSize: 11 }}>
                        {order.status.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <span className={`payment-badge ${order.paymentStatus === 'Paid' ? 'paid' : ''}`} style={{ fontWeight: 700 }}>
                        {order.paymentStatus?.toUpperCase()}
                      </span>
                    </td>
                    <td className="text-sm text-subtle">{timeAgo(order.createdAt)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {next && (
                          <button
                            className="btn btn-primary btn-xs"
                            style={{ background: 'var(--neon-cyan)', color: '#0f172a', fontWeight: 800, border: 'none' }}
                            onClick={() => handleStatusUpdate(order._id, next)}
                            disabled={isUpdating}
                          >
                            {isUpdating ? <RefreshCw size={12} className="spin" /> : <Check size={12} />}
                            {next}
                          </button>
                        )}
                        {canCancelOrder && (
                          <button
                            className="btn btn-ghost btn-xs"
                            style={{ color: 'var(--error)' }}
                            onClick={() => {
                              if (window.confirm('Cancel this order?')) {
                                handleStatusUpdate(order._id, 'Cancelled');
                              }
                            }}
                            disabled={isUpdating}
                          >
                            <X size={12} /> Cancel
                          </button>
                        )}
                        {!next && !canCancelOrder && <span className="text-xs text-muted">—</span>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
