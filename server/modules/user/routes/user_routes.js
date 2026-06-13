const router = require('express').Router();
const ctrl = require('../controllers/user_controller');
const { protect, authorize } = require('../../../utils/auth.middleware');
const { validateRegister, validateLogin, validateUpdateUser, validateInvite, validateOnboard, validateStaff } = require('../middlewares/user_middleware');

router.post('/register', validateRegister, ctrl.register);
router.post('/login', validateLogin, ctrl.login);
router.post('/onboard', validateOnboard, ctrl.onboard);
router.post('/logout', ctrl.logout);

// Customer self-registration (no auth, no invite needed)
const { checkLimit } = require('../../../utils/plan.middleware');
const User = require('../models/user_model');

router.post('/customer/register', ctrl.customerRegister);
router.post('/customer/login', validateLogin, ctrl.login);

router.post('/staff', 
  protect, 
  authorize('Admin', 'Manager'), 
  checkLimit('maxStaff', async (restaurantId) => {
    return await User.countDocuments({ restaurantId, role: { $in: ['Admin', 'Manager', 'Chef', 'Waiter', 'Driver'] }, deletedAt: null });
  }),
  validateStaff, 
  ctrl.createStaff
);

router.post('/invites', protect, authorize('SuperAdmin'), ctrl.createInvite);
router.get('/invites', protect, authorize('SuperAdmin'), ctrl.getInvites);
router.delete('/invites/:id', protect, authorize('SuperAdmin'), ctrl.revokeInvite);

router.get('/me', protect, ctrl.getMe);
router.patch('/me', protect, validateUpdateUser, ctrl.updateMe);
router.patch('/me/change-password', protect, ctrl.changePassword);

router.get('/', protect, authorize('SuperAdmin', 'Admin', 'Manager'), ctrl.getAllUsers);
router.get('/:id', protect, authorize('SuperAdmin', 'Admin', 'Manager'), ctrl.getUserById);
router.patch('/:id', protect, authorize('SuperAdmin', 'Admin', 'Manager'), validateUpdateUser, ctrl.updateUser);
router.delete('/:id', protect, authorize('SuperAdmin', 'Admin'), ctrl.deleteUser);

module.exports = router;
