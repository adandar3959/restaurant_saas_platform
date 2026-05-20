const Ingredient = require('../models/ingredient_model');
const Recipe = require('../models/recipe_model');
const Supplier = require('../models/supplier_model');
const PurchaseOrder = require('../models/purchaseOrder_model');

const mapToBackend = (data) => {
  if (!data) return {};
  const mapped = { ...data };
  if (data.name !== undefined) mapped.ingredientName = data.name;
  if (data.unit !== undefined) mapped.unitOfMeasurement = data.unit;
  if (data.reorderLevel !== undefined) mapped.lowStockThreshold = data.reorderLevel;
  return mapped;
};

const mapToFrontend = (doc) => {
  if (!doc) return null;
  const obj = doc.toObject ? doc.toObject({ virtuals: true }) : { ...doc };
  obj.name = obj.ingredientName;
  obj.unit = obj.unitOfMeasurement;
  obj.reorderLevel = obj.lowStockThreshold;
  return obj;
};

exports.createIngredient = async (data) => {
  const mapped = mapToBackend(data);
  const item = await Ingredient.create(mapped);
  return mapToFrontend(item);
};

exports.getIngredients = async (restaurantId, pagination) => {
  const query = { restaurantId, isActive: true };
  const [ingredients, total] = await Promise.all([
    Ingredient.find(query).populate('supplierId', 'name').skip(pagination.skip).limit(pagination.limit).sort({ ingredientName: 1 }),
    Ingredient.countDocuments(query),
  ]);
  return { ingredients: ingredients.map(mapToFrontend), total };
};

exports.getLowStock = async (restaurantId) => {
  const ingredients = await Ingredient.find({ restaurantId, isActive: true, $expr: { $lte: ['$currentStock', '$lowStockThreshold'] } });
  return ingredients.map(mapToFrontend);
};

exports.getIngredientById = async (id, restaurantId) => {
  const item = await Ingredient.findOne({ _id: id, restaurantId });
  if (!item) throw Object.assign(new Error('Ingredient not found'), { statusCode: 404 });
  return mapToFrontend(item);
};

exports.updateIngredient = async (id, restaurantId, data) => {
  const mapped = mapToBackend(data);
  const item = await Ingredient.findOneAndUpdate({ _id: id, restaurantId }, mapped, { returnDocument: 'after' });
  if (!item) throw Object.assign(new Error('Ingredient not found'), { statusCode: 404 });
  return mapToFrontend(item);
};

exports.deleteIngredient = async (id, restaurantId) => {
  const item = await Ingredient.findOneAndUpdate({ _id: id, restaurantId }, { isActive: false }, { returnDocument: 'after' });
  if (!item) throw Object.assign(new Error('Ingredient not found'), { statusCode: 404 });
  return mapToFrontend(item);
};


exports.createRecipe = async (data) => Recipe.create(data);

exports.getRecipes = async (restaurantId) =>
  Recipe.find({ restaurantId, isActive: true }).populate('menuItemId', 'name price').populate('ingredients.ingredientId', 'ingredientName unitOfMeasurement');

exports.getRecipeById = async (id, restaurantId) => {
  const recipe = await Recipe.findOne({ _id: id, restaurantId }).populate('menuItemId', 'name').populate('ingredients.ingredientId', 'ingredientName unitOfMeasurement currentStock');
  if (!recipe) throw Object.assign(new Error('Recipe not found'), { statusCode: 404 });
  return recipe;
};

exports.updateRecipe = async (id, restaurantId, data) => {
  const recipe = await Recipe.findOneAndUpdate({ _id: id, restaurantId }, data, { returnDocument: 'after' });
  if (!recipe) throw Object.assign(new Error('Recipe not found'), { statusCode: 404 });
  return recipe;
};

exports.createSupplier = async (data) => Supplier.create(data);

exports.getSuppliers = async (restaurantId) => Supplier.find({ restaurantId, isActive: true });

exports.updateSupplier = async (id, restaurantId, data) => {
  const supplier = await Supplier.findOneAndUpdate({ _id: id, restaurantId }, data, { returnDocument: 'after' });
  if (!supplier) throw Object.assign(new Error('Supplier not found'), { statusCode: 404 });
  return supplier;
};

exports.createPurchaseOrder = async (data) => {
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
  const po = await PurchaseOrder.findOneAndUpdate({ _id: id, restaurantId }, update, { returnDocument: 'after' });
  if (!po) throw Object.assign(new Error('Purchase order not found'), { statusCode: 404 });

  if (status === 'Received') {
    for (const item of po.items) {
      await Ingredient.findByIdAndUpdate(item.ingredientId, { $inc: { currentStock: item.quantity } });
    }
  }
  return po;
};
