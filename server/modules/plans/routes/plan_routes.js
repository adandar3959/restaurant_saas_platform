const router = require('express').Router();
const ctrl = require('../controllers/plan_controller');
const { protect, authorize } = require('../../../utils/auth.middleware');

// Public — used by PricingPage, OnboardingPage, AdminSettings
router.get('/', ctrl.getAllPlans);

// SuperAdmin only — edit price, stripePriceId, features, etc.
router.patch('/:planId', protect, authorize('SuperAdmin'), ctrl.updatePlan);

module.exports = router;
