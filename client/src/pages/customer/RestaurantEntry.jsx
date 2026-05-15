import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { customerApi } from '../../api/customer.api';
import '../../styles/customer.css';

/**
 * /r/:slug  →  resolves slug to restaurantId  →  redirects to /menu/:restaurantId
 * 
 * This is the "simple URL" for customers:
 *   http://localhost:5174/r/cheezious
 *   http://localhost:5174/r/cheezious?table=5
 */
export default function RestaurantEntry() {
  const { slug }              = useParams();
  const [searchParams]        = useSearchParams();
  const navigate              = useNavigate();
  const [error, setError]     = useState('');

  useEffect(() => {
    if (!slug) return;
    customerApi.getRestaurantBySlug(slug)
      .then(res => {
        const restaurant = res.data?.data || res.data;
        const rid = restaurant?._id;
        if (!rid) throw new Error('Restaurant not found');
        // Preserve query params (e.g. ?table=5)
        const qs = searchParams.toString();
        navigate(`/menu/${rid}${qs ? `?${qs}` : ''}`, { replace: true });
      })
      .catch(() => {
        setError(`No restaurant found for "${slug}". Check the URL and try again.`);
      });
  }, [slug]);

  if (error) {
    return (
      <div className="customer-root" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: 16, padding: 32 }}>
        <div style={{ fontSize: 56 }}>🍽️</div>
        <h2 style={{ fontWeight: 900, color: 'var(--c-text)', margin: 0 }}>Restaurant Not Found</h2>
        <p style={{ color: 'var(--c-text-muted)', textAlign: 'center', maxWidth: 320 }}>{error}</p>
      </div>
    );
  }

  // Loading spinner while resolving
  return (
    <div className="customer-root" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: 20 }}>
      <div style={{ fontSize: 56, animation: 'pulse 1.2s ease-in-out infinite' }}>🍽️</div>
      <p style={{ color: 'var(--c-text-muted)', fontWeight: 700, fontSize: 16 }}>Loading restaurant…</p>
    </div>
  );
}
