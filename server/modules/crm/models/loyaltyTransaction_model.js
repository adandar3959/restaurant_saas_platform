const mongoose = require('mongoose');

// Tracks every earn/redeem event for a customer's loyalty points
const loyaltyTransactionSchema = new mongoose.Schema(
  {
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },

    type: { type: String, enum: ['Earn', 'Redeem', 'Expire', 'Adjust'], required: true },
    points: { type: Number, required: true }, // positive = earn, negative = redeem/expire
    balanceAfter: { type: Number, required: true },

    description: { type: String }, // e.g. "Earned for Order #1042", "Redeemed for $5 off"
    expiresAt: { type: Date },
  },
  { timestamps: true }
);

loyaltyTransactionSchema.index({ customerId: 1, restaurantId: 1 });
loyaltyTransactionSchema.index({ orderId: 1 });

module.exports = mongoose.model('LoyaltyTransaction', loyaltyTransactionSchema);
