import { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { RefreshCw, Search, Check, X, AlertCircle } from 'lucide-react';
import { ordersApi } from '../../api/orders.api';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, timeAgo } from '../../lib/utils';
import { ORDER_STATUS_COLORS } from '../../lib/constants';
import './Orders.css';

const STATUS_TABS = ['All', 'Pending', 'Accepted', 'Preparing', 'Ready', 'Completed', 'Cancelled'];

// Backend role restrictions (read-only reference — do NOT change backend)
// Accepted/Preparing/Ready → Chef only
// OutForDelivery → Driver only
// Completed → Waiter | Driver
// Cancelled → Admin | Manager
const ROLE_NEXT_STATUS = {
  admin:   { Pending: null, Accepted: null, Preparing: null, Ready: null }, // Admin can only Cancel
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
  const [toast,    setToast]    = useState(null); // { type: 'success'|'error', msg }

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
      {/* Toast notification */}
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
          <h1 className="page-title">Orders</h1>
          <p className="page-subtitle">{orders.length} total orders</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Role info badge */}
          <span style={{
            fontSize: 12, padding: '4px 10px', borderRadius: 20,
            background: 'rgba(99,102,241,0.15)', color: '#818CF8', fontWeight: 600,
          }}>
            Role: {user?.role} — can Cancel orders
          </span>
          <button className="btn btn-outline btn-sm" onClick={fetchOrders} disabled={loading}>
            <RefreshCw size={15} className={loading ? 'spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {/* Status tabs */}
      <div className="orders-tabs">
        {STATUS_TABS.map(s => {
          const count = s === 'All' ? orders.length : orders.filter(o => o.status === s).length;
          return (
            <button key={s} className={`orders-tab ${tab === s ? 'active' : ''}`} onClick={() => setTab(s)}>
              {s}<span className="orders-tab-count">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="orders-search">
        <Search size={16} className="orders-search-icon" />
        <input
          type="text"
          className="form-input"
          style={{ paddingLeft: 40 }}
          placeholder="Search by order ID or type..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="page-loading"><div className="spinner-lg" /></div>
      ) : filtered.length === 0 ? (
        <div className="data-table-wrap">
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <div className="empty-state-title">No orders found</div>
            <p>Try a different filter or status tab.</p>
          </div>
        </div>
      ) : (
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Order</th><th>Type</th><th>Items</th><th>Total</th>
                <th>Payment</th><th>Status</th><th>Time</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(order => {
                const sc        = ORDER_STATUS_COLORS[order.status] || {};
                const nextSt    = getNextStatus(user?.role, order.status);
                const showCancel = canCancel(user?.role, order.status);
                const isUpdating = updating === order._id;
                // totalAmount may be null if backend didn't compute it
                const total = order.totalAmount != null ? formatCurrency(order.totalAmount) : '—';

                return (
                  <tr key={order._id}>
                    <td>
                      <span className="order-id">#{order._id?.slice(-6).toUpperCase()}</span>
                      {order.tableId && (
                        <div className="text-xs text-muted">
                          Table #{order.tableId?.tableNumber ?? order.tableId}
                        </div>
                      )}
                    </td>
                    <td><span className="order-type-badge">{order.orderType}</span></td>
                    <td className="text-muted">{order.items?.length || 0}</td>
                    <td className="font-semi">{total}</td>
                    <td>
                      <span className={`payment-badge ${order.paymentStatus === 'Paid' ? 'paid' : ''}`}>
                        {order.paymentStatus || 'Unpaid'}
                      </span>
                    </td>
                    <td>
                      <span
                        className="status-badge"
                        style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.color}33` }}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="text-muted text-sm">{timeAgo(order.createdAt)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {nextSt && (
                          <button
                            className="btn btn-primary btn-xs"
                            onClick={() => handleStatusUpdate(order._id, nextSt)}
                            disabled={isUpdating}
                          >
                            {isUpdating ? <div className="spinner" /> : <Check size={13} />}
                            {nextSt}
                          </button>
                        )}
                        {showCancel && (
                          <button
                            className="btn btn-xs"
                            style={{
                              background: 'rgba(239,68,68,0.12)',
                              color: '#F87171',
                              border: '1px solid rgba(239,68,68,0.35)',
                              borderRadius: 8,
                              fontWeight: 600,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 5,
                            }}
                            onClick={() => {
                              if (window.confirm('Cancel this order?')) {
                                handleStatusUpdate(order._id, 'Cancelled');
                              }
                            }}
                            disabled={isUpdating}
                            title="Cancel this order"
                          >
                            {isUpdating ? <div className="spinner" style={{ width: 12, height: 12, borderWidth: 2 }} /> : <X size={12} />}
                            Cancel Order
                          </button>
                        )}
                        {!nextSt && !showCancel && (
                          <span className="text-xs text-muted">—</span>
                        )}
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
