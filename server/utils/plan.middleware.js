const Tenant = require('../modules/tenant/models/tenant_model');

const PLANS = {
  FREE: 'Free',
  PRO: 'Pro',
  ENTERPRISE: 'Enterprise'
};

const PLAN_LIMITS = {
  [PLANS.FREE]: {
    maxStaff: 1,
    maxMenuCategories: 5,
    maxMenuItems: 50,
    features: { kds: false, tableManagement: false, inventory: false, delivery: false, crm: false }
  },
  [PLANS.PRO]: {
    maxStaff: 5,
    maxMenuCategories: 9999,
    maxMenuItems: 9999,
    features: { kds: true, tableManagement: true, inventory: true, delivery: false, crm: false }
  },
  [PLANS.ENTERPRISE]: {
    maxStaff: 9999,
    maxMenuCategories: 9999,
    maxMenuItems: 9999,
    features: { kds: true, tableManagement: true, inventory: true, delivery: true, crm: true }
  }
};

exports.PLAN_LIMITS = PLAN_LIMITS;
exports.PLANS = PLANS;

/**
 * Middleware to restrict API route access based on boolean feature flags.
 */
exports.requireFeature = (featureKey) => {
  return async (req, res, next) => {
    try {
      // SuperAdmins bypass all limits
      if (req.user && req.user.role === 'SuperAdmin') return next();
      
      // Determine the restaurant ID from user payload or request params
      const restaurantId = (req.user && req.user.restaurantId) ? req.user.restaurantId : req.params.restaurantId;
      if (!restaurantId) return res.status(400).json({ success: false, message: 'Restaurant ID required to verify plan access.' });

      const tenant = await Tenant.findById(restaurantId).select('subscription.planType');
      if (!tenant) return res.status(404).json({ success: false, message: 'Restaurant not found' });

      const planType = tenant.subscription?.planType || PLANS.FREE;
      const isAllowed = PLAN_LIMITS[planType]?.features[featureKey] || false;

      if (!isAllowed) {
        return res.status(403).json({
          success: false,
          message: 'PLAN_UPGRADE_REQUIRED',
          error: `This feature (${featureKey}) is not included in your ${planType} plan. Please upgrade your subscription.`
        });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware to restrict creation based on numerical plan limits.
 */
exports.checkLimit = (limitKey, countResolver) => {
  return async (req, res, next) => {
    try {
      if (req.user && req.user.role === 'SuperAdmin') return next();
      
      const restaurantId = (req.user && req.user.restaurantId) ? req.user.restaurantId : req.params.restaurantId;
      if (!restaurantId) return next();

      const tenant = await Tenant.findById(restaurantId).select('subscription.planType');
      const planType = tenant?.subscription?.planType || PLANS.FREE;
      
      const limit = PLAN_LIMITS[planType]?.[limitKey] || 0;
      
      // Call the provided callback to get the current count from the DB
      const currentCount = await countResolver(restaurantId);

      if (currentCount >= limit) {
        return res.status(403).json({
          success: false,
          message: 'PLAN_LIMIT_REACHED',
          error: `You have reached the limit of ${limit} for this resource on the ${planType} plan.`
        });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
