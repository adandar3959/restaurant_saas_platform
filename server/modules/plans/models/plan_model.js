const mongoose = require('mongoose');

const planSchema = new mongoose.Schema(
  {
    planId:       { type: String, enum: ['Free', 'Pro', 'Enterprise'], required: true, unique: true },
    name:         { type: String, required: true },
    tagline:      { type: String, default: '' },
    price:        { type: Number, required: true, default: 0 },   // in USD, for display
    priceInCents: { type: Number, required: true, default: 0 },   // for Stripe API
    currency:     { type: String, default: 'usd' },
    stripePriceId:{ type: String, default: null },                // from Stripe dashboard
    features:     [{ type: String }],                             // feature list shown on pricing/settings
    highlights:   [{ type: String }],                             // short bullets shown on onboarding
    isActive:     { type: Boolean, default: true },
    order:        { type: Number, default: 0 },                   // display order (0=Free,1=Pro,2=Ent)
  },
  { timestamps: true }
);

module.exports = mongoose.model('Plan', planSchema);
