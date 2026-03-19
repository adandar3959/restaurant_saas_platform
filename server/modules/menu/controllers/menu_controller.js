const menuService = require('../services/menu_service');
const asyncHandler = require('../../../utils/asyncHandler');
const { sendSuccess } = require('../../../utils/apiResponse');
const { paginate, paginateMeta } = require('../../../utils/paginate');

// ── Categories ──────────────────────────────────────────────
exports.createCategory = asyncHandler(async (req, res) => {
  const cat = await menuService.createCategory({ ...req.body, restaurantId: req.params.restaurantId });
  sendSuccess(res, cat, 'Category created', 201);
});

exports.getCategories = asyncHandler(async (req, res) => {
  const cats = await menuService.getCategories(req.params.restaurantId);
  sendSuccess(res, cats);
});

exports.getCategoryById = asyncHandler(async (req, res) => {
  const cat = await menuService.getCategoryById(req.params.id, req.params.restaurantId);
  sendSuccess(res, cat);
});

exports.updateCategory = asyncHandler(async (req, res) => {
  const cat = await menuService.updateCategory(req.params.id, req.params.restaurantId, req.body);
  sendSuccess(res, cat, 'Category updated');
});

exports.deleteCategory = asyncHandler(async (req, res) => {
  await menuService.deleteCategory(req.params.id, req.params.restaurantId);
  sendSuccess(res, null, 'Category deleted');
});

// ── Menu Items ───────────────────────────────────────────────
exports.createItem = asyncHandler(async (req, res) => {
  const item = await menuService.createItem({ ...req.body, restaurantId: req.params.restaurantId });
  sendSuccess(res, item, 'Menu item created', 201);
});

exports.getItems = asyncHandler(async (req, res) => {
  const pagination = paginate(req.query);
  const { items, total } = await menuService.getItems(req.params.restaurantId, req.query, pagination);
  sendSuccess(res, { items, meta: paginateMeta(total, pagination.page, pagination.limit) });
});

exports.getItemById = asyncHandler(async (req, res) => {
  const item = await menuService.getItemById(req.params.id, req.params.restaurantId);
  sendSuccess(res, item);
});

exports.updateItem = asyncHandler(async (req, res) => {
  const item = await menuService.updateItem(req.params.id, req.params.restaurantId, req.body);
  sendSuccess(res, item, 'Menu item updated');
});

exports.deleteItem = asyncHandler(async (req, res) => {
  await menuService.deleteItem(req.params.id, req.params.restaurantId);
  sendSuccess(res, null, 'Menu item deleted');
});

exports.toggleAvailability = asyncHandler(async (req, res) => {
  const item = await menuService.toggleAvailability(req.params.id, req.params.restaurantId);
  sendSuccess(res, item, `Item marked as ${item.isAvailable ? 'available' : 'unavailable'}`);
});
