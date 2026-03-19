const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema(
  {
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
    name: { type: String, required: true, trim: true },
    contactPerson: { type: String },
    email: { type: String, lowercase: true },
    phone: { type: String },
    address: { type: String },
    website: { type: String },
    paymentTerms: { type: String }, // e.g. "Net 30", "COD"
    notes: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

supplierSchema.index({ restaurantId: 1 });

module.exports = mongoose.model('Supplier', supplierSchema);
