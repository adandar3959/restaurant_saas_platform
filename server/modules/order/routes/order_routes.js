const router = require('express').Router({ mergeParams: true });
const ctrl = require('../controllers/order_controller');
const { protect, authorize } = require('../../../utils/auth.middleware');
const { validateCreateOrder, validateUpdateStatus, validatePayment } = require('../middlewares/order_middleware');

const staff = ['SuperAdmin', 'Admin', 'Manager', 'Waiter'];

router.get('/my', protect, authorize('Customer'), ctrl.getMyOrders);
router.post('/', protect, validateCreateOrder, ctrl.createOrder);
router.get('/', protect, authorize(...staff), ctrl.getOrders);
router.get('/:id', protect, ctrl.getOrderById);
router.patch('/:id/status', protect, authorize(...staff), validateUpdateStatus, ctrl.updateOrderStatus);
router.patch('/:id/payment', protect, authorize('SuperAdmin', 'Admin', 'Manager', 'Waiter'), validatePayment, ctrl.updatePayment);

module.exports = router;
