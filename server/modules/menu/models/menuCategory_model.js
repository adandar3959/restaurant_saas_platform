const mongoose = require('mongoose');

const menuCategorySchema = new mongoose.Schema(
  {
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
    name: { type: String, required: true, trim: true },
    description: { type: String },
    image: { type: String }, // URL
    displayOrder: { type: Number, default: 0 }, // lower = shown first
    isActive: { type: Boolean, default: true },
    availableFrom: { type: String }, // "11:00" — time-based visibility (e.g. Breakfast only)
    availableUntil: { type: String }, // "15:00"
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

menuCategorySchema.index({ restaurantId: 1, displayOrder: 1 });

module.exports = mongoose.model('MenuCategory', menuCategorySchema);
