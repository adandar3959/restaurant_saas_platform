import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { API_BASE } from '../../lib/constants';

export default function OrderSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { clearCart } = useCart();
  
  const orderId = searchParams.get('order_id');

  useEffect(() => {
    // Clear the cart as soon as the user arrives on the success page
    clearCart();

    const sessionId = searchParams.get('session_id');
    const rId = searchParams.get('restaurant_id');

    async function verifyPaymentAndRedirect() {
      if (sessionId && rId) {
        try {
          await fetch(`${API_BASE}/restaurants/${rId}/payment/verify-order?session_id=${sessionId}`);
        } catch (e) {
          console.error('Error verifying Stripe order payment:', e);
        }
      }
      
      // Redirect to the correct themed confirmation page directly
      if (orderId && rId) {
        navigate(`/menu/${rId}/order-confirmed/${orderId}`);
      } else if (orderId) {
        navigate(`/order-confirmed-redirect?order_id=${orderId}`);
      } else {
        navigate('/');
      }
    }

    const timer = setTimeout(() => {
      verifyPaymentAndRedirect();
    }, 2000);

    return () => clearTimeout(timer);
  }, [orderId, clearCart, navigate, searchParams]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#1B4332',
      color: '#fff',
      fontFamily: 'Raleway, sans-serif'
    }}>
      <div style={{ fontSize: '64px', marginBottom: '24px' }}>🎊</div>
      <h1 style={{ fontSize: '32px', fontWeight: 800, marginBottom: '8px' }}>Payment Successful!</h1>
      <p style={{ opacity: 0.8 }}>We're finalizing your order details...</p>
      <div style={{ marginTop: '32px' }} className="spinner"></div>
    </div>
  );
}
