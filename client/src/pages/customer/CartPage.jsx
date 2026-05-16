import { useState } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { CartProvider, useCart } from '../../context/CartContext';
import { customerApi } from '../../api/customer.api';
import '../../styles/customer.css';

const FOOD_EMOJI_MAP = { burger:'🍔',pizza:'🍕',pasta:'🍝',salad:'🥗',chicken:'🍗',rice:'🍚',soup:'🍜',sandwich:'🥪',dessert:'🍰',cake:'🎂',coffee:'☕',drink:'🥤',wrap:'🌯',steak:'🥩',curry:'🍛',biryani:'🍛' };
function getEmoji(name=''){const n=name.toLowerCase();for(const[k,v]of Object.entries(FOOD_EMOJI_MAP))if(n.includes(k))return v;return'🍽️';}

// ─── Checkout Modal ───────────────────────────────────────────
function CheckoutModal({ restaurantId, tableNo, items, totalPrice, onClose, onSuccess }) {
  const [orderType, setOrderType] = useState(tableNo ? 'Dine-In' : 'Takeaway');
  const [tableNum, setTableNum]   = useState(tableNo || '');
  const [address, setAddress]     = useState('');
  const [phone, setPhone]         = useState('');
  const [notes, setNotes]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');

  const handlePlace = async () => {
    if (orderType === 'Dine-In' && !tableNum) return setError('Please enter your table number.');
    if (orderType === 'Delivery' && !address)  return setError('Please enter a delivery address.');
    setError('');
    setLoading(true);
    try {
      const payload = {
        orderType,
        items: items.map(i => ({ menuItemId: i._id.split('_')[0], quantity: i.qty, unitPrice: i.price, name: i.name })),
        totalAmount: totalPrice,
        ...(orderType === 'Dine-In'  && { tableId: tableNum }),
        ...(orderType === 'Delivery' && { deliveryAddress: { street: address } }),
        ...(phone && { customerPhone: phone }),
        ...(notes && { notes }),
      };
      const res = await customerApi.placeOrder(restaurantId, payload);
      const orderId = res.data?.data?._id || res.data?._id;
      onSuccess(orderId);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="c-checkout-overlay" onClick={e => e.target===e.currentTarget && onClose()}>
      <div className="c-checkout-sheet">
        <div className="c-checkout-head">
          <h3>Place Order</h3>
          <button className="c-back-btn" onClick={onClose} style={{border:'none',fontSize:20}}>✕</button>
        </div>
        <div className="c-checkout-body">
          {error && <div className="c-auth-error">{error}</div>}

          {/* Order Type */}
          <div>
            <div className="c-field-label">How would you like this order?</div>
            <div className="c-order-types">
              {[{t:'Dine-In',e:'🍽️'},{t:'Takeaway',e:'🛍️'},{t:'Delivery',e:'🛵'}].map(({t,e}) => (
                <button key={t} className={`c-order-type-btn${orderType===t?' active':''}`} onClick={()=>setOrderType(t)}>
                  <span className="emoji">{e}</span>
                  <span className="label">{t}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Dine-In: table */}
          {orderType==='Dine-In' && (
            <div>
              <div className="c-field-label">Table Number *</div>
              <input className="c-field-input" placeholder="e.g. 5" value={tableNum} onChange={e=>setTableNum(e.target.value)} />
            </div>
          )}

          {/* Delivery: address */}
          {orderType==='Delivery' && (
            <div>
              <div className="c-field-label">Delivery Address *</div>
              <input className="c-field-input" placeholder="House/Flat, Street, City" value={address} onChange={e=>setAddress(e.target.value)} />
            </div>
          )}

          {/* Phone */}
          <div>
            <div className="c-field-label">Phone Number (optional)</div>
            <input className="c-field-input" type="tel" placeholder="03xx-xxxxxxx" value={phone} onChange={e=>setPhone(e.target.value)} />
          </div>

          {/* Notes */}
          <div>
            <div className="c-field-label">Special Instructions (optional)</div>
            <textarea className="c-field-input c-field-textarea" placeholder="Allergies, preferences..." value={notes} onChange={e=>setNotes(e.target.value)} />
          </div>

          {/* Summary */}
          <div className="c-cart-summary" style={{margin:0}}>
            <div className="c-summary-row"><span>{items.reduce((s,i)=>s+i.qty,0)} items</span><span>Rs {totalPrice.toLocaleString()}</span></div>
            <div className="c-summary-row"><span>Service</span><span>Free</span></div>
            <div className="c-summary-row total"><span>Total</span><span>Rs {totalPrice.toLocaleString()}</span></div>
          </div>
        </div>

        <div className="c-checkout-footer">
          <button className="c-checkout-btn" style={{width:'100%',margin:0}} onClick={handlePlace} disabled={loading}>
            {loading ? '⏳ Placing Order...' : `✅ Confirm Order · Rs ${totalPrice.toLocaleString()}`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Cart Content ─────────────────────────────────────────────
function CartContent({ restaurantId, tableNo }) {
  const navigate = useNavigate();
  const { items, totalItems, totalPrice, updateQty, removeItem, clearCart } = useCart();
  const [showCheckout, setShowCheckout] = useState(false);

  if (totalItems === 0) {
    return (
      <div className="customer-root">
        <div className="c-page-header">
          <button className="c-back-btn" onClick={() => navigate(-1)}>←</button>
          <div className="c-page-title">Your Cart</div>
        </div>
        <div className="c-empty" style={{paddingTop:80}}>
          <div className="c-empty-icon">🛒</div>
          <strong style={{fontSize:18}}>Cart is empty</strong>
          <p>Add some delicious items from the menu!</p>
          <Link to={`/menu/${restaurantId}${tableNo?`?table=${tableNo}`:''}`} className="c-btn-primary" style={{marginTop:8,maxWidth:220}}>
            Browse Menu
          </Link>
        </div>
      </div>
    );
  }

  const handleSuccess = (orderId) => {
    clearCart();
    navigate(`/menu/${restaurantId}/order-confirmed/${orderId}`);
  };

  return (
    <div className="customer-root">
      <div className="c-page-header">
        <button className="c-back-btn" onClick={() => navigate(-1)}>←</button>
        <div className="c-page-title">🛒 Cart ({totalItems} items)</div>
      </div>

      {/* Items */}
      <div className="c-cart-list">
        {items.map(item => (
          <div key={item._id} className="c-cart-item">
            <div className="c-cart-item-emoji">{getEmoji(item.name)}</div>
            <div className="c-cart-item-info">
              <div className="c-cart-item-name">{item.name}</div>
              <div className="c-cart-item-price">Rs {(item.price * item.qty).toLocaleString()}</div>
            </div>
            <div className="c-cart-item-controls">
              <div className="c-qty-sm">
                <button className="c-qty-sm-btn" onClick={() => updateQty(item._id, item.qty - 1)} disabled={item.qty <= 1}>−</button>
                <span className="c-qty-sm-val">{item.qty}</span>
                <button className="c-qty-sm-btn" onClick={() => updateQty(item._id, item.qty + 1)}>+</button>
              </div>
              <button className="c-remove-btn" onClick={() => removeItem(item._id)} title="Remove">✕</button>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="c-cart-summary">
        <div className="c-summary-row"><span>Subtotal</span><span>Rs {totalPrice.toLocaleString()}</span></div>
        <div className="c-summary-row"><span>Service Fee</span><span style={{color:'var(--c-green)'}}>Free</span></div>
        <div className="c-summary-row total"><span>Total</span><span>Rs {totalPrice.toLocaleString()}</span></div>
      </div>

      {/* CTA */}
      <button className="c-checkout-btn" onClick={() => setShowCheckout(true)}>
        Proceed to Checkout →
      </button>

      {showCheckout && (
        <CheckoutModal
          restaurantId={restaurantId}
          tableNo={tableNo}
          items={items}
          totalPrice={totalPrice}
          onClose={() => setShowCheckout(false)}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}

export default function CartPage() {
  const { restaurantId } = useParams();
  const [searchParams] = useSearchParams();
  const tableNo = searchParams.get('table');
  return (
    <CartProvider restaurantId={restaurantId}>
      <CartContent restaurantId={restaurantId} tableNo={tableNo} />
    </CartProvider>
  );
}
