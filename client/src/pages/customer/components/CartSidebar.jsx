import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useCart } from '../../../context/CartContext';
import { customerApi } from '../../../api/customer.api';
import { crmApi } from '../../../api/crm.api';
import { useAuth } from '../../../context/AuthContext';
import { formatCurrency } from '../../../lib/utils';

const FOOD_EMOJI_MAP = { burger:'🍔',pizza:'🍕',pasta:'🍝',salad:'🥗',chicken:'🍗',rice:'🍚',soup:'🍜',sandwich:'🥪',dessert:'🍰',cake:'🎂',coffee:'☕',drink:'🥤',wrap:'🌯',steak:'🥩',curry:'🍛',biryani:'🍛' };
function getEmoji(name=''){const n=name.toLowerCase();for(const[k,v]of Object.entries(FOOD_EMOJI_MAP))if(n.includes(k))return v;return'🍽️';}

export default function CartSidebar({ isOpen, onClose, restaurantId, tableNo }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { items, totalItems, totalPrice, updateQty, removeItem, clearCart } = useCart();
  const [showCheckout, setShowCheckout] = useState(searchParams.get('checkout') === 'true');
  const [loading, setLoading] = useState(false);
  const [tables, setTables] = useState([]);
  const [fetchingTables, setFetchingTables] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('Online');

  // Checkout states
  const [orderType, setOrderType] = useState(tableNo ? 'Dine-In' : 'Takeaway');
  const [tableNum, setTableNum]   = useState(tableNo || '');
  const [address, setAddress]     = useState('');
  const [phone, setPhone]         = useState(user?.phone || '');
  const [notes, setNotes]         = useState('');
  const [error, setError]         = useState('');

  // CRM & Loyalty States
  const [couponCode, setCouponCode] = useState('');
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponSuccessMsg, setCouponSuccessMsg] = useState('');

  const [loyalty, setLoyalty] = useState(null);
  const [redeemPoints, setRedeemPoints] = useState(false);

  // Fetch Tables
  useEffect(() => {
    const fetchTables = async () => {
      if (!restaurantId) return;
      setFetchingTables(true);
      try {
        const res = await customerApi.getTables(restaurantId);
        const all = res.data?.data || [];
        const activeTables = all.filter(t => t.isActive);
        setTables(activeTables);
        
        if (tableNo) {
          const matched = activeTables.find(t => t._id === tableNo || t.tableNumber === tableNo);
          if (matched && matched.status === 'Occupied') {
            setTableNum('');
          }
        }
      } catch (err) {
        console.error('Failed to load tables', err);
      } finally {
        setFetchingTables(false);
      }
    };
    fetchTables();
  }, [restaurantId]);

  // Fetch Loyalty points if logged in
  useEffect(() => {
    const customerId = user?._id || user?.id;
    if (user && customerId) {
      crmApi.getLoyalty(restaurantId, customerId)
        .then(res => setLoyalty(res.data?.data || res.data || null))
        .catch(() => setLoyalty(null));
    }
  }, [user, restaurantId]);

  // Validate coupon
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setValidatingCoupon(true);
    setError('');
    setCouponSuccessMsg('');
    try {
      const res = await crmApi.validateCoupon(restaurantId, couponCode.trim());
      const coupon = res.data?.data || res.data;
      if (!coupon) throw new Error('Invalid coupon code');

      // Check min order
      if (coupon.minimumOrderAmount && totalPrice < coupon.minimumOrderAmount) {
        throw new Error(`Minimum order of ${formatCurrency(coupon.minimumOrderAmount)} required.`);
      }

      setAppliedCoupon(coupon);
      setCouponSuccessMsg(`Promo code "${coupon.code}" active!`);
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
    Math.floor(Math.max(0, totalPrice - couponDiscount) * 10)
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
      const needsPayment = 
        orderType === 'Takeaway' || 
        (orderType === 'Delivery' && paymentMethod === 'Online') || 
        (orderType === 'Dine-In' && paymentMethod === 'Online');

      const payload = {
        orderType,
        items: items.map(i => ({ menuItemId: i._id.split('_')[0], quantity: i.qty, unitPrice: i.price, name: i.name, sizeName: i._id.split('_')[1] || '' })),
        totalAmount: finalPrice,
        ...(orderType === 'Dine-In' && tableNum && { tableId: tableNum }),
        ...(orderType === 'Dine-In' && tableNum && { tableNumber: tables.find(t => t._id === tableNum)?.tableNumber }),
        ...(orderType === 'Delivery' && { deliveryAddress: { street: address } }),
        ...(phone && { customerPhone: phone }),
        ...(notes && { notes }),
        loyaltyPointsRedeemed: redeemPoints ? maxRedeemablePoints : 0,
        couponId: appliedCoupon?._id || undefined,
        couponCode: appliedCoupon?.code || undefined,
        payment: {
          method: needsPayment ? 'Stripe' : 'Cash',
          status: 'Unpaid'
        },
        financials: {
          subTotal: totalPrice,
          deliveryFee: finalDeliveryFee,
          discountAmount: totalDiscount,
          taxAmount: 0,
          totalAmount: finalPrice
        }
      };

      // 1. Place the order
      const res = await customerApi.placeOrder(restaurantId, payload);
      const orderId = res.data?.data?._id || res.data?._id;

      // 2. Stripe Checkout session if Online Card payment
      if (needsPayment) {
        const payRes = await customerApi.createCheckoutSession(restaurantId, { 
          orderId,
          cancelUrl: window.location.origin + window.location.pathname + '?cart=open&checkout=true'
        });
        const { url } = payRes.data?.data || payRes.data;
        if (url) {
          window.location.href = url; // Redirect to Stripe checkout page (already has the applied discount!)
          return;
        }
      }

      // 3. COD / Dine-In success
      clearCart();
      navigate(`/menu/${restaurantId}/order-confirmed/${orderId}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`mz-cart-sidebar-overlay ${isOpen ? 'open' : ''}`} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="mz-cart-sidebar">
        <div className="mz-cart-header">
          <div className="mz-cart-title">Your Cart</div>
          <button className="mz-cart-close" onClick={onClose}>✕</button>
        </div>

        <div className="mz-cart-body">
          {totalItems === 0 ? (
            <div className="mz-cart-empty">
              <div className="mz-cart-empty-icon">🛒</div>
              <div>Your cart is empty</div>
            </div>
          ) : !showCheckout ? (
            // Cart Items View
            items.map(item => (
              <div key={item._id} className="mz-cart-item">
                <div className="mz-cart-item-emoji">{getEmoji(item.name)}</div>
                <div className="mz-cart-item-info">
                  <div className="mz-cart-item-name">{item.name}</div>
                  <div className="mz-cart-item-price">{formatCurrency(item.price * item.qty)}</div>
                </div>
                <div className="mz-cart-item-controls">
                  <button className="mz-cart-qty-btn" onClick={() => updateQty(item._id, item.qty - 1)} disabled={item.qty <= 1}>−</button>
                  <span className="mz-cart-qty-val">{item.qty}</span>
                  <button className="mz-cart-qty-btn" onClick={() => updateQty(item._id, item.qty + 1)}>+</button>
                  <button className="mz-cart-remove" onClick={() => removeItem(item._id)}>✕</button>
                </div>
              </div>
            ))
          ) : (
            // Checkout View
            <div style={{ paddingBottom: 40 }}>
              <button onClick={() => setShowCheckout(false)} style={{background:'none',border:'none',cursor:'pointer',fontFamily:'Raleway',color:'var(--mz-sage)',marginBottom:20,fontWeight:700,display:'flex',alignItems:'center',gap:4}}>← Back to Cart</button>
              
              {error && <div style={{background:'#fee2e2',color:'#ef4444',padding:12,borderRadius:8,marginBottom:16,fontFamily:'Raleway',fontSize:12,fontWeight:600}}>{error}</div>}
              {couponSuccessMsg && <div style={{background:'rgba(22,163,74,0.1)',color:'#16a34a',padding:12,borderRadius:8,marginBottom:16,fontFamily:'Raleway',fontSize:12,fontWeight:700}}>✅ {couponSuccessMsg}</div>}

              <div style={{marginBottom:20}}>
                <div style={{fontFamily:'Raleway',fontSize:10,fontWeight:800,letterSpacing:'0.15em',textTransform:'uppercase',color:'var(--mz-sage)',marginBottom:10}}>How would you like this order?</div>
                <div style={{display:'flex',gap:8}}>
                  {[{t:'Dine-In',e:'🍽️'},{t:'Takeaway',e:'🛍️'},{t:'Delivery',e:'🛵'}].map(({t,e}) => (
                    <button key={t} onClick={() => setOrderType(t)} style={{flex:1,padding:'12px 8px',borderRadius:8,border:`1.5px solid ${orderType===t?'var(--mz-dark)':'rgba(0,0,0,0.1)'}`,background:orderType===t?'var(--mz-dark)':'transparent',color:orderType===t?'#fff':'var(--mz-dark)',cursor:'pointer',transition:'all 0.2s',display:'flex',flexDirection:'column',alignItems:'center',gap:4}}>
                      <span style={{fontSize:20}}>{e}</span>
                      <span style={{fontFamily:'Raleway',fontSize:11,fontWeight:700}}>{t}</span>
                    </button>
                  ))}
                </div>
              </div>

              {orderType === 'Dine-In' && (
                <div style={{marginBottom:20}}>
                  <div style={{fontFamily:'Raleway',fontSize:10,fontWeight:800,letterSpacing:'0.15em',textTransform:'uppercase',color:'var(--mz-sage)',marginBottom:8}}>Select Table *</div>
                  <select 
                    style={{width:'100%',padding:12,borderRadius:8,border:'1.5px solid rgba(0,0,0,0.1)',fontFamily:'Raleway',fontSize:14,background:'#fff'}} 
                    value={tableNum} 
                    onChange={e=>setTableNum(e.target.value)}
                  >
                    <option value="">-- Choose a table --</option>
                    {tables.map(t => {
                      const isOccupied = t.status === 'Occupied';
                      return (
                        <option 
                          key={t._id} 
                          value={t._id} 
                          disabled={isOccupied}
                          style={{ color: isOccupied ? '#94a3b8' : 'inherit' }}
                        >
                          Table {t.tableNumber} ({t.capacity} Seats) {isOccupied ? '- Occupied' : ''}
                        </option>
                      );
                    })}
                  </select>
                  {fetchingTables && <div style={{fontSize:10,color:'var(--mz-sage)',marginTop:4}}>Loading tables...</div>}
                </div>
              )}

              {orderType === 'Delivery' && (
                <div style={{marginBottom:20}}>
                  <div style={{fontFamily:'Raleway',fontSize:10,fontWeight:800,letterSpacing:'0.15em',textTransform:'uppercase',color:'var(--mz-sage)',marginBottom:8}}>Delivery Address *</div>
                  <input style={{width:'100%',padding:12,borderRadius:8,border:'1.5px solid rgba(0,0,0,0.1)',fontFamily:'Raleway',fontSize:14}} placeholder="House/Flat, Street, City" value={address} onChange={e=>setAddress(e.target.value)} />
                </div>
              )}

              {(orderType === 'Dine-In' || orderType === 'Delivery') && (
                <div style={{marginBottom:20}}>
                  <div style={{fontFamily:'Raleway',fontSize:10,fontWeight:800,letterSpacing:'0.15em',textTransform:'uppercase',color:'var(--mz-sage)',marginBottom:12}}>Payment Method</div>
                  <div style={{display:'flex',gap:8}}>
                    {[
                      {
                        id: 'Cash',
                        n: orderType === 'Delivery' ? 'Cash on Delivery' : 'Cash at Counter',
                        e: '💵'
                      },
                      {
                        id: 'Online',
                        n: 'Online Card',
                        e: '💳'
                      }
                    ].map(pm => (
                      <button key={pm.id} onClick={() => setPaymentMethod(pm.id)} style={{flex:1,padding:'10px',borderRadius:8,border:`1.5px solid ${paymentMethod===pm.id?'var(--mz-dark)':'rgba(0,0,0,0.1)'}`,background:paymentMethod===pm.id?'var(--mz-dark)':'transparent',color:paymentMethod===pm.id?'#fff':'var(--mz-dark)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:6}}>
                        <span style={{fontSize:16}}>{pm.e}</span>
                        <span style={{fontFamily:'Raleway',fontSize:11,fontWeight:700}}>{pm.n}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div style={{marginBottom:20}}>
                <div style={{fontFamily:'Raleway',fontSize:10,fontWeight:800,letterSpacing:'0.15em',textTransform:'uppercase',color:'var(--mz-sage)',marginBottom:8}}>Phone Number *</div>
                <input style={{width:'100%',padding:12,borderRadius:8,border:'1.5px solid rgba(0,0,0,0.1)',fontFamily:'Raleway',fontSize:14}} type="tel" placeholder="03xx-xxxxxxx" value={phone} onChange={e=>setPhone(e.target.value)} />
              </div>

              {/* Promo Code Input */}
              <div style={{marginBottom:20, background: 'rgba(0,0,0,0.02)', padding: 12, borderRadius: 8, border: '1px solid rgba(0,0,0,0.05)'}}>
                <div style={{fontFamily:'Raleway',fontSize:10,fontWeight:800,letterSpacing:'0.15em',textTransform:'uppercase',color:'var(--mz-sage)',marginBottom:8}}>🎟️ Promo Code</div>
                <div style={{display:'flex', gap: 8}}>
                  <input 
                    style={{flex: 1, padding: 10, borderRadius: 8, border: '1.5px solid rgba(0,0,0,0.1)', fontFamily: 'Raleway', fontSize: 13, textTransform: 'uppercase'}} 
                    placeholder="e.g. ZALMI" 
                    value={couponCode} 
                    onChange={e => setCouponCode(e.target.value.toUpperCase())}
                    disabled={!!appliedCoupon}
                  />
                  {appliedCoupon ? (
                    <button 
                      onClick={() => { setAppliedCoupon(null); setCouponSuccessMsg(''); setCouponCode(''); }} 
                      style={{padding: '0 12px', background: '#7f1d1d', color: '#fff', border: 'none', borderRadius: 8, fontFamily: 'Raleway', fontSize: 12, fontWeight: 700, cursor: 'pointer'}}
                    >
                      Clear
                    </button>
                  ) : (
                    <button 
                      onClick={handleApplyCoupon} 
                      disabled={validatingCoupon || !couponCode.trim()} 
                      style={{padding: '0 16px', background: 'var(--mz-dark)', color: '#fff', border: 'none', borderRadius: 8, fontFamily: 'Raleway', fontSize: 12, fontWeight: 700, cursor: 'pointer'}}
                    >
                      {validatingCoupon ? 'Apply...' : 'Apply'}
                    </button>
                  )}
                </div>
              </div>

              {/* Loyalty points redemption check */}
              {user && userPoints > 0 && (
                <div style={{marginBottom:20, background: 'rgba(249, 115, 22, 0.05)', padding: 12, borderRadius: 8, border: '1px dashed rgba(249, 115, 22, 0.25)', display: 'flex', gap: 10, alignItems: 'flex-start'}}>
                  <input 
                    type="checkbox" 
                    checked={redeemPoints} 
                    onChange={e => setRedeemPoints(e.target.checked)} 
                    style={{width: 16, height: 16, marginTop: 2, accentColor: 'var(--c-primary)'}}
                  />
                  <div>
                    <div style={{fontFamily: 'Raleway', fontSize: 12, fontWeight: 800, color: 'var(--c-primary-dark)'}}>🪙 Redeem Points</div>
                    <div style={{fontFamily: 'Raleway', fontSize: 11, color: '#555', marginTop: 2, lineHeight: 1.4}}>
                      You have <strong>{userPoints} points</strong>. Apply <strong>{maxRedeemablePoints} points</strong> for <strong>{formatCurrency(Math.round(maxRedeemablePoints / 10))}</strong> flat discount?
                    </div>
                  </div>
                </div>
              )}

              <div style={{marginBottom:20}}>
                <div style={{fontFamily:'Raleway',fontSize:10,fontWeight:800,letterSpacing:'0.15em',textTransform:'uppercase',color:'var(--mz-sage)',marginBottom:8}}>Special Instructions (optional)</div>
                <textarea style={{width:'100%',padding:12,borderRadius:8,border:'1.5px solid rgba(0,0,0,0.1)',fontFamily:'Raleway',fontSize:14,minHeight:80,resize:'vertical'}} placeholder="Allergies, preferences..." value={notes} onChange={e=>setNotes(e.target.value)} />
              </div>

            </div>
          )}
        </div>

        {totalItems > 0 && (
          <div className="mz-cart-footer">
            <div className="mz-cart-summary-row"><span>Subtotal</span><span>{formatCurrency(totalPrice)}</span></div>
            {showCheckout && orderType === 'Delivery' && (
              <div className="mz-cart-summary-row">
                <span>Delivery Fee</span>
                {isFreeDelivery ? <span style={{color:'#16a34a',fontWeight:700}}>FREE</span> : <span>{formatCurrency(deliveryFee)}</span>}
              </div>
            )}
            {showCheckout && couponDiscount > 0 && (
              <div className="mz-cart-summary-row" style={{color:'#16a34a', fontWeight:700}}>
                <span>Promo Discount</span>
                <span>-{formatCurrency(couponDiscount)}</span>
              </div>
            )}
            {showCheckout && pointsDiscount > 0 && (
              <div className="mz-cart-summary-row" style={{color:'#16a34a', fontWeight:700}}>
                <span>Points Discount</span>
                <span>-{formatCurrency(pointsDiscount)}</span>
              </div>
            )}
            <div className="mz-cart-summary-total"><span>Total</span><span>{formatCurrency(showCheckout ? finalPrice : totalPrice)}</span></div>
            
            {!showCheckout ? (
              <button className="mz-cart-checkout-btn" onClick={() => setShowCheckout(true)}>Proceed to Checkout →</button>
            ) : (
              <button className="mz-cart-checkout-btn" onClick={handlePlace} disabled={loading}>
                {loading ? '⏳ Placing Order...' : `✅ Confirm Order · ${formatCurrency(finalPrice)}`}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
