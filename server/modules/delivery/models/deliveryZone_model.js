const mongoose = require('mongoose');

const deliveryZoneSchema = new mongoose.Schema(
  {
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
    name: { type: String, required: true },

    boundary: {
      type: { type: String, enum: ['Polygon'], default: 'Polygon' },
      coordinates: { type: [[[Number]]] },
    },

    center: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number] },
    },
    radiusKm: { type: Number },

    deliveryFee: { type: Number, required: true, default: 0 },
    minimumOrderAmount: { type: Number, default: 0 },
    estimatedDeliveryTime: { type: Number, default: 30 },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

deliveryZoneSchema.index({ 'boundary': '2dsphere' });
deliveryZoneSchema.index({ 'center': '2dsphere' });
deliveryZoneSchema.index({ restaurantId: 1 });

module.exports = mongoose.model('DeliveryZone', deliveryZoneSchema);
