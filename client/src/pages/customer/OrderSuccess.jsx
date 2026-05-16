import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useCart } from '../../context/CartContext';

export default function OrderSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { clearCart } = useCart();
  
  const orderId = searchParams.get('order_id');
  const restaurantId = window.location.pathname.split('/')[2]; // Fallback if needed, but we should use a better route

  useEffect(() => {
    // Clear the cart as soon as the user arrives on the success page
    clearCart();

    // After a short delay, redirect to the actual Order Confirmed page
    const timer = setTimeout(() => {
      if (orderId) {
        // We find the restaurantId from the context or URL
        // For now, let's just redirect to the confirmed page
        // The URL in payment_service needs to be compatible with this
        navigate(`/order-confirmed-redirect?order_id=${orderId}`);
      } else {
        navigate('/');
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [orderId, clearCart, navigate]);

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
