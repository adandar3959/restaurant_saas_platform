const MenuCategory = require('../models/menuCategory_model');
const MenuItem     = require('../models/menuItem_model');
const Deal         = require('../models/deal_model');

exports.createCategory = async (data) => MenuCategory.create(data);

exports.createManyCategories = async (categories, restaurantId) => {
  const docs = categories.map((cat, i) => ({ ...cat, restaurantId, displayOrder: cat.displayOrder ?? i + 1 }));
  return MenuCategory.insertMany(docs);
};

exports.getCategories = async (restaurantId) =>
  MenuCategory.find({ restaurantId, deletedAt: null }).sort({ displayOrder: 1 });

exports.getCategoryById = async (id, restaurantId) => {
  const cat = await MenuCategory.findOne({ _id: id, restaurantId, deletedAt: null });
  if (!cat) throw Object.assign(new Error('Category not found'), { statusCode: 404 });
  return cat;
};

exports.updateCategory = async (id, restaurantId, data) => {
  const cat = await MenuCategory.findOneAndUpdate({ _id: id, restaurantId }, data, { returnDocument: 'after', runValidators: true });
  if (!cat) throw Object.assign(new Error('Category not found'), { statusCode: 404 });
  return cat;
};

exports.deleteCategory = async (id, restaurantId) => {
  const cat = await MenuCategory.findOneAndUpdate(
    { _id: id, restaurantId },
    { deletedAt: new Date(), isActive: false },
    { returnDocument: 'after' }
  );
  if (!cat) throw Object.assign(new Error('Category not found'), { statusCode: 404 });
  return cat;
};

exports.createItem = async (data) => MenuItem.create(data);

exports.createManyItems = async (items, restaurantId) => {
  const docs = items.map((item) => ({ ...item, restaurantId }));
  return MenuItem.insertMany(docs);
};

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
  const item = await MenuItem.findOneAndUpdate({ _id: id, restaurantId }, data, { returnDocument: 'after', runValidators: true });
  if (!item) throw Object.assign(new Error('Menu item not found'), { statusCode: 404 });
  return item;
};

exports.deleteItem = async (id, restaurantId) => {
  const item = await MenuItem.findOneAndUpdate(
    { _id: id, restaurantId },
    { deletedAt: new Date(), isAvailable: false },
    { returnDocument: 'after' }
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

// --- Deal Services -------------------------------------------
exports.createDeal = async (data) => Deal.create(data);

exports.getDeals = async (restaurantId, filters = {}) => {
  const query = { restaurantId, deletedAt: null };
  if (filters.isAvailable !== undefined) query.isAvailable = filters.isAvailable === 'true';
  if (filters.isFeatured  !== undefined) query.isFeatured  = filters.isFeatured  === 'true';
  return Deal.find(query).sort({ displayOrder: 1, createdAt: -1 });
};

exports.getDealById = async (id, restaurantId) => {
  const deal = await Deal.findOne({ _id: id, restaurantId, deletedAt: null });
  if (!deal) throw Object.assign(new Error('Deal not found'), { statusCode: 404 });
  return deal;
};

exports.updateDeal = async (id, restaurantId, data) => {
  const deal = await Deal.findOneAndUpdate(
    { _id: id, restaurantId },
    data,
    { returnDocument: 'after', runValidators: true }
  );
  if (!deal) throw Object.assign(new Error('Deal not found'), { statusCode: 404 });
  return deal;
};

exports.deleteDeal = async (id, restaurantId) => {
  const deal = await Deal.findOneAndUpdate(
    { _id: id, restaurantId },
    { deletedAt: new Date(), isAvailable: false },
    { returnDocument: 'after' }
  );
  if (!deal) throw Object.assign(new Error('Deal not found'), { statusCode: 404 });
  return deal;
};

exports.toggleDeal = async (id, restaurantId) => {
  const deal = await Deal.findOne({ _id: id, restaurantId });
  if (!deal) throw Object.assign(new Error('Deal not found'), { statusCode: 404 });
  deal.isAvailable = !deal.isAvailable;
  return deal.save();
};
