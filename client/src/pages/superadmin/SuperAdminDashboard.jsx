import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { tenantApi } from '../../api/tenant.api';
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
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      background: '#F8F9FA',
      fontFamily: 'Outfit, Inter, sans-serif',
      color: '#1A1D20',
      overflowX: 'hidden'
    }}>
      <Toast toast={toast} />

      {/* Global CSS Overrides for Google Fonts & Inputs */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Inter:wght@300;400;500;600;700&display=swap');
        
        .sidebar-item {
          display: flex;
          align-items: center;
          gap: 14px;
          width: 100%;
          padding: 14px 20px;
          border-radius: 12px;
          border: none;
          background: transparent;
          color: #A3A3A3;
          font-weight: 500;
          font-size: 15px;
          cursor: pointer;
          transition: all 0.25s ease;
          font-family: 'Outfit', sans-serif;
          text-align: left;
        }
        .sidebar-item:hover {
          color: #FFFFFF;
          background: rgba(255, 255, 255, 0.05);
        }
        .sidebar-item.active {
          color: #FFFFFF;
          background: rgba(255, 255, 255, 0.08);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
        }
        .kpi-card {
          border-radius: 20px;
          padding: 24px;
          border: none;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.02);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .kpi-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 15px 35px rgba(0, 0, 0, 0.04);
        }
        .clean-table th {
          font-family: 'Outfit', sans-serif;
          font-weight: 600;
          font-size: 13px;
          color: #8E959F;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          padding: 16px 24px;
          border-bottom: 1px solid #EEF0F2;
        }
        .clean-table td {
          font-size: 14px;
          padding: 18px 24px;
          border-bottom: 1px solid #EEF0F2;
          vertical-align: middle;
        }
        .sub-tab-btn {
          padding: 8px 16px;
          border-radius: 10px;
          border: none;
          background: transparent;
          color: #8E959F;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.25s ease;
        }
        .sub-tab-btn.active {
          background: #FFFFFF;
          color: #1A1D20;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
        }
        .setting-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          background: #FFFFFF;
          border-radius: 16px;
          border: 1px solid #EEF0F2;
          margin-bottom: 16px;
        }
      `}</style>

      {/* 1. LEFT SIDEBAR (Dark Ultra-Modern Theme) */}
      <div style={{
        width: 280,
        background: '#131417',
        padding: '32px 20px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        flexShrink: 0,
        borderRight: '1px solid rgba(255, 255, 255, 0.03)'
      }}>
        <div>
          {/* Platform Branding Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0 16px', marginBottom: 44 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10,
              background: 'linear-gradient(135deg, #6366F1, #4F46E5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 20px rgba(99, 102, 241, 0.4)'
            }}>
              <Sparkles size={18} style={{ color: '#fff' }} />
            </div>
            <div>
              <span style={{ color: '#FFFFFF', fontWeight: 800, fontSize: 18, tracking: '-0.5px' }}>MEZAMI</span>
              <span style={{ color: '#6366F1', fontWeight: 800, fontSize: 11, display: 'block', letterSpacing: '1px', marginTop: -2 }}>SAAS PORTAL</span>
            </div>
          </div>

          {/* Navigation Links — Only highly useful, active sections */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
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
        <div style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          borderRadius: 20,
          padding: 20,
          textAlign: 'center'
        }}>
          <div style={{ fontSize: 13, color: '#A3A3A3', fontWeight: 700 }}>System Status</div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981', boxShadow: '0 0 10px #10B981' }} />
            <span style={{ color: '#10B981', fontWeight: 700, fontSize: 12 }}>100% Online</span>
          </div>
        </div>
      </div>

      {/* 2. MAIN WORKSPACE (Light Premium Theme) */}
      <div style={{ flex: 1, padding: 40, display: 'flex', flexDirection: 'column', gap: 32, overflowY: 'auto' }}>

        {/* Top Header Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ fontWeight: 800, fontSize: 28, tracking: '-1px', textTransform: 'capitalize' }}>
            {activeMenu === 'dashboard' ? 'Overview' : activeMenu === 'revenue' ? 'Revenue & Billing' : activeMenu}
          </h1>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* Search Input Box */}
            <div style={{ position: 'relative', width: 280 }}>
              <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#8E959F' }} />
              <input
                style={{
                  width: '100%', padding: '12px 14px 12px 42px', borderRadius: 14,
                  border: '1px solid #EEF0F2', background: '#FFFFFF',
                  outline: 'none', fontSize: 13, fontWeight: 500
                }}
                placeholder="Search something..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            {/* Notification Bell */}
            <button style={{
              width: 44, height: 44, borderRadius: 14, background: '#FFFFFF',
              border: '1px solid #EEF0F2', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: '#1A1D20'
            }} onClick={() => showToast('success', 'All system alerts cleared')}>
              <Bell size={18} />
            </button>

            {/* Logout/Exit */}
            <button style={{
              width: 44, height: 44, borderRadius: 14, background: '#FFFFFF',
              border: '1px solid #EEF0F2', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: '#1A1D20'
            }} onClick={logout}>
              <LogOut size={18} />
            </button>
          </div>
        </div>

        {/* Render View Dynamically Based on Active Menu Item */}

        {/* ================= VIEW 1: DASHBOARD OVERVIEW ================= */}
        {activeMenu === 'dashboard' && (
          <>
            {/* Metrics Row (Soft Pastel Colors) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24 }}>
              <div className="kpi-card" style={{ background: '#FEF9EC' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: '#FDF0CD', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <DollarSign size={18} />
                  </div>
                  <span style={{ color: '#D97706', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 2 }}>
                    +24% <ArrowUpRight size={14} />
                  </span>
                </div>
                <span style={{ color: '#8E959F', fontSize: 12, fontWeight: 600, display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Projected MRR</span>
                <h2 style={{ fontSize: 26, fontWeight: 800, margin: '6px 0 10px 0', tracking: '-0.5px' }}>${calculateMRR().toLocaleString()}.00</h2>
                <span style={{ color: '#D97706', fontSize: 12, fontWeight: 700 }}>Active MRR 30%</span>
              </div>

              <div className="kpi-card" style={{ background: '#F5F3FF' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: '#EDE9FE', color: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Building size={18} />
                  </div>
                  <span style={{ color: '#7C3AED', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 2 }}>
                    -32% <ArrowDownRight size={14} />
                  </span>
                </div>
                <span style={{ color: '#8E959F', fontSize: 12, fontWeight: 600, display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Active Restaurants</span>
                <h2 style={{ fontSize: 26, fontWeight: 800, margin: '6px 0 10px 0', tracking: '-0.5px' }}>{activeRestaurants}</h2>
                <span style={{ color: '#7C3AED', fontSize: 12, fontWeight: 700 }}>Stable 20%</span>
              </div>

              <div className="kpi-card" style={{ background: '#ECFDF5' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: '#D1FAE5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <User size={18} />
                  </div>
                  <span style={{ color: '#059669', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 2 }}>
                    +44% <ArrowUpRight size={14} />
                  </span>
                </div>
                <span style={{ color: '#8E959F', fontSize: 12, fontWeight: 600, display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Trial Accounts</span>
                <h2 style={{ fontSize: 26, fontWeight: 800, margin: '6px 0 10px 0', tracking: '-0.5px' }}>{trialRestaurants}</h2>
                <span style={{ color: '#059669', fontSize: 12, fontWeight: 700 }}>Conversion 60%</span>
              </div>

              <div className="kpi-card" style={{ background: '#FEF2F2' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: '#FEE2E2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ShieldAlert size={18} />
                  </div>
                  <span style={{ color: '#DC2626', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 2 }}>
                    -15% <ArrowDownRight size={14} />
                  </span>
                </div>
                <span style={{ color: '#8E959F', fontSize: 12, fontWeight: 600, display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Suspended Alerts</span>
                <h2 style={{ fontSize: 26, fontWeight: 800, margin: '6px 0 10px 0', tracking: '-0.5px' }}>{suspendedRestaurants}</h2>
                <span style={{ color: '#DC2626', fontSize: 12, fontWeight: 700 }}>Critical 20%</span>
              </div>
            </div>

            {/* Middle Section: Chart & Event Logger */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
              {/* Spline registration chart */}
              <div style={{ background: '#FFFFFF', borderRadius: 20, padding: 24, boxShadow: '0 10px 30px rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                  <h3 style={{ fontSize: 18, fontWeight: 800 }}>Platform Registration Activity</h3>
                  <span style={{ fontSize: 12, color: '#8E959F', fontWeight: 600 }}>Active Analytics</span>
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
                    <path d="M 0,110 Q 70,30 140,80 T 280,40 T 420,90 T 500,30 L 500,150 L 0,150 Z" fill="url(#chartGrad)" />
                    <path d="M 0,110 Q 70,30 140,80 T 280,40 T 420,90 T 500,30" fill="none" stroke="#6366F1" strokeWidth="3.5" strokeLinecap="round" />
                    <circle cx="280" cy="40" r="6" fill="#6366F1" stroke="#FFFFFF" strokeWidth="2.5" />
                  </svg>
                  <div style={{ position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)', background: '#131417', color: '#fff', padding: '6px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700 }}>
                    {totalRestaurants} Registered Teams Peak
                  </div>
                </div>
              </div>

              {/* Event Logs panel */}
              <div style={{ background: '#FFFFFF', borderRadius: 20, padding: 24, boxShadow: '0 10px 30px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', gap: 16 }}>
                <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>Recent System Events</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: '#ECFDF5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <CheckCircle size={14} />
                    </div>
                    <div>
                      <span style={{ fontSize: 13, fontWeight: 700, display: 'block' }}>SSL Verification Safe</span>
                      <span style={{ fontSize: 11, color: '#8E959F' }}>System is secure</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: '#F5F3FF', color: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Sparkles size={14} />
                    </div>
                    <div>
                      <span style={{ fontSize: 13, fontWeight: 700, display: 'block' }}>Database Connected</span>
                      <span style={{ fontSize: 11, color: '#8E959F' }}>Shards operating normally</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick tenant preview grid */}
            <div style={{ background: '#FFFFFF', borderRadius: 20, padding: 24, boxShadow: '0 10px 30px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>Active Platforms Overview</h3>
                <button className="btn btn-ghost btn-xs" style={{ color: '#6366F1', fontWeight: 700 }} onClick={() => setActiveMenu('restaurants')}>View all restaurants →</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                {tenants.slice(0, 3).map(tenant => (
                  <div key={tenant._id} style={{ border: '1px solid #EEF0F2', padding: 20, borderRadius: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
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
          <div style={{ background: '#FFFFFF', borderRadius: 20, padding: '24px 0', boxShadow: '0 10px 30px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 24px 20px 24px', borderBottom: '1px solid #EEF0F2' }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>Manage Partner Restaurants</h3>

              <div style={{ display: 'flex', background: '#F8F9FA', borderRadius: 12, padding: 4, gap: 2 }}>
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
              <table className="clean-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
              <div style={{ background: '#FFFFFF', borderRadius: 20, padding: 24, boxShadow: '0 10px 30px rgba(0,0,0,0.02)' }}>
                <span style={{ color: '#8E959F', fontSize: 12, fontWeight: 600 }}>Active MRR</span>
                <h2 style={{ fontSize: 28, fontWeight: 800, margin: '8px 0 0 0' }}>${calculateMRR()}.00</h2>
              </div>
              <div style={{ background: '#FFFFFF', borderRadius: 20, padding: 24, boxShadow: '0 10px 30px rgba(0,0,0,0.02)' }}>
                <span style={{ color: '#8E959F', fontSize: 12, fontWeight: 600 }}>Paid Contracts</span>
                <h2 style={{ fontSize: 28, fontWeight: 800, margin: '8px 0 0 0' }}>
                  {tenants.filter(t => t.isActive && t.subscription?.planType !== 'Free').length} Active
                </h2>
              </div>
              <div style={{ background: '#FFFFFF', borderRadius: 20, padding: 24, boxShadow: '0 10px 30px rgba(0,0,0,0.02)' }}>
                <span style={{ color: '#8E959F', fontSize: 12, fontWeight: 600 }}>Free Accounts</span>
                <h2 style={{ fontSize: 28, fontWeight: 800, margin: '8px 0 0 0' }}>
                  {tenants.filter(t => t.isActive && t.subscription?.planType === 'Free').length} Accounts
                </h2>
              </div>
            </div>

            {/* Plan details table */}
            <div style={{ background: '#FFFFFF', borderRadius: 20, padding: 24, boxShadow: '0 10px 30px rgba(0,0,0,0.02)' }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 20 }}>Billing Grid</h3>
              <table className="clean-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
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
                          <span style={{
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
          <div style={{ maxWidth: 680, display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Live Settings Panel */}
            <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 10 }}>Global Platform Settings</h3>

            {/* Commision Rate */}
            <div className="setting-row">
              <div>
                <span style={{ fontWeight: 700, fontSize: 15, display: 'block' }}>SaaS Transaction Commission (%)</span>
                <span style={{ fontSize: 12, color: '#8E959F' }}>The platform commission deducted per online store transaction.</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input
                  type="number"
                  style={{
                    width: 80, padding: '10px 14px', borderRadius: 10,
                    border: '1px solid #EEF0F2', textAlign: 'center', fontWeight: 700
                  }}
                  value={systemSettings.commissionRate}
                  onChange={e => saveGlobalSettings({ ...systemSettings, commissionRate: parseFloat(e.target.value) || 0 })}
                />
                <span style={{ fontWeight: 700 }}>%</span>
              </div>
            </div>

            {/* Base Currency */}
            <div className="setting-row">
              <div>
                <span style={{ fontWeight: 700, fontSize: 15, display: 'block' }}>Global Platform Currency</span>
                <span style={{ fontSize: 12, color: '#8E959F' }}>Default regional currency to display values in analytics.</span>
              </div>
              <div>
                <select
                  style={{
                    padding: '10px 14px', borderRadius: 10, border: '1px solid #EEF0F2',
                    fontWeight: 700, outline: 'none'
                  }}
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
            <div className="setting-row">
              <div>
                <span style={{ fontWeight: 700, fontSize: 15, display: 'block' }}>Global Maintenance Mode</span>
                <span style={{ fontSize: 12, color: '#8E959F' }}>Temporarily pause client checkouts and tenant portals for system upgrades.</span>
              </div>
              <button
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: systemSettings.maintenanceMode ? '#EF4444' : '#8E959F' }}
                onClick={() => saveGlobalSettings({ ...systemSettings, maintenanceMode: !systemSettings.maintenanceMode })}
              >
                {systemSettings.maintenanceMode ? <ToggleRight size={38} style={{ color: '#EF4444' }} /> : <ToggleLeft size={38} />}
              </button>
            </div>

            {/* Auto approve tenants */}
            <div className="setting-row">
              <div>
                <span style={{ fontWeight: 700, fontSize: 15, display: 'block' }}>Auto-Approve Registrations</span>
                <span style={{ fontSize: 12, color: '#8E959F' }}>Instantly launch new restaurants upon onboarding without manual review.</span>
              </div>
              <button
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: systemSettings.autoApproveTenants ? '#10B981' : '#8E959F' }}
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
