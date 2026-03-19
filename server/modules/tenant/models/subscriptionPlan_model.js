const mongoose = require('mongoose');

// Defines the platform's subscription tiers (managed by SuperAdmin)
const subscriptionPlanSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true }, // "Free", "Pro", "Enterprise"
    price: { type: Number, required: true, default: 0 },  // monthly price in USD
    billingCycle: { type: String, enum: ['Monthly', 'Yearly'], default: 'Monthly' },
    trialDays: { type: Number, default: 14 },

    // Feature limits
    limits: {
      maxMenuItems: { type: Number, default: 50 },
      maxStaffAccounts: { type: Number, default: 5 },
      maxBranches: { type: Number, default: 1 },
      maxOrdersPerMonth: { type: Number, default: 500 },
    },

    // Feature flags unlocked by this plan
    features: {
      onlineOrdering: { type: Boolean, default: true },
      tableReservations: { type: Boolean, default: false },
      inventoryTracking: { type: Boolean, default: false },
      loyaltyProgram: { type: Boolean, default: false },
      multiLocation: { type: Boolean, default: false },
      kdsEnabled: { type: Boolean, default: false },
      advancedAnalytics: { type: Boolean, default: false },
      customDomain: { type: Boolean, default: false },
      apiAccess: { type: Boolean, default: false },
    },

    isActive: { type: Boolean, default: true },
    description: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SubscriptionPlan', subscriptionPlanSchema);
