const router = require('express').Router();
const ctrl   = require('../controllers/settings_controller');
const { protect, authorize } = require('../../../utils/auth.middleware');

// Public — frontend polls this to know if maintenance is on
router.get('/public', ctrl.getPublic);

// SuperAdmin only
router.patch('/system', protect, authorize('SuperAdmin'), ctrl.update);

module.exports = router;
