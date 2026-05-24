const Plan = require('../models/plan_model');

exports.getAllPlans = async () => {
  return Plan.find({ isActive: true }).sort({ order: 1 });
};

exports.getPlanById = async (planId) => {
  const plan = await Plan.findOne({ planId });
  if (!plan) throw Object.assign(new Error(`Plan not found: ${planId}`), { statusCode: 404 });
  return plan;
};

exports.updatePlan = async (planId, data) => {
  // Prevent changing the planId itself
  delete data.planId;

  // If price changes, keep priceInCents in sync
  if (data.price !== undefined && data.priceInCents === undefined) {
    data.priceInCents = Math.round(data.price * 100);
  }

  const plan = await Plan.findOneAndUpdate(
    { planId },
    { $set: data },
    { new: true, runValidators: true }
  );
  if (!plan) throw Object.assign(new Error('Plan not found'), { statusCode: 404 });
  return plan;
};
