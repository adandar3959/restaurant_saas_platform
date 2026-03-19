const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema(
  {
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

    // Guest info for walk-in / phone reservations (when no account)
    guestName: { type: String },
    guestPhone: { type: String },
    guestEmail: { type: String },

    tableId: { type: mongoose.Schema.Types.ObjectId, ref: 'Table', default: null },
    reservationDate: { type: Date, required: true },
    timeSlot: { type: String, required: true }, // "19:30" 24h format
    duration: { type: Number, default: 90 },    // estimated duration in minutes
    guestCount: { type: Number, required: true, min: 1 },

    status: {
      type: String,
      enum: ['Pending', 'Confirmed', 'Seated', 'Completed', 'Cancelled', 'No-Show'],
      default: 'Pending',
    },

    specialRequests: { type: String }, // "Window seat, anniversary dinner"
    internalNotes: { type: String },   // staff-only notes

    // Confirmation & reminders
    confirmationCode: { type: String },
    reminderSentAt: { type: Date },

    // Who handled this reservation
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Manager/Host

    cancelledAt: { type: Date },
    cancellationReason: { type: String },
  },
  { timestamps: true }
);

reservationSchema.index({ restaurantId: 1, reservationDate: 1 });
reservationSchema.index({ restaurantId: 1, status: 1 });
reservationSchema.index({ customerId: 1 });

module.exports = mongoose.model('Reservation', reservationSchema);
