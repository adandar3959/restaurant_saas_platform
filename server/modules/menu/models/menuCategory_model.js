const mongoose = require('mongoose');

const menuCategorySchema = new mongoose.Schema(
  {
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
    name: { type: String, required: true, trim: true },
    description: { type: String },
    image: { type: String },
    displayOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    availableFrom: { type: String },
    availableUntil: { type: String },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

menuCategorySchema.index({ restaurantId: 1, displayOrder: 1 });

module.exports = mongoose.model('MenuCategory', menuCategorySchema);
