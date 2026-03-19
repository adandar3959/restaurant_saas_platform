const inventoryService = require('../services/inventory_service');
const asyncHandler = require('../../../utils/asyncHandler');
const { sendSuccess } = require('../../../utils/apiResponse');
const { paginate, paginateMeta } = require('../../../utils/paginate');

exports.createIngredient = asyncHandler(async (req, res) => {
  const item = await inventoryService.createIngredient({ ...req.body, restaurantId: req.params.restaurantId });
  sendSuccess(res, item, 'Ingredient created', 201);
});

exports.getIngredients = asyncHandler(async (req, res) => {
  const pagination = paginate(req.query);
  const { ingredients, total } = await inventoryService.getIngredients(req.params.restaurantId, pagination);
  sendSuccess(res, { ingredients, meta: paginateMeta(total, pagination.page, pagination.limit) });
});

exports.getLowStock = asyncHandler(async (req, res) => {
  const items = await inventoryService.getLowStock(req.params.restaurantId);
  sendSuccess(res, items);
});

exports.getIngredientById = asyncHandler(async (req, res) => {
  const item = await inventoryService.getIngredientById(req.params.id, req.params.restaurantId);
  sendSuccess(res, item);
});

exports.updateIngredient = asyncHandler(async (req, res) => {
  const item = await inventoryService.updateIngredient(req.params.id, req.params.restaurantId, req.body);
  sendSuccess(res, item, 'Ingredient updated');
});

exports.deleteIngredient = asyncHandler(async (req, res) => {
  await inventoryService.deleteIngredient(req.params.id, req.params.restaurantId);
  sendSuccess(res, null, 'Ingredient deleted');
});

exports.createRecipe = asyncHandler(async (req, res) => {
  const recipe = await inventoryService.createRecipe({ ...req.body, restaurantId: req.params.restaurantId });
  sendSuccess(res, recipe, 'Recipe created', 201);
});

exports.getRecipes = asyncHandler(async (req, res) => {
  const recipes = await inventoryService.getRecipes(req.params.restaurantId);
  sendSuccess(res, recipes);
});

exports.getRecipeById = asyncHandler(async (req, res) => {
  const recipe = await inventoryService.getRecipeById(req.params.id, req.params.restaurantId);
  sendSuccess(res, recipe);
});

exports.updateRecipe = asyncHandler(async (req, res) => {
  const recipe = await inventoryService.updateRecipe(req.params.id, req.params.restaurantId, req.body);
  sendSuccess(res, recipe, 'Recipe updated');
});

exports.createSupplier = asyncHandler(async (req, res) => {
  const supplier = await inventoryService.createSupplier({ ...req.body, restaurantId: req.params.restaurantId });
  sendSuccess(res, supplier, 'Supplier created', 201);
});

exports.getSuppliers = asyncHandler(async (req, res) => {
  const suppliers = await inventoryService.getSuppliers(req.params.restaurantId);
  sendSuccess(res, suppliers);
});

exports.updateSupplier = asyncHandler(async (req, res) => {
  const supplier = await inventoryService.updateSupplier(req.params.id, req.params.restaurantId, req.body);
  sendSuccess(res, supplier, 'Supplier updated');
});

exports.createPurchaseOrder = asyncHandler(async (req, res) => {
  const po = await inventoryService.createPurchaseOrder({ ...req.body, restaurantId: req.params.restaurantId, createdBy: req.user._id });
  sendSuccess(res, po, 'Purchase order created', 201);
});

exports.getPurchaseOrders = asyncHandler(async (req, res) => {
  const pagination = paginate(req.query);
  const { orders, total } = await inventoryService.getPurchaseOrders(req.params.restaurantId, pagination);
  sendSuccess(res, { orders, meta: paginateMeta(total, pagination.page, pagination.limit) });
});

exports.updatePOStatus = asyncHandler(async (req, res) => {
  const po = await inventoryService.updatePOStatus(req.params.id, req.params.restaurantId, req.body.status);
  sendSuccess(res, po, 'Purchase order updated');
});
