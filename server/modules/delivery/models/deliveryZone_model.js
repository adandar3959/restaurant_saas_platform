const mongoose = require('mongoose');

const deliveryZoneSchema = new mongoose.Schema(
  {
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
    name: { type: String, required: true }, // e.g. "Zone A - Downtown"

    // GeoJSON Polygon for geofencing
    boundary: {
      type: { type: String, enum: ['Polygon'], default: 'Polygon' },
      coordinates: { type: [[[Number]]] }, // GeoJSON polygon coordinates
    },

    // Alternatively, radius-based zone
    center: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number] }, // [lng, lat]
    },
    radiusKm: { type: Number }, // radius in km if using circle-based zone

    deliveryFee: { type: Number, required: true, default: 0 },
    minimumOrderAmount: { type: Number, default: 0 },
    estimatedDeliveryTime: { type: Number, default: 30 }, // minutes

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

deliveryZoneSchema.index({ 'boundary': '2dsphere' });
deliveryZoneSchema.index({ 'center': '2dsphere' });
deliveryZoneSchema.index({ restaurantId: 1 });

module.exports = mongoose.model('DeliveryZone', deliveryZoneSchema);
