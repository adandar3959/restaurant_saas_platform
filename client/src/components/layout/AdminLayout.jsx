import { useState, useEffect } from 'react';
import { NavLink, Outlet, useParams, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, ShoppingBag, UtensilsCrossed, Armchair, Users,
  Package, Truck, Heart, Settings, ChevronLeft, ChevronRight,
  Bell, LogOut, User, Menu, X, ChevronDown, Store
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { tenantApi } from '../../api/tenant.api';
import { getInitials } from '../../lib/utils';
import './AdminLayout.css';

const NAV_ITEMS = [
  { label: 'Dashboard',  icon: LayoutDashboard, path: '',         roles: null },
  { label: 'Orders',     icon: ShoppingBag,     path: 'orders',   roles: null },
  { label: 'Menu',       icon: UtensilsCrossed, path: 'menu',     roles: null },
  { label: 'Tables',     icon: Armchair,        path: 'tables',   roles: null },
  { label: 'Staff',      icon: Users,           path: 'staff',    roles: null },
  { label: 'Inventory',  icon: Package,         path: 'inventory',roles: null },
  { label: 'Delivery',   icon: Truck,           path: 'delivery', roles: null },
  { label: 'CRM',        icon: Heart,           path: 'crm',      roles: null },
  // Settings: Admin only — Managers handle day-to-day ops but not restaurant config
  { label: 'Settings',   icon: Settings,        path: 'settings', roles: ['admin'] },
];

export default function AdminLayout() {
  const { restaurantId } = useParams();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [collapsed,  setCollapsed]  = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [restaurant, setRestaurant] = useState(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // Fetch restaurant info
  useEffect(() => {
    if (!restaurantId) return;
    tenantApi.getRestaurant(restaurantId)
      .then(r => setRestaurant(r.data?.data))
      .catch(() => {});
  }, [restaurantId]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const basePath = `/admin/${restaurantId}`;
  const isAdmin  = (user?.role || '').toLowerCase() === 'admin';

  // Filter nav items by role
  const visibleNav = NAV_ITEMS.filter(item =>
    !item.roles || item.roles.includes((user?.role || '').toLowerCase())
  );

  const SidebarContent = () => (
    <>
      {/* Logo / Brand */}
      <div className="sidebar-brand">
        <div className="sidebar-logo">
          <Store size={20} />
        </div>
        {!collapsed && (
          <div className="sidebar-brand-text">
            <span className="sidebar-restaurant-name">
              {restaurant?.restaurantName || 'My Restaurant'}
            </span>
            <span className="sidebar-plan-badge">
              {restaurant?.subscription?.planType || 'Free'}
            </span>
          </div>
        )}
      </div>

      {/* Role badge */}
      {!collapsed && (
        <div style={{ padding: '0 16px 8px', marginTop: -4 }}>
          <span style={{
            fontSize: 11, fontWeight: 700, letterSpacing: '0.05em',
            padding: '3px 8px', borderRadius: 20, display: 'inline-block',
            background: isAdmin ? 'rgba(255,107,53,0.15)' : 'rgba(99,102,241,0.15)',
            color: isAdmin ? 'var(--primary)' : '#818CF8',
          }}>
            {user?.role?.toUpperCase()}
          </span>
        </div>
      )}

      {/* Nav items */}
      <nav className="sidebar-nav">
        {visibleNav.map(item => {
          const Icon = item.icon;
          const to = item.path ? `${basePath}/${item.path}` : basePath;
          return (
            <NavLink
              key={item.label}
              to={to}
              end={item.path === ''}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'sidebar-link-active' : ''} ${collapsed ? 'sidebar-link-collapsed' : ''}`
              }
              title={collapsed ? item.label : undefined}
              onClick={() => setMobileOpen(false)}
            >
              <Icon size={20} className="sidebar-link-icon" />
              {!collapsed && <span className="sidebar-link-label">{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom: user info */}
      <div className="sidebar-footer">
        <div className="sidebar-user" onClick={() => setUserMenuOpen(v => !v)}>
          <div className="sidebar-avatar">{getInitials(user?.name || 'A')}</div>
          {!collapsed && (
            <>
              <div className="sidebar-user-info">
                <span className="sidebar-user-name">{user?.name}</span>
                <span className="sidebar-user-role">{user?.role}</span>
              </div>
              <ChevronDown size={14} className="sidebar-user-chevron" />
            </>
          )}
        </div>

        {userMenuOpen && (
          <div className="sidebar-user-menu">
            {isAdmin && (
              <button className="sidebar-user-menu-item" onClick={() => navigate(`${basePath}/settings`)}>
                <Settings size={14} /> Settings
              </button>
            )}
            <button className="sidebar-user-menu-item danger" onClick={handleLogout}>
              <LogOut size={14} /> Logout
            </button>
          </div>
        )}
      </div>
    </>
  );


  return (
    <div className="admin-layout">
      {/* ── Desktop Sidebar ──────────────────────────────────────── */}
      <aside className={`admin-sidebar ${collapsed ? 'sidebar-collapsed' : ''}`}>
        <SidebarContent />

        {/* Collapse toggle */}
        <button
          className="sidebar-collapse-btn"
          onClick={() => setCollapsed(v => !v)}
          aria-label="Toggle sidebar"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </aside>

      {/* ── Mobile overlay ───────────────────────────────────────── */}
      {mobileOpen && (
        <div className="mobile-sidebar-overlay" onClick={() => setMobileOpen(false)}>
          <aside className="mobile-sidebar" onClick={e => e.stopPropagation()}>
            <button className="mobile-sidebar-close" onClick={() => setMobileOpen(false)}>
              <X size={20} />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* ── Main content ─────────────────────────────────────────── */}
      <div className="admin-main">
        {/* Top bar */}
        <header className="admin-topbar">
          <div className="topbar-left">
            <button className="topbar-menu-btn" onClick={() => setMobileOpen(true)}>
              <Menu size={20} />
            </button>
            <div className="topbar-breadcrumb">
              <span className="text-muted text-sm">Admin</span>
              <span className="text-subtle">/</span>
              <span className="text-sm font-semi">
                {restaurant?.restaurantName || '—'}
              </span>
            </div>
          </div>

          <div className="topbar-right">
            <button className="topbar-icon-btn" title="Notifications">
              <Bell size={18} />
              <span className="topbar-notif-dot" />
            </button>

            <div className="topbar-user" onClick={() => navigate(`${basePath}/settings`)}>
              <div className="topbar-avatar">{getInitials(user?.name || 'A')}</div>
              <span className="topbar-user-name hide-mobile">{user?.name}</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="admin-content">
          <Outlet context={{ restaurantId, restaurant }} />
        </main>
      </div>
    </div>
  );
}
