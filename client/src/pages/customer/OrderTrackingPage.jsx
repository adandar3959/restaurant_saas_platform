import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { customerApi } from '../../api/customer.api';
import '../../styles/customer.css';

const STEPS = [
  { key: 'Pending',         label: 'Order Received',    desc: 'We got your order!', emoji: '📋' },
  { key: 'Accepted',        label: 'Accepted',           desc: 'Kitchen confirmed your order', emoji: '✅' },
  { key: 'Preparing',       label: 'Preparing',          desc: 'Chef is cooking your food 🍳', emoji: '👨‍🍳' },
  { key: 'Ready',           label: 'Ready',              desc: 'Your order is ready!', emoji: '🔔' },
  { key: 'OutForDelivery',  label: 'Out for Delivery',   desc: 'Driver is on the way 🛵', emoji: '🛵' },
  { key: 'Completed',       label: 'Delivered',          desc: 'Enjoy your meal! 😋', emoji: '🎉' },
];

const STATUS_COLORS = {
  Pending:        { bg: 'rgba(99,102,241,0.1)',  color: '#4F46E5' },
  Accepted:       { bg: 'rgba(22,163,74,0.1)',   color: '#16A34A' },
  Preparing:      { bg: 'rgba(245,158,11,0.1)',  color: '#D97706' },
  Ready:          { bg: 'rgba(59,130,246,0.1)',  color: '#2563EB' },
  OutForDelivery: { bg: 'rgba(168,85,247,0.1)',  color: '#7C3AED' },
  Completed:      { bg: 'rgba(22,163,74,0.1)',   color: '#16A34A' },
  Cancelled:      { bg: 'rgba(220,38,38,0.1)',   color: '#DC2626' },
};

export default function OrderTrackingPage() {
  const { restaurantId, orderId } = useParams();
  const [order, setOrder]         = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const fetchOrder = useCallback(async () => {
    if (!restaurantId || !orderId) return;
    try {
      const res = await customerApi.getOrderStatus(restaurantId, orderId);
      setOrder(res.data?.data || res.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load order status.');
    } finally {
      setLoading(false);
      setLastRefresh(new Date());
    }
  }, [restaurantId, orderId]);

  useEffect(() => { fetchOrder(); }, [fetchOrder]);

  // Auto-refresh every 15 seconds unless completed/cancelled
  useEffect(() => {
    if (!order) return;
    if (['Completed', 'Cancelled'].includes(order.status)) return;
    const t = setInterval(fetchOrder, 15000);
    return () => clearInterval(t);
  }, [order, fetchOrder]);

  const currentStepIdx = order
    ? STEPS.findIndex(s => s.key === order.status)
    : -1;

  const isCancelled = order?.status === 'Cancelled';

  return (
    <div className="customer-root c-track-wrap">
      {/* Header */}
      <div className="c-track-header">
        <Link to={`/menu/${restaurantId}`} className="c-back-btn">←</Link>
        <div>
          <div className="c-page-title">Order Tracker</div>
          <div style={{fontSize:12,color:'var(--c-text-muted)',fontWeight:600,marginTop:2}}>
            Auto-refreshing every 15s
          </div>
        </div>
        <button className="c-refresh-btn" onClick={fetchOrder} style={{marginLeft:'auto'}}>
          🔄 Refresh
        </button>
      </div>

      <div className="c-track-body">
        {loading && (
          <div className="c-spinner-wrap"><div className="c-spinner"/>Loading order...</div>
        )}

        {error && !loading && (
          <div className="c-empty">
            <div className="c-empty-icon">😕</div>
            <strong>Oops!</strong><p>{error}</p>
            <button className="c-refresh-btn" onClick={fetchOrder}>Try Again</button>
          </div>
        )}

        {order && !loading && (
          <>
            {/* Status card */}
            <div className="c-track-status-card">
              <div className="c-track-status-label">Current Status</div>
              <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:16}}>
                <span style={{
                  padding:'6px 16px', borderRadius:'9999px', fontWeight:800, fontSize:15,
                  background: STATUS_COLORS[order.status]?.bg || '#f3f4f6',
                  color: STATUS_COLORS[order.status]?.color || '#374151',
                }}>
                  {STEPS.find(s=>s.key===order.status)?.emoji} {order.status === 'OutForDelivery' ? 'Out for Delivery' : order.status}
                </span>
              </div>

              {/* Stepper */}
              {!isCancelled && (
                <div className="c-stepper">
                  {(() => {
                    const filteredSteps = STEPS.filter(s => s.key !== 'OutForDelivery' || order.orderType === 'Delivery');
                    return filteredSteps.map((step, i) => {
                      const isDone   = filteredSteps.findIndex(s => s.key === order.status) > i;
                      const isActive = step.key === order.status;
                      const isLast   = i === filteredSteps.length - 1;
                      return (
                        <div key={step.key} className="c-step-row">
                          <div className="c-step-left">
                            <div className={`c-step-dot${isDone?' done':isActive?' active':''}`}>
                              {isDone ? '✓' : step.emoji}
                            </div>
                            {!isLast && <div className={`c-step-line${isDone?' done':''}`}/>}
                          </div>
                          <div className="c-step-info">
                            <div className="c-step-name" style={{fontWeight: isActive ? 900 : 700, color: isActive ? 'var(--c-primary-dark)' : undefined}}>
                              {step.label}
                            </div>
                            {isActive && <div className="c-step-desc">{step.desc}</div>}
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              )}

              {isCancelled && (
                <div style={{textAlign:'center',padding:'16px 0',color:'var(--c-red)',fontWeight:700}}>
                  ❌ This order was cancelled.
                </div>
              )}
            </div>

            {/* Order details */}
            <div className="c-track-detail-card">
              <div className="c-track-detail-title">Order Details</div>
              {order.items?.map((item, i) => (
                <div key={i} className="c-track-item-row">
                  <span>{item.quantity}× {item.name}</span>
                  <span style={{fontWeight:700}}>Rs {(item.unitPrice * item.quantity).toLocaleString()}</span>
                </div>
              ))}
              <div className="c-track-item-row" style={{fontWeight:900,marginTop:4}}>
                <span>Total</span>
                <span style={{color:'var(--c-primary-dark)'}}>Rs {order.totalAmount?.toLocaleString()}</span>
              </div>
            </div>

            {/* Order info */}
            <div className="c-track-detail-card">
              <div className="c-track-detail-title">Order Info</div>
              <div className="c-track-item-row"><span>Type</span><span style={{fontWeight:700}}>{order.orderType}</span></div>
              {order.tableId && (
                <div className="c-track-item-row">
                  <span>Table</span>
                  <span style={{fontWeight:700}}>
                    {typeof order.tableId === 'object' ? order.tableId.tableNumber : order.tableNumber || order.tableId}
                  </span>
                </div>
              )}
              {order.deliveryAddress && (
                <div className="c-track-item-row">
                  <span>Address</span>
                  <span style={{fontWeight:700,maxWidth:200,textAlign:'right'}}>
                    {typeof order.deliveryAddress === 'object' ? order.deliveryAddress.street : order.deliveryAddress}
                  </span>
                </div>
              )}
              <div className="c-track-item-row">
                <span>Last Updated</span>
                <span style={{fontWeight:600,color:'var(--c-text-muted)',fontSize:12}}>{lastRefresh.toLocaleTimeString()}</span>
              </div>
            </div>

            <Link to={`/menu/${restaurantId}`} className="c-btn-outline" style={{textAlign:'center',display:'block'}}>
              ← Back to Menu
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
