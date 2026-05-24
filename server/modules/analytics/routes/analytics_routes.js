const router = require('express').Router();
const ctrl   = require('../controllers/analytics_controller');
const { protect, authorize } = require('../../../utils/auth.middleware');

// SuperAdmin only
router.get('/saas', protect, authorize('SuperAdmin'), ctrl.getSaasMetrics);

module.exports = router;
