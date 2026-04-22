const mongoose = require('mongoose');

const prepStationSchema = new mongoose.Schema(
  {
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
    name: { type: String, required: true },
    description: { type: String },

    assignedCategories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'MenuCategory' }],
    assignedItems: [{ type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem' }],

    assignedStaff: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

    displayColor: { type: String, default: '#FF6B35' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

prepStationSchema.index({ restaurantId: 1 });

module.exports = mongoose.model('PrepStation', prepStationSchema);
