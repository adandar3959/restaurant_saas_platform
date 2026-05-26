const Settings = require('../models/settings_model');

// In-memory cache — avoids a DB hit on every single API request
let _cache = { maintenanceMode: false, platformCurrency: 'PKR' };

// Called once on server start to pre-load the cache
exports.loadCache = async () => {
  const doc = await Settings.findOneAndUpdate(
    { key: 'system' },
    { $setOnInsert: { maintenanceMode: false, platformCurrency: 'PKR' } },
    { upsert: true, new: true }
  );
  _cache = { maintenanceMode: doc.maintenanceMode, platformCurrency: doc.platformCurrency || 'PKR' };
  return _cache;
};

// Read from cache (no DB hit — used by middleware on every request)
exports.getCache = () => _cache;

// Public getter (GET /settings/public — no auth needed)
exports.getSettings = async () => {
  const doc = await Settings.findOneAndUpdate(
    { key: 'system' },
    { $setOnInsert: { maintenanceMode: false, platformCurrency: 'PKR' } },
    { upsert: true, new: true }
  );
  _cache = { maintenanceMode: doc.maintenanceMode, platformCurrency: doc.platformCurrency || 'PKR' };
  return doc;
};

// SuperAdmin update (PATCH /settings/system)
exports.updateSettings = async (data) => {
  const doc = await Settings.findOneAndUpdate(
    { key: 'system' },
    { $set: data },
    { upsert: true, new: true }
  );
  _cache = { maintenanceMode: doc.maintenanceMode, platformCurrency: doc.platformCurrency || 'PKR' };
  return doc;
};
