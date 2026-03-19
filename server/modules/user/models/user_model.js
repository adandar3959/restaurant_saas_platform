const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const savedAddressSchema = new mongoose.Schema(
  {
    label: { type: String, default: 'Home' }, // "Home", "Work", "Other"
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String },
    zipCode: { type: String },
    country: { type: String, default: 'US' },
    coordinates: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number] }, // [lng, lat]
    },
    isDefault: { type: Boolean, default: false },
  },
  { _id: true, timestamps: true }
);

const loyaltySchema = new mongoose.Schema(
  {
    points: { type: Number, default: 0 },
    totalEarned: { type: Number, default: 0 },
    totalRedeemed: { type: Number, default: 0 },
    tier: { type: String, enum: ['Bronze', 'Silver', 'Gold', 'Platinum'], default: 'Bronze' },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    // null for SuperAdmin; null for global Customers not tied to one restaurant
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', default: null },

    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false }, // never returned by default

    role: {
      type: String,
      enum: ['SuperAdmin', 'Admin', 'Manager', 'Chef', 'Waiter', 'Driver', 'Customer'],
      required: true,
    },

    phone: { type: String },
    profileImage: { type: String }, // URL to cloud storage (S3/Cloudinary)

    // Staff-specific: which prep station or section they're assigned to
    assignedStation: { type: String },

    // Customer-only details
    customerDetails: {
      savedAddresses: [savedAddressSchema],
      loyalty: loyaltySchema,
      preferredPaymentMethod: { type: String, enum: ['Cash', 'CreditCard', 'Wallet'] },
      dietaryPreferences: [{ type: String }], // e.g. ['Vegan', 'Gluten-Free']
      orderCount: { type: Number, default: 0 },
      totalSpent: { type: Number, default: 0 },
    },

    // Auth & security
    status: { type: String, enum: ['Active', 'Inactive', 'Banned'], default: 'Active' },
    emailVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String, select: false },
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
    lastLoginAt: { type: Date },
    refreshToken: { type: String, select: false },

    deletedAt: { type: Date, default: null }, // soft delete
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next();
  this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
  next();
});

// Instance method to compare passwords
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

userSchema.index({ email: 1 });
userSchema.index({ restaurantId: 1, role: 1 });

module.exports = mongoose.model('User', userSchema);
