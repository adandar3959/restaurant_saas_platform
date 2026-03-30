import { useState, useEffect, useCallback } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import {
  ShoppingBag, DollarSign, Clock, CheckCircle, TrendingUp,
  Users, UtensilsCrossed, ArrowRight, RefreshCw, Package,
  Armchair, AlertTriangle, CreditCard, Star, Truck,
  TrendingDown, Activity, Calendar, ChefHat,
} from 'lucide-react';
import { ordersApi }    from '../../api/orders.api';
import { tablesApi }    from '../../api/tables.api';
import { authApi }      from '../../api/tenant.api';
import { inventoryApi } from '../../api/inventory.api';
import { useAuth }      from '../../context/AuthContext';
import { formatCurrency, timeAgo } from '../../lib/utils';
import { ORDER_STATUS_COLORS } from '../../lib/constants';
import './AdminDashboard.css';

// ─── helpers ────────────────────────────────────────────────────────────────
const DAY_LABELS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

function getLast7Days() {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    d.setHours(0, 0, 0, 0);
    return d;
  });
}

function sameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth()    === b.getMonth()    &&
    a.getDate()     === b.getDate()
  );
}

// ─── SVG Revenue Chart ───────────────────────────────────────────────────────
function RevenueChart({ data }) {
  const maxVal = Math.max(...data.map(d => d.revenue), 1);
  const W = 700, H = 180, PL = 48, PB = 32, PR = 16, PT = 20;
  const cW = W - PL - PR;
  const cH = H - PB - PT;

  const pts = data.map((d, i) => ({
    x: PL + (i / (data.length - 1)) * cW,
    y: PT + cH - (d.revenue / maxVal) * cH,
    ...d,
  }));

  const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L${pts[pts.length-1].x},${PT+cH} L${pts[0].x},${PT+cH}Z`;

  // y-axis ticks
  const ticks = [0, 0.25, 0.5, 0.75, 1].map(t => ({
    val: maxVal * t,
    y: PT + cH - t * cH,
  }));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: H, display: 'block' }}>
      <defs>
        <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#FF6B35" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#FF6B35" stopOpacity="0"    />
        </linearGradient>
      </defs>

      {/* Grid lines */}
      {ticks.map((t, i) => (
        <g key={i}>
          <line x1={PL} y1={t.y} x2={W-PR} y2={t.y} stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
          <text x={PL-6} y={t.y+4} textAnchor="end" fontSize={9} fill="rgba(255,255,255,0.3)">
            ${t.val >= 1000 ? `${(t.val/1000).toFixed(1)}k` : t.val.toFixed(0)}
          </text>
        </g>
      ))}

      {/* Area fill */}
      <path d={areaPath} fill="url(#revGrad)" />

      {/* Line */}
      <path d={linePath} fill="none" stroke="#FF6B35" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />

      {/* Points */}
      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={4.5} fill="#FF6B35" stroke="var(--bg-surface)" strokeWidth={2} />
          {p.revenue > 0 && (
            <text x={p.x} y={p.y - 13} textAnchor="middle" fontSize={9.5} fill="#FF6B35" fontWeight="700">
              ${p.revenue >= 1000 ? `${(p.revenue/1000).toFixed(1)}k` : p.revenue.toFixed(0)}
            </text>
          )}
          <text x={p.x} y={H - 8} textAnchor="middle" fontSize={10} fill="rgba(255,255,255,0.45)">
            {DAY_LABELS[p.date.getDay()]}
          </text>
        </g>
      ))}
    </svg>
  );
}

// ─── Mini Stat Card ───────────────────────────────────────────────────────────
function MiniStat({ label, value, icon: Icon, color, sub, trend }) {
  return (
    <div className="stat-card">
      <div className="stat-card-top">
        <div className="stat-card-icon" style={{ background: `${color}20`, color }}>
          <Icon size={20} />
        </div>
        {trend !== undefined && (
          trend >= 0
            ? <TrendingUp  size={15} style={{ color: 'var(--success)' }} />
            : <TrendingDown size={15} style={{ color: 'var(--error)'   }} />
        )}
      </div>
      <div className="stat-card-label">{label}</div>
      <div className="stat-card-value" style={{ color }}>{value}</div>
      {sub && <div className="stat-card-change">{sub}</div>}
    </div>
  );
}

// ── Pulse dot ─────────────────────────────────────────────────────────────────
function PulseDot({ color = '#FF6B35' }) {
  return (
    <span style={{ position: 'relative', display: 'inline-block', width: 10, height: 10 }}>
      <span style={{
        position: 'absolute', inset: 0, borderRadius: '50%',
        background: color, opacity: 0.4,
        animation: 'pulseRing 1.5s ease-out infinite',
      }} />
      <span style={{ position: 'absolute', inset: 2, borderRadius: '50%', background: color }} />
    </span>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const { restaurantId, restaurant } = useOutletContext();
  const { user } = useAuth();
  const navigate = useNavigate();

  const isAdmin   = (user?.role || '').toLowerCase() === 'admin';
  const isManager = (user?.role || '').toLowerCase() === 'manager';

  const [orders,     setOrders]     = useState([]);
  const [tables,     setTables]     = useState([]);
  const [staff,      setStaff]      = useState([]);
  const [lowStock,   setLowStock]   = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAll = useCallback(async (silent = false) => {
    if (!restaurantId) return;
    if (silent) setRefreshing(true); else setLoading(true);
    try {
      const promises = [
        ordersApi.getOrders(restaurantId, { limit: 200, page: 1 }),
        tablesApi.getTables(restaurantId),
        authApi.getStaff({ restaurantId }),
        inventoryApi.getLowStock(restaurantId),
        tablesApi.getReservations(restaurantId),
      ];
      const [ordRes, tabRes, stfRes, lowRes, resRes] = await Promise.allSettled(promises);
      if (ordRes.status === 'fulfilled') setOrders(ordRes.value.data?.data?.orders || []);
      if (tabRes.status === 'fulfilled') setTables(tabRes.value.data?.data || []);
      if (stfRes.status === 'fulfilled') setStaff(stfRes.value.data?.data?.users || []);
      if (lowRes.status === 'fulfilled') setLowStock(lowRes.value.data?.data?.ingredients || lowRes.value.data?.data || []);
      if (resRes.status === 'fulfilled') setReservations(resRes.value.data?.data?.reservations || resRes.value.data?.data || []);
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  }, [restaurantId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Computed: common ────────────────────────────────────────────────────────
  const today = new Date(); today.setHours(0,0,0,0);
  const todayOrders   = orders.filter(o => sameDay(new Date(o.createdAt), today));
  const activeOrders  = orders.filter(o => ['Pending','Accepted','Preparing'].includes(o.status));
  const completedOrders = orders.filter(o => o.status === 'Completed');

  // ── Computed: Admin financial ────────────────────────────────────────────────
  const paidOrders    = orders.filter(o => o.paymentStatus === 'Paid');
  const totalRevenue  = paidOrders.reduce((s, o) => s + (o.totalAmount || 0), 0);
  const todayRevenue  = todayOrders.filter(o => o.paymentStatus === 'Paid').reduce((s, o) => s + (o.totalAmount || 0), 0);
  const aov           = paidOrders.length ? totalRevenue / paidOrders.length : 0;
  const completionRate= orders.length ? Math.round((completedOrders.length / orders.length) * 100) : 0;
  const unpaidAmount  = orders.filter(o => o.paymentStatus !== 'Paid').reduce((s, o) => s + (o.totalAmount || 0), 0);

  const days7 = getLast7Days();
  const dailyRevenue = days7.map(day => {
    const next = new Date(day); next.setDate(next.getDate() + 1);
    const dayO = orders.filter(o => {
      const d = new Date(o.createdAt);
      return d >= day && d < next && o.paymentStatus === 'Paid';
    });
    return { date: new Date(day), revenue: dayO.reduce((s, o) => s + (o.totalAmount || 0), 0), count: dayO.length };
  });

  // ── Computed: Manager operational ────────────────────────────────────────────
  const occupiedTables   = tables.filter(t => t.status === 'Occupied').length;
  const availableTables  = tables.filter(t => t.status === 'Available').length;
  const tableOccupancy   = tables.length ? Math.round((occupiedTables / tables.length) * 100) : 0;
  const todayReservations = reservations.filter(r => sameDay(new Date(r.reservationTime), today));
  const pendingReservations = reservations.filter(r => r.status === 'Pending').length;
  const staffByRole = {
    Chef:    staff.filter(s => s.role === 'Chef').length,
    Waiter:  staff.filter(s => s.role === 'Waiter').length,
    Driver:  staff.filter(s => s.role === 'Driver').length,
    Manager: staff.filter(s => s.role === 'Manager').length,
  };

  if (loading) {
    return (
      <div className="page-loading">
        <div className="spinner-lg" />
        <span style={{ color: 'var(--text-muted)', marginTop: 16 }}>Loading dashboard...</span>
      </div>
    );
  }

  const basePath = `/admin/${restaurantId}`;

  return (
    <div className="admin-dashboard">

      {/* ── Greeting banner ─────────────────────────────────────────────────── */}
      <div className="dash-greeting">
        <div>
          <h1 className="page-title" style={{ marginBottom: 4 }}>
            {isAdmin ? '👋 Welcome back, ' : '🎯 Operations — '}{user?.name?.split(' ')[0]}
          </h1>
          <p className="page-subtitle">
            {isAdmin
              ? `${restaurant?.restaurantName} · Financial Overview`
              : `${restaurant?.restaurantName} · Operational Overview`}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
          {/* Live indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 20, padding: '6px 14px', fontSize: 13 }}>
            <PulseDot color="#10B981" />
            <span className="text-muted">Live</span>
          </div>
          <button className="btn btn-outline btn-sm" onClick={() => fetchAll(true)} disabled={refreshing}>
            <RefreshCw size={14} className={refreshing ? 'spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
          ADMIN VIEW — Financial Focus
      ════════════════════════════════════════════════════════════════════════ */}
      {isAdmin && (
        <>
          {/* Subscription banner (only if non-Free) */}
          {restaurant?.subscription?.plan && restaurant.subscription.plan !== 'Free' && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 18px', borderRadius: 10,
              background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)',
            }}>
              <CreditCard size={16} style={{ color: '#818CF8' }} />
              <span style={{ fontSize: 13, color: '#A5B4FC' }}>
                <strong>{restaurant.subscription.plan} Plan</strong>
                {restaurant.subscription.status === 'Active' ? ' · Active' : ' · Inactive'}
                {restaurant.subscription.expiresAt && ` · Renews ${new Date(restaurant.subscription.expiresAt).toLocaleDateString()}`}
              </span>
              <button className="btn btn-ghost btn-xs" style={{ marginLeft: 'auto', color: '#818CF8' }} onClick={() => navigate(`${basePath}/settings`)}>
                Manage <ArrowRight size={12} />
              </button>
            </div>
          )}

          {/* Financial stat cards */}
          <div className="dash-stats-grid">
            <MiniStat label="Total Revenue"    value={formatCurrency(totalRevenue)}   icon={DollarSign}   color="#10B981" sub={`${paidOrders.length} paid orders`}   trend={1} />
            <MiniStat label="Today's Revenue"  value={formatCurrency(todayRevenue)}   icon={TrendingUp}   color="#FF6B35" sub={`${todayOrders.length} orders today`}  trend={todayRevenue > 0 ? 1 : 0} />
            <MiniStat label="Avg Order Value"  value={formatCurrency(aov)}            icon={Activity}     color="#6366F1" sub="per paid order" />
            <MiniStat label="Completion Rate"  value={`${completionRate}%`}           icon={CheckCircle}  color="#F59E0B" sub={`${completedOrders.length} completed`}  trend={completionRate >= 70 ? 1 : -1} />
          </div>

          {/* Revenue chart */}
          <div className="dash-section">
            <div className="dash-section-header">
              <h2 className="dash-section-title">Revenue — Last 7 Days</h2>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                Total: <strong style={{ color: 'var(--primary)' }}>{formatCurrency(dailyRevenue.reduce((s,d) => s+d.revenue, 0))}</strong>
              </div>
            </div>
            <div className="card" style={{ padding: 'var(--space-5)' }}>
              <RevenueChart data={dailyRevenue} />
              {/* Day summary row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginTop: 'var(--space-4)', borderTop: '1px solid var(--border)', paddingTop: 'var(--space-4)' }}>
                {dailyRevenue.map((d, i) => (
                  <div key={i} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 11, color: 'var(--text-subtle)', marginBottom: 2 }}>{d.count} ord</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: d.revenue > 0 ? 'var(--text)' : 'var(--text-subtle)' }}>
                      {d.revenue > 0 ? formatCurrency(d.revenue).replace(/\.00$/, '') : '—'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Order type + Payment breakdown */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-5)' }}>
            {/* Order type breakdown */}
            <div className="dash-section">
              <h2 className="dash-section-title">Order Type Mix</h2>
              <div className="card" style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                {[
                  { type: 'Dine-In',  color: '#FF6B35', icon: '🪑' },
                  { type: 'Takeaway', color: '#6366F1', icon: '🥡' },
                  { type: 'Delivery', color: '#10B981', icon: '🛵' },
                ].map(({ type, color, icon }) => {
                  const count   = orders.filter(o => o.orderType === type).length;
                  const revenue = orders.filter(o => o.orderType === type && o.paymentStatus === 'Paid').reduce((s, o) => s + (o.totalAmount || 0), 0);
                  const pct     = orders.length ? Math.round((count / orders.length) * 100) : 0;
                  return (
                    <div key={type}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, alignItems: 'center' }}>
                        <span style={{ fontSize: 14, fontWeight: 600 }}>{icon} {type}</span>
                        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                          {count} orders · <span style={{ color, fontWeight: 700 }}>{pct}%</span>
                        </span>
                      </div>
                      <div style={{ height: 6, background: 'var(--bg-surface-2)', borderRadius: 99 }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 99, transition: 'width 0.8s' }} />
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-subtle)', marginTop: 4 }}>{formatCurrency(revenue)} revenue</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Payment status */}
            <div className="dash-section">
              <h2 className="dash-section-title">Payment Overview</h2>
              <div className="card" style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
                {/* Donut-style visual */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-5)' }}>
                  <div style={{ position: 'relative', width: 80, height: 80, flexShrink: 0 }}>
                    <svg viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)', width: 80, height: 80 }}>
                      <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(239,68,68,0.2)" strokeWidth="3.8" />
                      <circle cx="18" cy="18" r="15.9" fill="none" stroke="#10B981" strokeWidth="3.8"
                        strokeDasharray={`${orders.length ? (paidOrders.length / orders.length) * 100 : 0} 100`}
                        strokeLinecap="round" />
                    </svg>
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 900, color: '#10B981' }}>
                      {orders.length ? Math.round((paidOrders.length / orders.length) * 100) : 0}%
                    </div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
                        Paid
                      </span>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 700, fontSize: 15 }}>{formatCurrency(totalRevenue)}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{paidOrders.length} orders</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#EF4444', display: 'inline-block' }} />
                        Unpaid
                      </span>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--error)' }}>{formatCurrency(unpaidAmount)}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{orders.length - paidOrders.length} orders</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent orders */}
          <div className="dash-section">
            <div className="dash-section-header">
              <h2 className="dash-section-title">Recent Orders</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => navigate(`${basePath}/orders`)}>
                View all <ArrowRight size={14} />
              </button>
            </div>
            <RecentOrdersTable orders={orders.slice(0, 8)} />
          </div>
        </>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          MANAGER VIEW — Operational Focus
      ════════════════════════════════════════════════════════════════════════ */}
      {isManager && (
        <>
          {/* Operational stat cards */}
          <div className="dash-stats-grid">
            <MiniStat label="Active Orders"    value={activeOrders.length}    icon={Clock}       color="#F59E0B" sub="need attention"  trend={activeOrders.length > 0 ? -1 : 0} />
            <MiniStat label="Tables Occupied"  value={`${occupiedTables}/${tables.length}`} icon={Armchair}   color="#6366F1" sub={`${tableOccupancy}% occupancy`} />
            <MiniStat label="Low Stock Items"  value={lowStock.length}        icon={Package}     color={lowStock.length > 0 ? '#EF4444' : '#10B981'} sub={lowStock.length > 0 ? 'restock needed' : 'all stocked'} trend={lowStock.length > 0 ? -1 : 1} />
            <MiniStat label="Today's Orders"   value={todayOrders.length}     icon={ShoppingBag} color="#10B981" sub={`${completedOrders.length} completed`} trend={1} />
          </div>

          {/* Active orders needing attention */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-5)' }}>
            <div className="dash-section">
              <div className="dash-section-header">
                <h2 className="dash-section-title">
                  🔥 Active Orders
                  {activeOrders.length > 0 && (
                    <span style={{ marginLeft: 8, background: 'rgba(245,158,11,0.15)', color: '#FCD34D', padding: '2px 10px', borderRadius: 20, fontSize: 13, fontWeight: 700 }}>
                      {activeOrders.length}
                    </span>
                  )}
                </h2>
                <button className="btn btn-ghost btn-xs" onClick={() => navigate(`${basePath}/orders`)}>View all <ArrowRight size={12} /></button>
              </div>
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {activeOrders.length === 0 ? (
                  <div className="empty-state" style={{ padding: 'var(--space-8)' }}>
                    <div className="empty-state-icon">✅</div>
                    <div className="empty-state-title">All caught up!</div>
                    <p>No active orders right now.</p>
                  </div>
                ) : (
                  activeOrders.slice(0, 6).map((o, idx) => {
                    const sc = ORDER_STATUS_COLORS[o.status] || {};
                    return (
                      <div key={o._id} style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: 'var(--space-3) var(--space-4)',
                        borderBottom: idx < activeOrders.length - 1 ? '1px solid var(--border)' : 'none',
                      }}>
                        <span style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 700, color: 'var(--primary)' }}>
                          #{o._id?.slice(-5).toUpperCase()}
                        </span>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)', flex: 1 }}>{o.orderType} · {o.items?.length} items</span>
                        <span className="status-badge" style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.color}33`, fontSize: 11 }}>
                          {o.status}
                        </span>
                        <span style={{ fontSize: 11, color: 'var(--text-subtle)' }}>{timeAgo(o.createdAt)}</span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Table status */}
            <div className="dash-section">
              <div className="dash-section-header">
                <h2 className="dash-section-title">🪑 Tables Status</h2>
                <button className="btn btn-ghost btn-xs" onClick={() => navigate(`${basePath}/tables`)}>Manage <ArrowRight size={12} /></button>
              </div>
              <div className="card" style={{ padding: 'var(--space-4)' }}>
                {/* Status summary */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
                  {[
                    { label: 'Available', count: availableTables,                                       color: '#10B981' },
                    { label: 'Occupied',  count: occupiedTables,                                        color: '#F59E0B' },
                    { label: 'Reserved',  count: tables.filter(t => t.status === 'Reserved').length,    color: '#6366F1' },
                  ].map(s => (
                    <div key={s.label} style={{ textAlign: 'center', padding: 'var(--space-3)', background: `${s.color}10`, borderRadius: 8 }}>
                      <div style={{ fontSize: 22, fontWeight: 900, color: s.color }}>{s.count}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.label}</div>
                    </div>
                  ))}
                </div>
                {/* Table grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(56px, 1fr))', gap: 6 }}>
                  {tables.slice(0, 20).map(t => {
                    const colors = { Available: '#10B981', Occupied: '#F59E0B', Reserved: '#6366F1', NeedsCleaning: '#EF4444', Inactive: '#6B7280' };
                    const c = colors[t.status] || '#6B7280';
                    return (
                      <div key={t._id} style={{
                        height: 48, borderRadius: 6, display: 'flex', alignItems: 'center',
                        justifyContent: 'center', flexDirection: 'column',
                        background: `${c}18`, border: `1.5px solid ${c}40`,
                        fontSize: 11, fontWeight: 700, color: c,
                      }}>
                        <div>T{t.tableNumber}</div>
                        <div style={{ fontSize: 9, fontWeight: 400, opacity: 0.7 }}>{t.capacity}p</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Staff overview + Low stock + Today's reservations */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-5)' }}>

            {/* Staff by role */}
            <div className="dash-section">
              <h2 className="dash-section-title">👥 Staff</h2>
              <div className="card" style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {[
                  { role: 'Chef',    icon: '👨‍🍳', color: '#F59E0B' },
                  { role: 'Waiter',  icon: '🍽️',  color: '#10B981' },
                  { role: 'Driver',  icon: '🛵',   color: '#3B82F6' },
                  { role: 'Manager', icon: '🏷️',   color: '#6366F1' },
                ].map(({ role, icon, color }) => (
                  <div key={role} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 18 }}>{icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 13, fontWeight: 600 }}>{role}</span>
                        <span style={{ fontSize: 14, fontWeight: 800, color }}>{staffByRole[role] || 0}</span>
                      </div>
                    </div>
                  </div>
                ))}
                <button className="btn btn-ghost btn-xs" style={{ marginTop: 4 }} onClick={() => navigate(`${basePath}/staff`)}>
                  Manage Staff <ArrowRight size={12} />
                </button>
              </div>
            </div>

            {/* Low stock */}
            <div className="dash-section">
              <h2 className="dash-section-title">
                📦 Low Stock {lowStock.length > 0 && <span style={{ color: 'var(--error)', fontSize: 14 }}>({lowStock.length})</span>}
              </h2>
              <div className="card" style={{ padding: 'var(--space-4)' }}>
                {lowStock.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 'var(--space-6)' }}>
                    <div style={{ fontSize: 28 }}>✅</div>
                    <div className="text-sm text-muted" style={{ marginTop: 8 }}>All stocked up</div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                    {lowStock.slice(0, 5).map(ing => (
                      <div key={ing._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderBottom: '1px solid var(--border)' }}>
                        <span style={{ fontSize: 13 }}>{ing.name}</span>
                        <span style={{ fontSize: 12, color: 'var(--error)', fontWeight: 700 }}>
                          {ing.currentStock} {ing.unit}
                        </span>
                      </div>
                    ))}
                    {lowStock.length > 5 && (
                      <button className="btn btn-ghost btn-xs" onClick={() => navigate(`${basePath}/inventory`)}>
                        +{lowStock.length - 5} more <ArrowRight size={11} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Today's reservations */}
            <div className="dash-section">
              <h2 className="dash-section-title">
                📅 Reservations
                {pendingReservations > 0 && (
                  <span style={{ marginLeft: 6, color: '#FCD34D', fontSize: 13 }}>{pendingReservations} pending</span>
                )}
              </h2>
              <div className="card" style={{ padding: 'var(--space-4)' }}>
                {todayReservations.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 'var(--space-6)' }}>
                    <div style={{ fontSize: 28 }}>📅</div>
                    <div className="text-sm text-muted" style={{ marginTop: 8 }}>No reservations today</div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                    {todayReservations.slice(0, 5).map(r => {
                      const sc = { Pending: '#FCD34D', Confirmed: '#34D399', Cancelled: '#F87171' };
                      return (
                        <div key={r._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderBottom: '1px solid var(--border)' }}>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600 }}>{r.guestName || 'Guest'}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                              {new Date(r.reservationTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {r.guestCount} guests
                            </div>
                          </div>
                          <span style={{ fontSize: 11, fontWeight: 700, color: sc[r.status] || 'var(--text-muted)' }}>{r.status}</span>
                        </div>
                      );
                    })}
                    <button className="btn btn-ghost btn-xs" onClick={() => navigate(`${basePath}/tables`)}>
                      View all <ArrowRight size={11} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Order flow KPIs */}
          <div className="dash-section">
            <h2 className="dash-section-title">📊 Order Flow Today</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 'var(--space-3)' }}>
              {[
                { label: 'Pending',   color: '#F59E0B', status: 'Pending'   },
                { label: 'Accepted',  color: '#6366F1', status: 'Accepted'  },
                { label: 'Preparing', color: '#3B82F6', status: 'Preparing' },
                { label: 'Ready',     color: '#10B981', status: 'Ready'     },
                { label: 'Completed', color: '#34D399', status: 'Completed' },
              ].map(({ label, color, status }) => {
                const count = todayOrders.filter(o => o.status === status).length;
                const pct   = todayOrders.length ? Math.round((count / todayOrders.length) * 100) : 0;
                return (
                  <div key={status} style={{ textAlign: 'center', padding: 'var(--space-4)', background: `${color}10`, borderRadius: 10, border: `1px solid ${color}25` }}>
                    <div style={{ fontSize: 28, fontWeight: 900, color }}>{count}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color, marginBottom: 4 }}>{label}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{pct}% of today</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent orders for Manager */}
          <div className="dash-section">
            <div className="dash-section-header">
              <h2 className="dash-section-title">Recent Orders</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => navigate(`${basePath}/orders`)}>
                View all <ArrowRight size={14} />
              </button>
            </div>
            <RecentOrdersTable orders={orders.slice(0, 8)} />
          </div>
        </>
      )}

      {/* Quick actions (both roles) */}
      <div className="dash-section">
        <h2 className="dash-section-title">Quick Actions</h2>
        <div className="quick-actions-grid">
          {(isAdmin ? [
            { label: 'View Orders',   icon: ShoppingBag,     path: 'orders',    color: '#FF6B35' },
            { label: 'Menu Manager',  icon: UtensilsCrossed, path: 'menu',      color: '#6366F1' },
            { label: 'Settings',      icon: CreditCard,       path: 'settings',  color: '#10B981' },
            { label: 'CRM & Reviews', icon: Star,             path: 'crm',       color: '#F59E0B' },
          ] : [
            { label: 'View Orders',   icon: ShoppingBag,     path: 'orders',    color: '#FF6B35' },
            { label: 'Manage Tables', icon: Armchair,         path: 'tables',    color: '#6366F1' },
            { label: 'Staff',         icon: Users,            path: 'staff',     color: '#10B981' },
            { label: 'Inventory',     icon: Package,          path: 'inventory', color: '#F59E0B' },
          ]).map((a, i) => {
            const Icon = a.icon;
            return (
              <button key={i} className="quick-action-card" onClick={() => navigate(`${basePath}/${a.path}`)} style={{ '--qa-color': a.color }}>
                <div className="qa-icon" style={{ background: `${a.color}20`, color: a.color }}><Icon size={22} /></div>
                <span className="qa-label">{a.label}</span>
                <ArrowRight size={14} className="qa-arrow" />
              </button>
            );
          })}
        </div>
      </div>

      <style>{`
        .dash-greeting { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: var(--space-4); }
        @keyframes pulseRing { 0% { transform: scale(1); opacity: 0.4; } 100% { transform: scale(2.5); opacity: 0; } }
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
}

// ── Shared Recent Orders Table ────────────────────────────────────────────────
function RecentOrdersTable({ orders }) {
  if (!orders.length) {
    return (
      <div className="data-table-wrap">
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <div className="empty-state-title">No orders yet</div>
        </div>
      </div>
    );
  }
  return (
    <div className="data-table-wrap">
      <table className="data-table">
        <thead>
          <tr><th>Order</th><th>Type</th><th>Items</th><th>Amount</th><th>Status</th><th>Time</th></tr>
        </thead>
        <tbody>
          {orders.map(order => {
            const sc = ORDER_STATUS_COLORS[order.status] || {};
            return (
              <tr key={order._id}>
                <td><span className="order-id">#{order._id?.slice(-6).toUpperCase()}</span></td>
                <td><span className="order-type-badge">{order.orderType}</span></td>
                <td className="text-muted">{order.items?.length || 0}</td>
                <td className="font-semi">{order.totalAmount ? formatCurrency(order.totalAmount) : '—'}</td>
                <td><span className="status-badge" style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.color}33` }}>{order.status}</span></td>
                <td className="text-muted text-sm">{timeAgo(order.createdAt)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
