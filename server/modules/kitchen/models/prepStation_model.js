const mongoose = require('mongoose');

const prepStationSchema = new mongoose.Schema(
  {
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
    name: { type: String, required: true }, // e.g. "Grill", "Bar", "Fryer", "Cold Station"
    description: { type: String },

    // Category or item IDs automatically routed to this station
    assignedCategories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'MenuCategory' }],
    assignedItems: [{ type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem' }],

    // Staff assigned to this station
    assignedStaff: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

    displayColor: { type: String, default: '#FF6B35' }, // color on KDS screen
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

prepStationSchema.index({ restaurantId: 1 });

module.exports = mongoose.model('PrepStation', prepStationSchema);
