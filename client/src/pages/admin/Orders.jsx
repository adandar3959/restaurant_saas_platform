import { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { RefreshCw, Filter, Search, Eye, Check, X } from 'lucide-react';
import { ordersApi } from '../../api/orders.api';
import { formatCurrency, formatDateTime, timeAgo } from '../../lib/utils';
import { ORDER_STATUS_COLORS, ORDER_STATUS } from '../../lib/constants';
import './Orders.css';

const STATUS_TABS = ['All', 'Pending', 'Accepted', 'Preparing', 'Ready', 'Completed', 'Cancelled'];

const NEXT_STATUS = {
  Pending:   'Accepted',
  Accepted:  'Preparing',
  Preparing: 'Ready',
  Ready:     'Completed',
};

export default function Orders() {
  const { restaurantId } = useOutletContext();
  const [orders,    setOrders]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [tab,       setTab]       = useState('All');
  const [search,    setSearch]    = useState('');
  const [updating,  setUpdating]  = useState(null);
  const [selected,  setSelected]  = useState(null);

  const fetch = useCallback(async () => {
    if (!restaurantId) return;
    setLoading(true);
    try {
      const res = await ordersApi.getOrders(restaurantId);
      setOrders(res.data?.data || []);
    } catch { setOrders([]); }
    finally { setLoading(false); }
  }, [restaurantId]);

  useEffect(() => { fetch(); }, [fetch]);

  const handleStatusUpdate = async (orderId, newStatus) => {
    setUpdating(orderId);
    try {
      await ordersApi.updateStatus(restaurantId, orderId, newStatus);
      setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: newStatus } : o));
    } catch {}
    finally { setUpdating(null); }
  };

  const filtered = orders.filter(o => {
    const matchTab = tab === 'All' || o.status === tab;
    const matchSearch = !search || o._id?.includes(search) || o.orderType?.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Orders</h1>
          <p className="page-subtitle">{orders.length} total orders</p>
        </div>
        <button className="btn btn-outline btn-sm" onClick={fetch} disabled={loading}>
          <RefreshCw size={15} className={loading ? 'spin' : ''} /> Refresh
        </button>
      </div>

      {/* Status tabs */}
      <div className="orders-tabs">
        {STATUS_TABS.map(s => {
          const count = s === 'All' ? orders.length : orders.filter(o => o.status === s).length;
          return (
            <button
              key={s}
              className={`orders-tab ${tab === s ? 'active' : ''}`}
              onClick={() => setTab(s)}
            >
              {s}
              <span className="orders-tab-count">{count}</span>
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
                <th>Order</th>
                <th>Type</th>
                <th>Items</th>
                <th>Total</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Time</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(order => {
                const sc = ORDER_STATUS_COLORS[order.status] || {};
                const next = NEXT_STATUS[order.status];
                const isUpdating = updating === order._id;
                return (
                  <tr key={order._id}>
                    <td>
                      <span className="order-id">#{order._id?.slice(-6).toUpperCase()}</span>
                      {order.tableId && <div className="text-xs text-muted">Table #{order.tableId}</div>}
                    </td>
                    <td><span className="order-type-badge">{order.orderType}</span></td>
                    <td className="text-muted">{order.items?.length || 0}</td>
                    <td className="font-semi">{formatCurrency(order.totalAmount)}</td>
                    <td>
                      <span className={`payment-badge ${order.paymentStatus === 'Paid' ? 'paid' : ''}`}>
                        {order.paymentStatus || 'Unpaid'}
                      </span>
                    </td>
                    <td>
                      <span className="status-badge" style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.color}33` }}>
                        {order.status}
                      </span>
                    </td>
                    <td className="text-muted text-sm">{timeAgo(order.createdAt)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 8 }}>
                        {next && (
                          <button
                            className="btn btn-primary btn-xs"
                            onClick={() => handleStatusUpdate(order._id, next)}
                            disabled={isUpdating}
                          >
                            {isUpdating ? <div className="spinner" /> : <Check size={13} />}
                            {next}
                          </button>
                        )}
                        {order.status !== 'Cancelled' && order.status !== 'Completed' && (
                          <button
                            className="btn btn-ghost btn-xs"
                            style={{ color: 'var(--error)' }}
                            onClick={() => handleStatusUpdate(order._id, 'Cancelled')}
                            disabled={isUpdating}
                          >
                            <X size={13} />
                          </button>
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
