const analyticsService = require('../services/analytics_service');
const asyncHandler     = require('../../../utils/asyncHandler');
const { sendSuccess }  = require('../../../utils/apiResponse');

exports.getSaasMetrics = asyncHandler(async (req, res) => {
  const metrics = await analyticsService.getSaasMetrics();
  sendSuccess(res, metrics);
});
