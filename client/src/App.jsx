import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// ── Public pages (still in pages/ root, working fine)
import LandingPage        from './pages/LandingPage';
import PricingPage        from './pages/PricingPage';
import OnboardingPage     from './pages/OnboardingPage';
import LoginPage          from './pages/LoginPage';
import SignupPage         from './pages/SignupPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';

// ── Admin layout + pages
import AdminLayout     from './components/layout/AdminLayout';
import AdminDashboard  from './pages/admin/AdminDashboard';
import Orders          from './pages/admin/Orders';
import MenuManagement  from './pages/admin/MenuManagement';
import Tables          from './pages/admin/Tables';
import Staff           from './pages/admin/Staff';
import Inventory       from './pages/admin/Inventory';
import Delivery        from './pages/admin/Delivery';
import CRM             from './pages/admin/CRM';
import AdminSettings   from './pages/admin/AdminSettings';

// ─── Route guards ───────────────────────────────────────────────────────────
function RequireAuth({ children, allowedRoles }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

function GuestOnly({ children }) {
  const { user, getDashboardRoute } = useAuth();
  if (user) return <Navigate to={getDashboardRoute(user.role, user.restaurantId)} replace />;
  return children;
}

// ─── App routes ─────────────────────────────────────────────────────────────
function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/"             element={<LandingPage />} />
      <Route path="/pricing"      element={<PricingPage />} />
      <Route path="/onboarding"   element={<OnboardingPage />} />

      {/* Auth */}
      <Route path="/login"           element={<GuestOnly><LoginPage /></GuestOnly>} />
      <Route path="/signup"          element={<GuestOnly><SignupPage /></GuestOnly>} />
      <Route path="/forgot-password" element={<GuestOnly><ForgotPasswordPage /></GuestOnly>} />

      {/* ── Admin Dashboard (Phase 3) ───────────────────────────── */}
      <Route
        path="/admin/:restaurantId"
        element={<RequireAuth allowedRoles={['Admin','Manager']}><AdminLayout /></RequireAuth>}
      >
        <Route index            element={<AdminDashboard />} />
        <Route path="orders"    element={<Orders />} />
        <Route path="menu"      element={<MenuManagement />} />
        <Route path="tables"    element={<Tables />} />
        <Route path="staff"     element={<Staff />} />
        <Route path="inventory" element={<Inventory />} />
        <Route path="delivery"  element={<Delivery />} />
        <Route path="crm"       element={<CRM />} />
        <Route path="settings"  element={<AdminSettings />} />
      </Route>

      {/* Placeholder: other roles (future phases) */}
      <Route path="/superadmin/*" element={<RequireAuth allowedRoles={['SuperAdmin']}><PlaceholderDash role="SuperAdmin Dashboard" /></RequireAuth>} />
      <Route path="/kitchen/*"    element={<RequireAuth allowedRoles={['Chef']}><PlaceholderDash role="Kitchen Display" /></RequireAuth>} />
      <Route path="/waiter/*"     element={<RequireAuth allowedRoles={['Waiter']}><PlaceholderDash role="Waiter View" /></RequireAuth>} />
      <Route path="/driver/*"     element={<RequireAuth allowedRoles={['Driver']}><PlaceholderDash role="Driver View" /></RequireAuth>} />
      <Route path="/account/*"    element={<RequireAuth allowedRoles={['Customer']}><PlaceholderDash role="Customer Account" /></RequireAuth>} />

      {/* 404 */}
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

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
