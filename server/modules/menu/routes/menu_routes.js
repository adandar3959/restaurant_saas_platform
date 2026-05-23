const router = require('express').Router({ mergeParams: true });
const ctrl = require('../controllers/menu_controller');
const { protect, authorize } = require('../../../utils/auth.middleware');
const { validateCategory, validateMenuItem } = require('../middlewares/menu_middleware');
const { checkLimit } = require('../../../utils/plan.middleware');
const Category = require('../models/menuCategory_model');
const MenuItem = require('../models/menuItem_model');

const staff = ['SuperAdmin', 'Admin', 'Manager'];

router.get('/categories', ctrl.getCategories);
router.post('/categories', 
  protect, 
  authorize(...staff), 
  checkLimit('maxMenuCategories', async (rid) => Category.countDocuments({ restaurantId: rid, deletedAt: null })),
  validateCategory, 
  ctrl.createCategory
);
router.post('/categories/bulk', 
  protect, 
  authorize(...staff), 
  checkLimit('maxMenuCategories', async (rid) => Category.countDocuments({ restaurantId: rid, deletedAt: null })),
  ctrl.createManyCategories
);
router.get('/categories/:id', ctrl.getCategoryById);
router.patch('/categories/:id', protect, authorize(...staff), validateCategory, ctrl.updateCategory);
router.delete('/categories/:id', protect, authorize(...staff), ctrl.deleteCategory);

router.get('/items', ctrl.getItems);
router.post('/items', 
  protect, 
  authorize(...staff), 
  checkLimit('maxMenuItems', async (rid) => MenuItem.countDocuments({ restaurantId: rid, deletedAt: null })),
  validateMenuItem, 
  ctrl.createItem
);
router.post('/items/bulk', 
  protect, 
  authorize(...staff), 
  checkLimit('maxMenuItems', async (rid) => MenuItem.countDocuments({ restaurantId: rid, deletedAt: null })),
  ctrl.createManyItems
);
router.get('/items/:id', ctrl.getItemById);
router.patch('/items/:id', protect, authorize(...staff), ctrl.updateItem);
router.delete('/items/:id', protect, authorize(...staff), ctrl.deleteItem);
router.patch('/items/:id/toggle', protect, authorize(...staff), ctrl.toggleAvailability);

module.exports = router;

// Deals (public GET, protected write)
router.get('/deals',              ctrl.getDeals);
router.post('/deals',             protect, authorize(...staff), ctrl.createDeal);
router.get('/deals/:id',          ctrl.getDealById);
router.patch('/deals/:id',        protect, authorize(...staff), ctrl.updateDeal);
router.delete('/deals/:id',       protect, authorize(...staff), ctrl.deleteDeal);
router.patch('/deals/:id/toggle', protect, authorize(...staff), ctrl.toggleDeal);
