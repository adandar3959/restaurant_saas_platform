import { BrowserRouter, Routes, Route, Navigate, useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { Component, useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

import LandingPage from './pages/public/LandingPage';
import PricingPage from './pages/public/PricingPage';
import OnboardingPage from './pages/public/OnboardingPage';
import LoginPage from './pages/public/LoginPage';
import SignupPage from './pages/public/SignupPage';
import ForgotPasswordPage from './pages/public/ForgotPasswordPage';
import SuspendedPage from './pages/public/SuspendedPage';
import UpgradeSuccess from './pages/public/UpgradeSuccess';

// Customer
import MenuPage from './pages/customer/MenuPage';
import CartPage from './pages/customer/CartPage';
import OrderConfirmedPage from './pages/customer/OrderConfirmedPage';
import OrderTrackingPage from './pages/customer/OrderTrackingPage';
import OrderSuccess from './pages/customer/OrderSuccess';
import CustomerLoginPage from './pages/customer/CustomerLoginPage';
import CustomerAccountPage from './pages/customer/CustomerAccountPage';
import RestaurantSlugPage from './pages/customer/RestaurantSlugPage';

import AdminLayout from './components/layout/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import Orders from './pages/admin/Orders';
import MenuManagement from './pages/admin/MenuManagement';
import Tables from './pages/admin/Tables';
import Staff from './pages/admin/Staff';
import Inventory from './pages/admin/Inventory';
import Delivery from './pages/admin/Delivery';
import CRM from './pages/admin/CRM';
import AdminSettings from './pages/admin/AdminSettings';

import KDS from './pages/kitchen/KDS';

import WaiterLayout from './pages/waiter/WaiterLayout';

import DriverDashboard from './pages/driver/DriverDashboard';
import SuperAdminDashboard from './pages/superadmin/SuperAdminDashboard';


class AdminErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(err) { return { error: err }; }
  componentDidCatch(err, info) { console.error('[AdminErrorBoundary]', err, info); }
  render() {
    if (this.state.error) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 32, background: 'var(--bg-base)' }}>
          <div style={{ fontSize: 40 }}>💥</div>
          <h2 style={{ color: 'var(--error)', fontWeight: 800 }}>Page Error</h2>
          <pre style={{ background: 'var(--bg-surface)', border: '1px solid var(--error)', borderRadius: 8, padding: 16, color: '#FCA5A5', fontSize: 13, maxWidth: 640, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
            {this.state.error?.message}\n\n{this.state.error?.stack?.split('\n').slice(0, 6).join('\n')}
          </pre>
          <button className="btn btn-outline btn-sm" onClick={() => this.setState({ error: null })}>
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function RequireAuth({ children, allowedRoles }) {
  const { user, isHydrated } = useAuth();
  if (!isHydrated) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="spinner" style={{ width: 40, height: 40, borderWidth: 3 }} />
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles) {
    const userRoleLower = (user.role || '').toLowerCase();
    const allowed = allowedRoles.map(r => r.toLowerCase());
    if (!allowed.includes(userRoleLower)) return <Navigate to="/" replace />;
  }
  return children;
}

function GuestOnly({ children }) {
  const { user, isHydrated, getDashboardRoute } = useAuth();
  if (!isHydrated) return null;
  if (user) return <Navigate to={getDashboardRoute(user.role, user.restaurantId)} replace />;
  return children;
}

import { API_BASE } from './lib/constants';

function AppRoutes() {
  const { user } = useAuth();
  const [isMaintenance, setIsMaintenance] = useState(false);
  const location = useLocation();

  useEffect(() => {
    fetch(`${API_BASE}/settings/public`)
      .then(r => r.json())
      .then(d => setIsMaintenance(d?.data?.maintenanceMode ?? false))
      .catch(() => {});
  }, []);

  // SuperAdmins always bypass the maintenance screen
  const isSuperAdmin = user?.role === 'SuperAdmin';
  
  // Only block tenant portals and checkout (marketing site remains up)
  const isMaintenancePath = 
    location.pathname.startsWith('/admin') ||
    location.pathname.startsWith('/kitchen') ||
    location.pathname.startsWith('/waiter') ||
    location.pathname.startsWith('/driver') ||
    location.pathname.startsWith('/menu') ||
    location.pathname.startsWith('/r/');

  if (isMaintenance && isMaintenancePath && !isSuperAdmin) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
        color: '#fff', textAlign: 'center', padding: 32, gap: 16,
      }}>
        <div style={{ fontSize: 64 }}>🔧</div>
        <h1 style={{ fontSize: 32, fontWeight: 900, margin: 0 }}>Under Maintenance</h1>
        <p style={{ fontSize: 16, color: '#94A3B8', maxWidth: 480, lineHeight: 1.6 }}>
          We're making some improvements to the platform. All services will be back shortly.
          Thank you for your patience.
        </p>
        <div style={{
          marginTop: 8, padding: '10px 20px',
          borderRadius: 99, background: 'rgba(99,102,241,0.15)',
          border: '1px solid rgba(99,102,241,0.3)',
          fontSize: 13, color: '#A5B4FC',
        }}>
          🔒 Platform temporarily unavailable
        </div>
      </div>
    );
  }
  return (
    <Routes>
      {/* Public pages */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/pricing" element={<PricingPage />} />
      <Route path="/onboarding" element={<OnboardingPage />} />

      {/* Customer — slug entry point (simple URL) */}
      <Route path="/r/:slug" element={<RestaurantSlugPage />} />

      {/* Customer — public menu + ordering (no auth needed) */}
      <Route path="/menu/:restaurantId" element={<MenuPage />} />
      <Route path="/menu/:restaurantId/cart" element={<CartPage />} />
      <Route path="/menu/:restaurantId/order-confirmed/:orderId" element={<OrderConfirmedPage />} />
      <Route path="/menu/:restaurantId/track/:orderId" element={<OrderTrackingPage />} />
      <Route path="/order-success" element={<OrderSuccess />} />
      <Route path="/order-confirmed-redirect" element={<OrderConfirmedRedirect />} />
      <Route path="/upgrade-success" element={<UpgradeSuccess />} />


      {/* Customer auth & account */}
      <Route path="/customer/login" element={<CustomerLoginPage />} />
      <Route path="/account" element={<CustomerAccountPage />} />

      {/* Staff Auth */}
      <Route path="/login" element={<GuestOnly><LoginPage /></GuestOnly>} />
      <Route path="/signup" element={<GuestOnly><SignupPage /></GuestOnly>} />
      <Route path="/forgot-password" element={<GuestOnly><ForgotPasswordPage /></GuestOnly>} />
      <Route path="/suspended" element={<SuspendedPage />} />

      {/* Admin Protected */}
      <Route
        path="/admin/:restaurantId"
        element={<RequireAuth allowedRoles={['Admin', 'Manager']}><AdminLayout /></RequireAuth>}
      >
        <Route index element={<AdminErrorBoundary><AdminDashboard /></AdminErrorBoundary>} />
        <Route path="orders" element={<AdminErrorBoundary><Orders /></AdminErrorBoundary>} />
        <Route path="menu" element={<AdminErrorBoundary><MenuManagement /></AdminErrorBoundary>} />
        <Route path="tables" element={<AdminErrorBoundary><Tables /></AdminErrorBoundary>} />
        <Route path="staff" element={<AdminErrorBoundary><Staff /></AdminErrorBoundary>} />
        <Route path="inventory" element={<AdminErrorBoundary><Inventory /></AdminErrorBoundary>} />
        <Route path="delivery" element={<AdminErrorBoundary><Delivery /></AdminErrorBoundary>} />
        <Route path="crm" element={<AdminErrorBoundary><CRM /></AdminErrorBoundary>} />
        <Route path="settings" element={<AdminErrorBoundary><AdminSettings /></AdminErrorBoundary>} />
      </Route>

      {/* Kitchen Protected */}
      <Route path="/kitchen/:restaurantId" element={<RequireAuth allowedRoles={['Chef']}><AdminErrorBoundary><KDS /></AdminErrorBoundary></RequireAuth>} />

      {/* Other Roles */}
      <Route path="/superadmin" element={<RequireAuth allowedRoles={['SuperAdmin']}><AdminErrorBoundary><SuperAdminDashboard /></AdminErrorBoundary></RequireAuth>} />
      <Route path="/waiter/:restaurantId" element={<RequireAuth allowedRoles={['Waiter']}><WaiterLayout /></RequireAuth>} />
      <Route path="/driver/:restaurantId" element={<RequireAuth allowedRoles={['Driver']}><DriverDashboard /></RequireAuth>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function PlaceholderDash({ role }) {
  const { user, logout } = useAuth();
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24 }}>
      <div style={{ fontSize: 48 }}>🚀</div>
      <h1 style={{ fontSize: 28, fontWeight: 800 }}>{role}</h1>
      <p style={{ color: 'var(--text-muted)' }}>Welcome, {user?.name}! Coming soon.</p>
      <button className="btn btn-outline btn-sm" onClick={logout}>Logout</button>
    </div>
  );
}

function OrderConfirmedRedirect() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const orderId = searchParams.get('order_id');

  useEffect(() => {
    async function findOrder() {
      if (orderId) {
        try {
          // We need to find the restaurantId to redirect to the correct themed confirmation page
          const res = await fetch(`http://localhost:5000/api/v1/restaurants/any/orders/public/find/${orderId}`);
          const data = await res.json();
          if (data.success && data.data.restaurantId) {
            navigate(`/menu/${data.data.restaurantId}/order-confirmed/${orderId}`);
          } else {
            navigate('/');
          }
        } catch (e) {
          navigate('/');
        }
      }
    }
    findOrder();
  }, [orderId, navigate]);

  return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1B4332' }}><div className="spinner"></div></div>;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <AppRoutes />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
