const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const savedAddressSchema = new mongoose.Schema(
  {
    label: { type: String, default: 'Home' },
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String },
    zipCode: { type: String },
    country: { type: String, default: 'Pakistan' },
    coordinates: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number] },
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
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', default: null },

    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },

    role: {
      type: String,
      enum: ['SuperAdmin', 'Admin', 'Manager', 'Chef', 'Waiter', 'Driver', 'Customer'],
      required: true,
    },

    phone: { type: String },
    gender: { type: String, enum: ['Male', 'Female', 'Other'] },
    profileImage: { type: String },

    assignedStation: { type: String },

    customerDetails: {
      savedAddresses: [savedAddressSchema],
      loyalty: loyaltySchema,
      preferredPaymentMethod: { type: String, enum: ['Cash', 'CreditCard', 'Wallet'] },
      dietaryPreferences: [{ type: String }],
      orderCount: { type: Number, default: 0 },
      totalSpent: { type: Number, default: 0 },
    },

    status: { type: String, enum: ['Active', 'Inactive', 'Banned'], default: 'Active' },

    // emailVerified: { type: Boolean, default: false },
    // emailVerificationToken: { type: String, select: false },
    // passwordResetToken: { type: String, select: false },
    // passwordResetExpires: { type: Date, select: false },

    lastLoginAt: { type: Date },

    // refreshToken: { type: String, select: false },

    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

userSchema.pre('save', async function () {
  if (!this.isModified('passwordHash')) return;
  this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

userSchema.index({ restaurantId: 1, role: 1 });

module.exports = mongoose.model('User', userSchema);
