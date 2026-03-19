const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema(
  {
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
    invoiceNumber: { type: String, unique: true }, // e.g. "INV-2024-0042"

    planName: { type: String },
    billingPeriodStart: { type: Date },
    billingPeriodEnd: { type: Date },

    amount: { type: Number, required: true },
    currency: { type: String, default: 'USD' },
    tax: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },

    status: {
      type: String,
      enum: ['Draft', 'Sent', 'Paid', 'Overdue', 'Void'],
      default: 'Draft',
    },

    paymentMethod: { type: String },
    stripeInvoiceId: { type: String },
    stripePaymentIntentId: { type: String },

    paidAt: { type: Date },
    dueDate: { type: Date },
    notes: { type: String },
  },
  { timestamps: true }
);

invoiceSchema.index({ restaurantId: 1 });
invoiceSchema.index({ status: 1 });

module.exports = mongoose.model('Invoice', invoiceSchema);
