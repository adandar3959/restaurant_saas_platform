const mongoose = require('mongoose');

// Each item included in a deal (loosely referenced — no strict ObjectId require)
const dealItemSchema = new mongoose.Schema(
  {
    name:       { type: String, required: true },          // display name e.g. "Zinger Burger (Large)"
    quantity:   { type: Number, required: true, default: 1 },
    menuItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem' }, // optional link
    sizeName:   { type: String },                          // e.g. "Regular", "Large" — if item has sizes
  },
  { _id: false }
);

const dealSchema = new mongoose.Schema(
  {
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },

    name:          { type: String, required: true, trim: true }, // e.g. "Deal 1", "Family Deal"
    description:   { type: String, trim: true },                 // e.g. "1 Zinger + 1 Fries + 1 Drink"
    tag:           { type: String, trim: true },                 // e.g. "Best Seller", "New", "Hot"

    originalPrice: { type: Number, min: 0 },                     // crossed-out price
    dealPrice:     { type: Number, required: true, min: 0 },     // actual deal price
    // discount % is computed: ((originalPrice - dealPrice) / originalPrice) * 100

    items:         [dealItemSchema],                             // what's included
    image:         { type: String },                            // optional image URL

    isAvailable:   { type: Boolean, default: true },
    isFeatured:    { type: Boolean, default: false },           // show in hero banner / top
    displayOrder:  { type: Number, default: 0 },

    validFrom:     { type: Date },                              // null = always active
    validTo:       { type: Date },

    deletedAt:     { type: Date, default: null },
  },
  { timestamps: true }
);

dealSchema.index({ restaurantId: 1, isAvailable: 1 });
dealSchema.index({ restaurantId: 1, displayOrder: 1 });

// Virtual: discount percentage
dealSchema.virtual('discountPct').get(function () {
  if (!this.originalPrice || this.originalPrice <= this.dealPrice) return 0;
  return Math.round(((this.originalPrice - this.dealPrice) / this.originalPrice) * 100);
});

dealSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Deal', dealSchema);
