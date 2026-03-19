const mongoose = require('mongoose');

const poItemSchema = new mongoose.Schema(
  {
    ingredientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ingredient', required: true },
    ingredientName: { type: String },
    quantity: { type: Number, required: true, min: 0 },
    unit: { type: String },
    unitCost: { type: Number, required: true },
    totalCost: { type: Number, required: true },
    receivedQuantity: { type: Number, default: 0 }, // for partial deliveries
  },
  { _id: true }
);

const purchaseOrderSchema = new mongoose.Schema(
  {
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
    supplierId: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true },
    poNumber: { type: String, unique: true }, // e.g. "PO-0042"

    items: [poItemSchema],

    status: {
      type: String,
      enum: ['Draft', 'Sent', 'PartiallyReceived', 'Received', 'Cancelled'],
      default: 'Draft',
    },

    totalAmount: { type: Number, default: 0 },
    expectedDeliveryDate: { type: Date },
    receivedAt: { type: Date },
    notes: { type: String },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

purchaseOrderSchema.index({ restaurantId: 1, status: 1 });

module.exports = mongoose.model('PurchaseOrder', purchaseOrderSchema);
