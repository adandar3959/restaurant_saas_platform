export const PLANS = {
  FREE: 'Free',
  PRO: 'Pro',
  ENTERPRISE: 'Enterprise'
};

export const PLAN_LIMITS = {
  [PLANS.FREE]: {
    maxStaff: 1,
    maxMenuCategories: 5,
    maxMenuItems: 50,
    maxOrders: 100,
    features: {
      kds: false,
      tableManagement: false,
      inventory: false,
      delivery: false,
      crm: false,
    }
  },
  [PLANS.PRO]: {
    maxStaff: 5,
    maxMenuCategories: 9999,
    maxMenuItems: 9999,
    maxOrders: 1000,
    features: {
      kds: true,
      tableManagement: true,
      inventory: true,
      delivery: false,
      crm: false,
    }
  },
  [PLANS.ENTERPRISE]: {
    maxStaff: 9999,
    maxMenuCategories: 9999,
    maxMenuItems: 9999,
    maxOrders: 999999,
    features: {
      kds: true,
      tableManagement: true,
      inventory: true,
      delivery: true,
      crm: true,
    }
  }
};

/**
 * Checks if a specific feature is allowed for the given plan.
 * @param {string} planType - 'Free', 'Pro', or 'Enterprise'
 * @param {string} featureKey - 'kds', 'inventory', etc.
 * @returns {boolean}
 */
export const hasFeatureAccess = (planType, featureKey) => {
  const plan = planType || PLANS.FREE;
  return PLAN_LIMITS[plan]?.features[featureKey] || false;
};

/**
 * Checks if a numeric limit is reached.
 * @param {string} planType 
 * @param {string} limitKey - 'maxStaff', 'maxMenuItems'
 * @param {number} currentCount 
 * @returns {boolean}
 */
export const isLimitReached = (planType, limitKey, currentCount) => {
  const plan = planType || PLANS.FREE;
  const limit = PLAN_LIMITS[plan]?.[limitKey] || 0;
  return currentCount >= limit;
};
