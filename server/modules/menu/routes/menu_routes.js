const router = require('express').Router({ mergeParams: true }); // mergeParams for restaurantId
const ctrl = require('../controllers/menu_controller');
const { protect, authorize } = require('../../../utils/auth.middleware');
const { validateCategory, validateMenuItem } = require('../middlewares/menu_middleware');

const staff = ['SuperAdmin', 'Admin', 'Manager'];

// ── Categories ──────────────────────────────────────────────
router.get('/categories', ctrl.getCategories);
router.post('/categories', protect, authorize(...staff), validateCategory, ctrl.createCategory);
router.get('/categories/:id', ctrl.getCategoryById);
router.patch('/categories/:id', protect, authorize(...staff), validateCategory, ctrl.updateCategory);
router.delete('/categories/:id', protect, authorize(...staff), ctrl.deleteCategory);

// ── Menu Items ───────────────────────────────────────────────
router.get('/items', ctrl.getItems);
router.post('/items', protect, authorize(...staff), validateMenuItem, ctrl.createItem);
router.get('/items/:id', ctrl.getItemById);
router.patch('/items/:id', protect, authorize(...staff), ctrl.updateItem);
router.delete('/items/:id', protect, authorize(...staff), ctrl.deleteItem);
router.patch('/items/:id/toggle', protect, authorize(...staff), ctrl.toggleAvailability);

module.exports = router;
