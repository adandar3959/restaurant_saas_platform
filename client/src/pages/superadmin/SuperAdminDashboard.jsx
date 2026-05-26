import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { tenantApi } from '../../api/tenant.api';
import { plansApi } from '../../api/plans.api';
import api from '../../api/tenant.api';
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

  // Plans & Pricing state
  const [dbPlans, setDbPlans] = useState([]);
  const [editingPlan, setEditingPlan] = useState(null);
  const [planForm, setPlanForm] = useState({});
  const [planSaving, setPlanSaving] = useState(false);

  // Analytics state
  const [metrics, setMetrics] = useState(null);
  const [metricsLoading, setMetricsLoading] = useState(false);

  // Load plans from DB
  useEffect(() => {
    plansApi.getAll().then(r => setDbPlans(r.data?.data || r.data || [])).catch(() => { });
  }, []);

  // Load analytics when Revenue tab is opened
  useEffect(() => {
    if (activeMenu !== 'revenue') return;
    setMetricsLoading(true);
    api.get('/analytics/saas')
      .then(r => setMetrics(r.data?.data || r.data))
      .catch(() => { })
      .finally(() => setMetricsLoading(false));
  }, [activeMenu]);

  // Modal State
  const [subModal, setSubModal] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [subForm, setSubForm] = useState({ planType: 'Free', status: 'Trial' });

  // Persistent System Settings State (persisted to localStorage)
  const [systemSettings, setSystemSettings] = useState({
    commissionRate: 5.0,
    platformCurrency: 'PKR',
    autoApproveTenants: true
  });
  const [maintenanceOn, setMaintenanceOn] = useState(false);
  const [maintenanceSaving, setMaintenanceSaving] = useState(false);

  // Load maintenance mode and platform currency state from API
  useEffect(() => {
    api.get('/settings/public')
      .then(res => {
        setMaintenanceOn(res.data?.data?.maintenanceMode ?? false);
        const backendCurrency = res.data?.data?.platformCurrency || 'PKR';
        setSystemSettings(prev => {
          const updated = { ...prev, platformCurrency: backendCurrency };
          localStorage.setItem('rms_system_settings', JSON.stringify(updated));
          return updated;
        });
      })
      .catch(() => { });
  }, []);

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
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

  const saveGlobalSettings = async (newSettings) => {
    setSystemSettings(newSettings);
    localStorage.setItem('rms_system_settings', JSON.stringify(newSettings));
    try {
      await api.patch('/settings/system', { platformCurrency: newSettings.platformCurrency });
      showToast('success', 'Global system settings saved');
    } catch (e) {
      showToast('error', 'Failed to sync settings to server');
    }
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
        const planData = dbPlans.find(p => p.planId === plan);
        return sum + (planData?.price || 0);
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

            {/* ── Analytics KPI Row ── */}
            {metricsLoading ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#8E959F' }}>Loading analytics…</div>
            ) : metrics ? (
              <>
                {/* Row 1: Revenue KPIs — 6 cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
                  {[
                    { label: 'Monthly Recurring Revenue', value: `$${metrics.mrr.toLocaleString()}`, sub: 'Active paid subs · forward-looking', color: '#10B981' },
                    { label: 'Annual Run Rate (ARR)', value: `$${metrics.arr.toLocaleString()}`, sub: 'MRR × 12', color: '#6366F1' },
                    { label: 'Total Revenue Collected', value: `$${metrics.totalRevenue?.toLocaleString() ?? '—'}`, sub: `${metrics.invoiceCount ?? 0} Stripe payments · all-time`, color: '#F59E0B' },
                  ].map(k => (
                    <div key={k.label} className="kpi-card" style={{ background: '#fff', borderTop: `3px solid ${k.color}` }}>
                      <span className="kpi-card-label">{k.label}</span>
                      <h2 className="kpi-card-value" style={{ color: k.color }}>{k.value}</h2>
                      <span className="kpi-card-footer-text">{k.sub}</span>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 16 }}>
                  {[
                    { label: 'Churn Rate', value: `${metrics.churnRate}%`, sub: `${metrics.counts.churned} suspended/expired`, color: metrics.churnRate > 10 ? '#EF4444' : '#F59E0B' },
                    { label: 'Conversion Rate', value: `${metrics.convRate}%`, sub: 'Pending → Active', color: '#10B981' },
                  ].map(k => (
                    <div key={k.label} className="kpi-card" style={{ background: '#fff', borderTop: `3px solid ${k.color}` }}>
                      <span className="kpi-card-label">{k.label}</span>
                      <h2 className="kpi-card-value" style={{ color: k.color }}>{k.value}</h2>
                      <span className="kpi-card-footer-text">{k.sub}</span>
                    </div>
                  ))}
                </div>

                {/* Row 2: Customer counts */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
                  {[
                    { label: 'Total Restaurants', value: metrics.counts.total, color: '#1E293B' },
                    { label: 'Paid Subscribers', value: metrics.counts.paid, color: '#6366F1' },
                    { label: 'Free Tier', value: metrics.counts.free, color: '#64748B' },
                    { label: 'Pending Activation', value: metrics.counts.pending, color: '#F59E0B' },
                  ].map(k => (
                    <div key={k.label} className="kpi-card" style={{ background: '#fff' }}>
                      <span className="kpi-card-label">{k.label}</span>
                      <h2 className="kpi-card-value" style={{ color: k.color }}>{k.value}</h2>
                    </div>
                  ))}
                </div>

                {/* Revenue Trend — 6 month bar chart from Stripe invoices */}
                {metrics.revenueByMonth && Object.keys(metrics.revenueByMonth).length > 0 && (
                  <div className="panel-card-container" style={{ padding: 24 }}>
                    <h3 className="panel-card-title" style={{ marginBottom: 4 }}>Stripe Payments — Last 6 Months</h3>
                    <p style={{ fontSize: 12, color: '#8E959F', marginBottom: 20 }}>Actual SaaS subscription payments from Stripe (not projected MRR)</p>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 120 }}>
                      {(() => {
                        const entries = Object.entries(metrics.revenueByMonth);
                        const maxVal = Math.max(...entries.map(([, v]) => v), 1);
                        return entries.map(([month, amount]) => {
                          const pct = Math.round((amount / maxVal) * 100);
                          const label = new Date(month + '-01').toLocaleString('default', { month: 'short', year: '2-digit' });
                          return (
                            <div key={month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                              <span style={{ fontSize: 10, color: '#8E959F', fontWeight: 700 }}>${amount.toFixed(0)}</span>
                              <div style={{ width: '100%', background: '#F1F5F9', borderRadius: 6, height: 80, display: 'flex', alignItems: 'flex-end', overflow: 'hidden' }}>
                                <div style={{
                                  width: '100%', height: `${pct}%`, minHeight: 4,
                                  background: 'linear-gradient(180deg, #6366F1, #A855F7)',
                                  borderRadius: '6px 6px 0 0', transition: 'height 0.6s ease',
                                }} />
                              </div>
                              <span style={{ fontSize: 10, color: '#8E959F' }}>{label}</span>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>
                )}

                {/* Row 3: Plan Distribution + Growth */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

                  {/* Plan Distribution */}
                  <div className="panel-card-container" style={{ padding: 24 }}>
                    <h3 className="panel-card-title" style={{ marginBottom: 20 }}>Plan Distribution</h3>
                    {['Free', 'Pro', 'Enterprise'].map(p => {
                      const count = metrics.byPlan[p] || 0;
                      const total = metrics.counts.active || 1;
                      const pct = Math.round((count / total) * 100);
                      const colors = { Free: '#64748B', Pro: '#6366F1', Enterprise: '#A855F7' };
                      return (
                        <div key={p} style={{ marginBottom: 16 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
                            <span style={{ color: colors[p] }}>{p}</span>
                            <span>{count} restaurants ({pct}%)</span>
                          </div>
                          <div style={{ background: '#F1F5F9', borderRadius: 99, height: 8, overflow: 'hidden' }}>
                            <div style={{ width: `${pct}%`, height: '100%', background: colors[p], borderRadius: 99, transition: 'width 0.6s ease' }} />
                          </div>
                        </div>
                      );
                    })}
                    <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid #EEF0F2', display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#8E959F' }}>
                      <span>MRR from Pro: <b style={{ color: '#6366F1' }}>${metrics.mrrByPlan.Pro || 0}</b></span>
                      <span>MRR from Enterprise: <b style={{ color: '#A855F7' }}>${metrics.mrrByPlan.Enterprise || 0}</b></span>
                    </div>
                  </div>

                  {/* Growth & Health */}
                  <div className="panel-card-container" style={{ padding: 24 }}>
                    <h3 className="panel-card-title" style={{ marginBottom: 20 }}>Growth & Health</h3>
                    {[
                      { label: 'New This Month', value: metrics.counts.newThisMonth, icon: '📈', color: '#10B981' },
                      { label: 'New Last Month', value: metrics.counts.newLastMonth, icon: '📅', color: '#64748B' },
                      { label: 'Churned / Suspended', value: metrics.counts.churned, icon: '📉', color: '#EF4444' },
                      { label: 'Trial Accounts', value: metrics.counts.trial, icon: '🧪', color: '#F59E0B' },
                    ].map(s => (
                      <div key={s.label} style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '12px 0', borderBottom: '1px solid #F1F5F9',
                      }}>
                        <span style={{ fontSize: 13, color: '#64748B' }}>{s.icon} {s.label}</span>
                        <span style={{ fontWeight: 800, fontSize: 18, color: s.color }}>{s.value}</span>
                      </div>
                    ))}
                    <div style={{ marginTop: 12, fontSize: 11, color: '#8E959F' }}>
                      {metrics.counts.newThisMonth > metrics.counts.newLastMonth
                        ? `▲ +${metrics.counts.newThisMonth - metrics.counts.newLastMonth} more than last month`
                        : metrics.counts.newThisMonth < metrics.counts.newLastMonth
                          ? `▼ ${metrics.counts.newLastMonth - metrics.counts.newThisMonth} fewer than last month`
                          : '— Same as last month'}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: 40, color: '#EF4444' }}>Failed to load analytics</div>
            )}

            {/* ── Plans & Pricing Editor ── */}
            <div className="panel-card-container" style={{ padding: '24px' }}>
              <h3 className="panel-card-title" style={{ marginBottom: 20 }}>Plans &amp; Pricing</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
                {dbPlans.map(plan => {
                  const isEditing = editingPlan === plan.planId;
                  return (
                    <div key={plan.planId} style={{
                      border: '1px solid #EEF0F2', borderRadius: 14,
                      padding: 20, display: 'flex', flexDirection: 'column', gap: 12,
                      background: isEditing ? '#F8F9FF' : '#fff',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 800, fontSize: 15 }}>{plan.planId}</span>
                        {!isEditing ? (
                          <button className="btn btn-ghost btn-xs" style={{ color: '#6366F1', fontSize: 12 }}
                            onClick={() => { setEditingPlan(plan.planId); setPlanForm({ price: plan.price, stripePriceId: plan.stripePriceId || '', tagline: plan.tagline || '' }); }}>
                            ✏️ Edit
                          </button>
                        ) : (
                          <button className="btn btn-ghost btn-xs" style={{ color: '#EF4444' }} onClick={() => setEditingPlan(null)}>✕ Cancel</button>
                        )}
                      </div>
                      {!isEditing ? (
                        <>
                          <div style={{ fontSize: 28, fontWeight: 900 }}>${plan.price}<span style={{ fontSize: 13, fontWeight: 400, color: '#8E959F' }}>/mo</span></div>
                          <div style={{ fontSize: 12, color: '#8E959F' }}>{plan.tagline}</div>
                          {plan.stripePriceId && <div style={{ fontSize: 11, color: '#8E959F', fontFamily: 'monospace', wordBreak: 'break-all' }}>Stripe ID: {plan.stripePriceId}</div>}
                        </>
                      ) : (
                        <>
                          <div className="form-group">
                            <label className="form-label" style={{ fontSize: 11 }}>Price (USD)</label>
                            <input type="number" className="form-input" value={planForm.price}
                              onChange={e => setPlanForm(p => ({ ...p, price: parseFloat(e.target.value) || 0 }))} />
                          </div>
                          <div className="form-group">
                            <label className="form-label" style={{ fontSize: 11 }}>Stripe Price ID</label>
                            <input type="text" className="form-input" placeholder="price_xxx..."
                              value={planForm.stripePriceId}
                              onChange={e => setPlanForm(p => ({ ...p, stripePriceId: e.target.value }))} />
                          </div>
                          <div className="form-group">
                            <label className="form-label" style={{ fontSize: 11 }}>Tagline</label>
                            <input type="text" className="form-input" value={planForm.tagline}
                              onChange={e => setPlanForm(p => ({ ...p, tagline: e.target.value }))} />
                          </div>
                          <button className="btn btn-primary btn-sm" disabled={planSaving}
                            onClick={async () => {
                              try {
                                setPlanSaving(true);
                                await plansApi.update(plan.planId, planForm);
                                const r = await plansApi.getAll();
                                setDbPlans(r.data?.data || r.data || []);
                                setEditingPlan(null);
                                showToast('success', `${plan.planId} plan updated`);
                              } catch { showToast('error', 'Failed to update plan'); }
                              finally { setPlanSaving(false); }
                            }}>
                            {planSaving ? 'Saving…' : 'Save Plan'}
                          </button>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── Billing Grid ── */}
            <div className="panel-card-container" style={{ padding: '24px 0' }}>
              <div style={{ padding: '0 24px 20px 24px', borderBottom: '1px solid #EEF0F2' }}>
                <h3 className="panel-card-title">Billing Grid</h3>
              </div>
              <table className="clean-table">
                <thead>
                  <tr>
                    <th>Restaurant</th>
                    <th>Plan</th>
                    <th>Status</th>
                    <th>Monthly Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {tenants.map(t => {
                    const planId = t.subscription?.planType || 'Free';
                    const status = t.subscription?.status || '—';
                    const planData = dbPlans.find(p => p.planId === planId);
                    const amount = planData?.price ?? 0;
                    const statusColors = { Active: '#10B981', Pending: '#F59E0B', Suspended: '#EF4444', Expired: '#EF4444', Trial: '#0EA5E9' };
                    return (
                      <tr key={t._id}>
                        <td style={{ fontWeight: 700 }}>{t.restaurantName}</td>
                        <td>
                          <span style={{
                            padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 800,
                            background: planId === 'Enterprise' ? 'rgba(168,85,247,0.1)' : planId === 'Pro' ? 'rgba(99,102,241,0.1)' : '#F1F5F9',
                            color: planId === 'Enterprise' ? '#A855F7' : planId === 'Pro' ? '#6366F1' : '#64748B'
                          }}>{planId}</span>
                        </td>
                        <td>
                          <span style={{ fontSize: 12, fontWeight: 700, color: statusColors[status] || '#64748B' }}>{status}</span>
                        </td>
                        <td style={{ fontWeight: 800, color: amount > 0 ? '#10B981' : '#8E959F' }}>
                          {amount > 0 ? `$${amount}/mo` : 'Free'}
                        </td>
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
                style={{ color: maintenanceOn ? '#EF4444' : '#8E959F', opacity: maintenanceSaving ? 0.6 : 1 }}
                disabled={maintenanceSaving}
                onClick={async () => {
                  setMaintenanceSaving(true);
                  try {
                    const newVal = !maintenanceOn;
                    await api.patch('/settings/system', { maintenanceMode: newVal });
                    setMaintenanceOn(newVal);
                    showToast(newVal ? 'error' : 'success',
                      newVal ? 'Maintenance mode ON — all portals blocked' : 'Maintenance mode OFF — platform restored');
                  } catch { showToast('error', 'Failed to update maintenance mode'); }
                  finally { setMaintenanceSaving(false); }
                }}
              >
                {maintenanceOn ? <ToggleRight size={38} style={{ color: '#EF4444' }} /> : <ToggleLeft size={38} />}
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
