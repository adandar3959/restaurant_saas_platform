const mongoose = require('mongoose');

const tableSchema = new mongoose.Schema(
  {
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
    tableNumber: { type: String, required: true }, // e.g. "T1", "A3", "Patio-2"
    capacity: { type: Number, required: true, min: 1 },

    status: {
      type: String,
      enum: ['Available', 'Occupied', 'Reserved', 'NeedsCleaning', 'Inactive'],
      default: 'Available',
    },

    // Floor plan positioning for visual map in admin dashboard
    floorPlan: {
      section: { type: String, default: 'Main' }, // e.g. "Main", "Patio", "Bar"
      positionX: { type: Number, default: 0 },    // pixel/grid x coordinate
      positionY: { type: Number, default: 0 },    // pixel/grid y coordinate
      shape: { type: String, enum: ['Square', 'Round', 'Rectangle'], default: 'Square' },
    },

    qrCodeUrl: { type: String },   // URL to the table-side ordering page
    qrCodeData: { type: String },  // raw QR data string (e.g. "https://order.joespizza.com/table/T1")

    // Currently active order on this table
    currentOrderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

tableSchema.index({ restaurantId: 1, status: 1 });
tableSchema.index({ restaurantId: 1, tableNumber: 1 }, { unique: true });

module.exports = mongoose.model('Table', tableSchema);
