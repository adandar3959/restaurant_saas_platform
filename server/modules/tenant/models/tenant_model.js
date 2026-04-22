const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema(
  {
    street: { type: String },
    city: { type: String },
    state: { type: String },
    zipCode: { type: String },
    country: { type: String, default: 'US' },
    coordinates: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number] },
    },
  },
  { _id: false }
);

const subscriptionSchema = new mongoose.Schema(
  {
    planType: { type: String, enum: ['Free', 'Pro', 'Enterprise'], default: 'Free' },
    status: { type: String, enum: ['Active', 'Suspended', 'Expired', 'Trial'], default: 'Trial' },
    trialEndsAt: { type: Date },
    validUntil: { type: Date },
    stripeCustomerId: { type: String },
    stripeSubscriptionId: { type: String },
  },
  { _id: false }
);

const businessHoursSchema = new mongoose.Schema(
  {
    day: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      required: true,
    },
    isOpen: { type: Boolean, default: true },
    openTime: { type: String, default: '09:00' },
    closeTime: { type: String, default: '22:00' },
  },
  { _id: false }
);

const brandingSchema = new mongoose.Schema(
  {
    logoUrl: { type: String },
    bannerUrl: { type: String },
    primaryColor: { type: String, default: '#FF6B35' },
    secondaryColor: { type: String, default: '#FFFFFF' },
    fontFamily: { type: String, default: 'Inter' },
  },
  { _id: false }
);

const tenantSchema = new mongoose.Schema(
  {
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    restaurantName: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, lowercase: true, trim: true },
    description: { type: String, maxlength: 500 },

    contactInfo: {
      email: { type: String, lowercase: true, trim: true },
      phone: { type: String },
      website: { type: String },
    },

    address: addressSchema,
    branding: brandingSchema,

    customDomain: { type: String, unique: true, sparse: true },

    subscription: subscriptionSchema,

    settings: {
      currency: { type: String, default: 'USD' },
      taxRate: { type: Number, default: 0, min: 0, max: 100 },
      serviceChargeRate: { type: Number, default: 0, min: 0, max: 100 },
      timezone: { type: String, default: 'America/New_York' },
      orderPrefix: { type: String, default: 'ORD' },
      autoAcceptOrders: { type: Boolean, default: false },
      allowScheduledOrders: { type: Boolean, default: true },
      maxDeliveryRadius: { type: Number, default: 10 },
    },

    businessHours: [businessHoursSchema],

    features: {
      onlineOrdering: { type: Boolean, default: true },
      tableReservations: { type: Boolean, default: false },
      inventoryTracking: { type: Boolean, default: false },
      loyaltyProgram: { type: Boolean, default: false },
      multiLocation: { type: Boolean, default: false },
      kdsEnabled: { type: Boolean, default: false },
    },

    parentRestaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', default: null },
    isBranch: { type: Boolean, default: false },

    isActive: { type: Boolean, default: true },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

tenantSchema.index({ 'address.coordinates': '2dsphere' });
tenantSchema.index({ ownerId: 1 });

module.exports = mongoose.model('Tenant', tenantSchema);
