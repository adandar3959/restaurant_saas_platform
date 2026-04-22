const router = require('express').Router();
const ctrl = require('../controllers/tenant_controller');
const { protect, authorize } = require('../../../utils/auth.middleware');
const { validateCreateTenant, validateUpdateTenant, validateSubscription } = require('../middlewares/tenant_middleware');

router.get('/slug/:slug', ctrl.getTenantBySlug);

router.get('/', protect, authorize('SuperAdmin'), ctrl.getAllTenants);
router.delete('/:id', protect, authorize('SuperAdmin'), ctrl.deleteTenant);
router.patch('/:id/subscription', protect, authorize('SuperAdmin'), validateSubscription, ctrl.updateSubscription);

router.post('/', protect, authorize('SuperAdmin', 'Admin'), validateCreateTenant, ctrl.createTenant);

router.get('/:id', protect, authorize('SuperAdmin', 'Admin', 'Manager'), ctrl.getTenantById);
router.patch('/:id', protect, authorize('SuperAdmin', 'Admin'), validateUpdateTenant, ctrl.updateTenant);

module.exports = router;
