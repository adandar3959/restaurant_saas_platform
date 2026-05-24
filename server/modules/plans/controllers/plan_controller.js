const planService = require('../services/plan_service');
const asyncHandler = require('../../../utils/asyncHandler');
const { sendSuccess } = require('../../../utils/apiResponse');

exports.getAllPlans = asyncHandler(async (req, res) => {
  const plans = await planService.getAllPlans();
  sendSuccess(res, plans);
});

exports.updatePlan = asyncHandler(async (req, res) => {
  const plan = await planService.updatePlan(req.params.planId, req.body);
  sendSuccess(res, plan, 'Plan updated successfully');
});
