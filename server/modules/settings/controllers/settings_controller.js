const settingsService = require('../services/settings_service');
const asyncHandler    = require('../../../utils/asyncHandler');
const { sendSuccess } = require('../../../utils/apiResponse');

// GET /api/v1/settings/public — no auth, used by frontend to check maintenance
exports.getPublic = asyncHandler(async (req, res) => {
  const doc = await settingsService.getSettings();
  sendSuccess(res, { maintenanceMode: doc.maintenanceMode });
});

// PATCH /api/v1/settings/system — SuperAdmin only
exports.update = asyncHandler(async (req, res) => {
  const allowed = ['maintenanceMode'];
  const data = {};
  allowed.forEach(k => { if (req.body[k] !== undefined) data[k] = req.body[k]; });

  const doc = await settingsService.updateSettings(data);
  sendSuccess(res, { maintenanceMode: doc.maintenanceMode }, 'Settings updated');
});
