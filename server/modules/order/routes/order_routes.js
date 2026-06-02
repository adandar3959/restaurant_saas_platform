const router = require('express').Router({ mergeParams: true });
const ctrl = require('../controllers/order_controller');
const { protect, authorize, optionalAuth } = require('../../../utils/auth.middleware');
const { validateCreateOrder, validateUpdateStatus, validatePayment } = require('../middlewares/order_middleware');
const { checkLimit } = require('../../../utils/plan.middleware');
const Order = require('../models/order_model');

const staff      = ['SuperAdmin', 'Admin', 'Manager', 'Waiter', 'Chef'];
const fieldStaff = [...staff, 'Driver'];

router.get('/my',    protect, authorize('Customer'),                                              ctrl.getMyOrders);
router.get('/stats', protect, authorize('SuperAdmin', 'Admin', 'Manager'),                        ctrl.getOrderStats);
router.get('/public/find/:id',                                                                    ctrl.publicFindOrder);
router.post('/',     
  optionalAuth, 
  validateCreateOrder, 
  checkLimit('maxOrders', async (rid) => {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    return await Order.countDocuments({ restaurantId: rid, createdAt: { $gte: startOfMonth } });
  }),
  ctrl.createOrder
);
router.get('/',      protect, authorize(...fieldStaff),                                           ctrl.getOrders);
router.get('/:id',   protect, authorize(...fieldStaff),                                           ctrl.getOrderById);
router.patch('/:id/status',         protect, authorize(...fieldStaff), validateUpdateStatus,      ctrl.updateOrderStatus);
router.patch('/:id/items/:itemId',  protect, authorize(...staff),                                 ctrl.updateItemStatus);
router.post('/:id/items',           protect, authorize('Waiter', 'Admin', 'Manager', 'SuperAdmin'), ctrl.addItemsToOrder);
router.patch('/:id/tip',            optionalAuth,                                                 ctrl.addTip);
router.patch('/:id/payment',        protect, authorize('SuperAdmin', 'Admin', 'Manager', 'Waiter'), validatePayment, ctrl.updatePayment);

module.exports = router;
