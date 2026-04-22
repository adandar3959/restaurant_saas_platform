const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema(
  {
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

    guestName: { type: String },
    guestPhone: { type: String },
    guestEmail: { type: String },

    tableId: { type: mongoose.Schema.Types.ObjectId, ref: 'Table', default: null },
    reservationDate: { type: Date, required: true },
    timeSlot: { type: String, required: true },
    duration: { type: Number, default: 90 },
    guestCount: { type: Number, required: true, min: 1 },

    status: {
      type: String,
      enum: ['Pending', 'Confirmed', 'Seated', 'Completed', 'Cancelled', 'No-Show'],
      default: 'Pending',
    },

    specialRequests: { type: String },
    internalNotes: { type: String },

    confirmationCode: { type: String },
    reminderSentAt: { type: Date },

    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    cancelledAt: { type: Date },
    cancellationReason: { type: String },
  },
  { timestamps: true }
);

reservationSchema.index({ restaurantId: 1, reservationDate: 1 });
reservationSchema.index({ restaurantId: 1, status: 1 });
reservationSchema.index({ customerId: 1 });

module.exports = mongoose.model('Reservation', reservationSchema);
