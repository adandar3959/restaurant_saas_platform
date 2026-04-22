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
    discountValue: { type: Number, default: 0 },

    minimumOrderAmount: { type: Number, default: 0 },
    maximumDiscountAmount: { type: Number },

    applicableTo: {
      type: String,
      enum: ['All', 'Delivery', 'Dine-In', 'Takeaway'],
      default: 'All',
    },
    applicableItems: [{ type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem' }],
    applicableCategories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'MenuCategory' }],

    usageLimit: { type: Number, default: null },
    usageLimitPerUser: { type: Number, default: 1 },
    usedCount: { type: Number, default: 0 },

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
