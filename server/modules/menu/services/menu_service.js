const MenuCategory = require('../models/menuCategory_model');
const MenuItem = require('../models/menuItem_model');

// ── Categories ──────────────────────────────────────────────
exports.createCategory = async (data) => MenuCategory.create(data);

exports.getCategories = async (restaurantId) =>
  MenuCategory.find({ restaurantId, deletedAt: null }).sort({ displayOrder: 1 });

exports.getCategoryById = async (id, restaurantId) => {
  const cat = await MenuCategory.findOne({ _id: id, restaurantId, deletedAt: null });
  if (!cat) throw Object.assign(new Error('Category not found'), { statusCode: 404 });
  return cat;
};

exports.updateCategory = async (id, restaurantId, data) => {
  const cat = await MenuCategory.findOneAndUpdate({ _id: id, restaurantId }, data, { new: true, runValidators: true });
  if (!cat) throw Object.assign(new Error('Category not found'), { statusCode: 404 });
  return cat;
};

exports.deleteCategory = async (id, restaurantId) => {
  const cat = await MenuCategory.findOneAndUpdate(
    { _id: id, restaurantId },
    { deletedAt: new Date(), isActive: false },
    { new: true }
  );
  if (!cat) throw Object.assign(new Error('Category not found'), { statusCode: 404 });
  return cat;
};

// ── Menu Items ───────────────────────────────────────────────
exports.createItem = async (data) => MenuItem.create(data);

exports.getItems = async (restaurantId, filters, pagination) => {
  const query = { restaurantId, deletedAt: null };
  if (filters.categoryId) query.categoryId = filters.categoryId;
  if (filters.isAvailable !== undefined) query.isAvailable = filters.isAvailable === 'true';
  if (filters.tag) query.tags = filters.tag;
  const [items, total] = await Promise.all([
    MenuItem.find(query)
      .populate('categoryId', 'name')
      .skip(pagination.skip)
      .limit(pagination.limit)
      .sort({ displayOrder: 1 }),
    MenuItem.countDocuments(query),
  ]);
  return { items, total };
};

exports.getItemById = async (id, restaurantId) => {
  const item = await MenuItem.findOne({ _id: id, restaurantId, deletedAt: null }).populate('categoryId', 'name');
  if (!item) throw Object.assign(new Error('Menu item not found'), { statusCode: 404 });
  return item;
};

exports.updateItem = async (id, restaurantId, data) => {
  const item = await MenuItem.findOneAndUpdate({ _id: id, restaurantId }, data, { new: true, runValidators: true });
  if (!item) throw Object.assign(new Error('Menu item not found'), { statusCode: 404 });
  return item;
};

exports.deleteItem = async (id, restaurantId) => {
  const item = await MenuItem.findOneAndUpdate(
    { _id: id, restaurantId },
    { deletedAt: new Date(), isAvailable: false },
    { new: true }
  );
  if (!item) throw Object.assign(new Error('Menu item not found'), { statusCode: 404 });
  return item;
};

exports.toggleAvailability = async (id, restaurantId) => {
  const item = await MenuItem.findOne({ _id: id, restaurantId });
  if (!item) throw Object.assign(new Error('Menu item not found'), { statusCode: 404 });
  item.isAvailable = !item.isAvailable;
  return item.save();
};
