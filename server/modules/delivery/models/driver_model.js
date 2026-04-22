const mongoose = require('mongoose');

const driverSchema = new mongoose.Schema(
  {
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    vehicleType: { type: String, enum: ['Bike', 'Scooter', 'Car', 'Van', 'Bicycle'], default: 'Bike' },
    vehiclePlate: { type: String },

    currentLocation: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number] },
    },
    lastLocationUpdate: { type: Date },

    status: {
      type: String,
      enum: ['Available', 'OnDelivery', 'Offline', 'Inactive'],
      default: 'Offline',
    },

    isThirdParty: { type: Boolean, default: false },
    thirdPartyProvider: { type: String },
    thirdPartyDriverId: { type: String },

    rating: { type: Number, default: 5, min: 1, max: 5 },
    totalDeliveries: { type: Number, default: 0 },
  },
  { timestamps: true }
);

driverSchema.index({ 'currentLocation': '2dsphere' });
driverSchema.index({ restaurantId: 1, status: 1 });

module.exports = mongoose.model('Driver', driverSchema);
