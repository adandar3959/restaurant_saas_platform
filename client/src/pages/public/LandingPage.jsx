import { Link } from 'react-router-dom';
import {
  ShoppingBag, ChefHat, Truck, BarChart3, Users, Star,
  ArrowRight, Utensils, Smartphone, Shield, Check, Quote,
  TrendingUp, Clock, Globe
} from 'lucide-react';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import './LandingPage.css';

const features = [
  { icon: <ShoppingBag size={22} />, color: '#7C3AED', bg: '#f5f3ff', title: 'Online Ordering', desc: 'Accept dine-in, takeaway, and delivery orders from a beautiful storefront. Auto-calculate totals, taxes, and discounts.' },
  { icon: <ChefHat size={22} />, color: '#6366F1', bg: '#eef2ff', title: 'Kitchen Display System', desc: 'Real-time KDS for your kitchen. Tickets routed to the right prep station automatically. No more paper tickets.' },
  { icon: <Utensils size={22} />, color: '#10B981', bg: '#ecfdf5', title: 'Table Management', desc: 'Visual floor plan, QR-code ordering, and reservation management. Keep every table turning smoothly.' },
  { icon: <Truck size={22} />, color: '#8B5CF6', bg: '#f5f3ff', title: 'Delivery Management', desc: 'Assign drivers, track deliveries in real-time with GPS, and manage delivery zones with geofencing.' },
  { icon: <BarChart3 size={22} />, color: '#A78BFA', bg: '#ede9fe', title: 'Inventory & Recipes', desc: 'Track ingredients, link recipes to menu items, get low-stock alerts, and auto-deduct stock on orders.' },
  { icon: <Users size={22} />, color: '#6D28D9', bg: '#f5f3ff', title: 'CRM & Loyalty', desc: 'Reward your regulars with loyalty points, coupons, and reviews. Turn first-time visitors into loyal fans.' },
];

const steps = [
  { num: '01', title: 'Choose Your Plan', desc: 'Start free or go Pro. No credit card required for the 14-day trial.', icon: <Globe size={24} /> },
  { num: '02', title: 'Set Up Your Restaurant', desc: 'Add your menu, configure your hours, and customize your branding in minutes.', icon: <Utensils size={24} /> },
  { num: '03', title: 'Go Live & Grow', desc: 'Accept orders, manage your kitchen, and watch your revenue grow with built-in analytics.', icon: <TrendingUp size={24} /> },
];

const testimonials = [
  { name: 'Ahmed Raza', role: 'Owner, Karahi House', avatar: 'AR', rating: 5, text: 'DineFlow cut our order processing time by 40%. The KDS alone paid for itself in the first month. Absolutely love it.' },
  { name: 'Sarah Mitchell', role: 'Manager, The Burger Lab', avatar: 'SM', rating: 5, text: 'We went from spreadsheets to a full system in one afternoon. The onboarding is ridiculously smooth.' },
  { name: 'Khalid Hassan', role: 'Owner, Spice Route', avatar: 'KH', rating: 5, text: 'Managing 3 branches from one dashboard is a game changer. The inventory tracking alone saves us thousands.' },
];

const stats = [
  { value: '2,500+', label: 'Restaurants' },
  { value: '1.2M+', label: 'Orders Processed' },
  { value: '99.9%', label: 'Uptime SLA' },
  { value: '4.9 ★', label: 'Average Rating' },
];

export default function LandingPage() {
  return (
    <div className="landing">
      <Navbar />

      {}
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
                Start Free Trial <ArrowRight size={18} />
              </Link>
              <Link to="/pricing" className="btn btn-outline btn-lg">View Pricing</Link>
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

          <div className="hero-visual animate-float">
            <div className="hero-card-main glass">
              <div className="hero-card-header">
                <div className="hc-dot red" /><div className="hc-dot yellow" /><div className="hc-dot green" />
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

      {}
      <section className="stats-bar">
        <div className="container">
          <div className="stats-grid">
            {stats.map(s => (
              <div key={s.label} className="stat-item">
                <div className="stat-value">{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {}
      <section className="section-light" id="features">
        <div className="container">
          <div className="section-header text-center">
            <div className="section-tag-light">✨ Everything You Need</div>
            <h2 className="section-title-light">
              One Platform, <span>Infinite Possibilities</span>
            </h2>
            <p className="section-subtitle-light">
              Every feature your restaurant needs — built in, not bolted on. No integrations, no extra costs.
            </p>
          </div>
          <div className="features-grid">
            {features.map((f, i) => (
              <div key={i} className="feature-card-light">
                <div className="feature-icon-light" style={{ background: f.bg, color: f.color }}>
                  {f.icon}
                </div>
                <h3 className="feature-title-light">{f.title}</h3>
                <p className="feature-desc-light">{f.desc}</p>
                <div className="feature-arrow-light">
                  <ArrowRight size={16} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {}
      <section className="section-light-alt" id="how-it-works">
        <div className="container">
          <div className="section-header text-center">
            <div className="section-tag-light">🚀 Quick Setup</div>
            <h2 className="section-title-light">
              Up and Running in <span>Minutes</span>
            </h2>
            <p className="section-subtitle-light">
              No technical knowledge required. If you can use a smartphone, you can run DineFlow.
            </p>
          </div>
          <div className="steps-grid">
            {steps.map((s, i) => (
              <div key={i} className="step-card-light">
                <div className="step-num-light">{s.num}</div>
                <div className="step-icon-light">{s.icon}</div>
                <h3 className="step-title-light">{s.title}</h3>
                <p className="step-desc-light">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {}
      <section className="section-light">
        <div className="container">
          <div className="section-header text-center">
            <div className="section-tag-light">❤️ Loved by Owners</div>
            <h2 className="section-title-light">
              Don't Take Our <span>Word for It</span>
            </h2>
            <p className="section-subtitle-light">
              Thousands of restaurant owners trust DineFlow to run their business every day.
            </p>
          </div>
          <div className="testimonials-grid">
            {testimonials.map((t, i) => (
              <div key={i} className="testimonial-card-light">
                <Quote size={28} className="quote-icon-light" />
                <div className="stars">
                  {[...Array(t.rating)].map((_, j) => (
                    <Star key={j} size={14} fill="#F59E0B" color="#F59E0B" />
                  ))}
                </div>
                <p className="testimonial-text-light">"{t.text}"</p>
                <div className="testimonial-author-light">
                  <div className="author-avatar-light">{t.avatar}</div>
                  <div>
                    <div className="author-name-light">{t.name}</div>
                    <div className="author-role-light">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {}
      <section className="section-light-alt">
        <div className="container">
          <div className="cta-banner-light">
            <div className="cta-content-light">
              <h2 className="cta-title-light">
                Ready to Transform<br /><span>Your Restaurant?</span>
              </h2>
              <p className="cta-subtitle-light">
                Join 2,500+ restaurants already using DineFlow. Start your free trial today — no credit card required.
              </p>
              <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link to="/onboarding" className="btn btn-primary btn-lg">
                  Start Free Trial <ArrowRight size={18} />
                </Link>
                <Link to="/pricing" className="btn btn-outline btn-lg">See All Plans</Link>
              </div>
              <div className="cta-checks-light">
                {['14-day free trial', 'No credit card required', 'Cancel anytime'].map(c => (
                  <span key={c} className="cta-check-light">
                    <Check size={14} style={{ color: '#10B981' }} />
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
