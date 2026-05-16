import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../../context/CartContext';
import { customerApi } from '../../../api/customer.api';

const FOOD_EMOJI_MAP = { burger:'🍔',pizza:'🍕',pasta:'🍝',salad:'🥗',chicken:'🍗',rice:'🍚',soup:'🍜',sandwich:'🥪',dessert:'🍰',cake:'🎂',coffee:'☕',drink:'🥤',wrap:'🌯',steak:'🥩',curry:'🍛',biryani:'🍛' };
function getEmoji(name=''){const n=name.toLowerCase();for(const[k,v]of Object.entries(FOOD_EMOJI_MAP))if(n.includes(k))return v;return'🍽️';}

export default function CartSidebar({ isOpen, onClose, restaurantId, tableNo }) {
  const navigate = useNavigate();
  const { items, totalItems, totalPrice, updateQty, removeItem, clearCart } = useCart();
  const [showCheckout, setShowCheckout] = useState(false);
  const [loading, setLoading] = useState(false);

  // Quick checkout logic directly in sidebar to skip the modal
  const [orderType, setOrderType] = useState(tableNo ? 'Dine-In' : 'Takeaway');
  const [tableNum, setTableNum]   = useState(tableNo || '');
  const [address, setAddress]     = useState('');
  const [phone, setPhone]         = useState('');
  const [notes, setNotes]         = useState('');
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

      // 1. Place the order in the database (status will be Pending)
      const res = await customerApi.placeOrder(restaurantId, payload);
      const orderId = res.data?.data?._id || res.data?._id;

      // 2. If it's a paid order type, redirect to Stripe
      if (orderType === 'Takeaway' || orderType === 'Delivery') {
        const payRes = await customerApi.createCheckoutSession(restaurantId, { orderId });
        const { url } = payRes.data?.data || payRes.data;
        if (url) {
          window.location.href = url; // Redirect to Stripe
          return;
        }
      }

      // 3. For Dine-In (or if no payment URL), go to success page
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
                  <div className="mz-cart-item-price">Rs {(item.price * item.qty).toLocaleString()}</div>
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
            <div>
              <button onClick={() => setShowCheckout(false)} style={{background:'none',border:'none',cursor:'pointer',fontFamily:'Raleway',color:'var(--mz-sage)',marginBottom:20,fontWeight:700}}>← Back to Cart</button>
              
              {error && <div style={{background:'#fee2e2',color:'#ef4444',padding:12,borderRadius:8,marginBottom:16,fontFamily:'Raleway',fontSize:12,fontWeight:600}}>{error}</div>}

              <div style={{marginBottom:24}}>
                <div style={{fontFamily:'Raleway',fontSize:10,fontWeight:800,letterSpacing:'0.15em',textTransform:'uppercase',color:'var(--mz-sage)',marginBottom:12}}>How would you like this order?</div>
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
                  <div style={{fontFamily:'Raleway',fontSize:10,fontWeight:800,letterSpacing:'0.15em',textTransform:'uppercase',color:'var(--mz-sage)',marginBottom:8}}>Table Number *</div>
                  <input style={{width:'100%',padding:12,borderRadius:8,border:'1.5px solid rgba(0,0,0,0.1)',fontFamily:'Raleway',fontSize:14}} placeholder="e.g. 5" value={tableNum} onChange={e=>setTableNum(e.target.value)} />
                </div>
              )}

              {orderType === 'Delivery' && (
                <div style={{marginBottom:20}}>
                  <div style={{fontFamily:'Raleway',fontSize:10,fontWeight:800,letterSpacing:'0.15em',textTransform:'uppercase',color:'var(--mz-sage)',marginBottom:8}}>Delivery Address *</div>
                  <input style={{width:'100%',padding:12,borderRadius:8,border:'1.5px solid rgba(0,0,0,0.1)',fontFamily:'Raleway',fontSize:14}} placeholder="House/Flat, Street, City" value={address} onChange={e=>setAddress(e.target.value)} />
                </div>
              )}

              <div style={{marginBottom:20}}>
                <div style={{fontFamily:'Raleway',fontSize:10,fontWeight:800,letterSpacing:'0.15em',textTransform:'uppercase',color:'var(--mz-sage)',marginBottom:8}}>Phone Number (optional)</div>
                <input style={{width:'100%',padding:12,borderRadius:8,border:'1.5px solid rgba(0,0,0,0.1)',fontFamily:'Raleway',fontSize:14}} type="tel" placeholder="03xx-xxxxxxx" value={phone} onChange={e=>setPhone(e.target.value)} />
              </div>

              <div style={{marginBottom:20}}>
                <div style={{fontFamily:'Raleway',fontSize:10,fontWeight:800,letterSpacing:'0.15em',textTransform:'uppercase',color:'var(--mz-sage)',marginBottom:8}}>Special Instructions (optional)</div>
                <textarea style={{width:'100%',padding:12,borderRadius:8,border:'1.5px solid rgba(0,0,0,0.1)',fontFamily:'Raleway',fontSize:14,minHeight:80,resize:'vertical'}} placeholder="Allergies, preferences..." value={notes} onChange={e=>setNotes(e.target.value)} />
              </div>

            </div>
          )}
        </div>

        {totalItems > 0 && (
          <div className="mz-cart-footer">
            <div className="mz-cart-summary-row"><span>Subtotal</span><span>Rs {totalPrice.toLocaleString()}</span></div>
            <div className="mz-cart-summary-row"><span>Service Fee</span><span style={{color:'var(--mz-sage)'}}>Free</span></div>
            <div className="mz-cart-summary-total"><span>Total</span><span>Rs {totalPrice.toLocaleString()}</span></div>
            
            {!showCheckout ? (
              <button className="mz-cart-checkout-btn" onClick={() => setShowCheckout(true)}>Proceed to Checkout →</button>
            ) : (
              <button className="mz-cart-checkout-btn" onClick={handlePlace} disabled={loading}>
                {loading ? '⏳ Placing Order...' : `✅ Confirm Order · Rs ${totalPrice.toLocaleString()}`}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
