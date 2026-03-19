const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema(
  {
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
    code: { type: String, required: true, uppercase: true, trim: true },

    discountType: {
      type: String,
      enum: ['Percentage', 'FixedAmount', 'FreeDelivery', 'BuyXGetY'],
      required: true,
    },
    discountValue: { type: Number, default: 0 }, // % or flat amount

    // Conditions
    minimumOrderAmount: { type: Number, default: 0 },
    maximumDiscountAmount: { type: Number }, // cap for percentage discounts

    // Applicability
    applicableTo: {
      type: String,
      enum: ['All', 'Delivery', 'Dine-In', 'Takeaway'],
      default: 'All',
    },
    applicableItems: [{ type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem' }],
    applicableCategories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'MenuCategory' }],

    // Usage limits
    usageLimit: { type: Number, default: null },       // null = unlimited
    usageLimitPerUser: { type: Number, default: 1 },
    usedCount: { type: Number, default: 0 },

    // Validity
    validFrom: { type: Date, required: true },
    validUntil: { type: Date, required: true },

    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

couponSchema.index({ restaurantId: 1, code: 1 }, { unique: true });
couponSchema.index({ restaurantId: 1, isActive: 1 });

module.exports = mongoose.model('Coupon', couponSchema);
