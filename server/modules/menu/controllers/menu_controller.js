const menuService = require('../services/menu_service');
const asyncHandler = require('../../../utils/asyncHandler');
const { sendSuccess } = require('../../../utils/apiResponse');
const { paginate, paginateMeta } = require('../../../utils/paginate');
const { getCache, setCache, clearMenuCache } = require('../../../utils/redis');

// --- Category Controllers -------------------------------------
exports.createCategory = asyncHandler(async (req, res) => {
  const rid = req.params.restaurantId;
  const cat = await menuService.createCategory({ ...req.body, restaurantId: rid });
  await clearMenuCache(rid);
  sendSuccess(res, cat, 'Category created', 201);
});

exports.createManyCategories = asyncHandler(async (req, res) => {
  const rid = req.params.restaurantId;
  const cats = await menuService.createManyCategories(req.body, rid);
  await clearMenuCache(rid);
  sendSuccess(res, cats, 'Categories created', 201);
});

exports.getCategories = asyncHandler(async (req, res) => {
  const rid = req.params.restaurantId;
  const cacheKey = `menu:categories:${rid}`;
  
  const cached = await getCache(cacheKey);
  if (cached) {
    return sendSuccess(res, cached, 'Categories fetched from cache');
  }

  const cats = await menuService.getCategories(rid);
  await setCache(cacheKey, cats, 3600); // Cache for 1 hour
  sendSuccess(res, cats);
});

exports.getCategoryById = asyncHandler(async (req, res) => {
  const cat = await menuService.getCategoryById(req.params.id, req.params.restaurantId);
  sendSuccess(res, cat);
});

exports.updateCategory = asyncHandler(async (req, res) => {
  const rid = req.params.restaurantId;
  const cat = await menuService.updateCategory(req.params.id, rid, req.body);
  await clearMenuCache(rid);
  sendSuccess(res, cat, 'Category updated');
});

exports.deleteCategory = asyncHandler(async (req, res) => {
  const rid = req.params.restaurantId;
  await menuService.deleteCategory(req.params.id, rid);
  await clearMenuCache(rid);
  sendSuccess(res, null, 'Category deleted');
});

// --- Item Controllers -----------------------------------------
exports.createItem = asyncHandler(async (req, res) => {
  const rid = req.params.restaurantId;
  const item = await menuService.createItem({ ...req.body, restaurantId: rid });
  await clearMenuCache(rid);
  sendSuccess(res, item, 'Menu item created', 201);
});

exports.createManyItems = asyncHandler(async (req, res) => {
  const rid = req.params.restaurantId;
  const items = await menuService.createManyItems(req.body, rid);
  await clearMenuCache(rid);
  sendSuccess(res, items, 'Menu items created', 201);
});

exports.getItems = asyncHandler(async (req, res) => {
  const rid = req.params.restaurantId;
  const queryStr = JSON.stringify(req.query);
  const cacheKey = `menu:items:${rid}:${queryStr}`;

  const cached = await getCache(cacheKey);
  if (cached) {
    return sendSuccess(res, cached, 'Items fetched from cache');
  }

  const pagination = paginate(req.query);
  const { items, total } = await menuService.getItems(rid, req.query, pagination);
  const responseData = { items, meta: paginateMeta(total, pagination.page, pagination.limit) };

  await setCache(cacheKey, responseData, 3600); // Cache for 1 hour
  sendSuccess(res, responseData);
});

exports.getItemById = asyncHandler(async (req, res) => {
  const item = await menuService.getItemById(req.params.id, req.params.restaurantId);
  sendSuccess(res, item);
});

exports.updateItem = asyncHandler(async (req, res) => {
  const rid = req.params.restaurantId;
  const item = await menuService.updateItem(req.params.id, rid, req.body);
  await clearMenuCache(rid);
  sendSuccess(res, item, 'Menu item updated');
});

exports.deleteItem = asyncHandler(async (req, res) => {
  const rid = req.params.restaurantId;
  await menuService.deleteItem(req.params.id, rid);
  await clearMenuCache(rid);
  sendSuccess(res, null, 'Menu item deleted');
});

exports.toggleAvailability = asyncHandler(async (req, res) => {
  const rid = req.params.restaurantId;
  const item = await menuService.toggleAvailability(req.params.id, rid);
  await clearMenuCache(rid);
  sendSuccess(res, item, `Item marked as ${item.isAvailable ? 'available' : 'unavailable'}`);
});

// --- Deal Controllers ----------------------------------------
exports.createDeal = asyncHandler(async (req, res) => {
  const rid = req.params.restaurantId;
  const deal = await menuService.createDeal({ ...req.body, restaurantId: rid });
  await clearMenuCache(rid);
  sendSuccess(res, deal, 'Deal created', 201);
});

exports.getDeals = asyncHandler(async (req, res) => {
  const rid = req.params.restaurantId;
  const queryStr = JSON.stringify(req.query);
  const cacheKey = `menu:deals:${rid}:${queryStr}`;

  const cached = await getCache(cacheKey);
  if (cached) {
    return sendSuccess(res, cached, 'Deals fetched from cache');
  }

  const deals = await menuService.getDeals(rid, req.query);
  await setCache(cacheKey, deals, 3600); // Cache for 1 hour
  sendSuccess(res, deals);
});

exports.getDealById = asyncHandler(async (req, res) => {
  const deal = await menuService.getDealById(req.params.id, req.params.restaurantId);
  sendSuccess(res, deal);
});

exports.updateDeal = asyncHandler(async (req, res) => {
  const rid = req.params.restaurantId;
  const deal = await menuService.updateDeal(req.params.id, rid, req.body);
  await clearMenuCache(rid);
  sendSuccess(res, deal, 'Deal updated');
});

exports.deleteDeal = asyncHandler(async (req, res) => {
  const rid = req.params.restaurantId;
  await menuService.deleteDeal(req.params.id, rid);
  await clearMenuCache(rid);
  sendSuccess(res, null, 'Deal deleted');
});

exports.toggleDeal = asyncHandler(async (req, res) => {
  const rid = req.params.restaurantId;
  const deal = await menuService.toggleDeal(req.params.id, rid);
  await clearMenuCache(rid);
  sendSuccess(res, deal, `Deal marked as ${deal.isAvailable ? 'available' : 'unavailable'}`);
});
