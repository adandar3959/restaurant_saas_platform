import { Link, useParams } from 'react-router-dom';
import '../../styles/customer.css';

export default function OrderConfirmedPage() {
  const { restaurantId, orderId } = useParams();
  const short = orderId ? `#${orderId.slice(-6).toUpperCase()}` : '#------';

  return (
    <div className="customer-root c-confirmed-wrap">
      <div className="c-confirmed-icon">✅</div>
      <h1 className="c-confirmed-title">Order Placed!</h1>
      <p className="c-confirmed-sub">Your order is confirmed. The kitchen is on it! 🍳</p>

      <div className="c-confirmed-card">
        <div className="c-confirmed-row">
          <span className="label">Order ID</span>
          <span className="value" style={{fontSize:13,letterSpacing:'0.04em'}}>{short}</span>
        </div>
        <div className="c-confirmed-row">
          <span className="label">Status</span>
          <span className="value" style={{color:'var(--c-green)'}}>✓ Received</span>
        </div>
        <div className="c-confirmed-row">
          <span className="label">Est. Time</span>
          <span className="value">20–35 min</span>
        </div>
      </div>

      <div className="c-confirmed-actions">
        {orderId && (
          <Link to={`/menu/${restaurantId}/track/${orderId}`} className="c-btn-primary">
            📍 Track My Order
          </Link>
        )}
        <Link to={`/menu/${restaurantId}`} className="c-btn-outline">
          ← Back to Menu
        </Link>
      </div>
    </div>
  );
}
