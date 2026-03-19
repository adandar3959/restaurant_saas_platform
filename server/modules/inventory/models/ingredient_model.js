const mongoose = require('mongoose');

const ingredientSchema = new mongoose.Schema(
  {
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
    ingredientName: { type: String, required: true, trim: true },
    sku: { type: String }, // internal stock-keeping unit code

    unitOfMeasurement: {
      type: String,
      enum: ['kg', 'g', 'L', 'ml', 'pcs', 'oz', 'lb', 'cup', 'tbsp', 'tsp'],
      required: true,
    },

    currentStock: { type: Number, required: true, default: 0, min: 0 },
    lowStockThreshold: { type: Number, required: true, default: 0 }, // alert trigger
    reorderQuantity: { type: Number, default: 0 }, // how much to order when restocking

    costPerUnit: { type: Number, default: 0 },
    supplierId: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', default: null },

    category: { type: String }, // e.g. "Dairy", "Produce", "Meat", "Dry Goods"
    storageLocation: { type: String }, // e.g. "Fridge A", "Dry Store"
    expiryDate: { type: Date },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

ingredientSchema.index({ restaurantId: 1 });
ingredientSchema.index({ restaurantId: 1, currentStock: 1 });

module.exports = mongoose.model('Ingredient', ingredientSchema);
