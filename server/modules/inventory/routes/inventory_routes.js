const router = require('express').Router({ mergeParams: true });
const ctrl = require('../controllers/inventory_controller');
const { protect, authorize } = require('../../../utils/auth.middleware');

const staff = ['SuperAdmin', 'Admin', 'Manager'];

// Ingredients
router.get('/ingredients', protect, authorize(...staff), ctrl.getIngredients);
router.post('/ingredients', protect, authorize(...staff), ctrl.createIngredient);
router.get('/ingredients/low-stock', protect, authorize(...staff), ctrl.getLowStock);
router.get('/ingredients/:id', protect, authorize(...staff), ctrl.getIngredientById);
router.patch('/ingredients/:id', protect, authorize(...staff), ctrl.updateIngredient);
router.delete('/ingredients/:id', protect, authorize(...staff), ctrl.deleteIngredient);

// Recipes
router.get('/recipes', protect, authorize(...staff), ctrl.getRecipes);
router.post('/recipes', protect, authorize(...staff), ctrl.createRecipe);
router.get('/recipes/:id', protect, authorize(...staff), ctrl.getRecipeById);
router.patch('/recipes/:id', protect, authorize(...staff), ctrl.updateRecipe);

// Suppliers
router.get('/suppliers', protect, authorize(...staff), ctrl.getSuppliers);
router.post('/suppliers', protect, authorize(...staff), ctrl.createSupplier);
router.patch('/suppliers/:id', protect, authorize(...staff), ctrl.updateSupplier);

// Purchase Orders
router.get('/purchase-orders', protect, authorize(...staff), ctrl.getPurchaseOrders);
router.post('/purchase-orders', protect, authorize(...staff), ctrl.createPurchaseOrder);
router.patch('/purchase-orders/:id/status', protect, authorize(...staff), ctrl.updatePOStatus);

module.exports = router;
