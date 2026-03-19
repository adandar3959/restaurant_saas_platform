const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    menuItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', default: null }, // item-level review

    overallRating: { type: Number, required: true, min: 1, max: 5 },
    foodRating: { type: Number, min: 1, max: 5 },
    serviceRating: { type: Number, min: 1, max: 5 },
    deliveryRating: { type: Number, min: 1, max: 5 },

    comment: { type: String, maxlength: 1000 },
    images: [{ type: String }], // URLs to review photos

    // Admin response to the review
    response: {
      text: { type: String },
      respondedAt: { type: Date },
      respondedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    },

    isVerified: { type: Boolean, default: false }, // verified purchase
    isPublished: { type: Boolean, default: true },
    isFlagged: { type: Boolean, default: false },
  },
  { timestamps: true }
);

reviewSchema.index({ restaurantId: 1, isPublished: 1 });
reviewSchema.index({ customerId: 1 });
reviewSchema.index({ orderId: 1 });

module.exports = mongoose.model('Review', reviewSchema);
