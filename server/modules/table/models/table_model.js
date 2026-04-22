const mongoose = require('mongoose');

const tableSchema = new mongoose.Schema(
  {
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
    tableNumber: { type: String, required: true },
    capacity: { type: Number, required: true, min: 1 },

    status: {
      type: String,
      enum: ['Available', 'Occupied', 'Reserved', 'NeedsCleaning', 'Inactive'],
      default: 'Available',
    },

    floorPlan: {
      section: { type: String, default: 'Main' },
      positionX: { type: Number, default: 0 },
      positionY: { type: Number, default: 0 },
      shape: { type: String, enum: ['Square', 'Round', 'Rectangle'], default: 'Square' },
    },

    qrCodeUrl: { type: String },
    qrCodeData: { type: String },

    currentOrderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

tableSchema.index({ restaurantId: 1, status: 1 });
tableSchema.index({ restaurantId: 1, tableNumber: 1 }, { unique: true });

module.exports = mongoose.model('Table', tableSchema);
