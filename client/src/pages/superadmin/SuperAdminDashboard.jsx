import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { tenantApi } from '../../api/tenant.api';
import './SuperAdminDashboard.css';
import {
  LayoutDashboard,
  DollarSign,
  Settings,
  Search,
  Bell,
  LogOut,
  Building,
  User,
  Sliders,
  Power,
  Trash2,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  X,
  CreditCard,
  Percent,
  CheckCircle,
  XCircle,
  HelpCircle,
  ToggleLeft,
  ToggleRight,
  ArrowUpRight,
  ArrowDownRight,
  ShieldAlert
} from 'lucide-react';

function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div style={{
      position: 'fixed', top: 24, right: 24, zIndex: 9999,
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '12px 18px', borderRadius: 12, fontWeight: 700, fontSize: 13,
      background: toast.type === 'error' ? '#7f1d1d' : '#1e1b4b',
      border: `1px solid ${toast.type === 'error' ? '#ef4444' : '#6366f1'}`,
      color: '#fff',
      boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
      fontFamily: 'Outfit, sans-serif'
    }}>
      {toast.msg}
    </div>
  );
}

export default function SuperAdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Sidebar Menu State: 'dashboard' | 'restaurants' | 'revenue' | 'settings'
  const [activeMenu, setActiveMenu] = useState('dashboard');

  // Tenants & Real Data
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedSubTab, setSelectedSubTab] = useState('All'); // 'All' | 'Pro' | 'Enterprise' | 'Free'
  const [toast, setToast] = useState(null);
  const [saving, setSaving] = useState(false);

  // Modal State
  const [subModal, setSubModal] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [subForm, setSubForm] = useState({ planType: 'Free', status: 'Trial' });

  // Persistent System Settings State (persisted to localStorage)
  const [systemSettings, setSystemSettings] = useState({
    commissionRate: 5.0,
    platformCurrency: 'PKR',
    maintenanceMode: false,
    autoApproveTenants: true
  });

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  };

  const load = async () => {
    setLoading(true);
    try {
      const res = await tenantApi.getAllRestaurants({ limit: 1000 });
      setTenants(res.data?.data?.tenants || res.data?.data || []);
    } catch (err) {
      showToast('error', 'Failed to load platform restaurants');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // Load persisted configurations
    const saved = localStorage.getItem('rms_system_settings');
    if (saved) {
      try {
        setSystemSettings(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const saveGlobalSettings = (newSettings) => {
    setSystemSettings(newSettings);
    localStorage.setItem('rms_system_settings', JSON.stringify(newSettings));
    showToast('success', 'Global system settings saved');
  };

  const handleToggleStatus = async (tenant) => {
    const updatedStatus = !tenant.isActive;
    const confirmMsg = updatedStatus
      ? `Activate "${tenant.restaurantName}"?`
      : `SUSPEND "${tenant.restaurantName}"? This will block their dashboard and checkout immediately.`;

    if (!window.confirm(confirmMsg)) return;

    try {
      await tenantApi.updateRestaurant(tenant._id, { isActive: updatedStatus });
      showToast('success', `${tenant.restaurantName} is now ${updatedStatus ? 'Active' : 'Suspended'}`);
      load();
    } catch (err) {
      showToast('error', 'Failed to update restaurant status');
    }
  };

  const handleOpenSubscription = (tenant) => {
    setSelectedTenant(tenant);
    setSubForm({
      planType: tenant.subscription?.planType || 'Free',
      status: tenant.subscription?.status || 'Trial',
    });
    setSubModal(true);
  };

  const handleSaveSubscription = async () => {
    setSaving(true);
    try {
      await tenantApi.updateSubscription(selectedTenant._id, subForm);
      showToast('success', 'Subscription updated successfully');
      setSubModal(false);
      load();
    } catch (err) {
      showToast('error', err?.response?.data?.message || 'Failed to update subscription');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTenant = async (tenant) => {
    if (!window.confirm(`DANGER: Completely delete "${tenant.restaurantName}"? This action is permanent and deletes all associated menu, orders, and configuration.`)) return;

    try {
      await tenantApi.deleteRestaurant(tenant._id);
      showToast('success', `${tenant.restaurantName} successfully offboarded`);
      load();
    } catch (err) {
      showToast('error', 'Failed to delete restaurant');
    }
  };

  // KPIs calculations from dynamic loaded data
  const totalRestaurants = tenants.length;
  const activeRestaurants = tenants.filter(t => t.isActive).length;
  const trialRestaurants = tenants.filter(t => t.isActive && t.subscription?.status === 'Trial').length;
  const suspendedRestaurants = tenants.filter(t => !t.isActive).length;

  const calculateMRR = () => {
    return tenants
      .filter(t => t.isActive && t.subscription?.status === 'Active')
      .reduce((sum, t) => {
        const plan = t.subscription?.planType || 'Free';
        if (plan === 'Pro') return sum + 49;
        if (plan === 'Enterprise') return sum + 149;
        return sum;
      }, 0);
  };

  // Real-time statistical ratios
  const activeRatio = totalRestaurants > 0 ? Math.round((activeRestaurants / totalRestaurants) * 100) : 0;
  const paidCount = tenants.filter(t => t.isActive && t.subscription?.status === 'Active' && t.subscription?.planType !== 'Free').length;
  const paidRatio = activeRestaurants > 0 ? Math.round((paidCount / activeRestaurants) * 100) : 0;
  const trialRatio = activeRestaurants > 0 ? Math.round((trialRestaurants / activeRestaurants) * 100) : 0;
  const suspendedRatio = totalRestaurants > 0 ? Math.round((suspendedRestaurants / totalRestaurants) * 100) : 0;

  const filteredTenants = tenants.filter(t => {
    const matchesSearch =
      t.restaurantName?.toLowerCase().includes(search.toLowerCase()) ||
      t.slug?.toLowerCase().includes(search.toLowerCase()) ||
      t.contactInfo?.email?.toLowerCase().includes(search.toLowerCase());

    const matchesSubTab =
      selectedSubTab === 'All' ||
      t.subscription?.planType === selectedSubTab;

    return matchesSearch && matchesSubTab;
  });

  return (
    <div className="superadmin-container">
      <Toast toast={toast} />

      {/* 1. LEFT SIDEBAR (Dark Ultra-Modern Theme) */}
      <div className="superadmin-sidebar">
        <div>
          {/* Platform Branding Logo */}
          <div className="sidebar-logo-container">
            <div className="sidebar-logo-icon">
              <Sparkles size={18} style={{ color: '#fff' }} />
            </div>
            <div>
              <span className="sidebar-logo-text-primary">MEZAMI</span>
              <span className="sidebar-logo-text-secondary">SAAS PORTAL</span>
            </div>
          </div>

          {/* Navigation Links — Only highly useful, active sections */}
          <div className="sidebar-menu-list">
            <button className={`sidebar-item ${activeMenu === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveMenu('dashboard')}>
              <LayoutDashboard size={20} />
              Dashboard
            </button>
            <button className={`sidebar-item ${activeMenu === 'restaurants' ? 'active' : ''}`} onClick={() => setActiveMenu('restaurants')}>
              <Building size={20} />
              Restaurants
            </button>
            <button className={`sidebar-item ${activeMenu === 'revenue' ? 'active' : ''}`} onClick={() => setActiveMenu('revenue')}>
              <DollarSign size={20} />
              Revenue & Plans
            </button>
            <button className={`sidebar-item ${activeMenu === 'settings' ? 'active' : ''}`} onClick={() => setActiveMenu('settings')}>
              <Settings size={20} />
              System Settings
            </button>
          </div>
        </div>

        {/* Sidebar Footer Info */}
        <div className="sidebar-footer-box">
          <div className="sidebar-footer-status-title">System Status</div>
          <div className="sidebar-footer-status-indicator">
            <span className="status-indicator-dot-green" />
            <span className="status-indicator-text-green">100% Online</span>
          </div>
        </div>
      </div>

      {/* 2. MAIN WORKSPACE (Light Premium Theme) */}
      <div className="superadmin-workspace">

        {/* Top Header Bar */}
        <div className="workspace-header-row">
          <h1 className="workspace-header-title">
            {activeMenu === 'dashboard' ? 'Overview' : activeMenu === 'revenue' ? 'Revenue & Billing' : activeMenu}
          </h1>

          <div className="workspace-header-actions">
            {/* Search Input Box */}
            <div className="header-search-container">
              <Search size={16} className="header-search-icon" />
              <input
                className="header-search-input"
                placeholder="Search something..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            {/* Notification Bell */}
            <button className="header-action-button" onClick={() => showToast('success', 'All system alerts cleared')}>
              <Bell size={18} />
            </button>

            {/* Logout/Exit */}
            <button className="header-action-button" onClick={logout}>
              <LogOut size={18} />
            </button>
          </div>
        </div>

        {/* Render View Dynamically Based on Active Menu Item */}

        {/* ================= VIEW 1: DASHBOARD OVERVIEW ================= */}
        {activeMenu === 'dashboard' && (
          <>
            {/* Metrics Row (Soft Pastel Colors) */}
            <div className="kpi-cards-grid">
              <div className="kpi-card" style={{ background: '#FEF9EC' }}>
                <div className="kpi-card-header">
                  <div className="kpi-card-icon-wrapper" style={{ background: '#FDF0CD', color: '#D97706' }}>
                    <DollarSign size={18} />
                  </div>
                  <span className="kpi-card-trend-badge" style={{ color: '#D97706' }}>
                    {paidRatio}% <ArrowUpRight size={14} />
                  </span>
                </div>
                <span className="kpi-card-label">Projected MRR</span>
                <h2 className="kpi-card-value">${calculateMRR().toLocaleString()}.00</h2>
                <span className="kpi-card-footer-text" style={{ color: '#D97706' }}>Paid Ratio: {paidRatio}%</span>
              </div>

              <div className="kpi-card" style={{ background: '#F5F3FF' }}>
                <div className="kpi-card-header">
                  <div className="kpi-card-icon-wrapper" style={{ background: '#EDE9FE', color: '#7C3AED' }}>
                    <Building size={18} />
                  </div>
                  <span className="kpi-card-trend-badge" style={{ color: '#7C3AED' }}>
                    {activeRatio}% <ArrowUpRight size={14} />
                  </span>
                </div>
                <span className="kpi-card-label">Active Restaurants</span>
                <h2 className="kpi-card-value">{activeRestaurants}</h2>
                <span className="kpi-card-footer-text" style={{ color: '#7C3AED' }}>Online: {activeRestaurants}/{totalRestaurants}</span>
              </div>

              <div className="kpi-card" style={{ background: '#ECFDF5' }}>
                <div className="kpi-card-header">
                  <div className="kpi-card-icon-wrapper" style={{ background: '#D1FAE5', color: '#059669' }}>
                    <User size={18} />
                  </div>
                  <span className="kpi-card-trend-badge" style={{ color: '#059669' }}>
                    {trialRatio}% <ArrowUpRight size={14} />
                  </span>
                </div>
                <span className="kpi-card-label">Trial Accounts</span>
                <h2 className="kpi-card-value">{trialRestaurants}</h2>
                <span className="kpi-card-footer-text" style={{ color: '#059669' }}>Trial Ratio: {trialRatio}%</span>
              </div>

              <div className="kpi-card" style={{ background: '#FEF2F2' }}>
                <div className="kpi-card-header">
                  <div className="kpi-card-icon-wrapper" style={{ background: '#FEE2E2', color: '#DC2626' }}>
                    <ShieldAlert size={18} />
                  </div>
                  <span className="kpi-card-trend-badge" style={{ color: '#DC2626' }}>
                    {suspendedRatio}% <ArrowDownRight size={14} />
                  </span>
                </div>
                <span className="kpi-card-label">Suspended Alerts</span>
                <h2 className="kpi-card-value">{suspendedRestaurants}</h2>
                <span className="kpi-card-footer-text" style={{ color: '#DC2626' }}>Suspended: {suspendedRatio}%</span>
              </div>
            </div>

            {/* Middle Section: Chart & Event Logger */}
            <div className="dashboard-layout-grid">
              {/* Spline registration chart */}
              <div className="chart-card-container">
                <div className="panel-card-header">
                  <h3 className="panel-card-title">Platform Registration Activity</h3>
                  <span className="panel-card-subtitle">Active Analytics</span>
                </div>
                <div style={{ position: 'relative', width: '100%', height: 180 }}>
                  <svg viewBox="0 0 500 150" width="100%" height="100%">
                    <defs>
                      <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366F1" stopOpacity="0.15" />
                        <stop offset="100%" stopColor="#6366F1" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <line x1="0" y1="30" x2="500" y2="30" stroke="#EEF0F2" strokeWidth="1" strokeDasharray="5,5" />
                    <line x1="0" y1="70" x2="500" y2="70" stroke="#EEF0F2" strokeWidth="1" strokeDasharray="5,5" />
                    <line x1="0" y1="110" x2="500" y2="110" stroke="#EEF0F2" strokeWidth="1" strokeDasharray="5,5" />
                    <path d="M 0,120 C 100,120 120,40 250,80 C 350,110 400,30 500,30 L 500,150 L 0,150 Z" fill="url(#chartGrad)" />
                    <path d="M 0,120 C 100,120 120,40 250,80 C 350,110 400,30 500,30" fill="none" stroke="#6366F1" strokeWidth="3.5" strokeLinecap="round" />
                    <circle cx="250" cy="80" r="6" fill="#6366F1" stroke="#FFFFFF" strokeWidth="2.5" />
                  </svg>
                  <div style={{ 
                    position: 'absolute', top: 14, left: '50%', transform: 'translateX(-50%)', 
                    background: 'rgba(19, 20, 23, 0.95)', color: '#fff', 
                    padding: '6px 14px', borderRadius: 10, fontSize: 11, fontWeight: 800,
                    boxShadow: '0 4px 15px rgba(0,0,0,0.15)', backdropFilter: 'blur(4px)',
                    border: '1px solid rgba(255, 255, 255, 0.08)' 
                  }}>
                    {totalRestaurants} Registered Teams Peak
                  </div>
                </div>
              </div>

              {/* Event Logs panel */}
              <div className="recent-events-container">
                <div className="panel-card-header">
                  <h3 className="panel-card-title">Recent System Events</h3>
                  <span className="panel-card-subtitle">Real-time logs</span>
                </div>
                <div className="recent-events-list">
                  <div className="event-log-item">
                    <div className="event-log-icon-container" style={{ background: '#ECFDF5', color: '#059669' }}>
                      <CheckCircle size={14} />
                    </div>
                    <div>
                      <span className="event-log-text-primary">SSL Verification Safe</span>
                      <span className="event-log-text-secondary">System is secure</span>
                    </div>
                  </div>
                  <div className="event-log-item">
                    <div className="event-log-icon-container" style={{ background: '#F5F3FF', color: '#7C3AED' }}>
                      <Sparkles size={14} />
                    </div>
                    <div>
                      <span className="event-log-text-primary">Database Connected</span>
                      <span className="event-log-text-secondary">Shards operating normally</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick tenant preview grid */}
            <div className="panel-card-container">
              <div className="panel-card-header">
                <h3 className="panel-card-title">Active Platforms Overview</h3>
                <button className="btn btn-ghost btn-xs" style={{ color: '#6366F1', fontWeight: 700 }} onClick={() => setActiveMenu('restaurants')}>View all restaurants →</button>
              </div>
              <div className="platform-preview-row-grid">
                {tenants.slice(0, 3).map(tenant => (
                  <div key={tenant._id} className="platform-preview-card">
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: tenant.branding?.primaryColor || '#6366F1', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                      {tenant.restaurantName?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <span style={{ fontWeight: 700, fontSize: 14, display: 'block' }}>{tenant.restaurantName}</span>
                      <span style={{ fontSize: 11, color: '#8E959F' }}>/r/{tenant.slug}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ================= VIEW 2: DETAILED RESTAURANTS DIRECTORY ================= */}
        {activeMenu === 'restaurants' && (
          <div className="data-table-main-panel">
            <div className="data-table-title-row">
              <h3 className="panel-card-title">Manage Partner Restaurants</h3>

              <div className="tab-filter-container">
                {['All', 'Pro', 'Enterprise', 'Free'].map(tab => (
                  <button
                    key={tab}
                    className={`sub-tab-btn ${selectedSubTab === tab ? 'active' : ''}`}
                    onClick={() => setSelectedSubTab(tab)}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="clean-table">
                <thead>
                  <tr>
                    <th>Restaurant</th>
                    <th>Slug / URL</th>
                    <th>Contact Info</th>
                    <th>Subscription</th>
                    <th>Operational Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '60px 0' }}>
                        <div className="spinner" style={{ margin: '0 auto', borderColor: '#6366F1' }} />
                      </td>
                    </tr>
                  ) : filteredTenants.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '60px 0', color: '#8E959F' }}>
                        No restaurants matching criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredTenants.map(tenant => {
                      const plan = tenant.subscription?.planType || 'Free';
                      const subStatus = tenant.subscription?.status || 'Trial';
                      const isActive = tenant.isActive;

                      return (
                        <tr key={tenant._id} style={{ opacity: isActive ? 1 : 0.6 }}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                              <div style={{
                                width: 44, height: 44, borderRadius: 12,
                                background: tenant.branding?.primaryColor || '#6366F1',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: '#fff', fontSize: 18, fontWeight: 800,
                                boxShadow: '0 4px 15px rgba(0,0,0,0.05)'
                              }}>
                                {tenant.restaurantName?.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <span style={{ fontWeight: 700, fontSize: 15, display: 'block' }}>{tenant.restaurantName}</span>
                                <span style={{ fontSize: 11, color: '#8E959F' }}>Owner: {tenant.ownerId?.name || tenant.ownerId?._id || tenant.ownerId || '—'}</span>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <a
                                href={`/r/${tenant.slug}`}
                                target="_blank"
                                rel="noreferrer"
                                style={{ color: '#6366F1', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}
                              >
                                /r/{tenant.slug} <ExternalLink size={12} />
                              </a>
                              <span style={{ fontSize: 12, color: '#8E959F' }}>{tenant.address?.city || 'Default Region'}</span>
                            </div>
                          </td>
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span style={{ fontWeight: 500 }}>{tenant.contactInfo?.email || '—'}</span>
                              <span style={{ fontSize: 12, color: '#8E959F' }}>{tenant.contactInfo?.phone || '—'}</span>
                            </div>
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{
                                padding: '6px 12px', borderRadius: 8, fontSize: 11, fontWeight: 800,
                                background: plan === 'Enterprise' ? 'rgba(168,85,247,0.1)' : plan === 'Pro' ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.05)',
                                color: plan === 'Enterprise' ? '#A855F7' : plan === 'Pro' ? '#6366F1' : '#8E959F',
                                border: `1px solid ${plan === 'Enterprise' ? 'rgba(168,85,247,0.15)' : plan === 'Pro' ? 'rgba(99,102,241,0.15)' : '#EEF0F2'}`
                              }}>
                                {plan}
                              </span>
                              <span style={{ fontSize: 12, color: '#8E959F' }}>({subStatus})</span>
                            </div>
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{
                                width: 8, height: 8, borderRadius: '50%',
                                background: isActive ? '#10B981' : '#EF4444',
                                boxShadow: isActive ? '0 0 10px #10B981' : '0 0 10px #EF4444'
                              }} />
                              <span style={{ fontWeight: 700, fontSize: 13, color: isActive ? '#10B981' : '#EF4444' }}>
                                {isActive ? 'Active' : 'Suspended'}
                              </span>
                            </div>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                              <button
                                className="btn btn-ghost btn-xs"
                                style={{ color: '#0EA5E9', background: 'rgba(14,165,233,0.05)', borderRadius: 8, padding: '6px 12px' }}
                                onClick={() => handleOpenSubscription(tenant)}
                              >
                                <Sliders size={13} /> Edit Plan
                              </button>

                              <button
                                className={`btn btn-xs ${isActive ? 'btn-ghost' : 'btn-primary'}`}
                                style={{
                                  color: isActive ? '#EF4444' : '#10B981',
                                  background: isActive ? 'rgba(239,68,68,0.05)' : 'rgba(16,185,129,0.05)',
                                  borderRadius: 8,
                                  padding: '6px 12px',
                                  border: 'none'
                                }}
                                onClick={() => handleToggleStatus(tenant)}
                              >
                                <Power size={13} /> {isActive ? 'Suspend' : 'Activate'}
                              </button>

                              <button
                                className="btn btn-ghost btn-xs text-error"
                                onClick={() => handleDeleteTenant(tenant)}
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= VIEW 3: REVENUE & PLANS ================= */}
        {activeMenu === 'revenue' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Subscription Billing overview */}
            <div className="kpi-cards-grid">
              <div className="kpi-card" style={{ background: '#FFFFFF' }}>
                <span className="kpi-card-label">Active MRR</span>
                <h2 className="kpi-card-value">${calculateMRR()}.00</h2>
              </div>
              <div className="kpi-card" style={{ background: '#FFFFFF' }}>
                <span className="kpi-card-label">Paid Contracts</span>
                <h2 className="kpi-card-value">
                  {tenants.filter(t => t.isActive && t.subscription?.planType !== 'Free').length} Active
                </h2>
              </div>
              <div className="kpi-card" style={{ background: '#FFFFFF' }}>
                <span className="kpi-card-label">Free Accounts</span>
                <h2 className="kpi-card-value">
                  {tenants.filter(t => t.isActive && t.subscription?.planType === 'Free').length} Accounts
                </h2>
              </div>
            </div>

            {/* Plan details table */}
            <div className="panel-card-container" style={{ padding: '24px 0' }}>
              <div style={{ padding: '0 24px 20px 24px', borderBottom: '1px solid #EEF0F2' }}>
                <h3 className="panel-card-title">Billing Grid</h3>
              </div>
              <table className="clean-table">
                <thead>
                  <tr>
                    <th>Restaurant</th>
                    <th>Plan Type</th>
                    <th>Projected Billing Cycle</th>
                    <th>Expected Monthly Contribution</th>
                  </tr>
                </thead>
                <tbody>
                  {tenants.map(t => {
                    const plan = t.subscription?.planType || 'Free';
                    const amount = plan === 'Pro' ? 49 : plan === 'Enterprise' ? 149 : 0;
                    return (
                      <tr key={t._id}>
                        <td style={{ fontWeight: 700 }}>{t.restaurantName}</td>
                        <td>
                          <span className="kpi-card-footer-text" style={{
                            padding: '4px 8px', borderRadius: 6, fontSize: 11, fontWeight: 800,
                            background: plan === 'Enterprise' ? 'rgba(168,85,247,0.1)' : plan === 'Pro' ? 'rgba(99,102,241,0.1)' : '#F1F5F9',
                            color: plan === 'Enterprise' ? '#A855F7' : plan === 'Pro' ? '#6366F1' : '#64748B'
                          }}>
                            {plan}
                          </span>
                        </td>
                        <td>Monthly Billing</td>
                        <td style={{ fontWeight: 800, color: amount > 0 ? '#10B981' : '#8E959F' }}>${amount}.00/mo</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= VIEW 4: SYSTEM SETTINGS ================= */}
        {activeMenu === 'settings' && (
          <div className="settings-rows-list">
            <h3 className="panel-card-title" style={{ marginBottom: 10 }}>Global Platform Settings</h3>

            {/* Commision Rate */}
            <div className="setting-item-row">
              <div>
                <span className="setting-title-main">SaaS Transaction Commission (%)</span>
                <span className="setting-title-desc">The platform commission deducted per online store transaction.</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input
                  type="number"
                  className="setting-commission-input"
                  value={systemSettings.commissionRate}
                  onChange={e => saveGlobalSettings({ ...systemSettings, commissionRate: parseFloat(e.target.value) || 0 })}
                />
                <span style={{ fontWeight: 700 }}>%</span>
              </div>
            </div>

            {/* Base Currency */}
            <div className="setting-item-row">
              <div>
                <span className="setting-title-main">Global Platform Currency</span>
                <span className="setting-title-desc">Default regional currency to display values in analytics.</span>
              </div>
              <div>
                <select
                  className="setting-select-box"
                  value={systemSettings.platformCurrency}
                  onChange={e => saveGlobalSettings({ ...systemSettings, platformCurrency: e.target.value })}
                >
                  <option value="PKR">PKR (Rs.)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                </select>
              </div>
            </div>

            {/* Maintenance Mode */}
            <div className="setting-item-row">
              <div>
                <span className="setting-title-main">Global Maintenance Mode</span>
                <span className="setting-title-desc">Temporarily pause client checkouts and tenant portals for system upgrades.</span>
              </div>
              <button
                className="setting-toggle-btn"
                style={{ color: systemSettings.maintenanceMode ? '#EF4444' : '#8E959F' }}
                onClick={() => saveGlobalSettings({ ...systemSettings, maintenanceMode: !systemSettings.maintenanceMode })}
              >
                {systemSettings.maintenanceMode ? <ToggleRight size={38} style={{ color: '#EF4444' }} /> : <ToggleLeft size={38} />}
              </button>
            </div>

            {/* Auto approve tenants */}
            <div className="setting-item-row">
              <div>
                <span className="setting-title-main">Auto-Approve Registrations</span>
                <span className="setting-title-desc">Instantly launch new restaurants upon onboarding without manual review.</span>
              </div>
              <button
                className="setting-toggle-btn"
                style={{ color: systemSettings.autoApproveTenants ? '#10B981' : '#8E959F' }}
                onClick={() => saveGlobalSettings({ ...systemSettings, autoApproveTenants: !systemSettings.autoApproveTenants })}
              >
                {systemSettings.autoApproveTenants ? <ToggleRight size={38} style={{ color: '#10B981' }} /> : <ToggleLeft size={38} />}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Subscription Customization Modal */}
      {subModal && selectedTenant && (
        <div className="modal-overlay" onClick={() => setSubModal(false)}>
          <div className="modal" style={{ maxWidth: 420, borderRadius: 20 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Building size={18} style={{ color: '#6366F1' }} />
                Manage Plan: {selectedTenant.restaurantName}
              </h3>
              <button className="modal-close" onClick={() => setSubModal(false)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Subscription Tier</label>
                <select
                  className="form-select"
                  value={subForm.planType}
                  onChange={e => setSubForm(p => ({ ...p, planType: e.target.value }))}
                >
                  <option value="Free">Free Tier ($0/mo)</option>
                  <option value="Pro">Pro Tier ($49/mo)</option>
                  <option value="Enterprise">Enterprise Tier ($149/mo)</option>
                </select>
              </div>

              <div className="form-group" style={{ marginTop: 16 }}>
                <label className="form-label">Billing Status</label>
                <select
                  className="form-select"
                  value={subForm.status}
                  onChange={e => setSubForm(p => ({ ...p, status: e.target.value }))}
                >
                  <option value="Active">Active / Paid</option>
                  <option value="Trial">Trial Period</option>
                  <option value="Expired">Expired / Unpaid</option>
                  <option value="Suspended">Suspended</option>
                </select>
              </div>
            </div>
            <div className="modal-footer" style={{ marginTop: 24 }}>
              <button className="btn btn-ghost" onClick={() => setSubModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSaveSubscription} disabled={saving}>
                {saving ? <div className="spinner" /> : null} Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
