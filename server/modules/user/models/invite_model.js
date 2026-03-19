const mongoose = require('mongoose');
const crypto = require('crypto');

const inviteSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true },
    token: { type: String, required: true, unique: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // SuperAdmin
    expiresAt: { type: Date, required: true },
    usedAt: { type: Date, default: null }, // null = not yet used
  },
  { timestamps: true }
);

// Static method to generate a secure token
inviteSchema.statics.generateToken = () => crypto.randomBytes(32).toString('hex');

inviteSchema.index({ token: 1 });
inviteSchema.index({ email: 1 });

module.exports = mongoose.model('Invite', inviteSchema);
