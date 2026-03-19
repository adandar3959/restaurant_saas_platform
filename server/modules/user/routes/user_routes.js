const router = require('express').Router();
const ctrl = require('../controllers/user_controller');
const { protect, authorize } = require('../../../utils/auth.middleware');
const { validateRegister, validateLogin, validateUpdateUser, validateInvite } = require('../middlewares/user_middleware');

// Public
router.post('/register', validateRegister, ctrl.register);
router.post('/login', validateLogin, ctrl.login);

// Admin/Manager creates staff (Chef, Waiter, Driver, Manager)
router.post('/staff', protect, authorize('Admin', 'Manager'), validateRegister, ctrl.createStaff);

// Invite management — SuperAdmin only
router.post('/invites', protect, authorize('SuperAdmin'), ctrl.createInvite);
router.get('/invites', protect, authorize('SuperAdmin'), ctrl.getInvites);
router.delete('/invites/:id', protect, authorize('SuperAdmin'), ctrl.revokeInvite);

// Authenticated user — own profile
router.get('/me', protect, ctrl.getMe);
router.patch('/me', protect, validateUpdateUser, ctrl.updateMe);

// Staff management — Admin/Manager only
router.get('/', protect, authorize('SuperAdmin', 'Admin', 'Manager'), ctrl.getAllUsers);
router.get('/:id', protect, authorize('SuperAdmin', 'Admin', 'Manager'), ctrl.getUserById);
router.patch('/:id', protect, authorize('SuperAdmin', 'Admin', 'Manager'), validateUpdateUser, ctrl.updateUser);
router.delete('/:id', protect, authorize('SuperAdmin', 'Admin'), ctrl.deleteUser);

module.exports = router;
