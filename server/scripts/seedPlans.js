require('dotenv').config();
const mongoose = require('mongoose');
const Plan = require('../modules/plans/models/plan_model');

const PLANS = [
  {
    planId:        'Free',
    name:          'DineFlow Free',
    tagline:       'Get started for free',
    price:         0,
    priceInCents:  0,
    currency:      'usd',
    stripePriceId: null,
    order:         0,
    highlights: [
      '50 menu items',
      '1 staff account',
      '100 orders/month',
    ],
    features: [
      '1 Staff account',
      '5 Menu categories',
      '50 Menu items',
      '100 Orders / month',
      'Basic Order Management',
      'Online Ordering',
    ],
  },
  {
    planId:        'Pro',
    name:          'DineFlow Pro',
    tagline:       'Most popular for growing restaurants',
    price:         49,
    priceInCents:  4900,
    currency:      'usd',
    stripePriceId: process.env.STRIPE_PRO_PRICE_ID || null,
    order:         1,
    highlights: [
      'Unlimited menu items',
      '5 staff accounts',
      '1,000 orders/month',
    ],
    features: [
      '5 Staff accounts',
      'Unlimited Menu items',
      '1,000 Orders / month',
      'Kitchen Display System (KDS)',
      'Table Reservations',
      'Inventory Tracking',
      'Advanced Order Management',
    ],
  },
  {
    planId:        'Enterprise',
    name:          'DineFlow Enterprise',
    tagline:       'For restaurant chains & power users',
    price:         149,
    priceInCents:  14900,
    currency:      'usd',
    stripePriceId: process.env.STRIPE_ENT_PRICE_ID || null,
    order:         2,
    highlights: [
      'Unlimited everything',
      'Delivery Management',
      'CRM & Loyalty',
    ],
    features: [
      'Unlimited Staff',
      'Unlimited Menu items',
      'Unlimited Orders / month',
      'Delivery Management',
      'CRM & Loyalty Program',
      'Advanced Analytics',
      'Full Analytics & Reports',
      '24/7 Priority Support',
    ],
  },
];

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  for (const planData of PLANS) {
    await Plan.findOneAndUpdate(
      { planId: planData.planId },
      { $set: planData },
      { upsert: true, new: true }
    );
    console.log(`✅ Seeded: ${planData.planId} ($${planData.price}/mo)`);
  }

  console.log('\n✨ Plans seeded successfully!');
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(err => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});
