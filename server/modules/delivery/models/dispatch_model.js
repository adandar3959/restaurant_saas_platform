const mongoose = require('mongoose');

const dispatchSchema = new mongoose.Schema(
  {
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver', required: true },
    deliveryZoneId: { type: mongoose.Schema.Types.ObjectId, ref: 'DeliveryZone' },

    status: {
      type: String,
      enum: ['Assigned', 'PickedUp', 'InTransit', 'Delivered', 'Failed', 'Returned'],
      default: 'Assigned',
    },

    // Location snapshots for tracking history
    pickupLocation: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number] },
    },
    dropoffLocation: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number] },
    },

    assignedAt: { type: Date, default: Date.now },
    pickedUpAt: { type: Date },
    deliveredAt: { type: Date },

    estimatedArrival: { type: Date },
    distanceKm: { type: Number },
    deliveryFee: { type: Number },

    failureReason: { type: String },
    proofOfDelivery: { type: String }, // URL to photo
  },
  { timestamps: true }
);

dispatchSchema.index({ restaurantId: 1, status: 1 });
dispatchSchema.index({ orderId: 1 });
dispatchSchema.index({ driverId: 1, status: 1 });

module.exports = mongoose.model('Dispatch', dispatchSchema);
