import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { API_BASE } from '../../lib/constants';

/**
 * /r/:slug  →  resolves slug to restaurantId  →  redirects to /menu/:restaurantId
 *
 * This lets restaurants share a clean URL like:
 *   http://localhost:5174/r/cheezious
 * instead of:
 *   http://localhost:5174/menu/683abc123...
 */
export default function RestaurantSlugPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState('');

  useEffect(() => {
    if (!slug) {
      setError('No restaurant slug provided.');
      return;
    }

    axios
      .get(`${API_BASE}/tenants/slug/${slug}`)
      .then(res => {
        const tenant = res.data?.data || res.data;
        if (!tenant?._id) throw new Error('Restaurant not found');

        // Preserve any query params (e.g. ?table=5)
        const qs = searchParams.toString();
        navigate(`/menu/${tenant._id}${qs ? `?${qs}` : ''}`, { replace: true });
      })
      .catch(err => {
        const msg = err.response?.data?.message || err.message || 'Restaurant not found.';
        setError(msg);
      });
  }, [slug, navigate, searchParams]);

  if (error) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          fontFamily: 'Nunito, sans-serif',
          background: 'var(--c-bg, #f9fafb)',
        }}
      >
        <div style={{ fontSize: 48 }}>🍽️</div>
        <h2 style={{ fontWeight: 800, fontSize: 22, margin: 0 }}>Restaurant Not Found</h2>
        <p style={{ color: '#6b7280', margin: 0 }}>{error}</p>
        <a href="/" style={{ marginTop: 8, color: '#FF6B35', fontWeight: 700, textDecoration: 'none' }}>
          ← Back to Home
        </a>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Nunito, sans-serif',
        gap: 12,
        flexDirection: 'column',
      }}
    >
      <div style={{ fontSize: 40 }}>🍽️</div>
      <p style={{ color: '#6b7280', fontWeight: 600 }}>Loading restaurant…</p>
    </div>
  );
}
