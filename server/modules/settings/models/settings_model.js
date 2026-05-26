const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  key:             { type: String, unique: true, default: 'system' },
  maintenanceMode: { type: Boolean, default: false },
  platformCurrency: { type: String, default: 'PKR' },
}, { timestamps: true });

module.exports = mongoose.model('SystemSettings', settingsSchema);
