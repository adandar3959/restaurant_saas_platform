const Ingredient = require('../models/ingredient_model');
const Recipe = require('../models/recipe_model');
const Supplier = require('../models/supplier_model');
const PurchaseOrder = require('../models/purchaseOrder_model');

// ── Ingredients ──────────────────────────────────────────────
exports.createIngredient = async (data) => Ingredient.create(data);

exports.getIngredients = async (restaurantId, pagination) => {
  const query = { restaurantId, isActive: true };
  const [ingredients, total] = await Promise.all([
    Ingredient.find(query).populate('supplierId', 'name').skip(pagination.skip).limit(pagination.limit).sort({ ingredientName: 1 }),
    Ingredient.countDocuments(query),
  ]);
  return { ingredients, total };
};

exports.getLowStock = async (restaurantId) =>
  Ingredient.find({ restaurantId, isActive: true, $expr: { $lte: ['$currentStock', '$lowStockThreshold'] } });

exports.getIngredientById = async (id, restaurantId) => {
  const item = await Ingredient.findOne({ _id: id, restaurantId });
  if (!item) throw Object.assign(new Error('Ingredient not found'), { statusCode: 404 });
  return item;
};

exports.updateIngredient = async (id, restaurantId, data) => {
  const item = await Ingredient.findOneAndUpdate({ _id: id, restaurantId }, data, { new: true });
  if (!item) throw Object.assign(new Error('Ingredient not found'), { statusCode: 404 });
  return item;
};

exports.deleteIngredient = async (id, restaurantId) => {
  const item = await Ingredient.findOneAndUpdate({ _id: id, restaurantId }, { isActive: false }, { new: true });
  if (!item) throw Object.assign(new Error('Ingredient not found'), { statusCode: 404 });
  return item;
};

// ── Recipes ──────────────────────────────────────────────────
exports.createRecipe = async (data) => Recipe.create(data);

exports.getRecipes = async (restaurantId) =>
  Recipe.find({ restaurantId, isActive: true }).populate('menuItemId', 'name price').populate('ingredients.ingredientId', 'ingredientName unitOfMeasurement');

exports.getRecipeById = async (id, restaurantId) => {
  const recipe = await Recipe.findOne({ _id: id, restaurantId }).populate('menuItemId', 'name').populate('ingredients.ingredientId', 'ingredientName unitOfMeasurement currentStock');
  if (!recipe) throw Object.assign(new Error('Recipe not found'), { statusCode: 404 });
  return recipe;
};

exports.updateRecipe = async (id, restaurantId, data) => {
  const recipe = await Recipe.findOneAndUpdate({ _id: id, restaurantId }, data, { new: true });
  if (!recipe) throw Object.assign(new Error('Recipe not found'), { statusCode: 404 });
  return recipe;
};

// ── Suppliers ────────────────────────────────────────────────
exports.createSupplier = async (data) => Supplier.create(data);

exports.getSuppliers = async (restaurantId) => Supplier.find({ restaurantId, isActive: true });

exports.updateSupplier = async (id, restaurantId, data) => {
  const supplier = await Supplier.findOneAndUpdate({ _id: id, restaurantId }, data, { new: true });
  if (!supplier) throw Object.assign(new Error('Supplier not found'), { statusCode: 404 });
  return supplier;
};

// ── Purchase Orders ──────────────────────────────────────────
exports.createPurchaseOrder = async (data) => {
  // Auto-calculate totals
  data.items = data.items.map((i) => ({ ...i, totalCost: i.quantity * i.unitCost }));
  data.totalAmount = data.items.reduce((sum, i) => sum + i.totalCost, 0);
  const count = await PurchaseOrder.countDocuments({ restaurantId: data.restaurantId });
  data.poNumber = `PO-${String(count + 1).padStart(4, '0')}`;
  return PurchaseOrder.create(data);
};

exports.getPurchaseOrders = async (restaurantId, pagination) => {
  const [orders, total] = await Promise.all([
    PurchaseOrder.find({ restaurantId }).populate('supplierId', 'name').skip(pagination.skip).limit(pagination.limit).sort({ createdAt: -1 }),
    PurchaseOrder.countDocuments({ restaurantId }),
  ]);
  return { orders, total };
};

exports.updatePOStatus = async (id, restaurantId, status) => {
  const update = { status };
  if (status === 'Received') update.receivedAt = new Date();
  const po = await PurchaseOrder.findOneAndUpdate({ _id: id, restaurantId }, update, { new: true });
  if (!po) throw Object.assign(new Error('Purchase order not found'), { statusCode: 404 });

  // If received, update ingredient stock
  if (status === 'Received') {
    for (const item of po.items) {
      await Ingredient.findByIdAndUpdate(item.ingredientId, { $inc: { currentStock: item.quantity } });
    }
  }
  return po;
};
