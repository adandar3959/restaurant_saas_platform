import { Link } from 'react-router-dom';
import { Check, ArrowRight, Zap, Building2, Sprout } from 'lucide-react';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import PlanCard from '../../components/shared/PlanCard';
import './PricingPage.css';

const plans = [
  {
    id: 'Free',
    name: 'Free',
    price: 0,
    trialDays: 0,
    description: 'Perfect for small restaurants just getting started.',
    features: [
      { label: 'Online Ordering',         included: true },
      { label: 'Menu Management',          included: true },
      { label: 'Basic Order Management',   included: true },
      { label: 'Table Reservations',       included: false },
      { label: 'Kitchen Display System',   included: false },
      { label: 'Inventory Tracking',       included: false },
      { label: 'Loyalty Program',          included: false },
      { label: 'Delivery Management',      included: false },
      { label: 'Advanced Analytics',       included: false },
      { label: 'Multi-Location Support',   included: false },
      { label: 'API Access',               included: false },
    ],
    limits: [
      { label: 'Menu Items',    value: '50 items' },
      { label: 'Staff Accounts',value: '5 accounts' },
      { label: 'Orders / Month',value: '500 orders' },
      { label: 'Branches',      value: '1 branch' },
    ],
  },
  {
    id: 'Pro',
    name: 'Pro',
    price: 49,
    trialDays: 14,
    description: 'Everything a growing restaurant needs to scale.',
    features: [
      { label: 'Online Ordering',         included: true },
      { label: 'Menu Management',          included: true },
      { label: 'Advanced Order Management',included: true },
      { label: 'Table Reservations',       included: true },
      { label: 'Kitchen Display System',   included: true },
      { label: 'Inventory Tracking',       included: true },
      { label: 'Loyalty Program',          included: true },
      { label: 'Delivery Management',      included: true },
      { label: 'Advanced Analytics',       included: false },
      { label: 'Multi-Location Support',   included: false },
      { label: 'API Access',               included: false },
    ],
    limits: [
      { label: 'Menu Items',    value: 'Unlimited' },
      { label: 'Staff Accounts',value: '25 accounts' },
      { label: 'Orders / Month',value: 'Unlimited' },
      { label: 'Branches',      value: '1 branch' },
    ],
  },
  {
    id: 'Enterprise',
    name: 'Enterprise',
    price: 149,
    trialDays: 14,
    description: 'Full power for multi-branch restaurant chains.',
    features: [
      { label: 'Online Ordering',         included: true },
      { label: 'Menu Management',          included: true },
      { label: 'Advanced Order Management',included: true },
      { label: 'Table Reservations',       included: true },
      { label: 'Kitchen Display System',   included: true },
      { label: 'Inventory Tracking',       included: true },
      { label: 'Loyalty Program',          included: true },
      { label: 'Delivery Management',      included: true },
      { label: 'Advanced Analytics',       included: true },
      { label: 'Multi-Location Support',   included: true },
      { label: 'API Access',               included: true },
    ],
    limits: [
      { label: 'Menu Items',    value: 'Unlimited' },
      { label: 'Staff Accounts',value: 'Unlimited' },
      { label: 'Orders / Month',value: 'Unlimited' },
      { label: 'Branches',      value: 'Unlimited' },
    ],
  },
];

const compareFeatures = [
  { name: 'Online Ordering',         free: true,  pro: true,  ent: true },
  { name: 'Menu Management',          free: true,  pro: true,  ent: true },
  { name: 'Table Reservations',       free: false, pro: true,  ent: true },
  { name: 'Kitchen Display System',   free: false, pro: true,  ent: true },
  { name: 'Inventory Tracking',       free: false, pro: true,  ent: true },
  { name: 'Loyalty & CRM',            free: false, pro: true,  ent: true },
  { name: 'Delivery Management',      free: false, pro: true,  ent: true },
  { name: 'Advanced Analytics',       free: false, pro: false, ent: true },
  { name: 'Multi-Location',           free: false, pro: false, ent: true },
  { name: 'Custom Domain',            free: false, pro: false, ent: true },
  { name: 'API Access',               free: false, pro: false, ent: true },
  { name: 'Priority Support',         free: false, pro: false, ent: true },
];

const faqs = [
  {
    q: 'Do I need a credit card to start?',
    a: 'No! The Free plan requires no card. The Pro and Enterprise trials are also free for 14 days, card added after trial.',
  },
  {
    q: 'Can I change plans later?',
    a: 'Absolutely. Upgrade or downgrade anytime from your admin dashboard. Upgrades take effect immediately.',
  },
  {
    q: 'What happens when my trial ends?',
    a: 'You will get a reminder 3 days before. If you do not add a payment method, your account drops to the Free plan.',
  },
  {
    q: 'Is there a setup fee?',
    a: 'Zero. No setup fees, no hidden costs. The price you see is exactly what you pay.',
  },
];

export default function PricingPage() {
  return (
    <div>
      <Navbar />
      <div className="pricing-page">
        {}
        <div className="pricing-hero">
          <div className="container text-center">
            <div className="section-tag" style={{ marginBottom: 'var(--space-4)', display: 'inline-flex' }}>
              💳 Simple, Transparent Pricing
            </div>
            <h1 className="section-title">
              Start Free, Scale with <span className="gradient-text">Confidence</span>
            </h1>
            <p className="section-subtitle" style={{ margin: '0 auto' }}>
              No long-term contracts. No hidden fees. Cancel anytime.
              Every plan includes a free onboarding call.
            </p>
          </div>
        </div>

        {}
        <div className="container">
          <div className="plans-grid">
            {plans.map((plan, i) => (
              <PlanCard key={plan.id} plan={plan} isPopular={plan.id === 'Pro'} />
            ))}
          </div>

          {}
          <div className="compare-section">
            <h2 className="text-2xl font-bold text-center mb-8">Compare All Features</h2>
            <div className="compare-table">
              <div className="compare-header">
                <div className="compare-cell compare-label-cell">Feature</div>
                {['🌱 Free', '⚡ Pro', '🏢 Enterprise'].map(p => (
                  <div key={p} className="compare-cell compare-plan-name">{p}</div>
                ))}
              </div>
              {compareFeatures.map((f, i) => (
                <div key={i} className={`compare-row ${i % 2 === 0 ? 'compare-row-alt' : ''}`}>
                  <div className="compare-cell compare-label">{f.name}</div>
                  {[f.free, f.pro, f.ent].map((v, j) => (
                    <div key={j} className="compare-cell compare-value">
                      {v
                        ? <Check size={18} style={{ color: 'var(--success)' }} />
                        : <span style={{ color: 'var(--text-subtle)', fontSize: 18 }}>—</span>
                      }
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {}
          <div className="faq-section">
            <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
            <div className="faq-grid">
              {faqs.map((f, i) => (
                <div key={i} className="faq-card card">
                  <h3 className="faq-q">{f.q}</h3>
                  <p className="faq-a text-muted text-sm">{f.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
