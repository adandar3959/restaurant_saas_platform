import { Link } from 'react-router-dom';
import {
  ShoppingBag, ChefHat, Truck, BarChart3, Users, Star,
  ArrowRight, Utensils, Smartphone, Shield, Check, Quote,
  TrendingUp, Clock, Globe
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import './LandingPage.css';

// ── Data ─────────────────────────────────────────────────────────────────
const features = [
  {
    icon: <ShoppingBag size={24} />,
    color: '#FF6B35',
    title: 'Online Ordering',
    desc: 'Accept dine-in, takeaway, and delivery orders from a beautiful storefront. Auto-calculate totals, taxes, and discounts.',
  },
  {
    icon: <ChefHat size={24} />,
    color: '#6366F1',
    title: 'Kitchen Display System',
    desc: 'Real-time KDS for your kitchen. Tickets routed to the right prep station automatically. No more paper tickets.',
  },
  {
    icon: <Utensils size={24} />,
    color: '#10B981',
    title: 'Table Management',
    desc: 'Visual floor plan, QR-code ordering, and reservation management. Keep every table turning smoothly.',
  },
  {
    icon: <Truck size={24} />,
    color: '#F59E0B',
    title: 'Delivery Management',
    desc: 'Assign drivers, track deliveries in real-time with GPS, and manage delivery zones with geofencing.',
  },
  {
    icon: <BarChart3 size={24} />,
    color: '#EF4444',
    title: 'Inventory & Recipes',
    desc: 'Track ingredients, link recipes to menu items, get low-stock alerts, and auto-deduct stock on orders.',
  },
  {
    icon: <Users size={24} />,
    color: '#8B5CF6',
    title: 'CRM & Loyalty',
    desc: 'Reward your regulars with loyalty points, coupons, and reviews. Turn first-time visitors into loyal fans.',
  },
];

const steps = [
  {
    num: '01',
    title: 'Choose Your Plan',
    desc: 'Start free or go Pro. No credit card required for the 14-day trial.',
    icon: <Globe size={28} />,
  },
  {
    num: '02',
    title: 'Set Up Your Restaurant',
    desc: 'Add your menu, configure your hours, and customize your branding in minutes.',
    icon: <Utensils size={28} />,
  },
  {
    num: '03',
    title: 'Go Live & Grow',
    desc: 'Accept orders, manage your kitchen, and watch your revenue grow with built-in analytics.',
    icon: <TrendingUp size={28} />,
  },
];

const testimonials = [
  {
    name: 'Ahmed Raza',
    role: 'Owner, Karahi House',
    avatar: 'AR',
    rating: 5,
    text: 'DineFlow cut our order processing time by 40%. The KDS alone paid for itself in the first month. Absolutely love it.',
  },
  {
    name: 'Sarah Mitchell',
    role: 'Manager, The Burger Lab',
    avatar: 'SM',
    rating: 5,
    text: 'We went from spreadsheets to a full system in one afternoon. The onboarding is ridiculously smooth.',
  },
  {
    name: 'Khalid Hassan',
    role: 'Owner, Spice Route',
    avatar: 'KH',
    rating: 5,
    text: 'Managing 3 branches from one dashboard is a game changer. The inventory tracking alone saves us thousands.',
  },
];

const stats = [
  { value: '2,500+', label: 'Restaurants' },
  { value: '1.2M+',  label: 'Orders Processed' },
  { value: '99.9%',  label: 'Uptime SLA' },
  { value: '4.9 ★',  label: 'Average Rating' },
];

// ── Component ─────────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <div className="landing">
      <Navbar />

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section className="hero">
        <div className="hero-bg-glow" />
        <div className="container">
          <div className="hero-content">
            <div className="badge badge-primary animate-fade-up">
              <Star size={12} fill="currentColor" />
              Trusted by 2,500+ Restaurants Worldwide
            </div>

            <h1 className="hero-title animate-fade-up delay-100">
              The Only Platform
              <br />
              <span className="gradient-text">Your Restaurant Needs</span>
            </h1>

            <p className="hero-subtitle animate-fade-up delay-200">
              From online ordering to kitchen display, table management to delivery tracking —
              DineFlow unifies your entire restaurant operation in one beautiful dashboard.
            </p>

            <div className="hero-actions animate-fade-up delay-300">
              <Link to="/onboarding" className="btn btn-primary btn-lg">
                Start Free Trial
                <ArrowRight size={18} />
              </Link>
              <Link to="/pricing" className="btn btn-outline btn-lg">
                View Pricing
              </Link>
            </div>

            <div className="hero-trust animate-fade-up delay-400">
              <div className="trust-avatars">
                {['AR', 'SM', 'KH', 'MJ', 'PL'].map(a => (
                  <div key={a} className="trust-avatar">{a}</div>
                ))}
              </div>
              <span className="text-sm text-muted">
                <strong className="text-primary">4.9/5</strong> from 800+ reviews
              </span>
            </div>
          </div>

          {/* Hero visual */}
          <div className="hero-visual animate-float">
            <div className="hero-card-main glass">
              <div className="hero-card-header">
                <div className="hc-dot red" />
                <div className="hc-dot yellow" />
                <div className="hc-dot green" />
                <span className="text-xs text-muted">Live Orders Dashboard</span>
              </div>
              <div className="hero-orders">
                {[
                  { id: 'ORD-1042', type: 'Dine-In', table: 'T-4', status: 'Preparing', color: '#F59E0B' },
                  { id: 'ORD-1043', type: 'Delivery', table: 'Zone A', status: 'Ready', color: '#10B981' },
                  { id: 'ORD-1044', type: 'Takeaway', table: '—', status: 'Pending', color: '#6366F1' },
                ].map(o => (
                  <div key={o.id} className="hero-order-row">
                    <div>
                      <div className="text-sm font-semi">{o.id}</div>
                      <div className="text-xs text-muted">{o.type} · {o.table}</div>
                    </div>
                    <span className="hero-status-badge" style={{ background: `${o.color}22`, color: o.color, border: `1px solid ${o.color}44` }}>
                      {o.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Floating mini card */}
            <div className="hero-float-card glass">
              <TrendingUp size={18} style={{ color: '#10B981' }} />
              <div>
                <div className="text-sm font-bold" style={{ color: '#10B981' }}>+23% Revenue</div>
                <div className="text-xs text-muted">vs last month</div>
              </div>
            </div>

            <div className="hero-float-card-2 glass">
              <Clock size={18} style={{ color: '#F59E0B' }} />
              <div>
                <div className="text-sm font-bold">18 min</div>
                <div className="text-xs text-muted">Avg prep time</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ────────────────────────────────────────────────────── */}
      <section className="stats-bar">
        <div className="container">
          <div className="stats-grid">
            {stats.map(s => (
              <div key={s.label} className="stat-item">
                <div className="stat-value gradient-text">{s.value}</div>
                <div className="stat-label text-muted text-sm">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────────── */}
      <section className="section" id="features">
        <div className="container">
          <div className="section-header text-center">
            <div className="section-tag">✨ Everything You Need</div>
            <h2 className="section-title">
              One Platform,<br /><span className="gradient-text">Infinite Possibilities</span>
            </h2>
            <p className="section-subtitle" style={{ margin: '0 auto' }}>
              Every feature your restaurant needs — built in, not bolted on. No integrations, no extra costs.
            </p>
          </div>

          <div className="features-grid">
            {features.map((f, i) => (
              <div key={i} className="feature-card card" style={{ '--feature-color': f.color }}>
                <div className="feature-icon-wrap" style={{ background: `${f.color}18`, color: f.color }}>
                  {f.icon}
                </div>
                <h3 className="feature-title">{f.title}</h3>
                <p className="feature-desc text-muted text-sm">{f.desc}</p>
                <div className="feature-arrow">
                  <ArrowRight size={16} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────── */}
      <section className="section how-section" id="how-it-works">
        <div className="container">
          <div className="section-header text-center">
            <div className="section-tag">🚀 Quick Setup</div>
            <h2 className="section-title">Up and Running in <span className="gradient-text">Minutes</span></h2>
          </div>

          <div className="steps-grid">
            {steps.map((s, i) => (
              <div key={i} className="step-card">
                <div className="step-num">{s.num}</div>
                <div className="step-icon-wrap">{s.icon}</div>
                <h3 className="step-title">{s.title}</h3>
                <p className="text-muted text-sm">{s.desc}</p>
                {i < steps.length - 1 && <div className="step-connector" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────────────────────────── */}
      <section className="section">
        <div className="container">
          <div className="section-header text-center">
            <div className="section-tag">❤️ Loved by Owners</div>
            <h2 className="section-title">Don't Take Our <span className="gradient-text">Word for It</span></h2>
          </div>

          <div className="testimonials-grid">
            {testimonials.map((t, i) => (
              <div key={i} className="testimonial-card card">
                <Quote size={28} className="quote-icon" />
                <div className="stars">
                  {[...Array(t.rating)].map((_, j) => (
                    <Star key={j} size={14} fill="#F59E0B" color="#F59E0B" />
                  ))}
                </div>
                <p className="testimonial-text">"{t.text}"</p>
                <div className="testimonial-author">
                  <div className="author-avatar">{t.avatar}</div>
                  <div>
                    <div className="font-semi text-sm">{t.name}</div>
                    <div className="text-xs text-muted">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ──────────────────────────────────────────────── */}
      <section className="section-sm">
        <div className="container">
          <div className="cta-banner">
            <div className="cta-glow" />
            <div className="cta-content">
              <h2 className="cta-title">Ready to Transform<br /><span className="gradient-text">Your Restaurant?</span></h2>
              <p className="text-muted" style={{ maxWidth: 480 }}>
                Join 2,500+ restaurants already using DineFlow. Start your free trial today — no credit card required.
              </p>
              <div className="flex gap-4" style={{ justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link to="/onboarding" className="btn btn-primary btn-lg">
                  Start Free Trial <ArrowRight size={18} />
                </Link>
                <Link to="/pricing" className="btn btn-outline btn-lg">
                  See All Plans
                </Link>
              </div>
              <div className="cta-checks">
                {['14-day free trial', 'No credit card required', 'Cancel anytime'].map(c => (
                  <span key={c} className="cta-check">
                    <Check size={14} style={{ color: 'var(--success)' }} />
                    {c}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
