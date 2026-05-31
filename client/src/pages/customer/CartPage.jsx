import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { CartProvider, useCart } from '../../context/CartContext';
import { customerApi } from '../../api/customer.api';
import { crmApi } from '../../api/crm.api';
import { useAuth } from '../../context/AuthContext';
import '../../styles/customer.css';
import { formatCurrency } from '../../lib/utils';

const FOOD_EMOJI_MAP = { burger:'🍔',pizza:'🍕',pasta:'🍝',salad:'🥗',chicken:'🍗',rice:'🍚',soup:'🍜',sandwich:'🥪',dessert:'🍰',cake:'🎂',coffee:'☕',drink:'🥤',wrap:'🌯',steak:'🥩',curry:'🍛',biryani:'🍛' };
function getEmoji(name=''){const n=name.toLowerCase();for(const[k,v]of Object.entries(FOOD_EMOJI_MAP))if(n.includes(k))return v;return'🍽️';}

// ─── Checkout Modal ───────────────────────────────────────────
function CheckoutModal({ restaurantId, tableNo, items, totalPrice, onClose, onSuccess }) {
  const { user } = useAuth();
  const [orderType, setOrderType] = useState(tableNo ? 'Dine-In' : 'Takeaway');
  const [tableNum, setTableNum]   = useState(tableNo || '');
  const [address, setAddress]     = useState('');
  const [phone, setPhone]         = useState(user?.phone || '');
  const [notes, setNotes]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponSuccessMsg, setCouponSuccessMsg] = useState('');

  // Loyalty states
  const [loyalty, setLoyalty] = useState(null);
  const [redeemPoints, setRedeemPoints] = useState(false);

  // Fetch customer loyalty on load if logged in
  useEffect(() => {
    const customerId = user?._id || user?.id;
    if (user && customerId) {
      crmApi.getLoyalty(restaurantId, customerId)
        .then(res => setLoyalty(res.data?.data || res.data || null))
        .catch(() => setLoyalty(null));
    }
  }, [user, restaurantId]);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setValidatingCoupon(true);
    setError('');
    setCouponSuccessMsg('');
    try {
      const res = await crmApi.validateCoupon(restaurantId, couponCode.trim());
      const coupon = res.data?.data || res.data;
      if (!coupon) throw new Error('Invalid coupon code');

      // Check minimum order amount
      if (coupon.minimumOrderAmount && totalPrice < coupon.minimumOrderAmount) {
        throw new Error(`Minimum order of ${formatCurrency(coupon.minimumOrderAmount)} required for this coupon.`);
      }

      setAppliedCoupon(coupon);
      setCouponSuccessMsg(`Coupon "${coupon.code}" applied!`);
    } catch (err) {
      setAppliedCoupon(null);
      setError(err.response?.data?.message || err.message || 'Invalid or expired coupon');
    } finally {
      setValidatingCoupon(false);
    }
  };

  // Calculations
  const deliveryFee = orderType === 'Delivery' ? 150 : 0;
  const isFreeDelivery = appliedCoupon?.discountType === 'FreeDelivery';
  const finalDeliveryFee = isFreeDelivery ? 0 : deliveryFee;

  let couponDiscount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.discountType === 'Percentage') {
      couponDiscount = Math.round(totalPrice * (appliedCoupon.discountValue / 100));
    } else if (appliedCoupon.discountType === 'FixedAmount') {
      couponDiscount = Math.min(totalPrice, appliedCoupon.discountValue);
    }
  }

  const userPoints = loyalty?.points || 0;
  const maxRedeemablePoints = Math.min(
    userPoints,
    Math.floor(Math.max(0, totalPrice - couponDiscount) * 10) // 10 points = 1 cash unit
  );
  const pointsDiscount = redeemPoints ? Math.round(maxRedeemablePoints / 10) : 0;
  const totalDiscount = couponDiscount + pointsDiscount;

  const finalPrice = Math.max(0, totalPrice + finalDeliveryFee - totalDiscount);

  const handlePlace = async () => {
    if (orderType === 'Dine-In' && !tableNum) return setError('Please enter your table number.');
    if (orderType === 'Delivery' && !address)  return setError('Please enter a delivery address.');
    if (!phone.trim()) return setError('Please enter your phone number.');
    setError('');
    setLoading(true);
    try {
      const payload = {
        orderType,
        items: items.map(i => ({ menuItemId: i._id.split('_')[0], quantity: i.qty, unitPrice: i.price, name: i.name, sizeName: i._id.split('_')[1] || '' })),
        totalAmount: finalPrice,
        ...(orderType === 'Dine-In'  && { tableId: tableNum }),
        ...(orderType === 'Delivery' && { deliveryAddress: { street: address } }),
        ...(phone && { customerPhone: phone }),
        ...(notes && { notes }),
        loyaltyPointsRedeemed: redeemPoints ? maxRedeemablePoints : 0,
        couponId: appliedCoupon?._id || undefined,
        financials: {
          subTotal: totalPrice,
          deliveryFee: finalDeliveryFee,
          discountAmount: totalDiscount,
          taxAmount: 0,
          totalAmount: finalPrice
        }
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
          {error && <div className="c-auth-error" style={{ marginBottom: 16 }}>{error}</div>}
          {couponSuccessMsg && <div style={{ color: '#16A34A', background: 'rgba(22,163,74,0.1)', padding: 10, borderRadius: 10, fontSize: 13, fontWeight: 700, marginBottom: 16 }}>✅ {couponSuccessMsg}</div>}

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
            <div className="c-field-label">Phone Number *</div>
            <input className="c-field-input" type="tel" placeholder="03xx-xxxxxxx" value={phone} onChange={e=>setPhone(e.target.value)} />
          </div>

          {/* Promo Code Coupon Engine */}
          <div style={{ marginTop: 12, background: 'rgba(0,0,0,0.02)', padding: 12, borderRadius: 12, border: '1px solid var(--c-border)' }}>
            <div className="c-field-label" style={{ marginTop: 0, marginBottom: 6 }}>🎟️ Have a Promo Code?</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input 
                className="c-field-input" 
                placeholder="e.g. SAVE20" 
                style={{ textTransform: 'uppercase', margin: 0 }} 
                value={couponCode}
                onChange={e => setCouponCode(e.target.value.toUpperCase())}
                disabled={!!appliedCoupon}
              />
              {appliedCoupon ? (
                <button 
                  className="btn btn-outline btn-sm" 
                  style={{ background: '#7f1d1d', color: '#fff', border: 'none', borderRadius: 8, padding: '0 16px', fontSize: 13, fontWeight: 700 }}
                  onClick={() => { setAppliedCoupon(null); setCouponSuccessMsg(''); setCouponCode(''); }}
                >
                  Clear
                </button>
              ) : (
                <button 
                  className="c-btn-primary" 
                  style={{ width: 'auto', margin: 0, padding: '0 20px', fontSize: 13 }}
                  onClick={handleApplyCoupon}
                  disabled={validatingCoupon || !couponCode.trim()}
                >
                  {validatingCoupon ? 'Apply...' : 'Apply'}
                </button>
              )}
            </div>
          </div>

          {/* Loyalty Point Redemption */}
          {user && userPoints > 0 && (
            <div style={{ marginTop: 12, background: 'rgba(249, 115, 22, 0.05)', padding: 12, borderRadius: 12, border: '1px dashed rgba(249, 115, 22, 0.3)' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={redeemPoints} 
                  onChange={e => setRedeemPoints(e.target.checked)} 
                  style={{ width: 18, height: 18, accentColor: 'var(--c-primary)' }}
                />
                <div style={{ fontSize: 13 }}>
                  <div style={{ fontWeight: 800, color: 'var(--c-primary-dark)' }}>🪙 Redeem Loyalty Points</div>
                  <div style={{ fontSize: 11, color: 'var(--c-text-muted)', marginTop: 2 }}>
                    You have <strong>{userPoints} points</strong>. Use <strong>{maxRedeemablePoints} points</strong> for <strong>{formatCurrency(Math.round(maxRedeemablePoints / 10))}</strong> flat discount?
                  </div>
                </div>
              </label>
            </div>
          )}

          {/* Notes */}
          <div>
            <div className="c-field-label">Special Instructions (optional)</div>
            <textarea className="c-field-input c-field-textarea" placeholder="Allergies, preferences..." value={notes} onChange={e=>setNotes(e.target.value)} />
          </div>

          {/* Summary Breakdown */}
          <div className="c-cart-summary" style={{margin:'16px 0 0 0'}}>
            <div className="c-summary-row"><span>Subtotal</span><span>{formatCurrency(totalPrice)}</span></div>
            {orderType === 'Delivery' && (
              <div className="c-summary-row">
                <span>Delivery Fee</span>
                {isFreeDelivery ? <span style={{color:'var(--c-green)'}}>FREE (waived)</span> : <span>{formatCurrency(deliveryFee)}</span>}
              </div>
            )}
            {couponDiscount > 0 && <div className="c-summary-row" style={{ color: '#16A34A', fontWeight: 700 }}><span>Coupon Discount</span><span>-{formatCurrency(couponDiscount)}</span></div>}
            {pointsDiscount > 0 && <div className="c-summary-row" style={{ color: '#16A34A', fontWeight: 700 }}><span>Points Discount</span><span>-{formatCurrency(pointsDiscount)}</span></div>}
            <div className="c-summary-row total"><span>Total</span><span>{formatCurrency(finalPrice)}</span></div>
          </div>
        </div>

        <div className="c-checkout-footer">
          <button className="c-checkout-btn" style={{width:'100%',margin:0}} onClick={handlePlace} disabled={loading}>
            {loading ? '⏳ Placing Order...' : `✅ Confirm Order · ${formatCurrency(finalPrice)}`}
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
              <div className="c-cart-item-price">{formatCurrency(item.price * item.qty)}</div>
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
        <div className="c-summary-row"><span>Subtotal</span><span>{formatCurrency(totalPrice)}</span></div>
        <div className="c-summary-row"><span>Service Fee</span><span style={{color:'var(--c-green)'}}>Free</span></div>
        <div className="c-summary-row total"><span>Total</span><span>{formatCurrency(totalPrice)}</span></div>
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
