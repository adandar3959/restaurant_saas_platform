const mongoose = require('mongoose');

const ingredientSchema = new mongoose.Schema(
  {
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
    ingredientName: { type: String, required: true, trim: true },
    sku: { type: String },

    unitOfMeasurement: {
      type: String,
      enum: ['kg', 'g', 'L', 'ml', 'pieces'],
      required: true,
    },

    currentStock: { type: Number, required: true, default: 0, min: 0 },
    lowStockThreshold: { type: Number, required: true, default: 0 },
    reorderQuantity: { type: Number, default: 0 },
    costPerUnit: { type: Number, default: 0 },
    supplierId: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', default: null },

    category: { type: String },
    storageLocation: { type: String },
    expiryDate: { type: Date },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

ingredientSchema.index({ restaurantId: 1 });
ingredientSchema.index({ restaurantId: 1, currentStock: 1 });

module.exports = mongoose.model('Ingredient', ingredientSchema);
