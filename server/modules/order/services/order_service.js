const Order = require('../models/order_model');
const MenuItem = require('../../menu/models/menuItem_model');
const Deal = require('../../menu/models/deal_model');
const Tenant = require('../../tenant/models/tenant_model');
const KitchenTicket = require('../../kitchen/models/kitchenTicket_model');
const Recipe = require('../../inventory/models/recipe_model');
const Ingredient = require('../../inventory/models/ingredient_model');

const generateOrderNumber = async (restaurantId) => {
  const tenant = await Tenant.findById(restaurantId).select('settings.orderPrefix');
  const prefix = tenant?.settings?.orderPrefix || 'ORD';
  const count = await Order.countDocuments({ restaurantId });
  return `${prefix}-${String(count + 1).padStart(4, '0')}`;
};

exports.createOrder = async (data, restaurantId) => {
  data.restaurantId = restaurantId;
  data.orderNumber = await generateOrderNumber(restaurantId);

  const tenant = await Tenant.findById(restaurantId).select('settings');
  const taxRate = tenant?.settings?.taxRate || 0;

  let subTotal = 0;
  const enrichedItems = await Promise.all(
    data.items.map(async (item) => {
      // 1. Try finding in MenuItem first
      let baseItem = await MenuItem.findOne({ _id: item.menuItemId, restaurantId, isAvailable: true });
      let price = baseItem?.price;
      let displayName = baseItem?.name;

      if (baseItem && item.sizeName && baseItem.sizes?.length > 0) {
        const sizeObj = baseItem.sizes.find(s => s.name === item.sizeName);
        if (sizeObj) {
          price = sizeObj.price;
          displayName = `${baseItem.name} (${sizeObj.name})`;
        }
      }

      // 2. If not found, try finding in Deal
      if (!baseItem) {
        baseItem = await Deal.findOne({ _id: item.menuItemId, restaurantId, isAvailable: true });
        price = baseItem?.dealPrice;
        displayName = baseItem?.name;
      }

      if (!baseItem) {
        throw Object.assign(new Error(`Item ${item.menuItemId} not found or unavailable`), { statusCode: 400 });
      }

      const modifierTotal = (item.selectedModifiers || []).reduce((sum, m) => sum + (m.extraPrice || 0), 0);
      const itemTotal = (price + modifierTotal) * item.quantity;
      subTotal += itemTotal;

      return {
        ...item,
        name: displayName,
        image: baseItem.image,
        unitPrice: price,
        itemTotal
      };
    })
  );

  data.items = enrichedItems;
  const taxAmount = parseFloat(((subTotal * taxRate) / 100).toFixed(2));
  const deliveryFee = data.financials?.deliveryFee || 0;
  const discountAmount = data.financials?.discountAmount || 0;
  const tipAmount = data.financials?.tipAmount || 0;

  data.financials = {
    subTotal,
    taxAmount,
    serviceCharge: data.financials?.serviceCharge || 0,
    deliveryFee,
    discountAmount,
    tipAmount,
    totalAmount: parseFloat((subTotal + taxAmount + deliveryFee - discountAmount + tipAmount).toFixed(2)),
  };

  const order = await Order.create(data);

  await KitchenTicket.create({
    restaurantId,
    orderId: order._id,
    orderNumber: order.orderNumber,
    orderType: order.orderType,
    tableNumber: order.tableNumber,
    items: order.items.map((i) => ({
      menuItemId: i.menuItemId,
      name: i.name,
      quantity: i.quantity,
      selectedModifiers: i.selectedModifiers,
      specialInstructions: i.specialInstructions,
    })),
  });

  return order;
};

exports.getOrders = async (restaurantId, filters, pagination) => {
  const query = { restaurantId };
  if (filters.status) query.status = filters.status;
  if (filters.orderType) query.orderType = filters.orderType;
  if (filters.customerId) query.customerId = filters.customerId;
  if (filters.date) {
    const start = new Date(filters.date);
    const end = new Date(filters.date);
    end.setDate(end.getDate() + 1);
    query.createdAt = { $gte: start, $lt: end };
  }
  const [orders, total] = await Promise.all([
    Order.find(query)
      .populate('customerId', 'name email phone')
      .populate('waiterId', 'name')
      .populate('tableId', 'tableNumber')
      .skip(pagination.skip)
      .limit(pagination.limit)
      .sort({ createdAt: -1 }),
    Order.countDocuments(query),
  ]);
  return { orders, total };
};

exports.getOrderById = async (id, restaurantId) => {
  const order = await Order.findOne({ _id: id, restaurantId })
    .populate('customerId', 'name email phone')
    .populate('waiterId', 'name')
    .populate('tableId', 'tableNumber');
  if (!order) throw Object.assign(new Error('Order not found'), { statusCode: 404 });
  return order;
};

const deductOrderInventory = async (order) => {
  try {
    for (const item of order.items) {
      // 1. Try to find a recipe for this item directly (if it's a MenuItem)
      const recipe = await Recipe.findOne({ menuItemId: item.menuItemId, isActive: true });
      if (recipe) {
        for (const ing of recipe.ingredients) {
          const totalDeducted = ing.quantity * item.quantity;
          await Ingredient.findByIdAndUpdate(ing.ingredientId, {
            $inc: { currentStock: -totalDeducted }
          });
        }
      } else {
        // 2. If not found, check if it is a Deal
        const deal = await Deal.findOne({ _id: item.menuItemId });
        if (deal && deal.items) {
          for (const subItem of deal.items) {
            if (subItem.menuItemId) {
              const subRecipe = await Recipe.findOne({ menuItemId: subItem.menuItemId, isActive: true });
              if (subRecipe) {
                for (const ing of subRecipe.ingredients) {
                  // Multiply the recipe ingredient quantity by the sub-item quantity inside the deal,
                  // and then by the overall ordered quantity of the deal!
                  const totalDeducted = ing.quantity * subItem.quantity * item.quantity;
                  await Ingredient.findByIdAndUpdate(ing.ingredientId, {
                    $inc: { currentStock: -totalDeducted }
                  });
                }
              }
            }
          }
        }
      }
    }
  } catch (err) {
    console.error('Error executing inventory deduction for order:', order._id, err);
  }
};

exports.updateOrderStatus = async (id, restaurantId, status, userId) => {
  const update = { status, [`statusTimestamps.${status.charAt(0).toLowerCase() + status.slice(1)}At`]: new Date() };
  if (status === 'Cancelled') update.cancelledBy = userId;

  const order = await Order.findOne({ _id: id, restaurantId });
  if (!order) throw Object.assign(new Error('Order not found'), { statusCode: 404 });

  if (status === 'Completed') {
    if (!order.inventoryDeducted) {
      await deductOrderInventory(order);
      update.inventoryDeducted = true;
    }
    // Auto-pay Cash/unpaid orders on completion
    if (order.payment?.status !== 'Paid') {
      update['payment.status'] = 'Paid';
      update['payment.paidAt'] = new Date();
      if (!order.payment?.method) {
        update['payment.method'] = 'Cash';
      }
    }
  }

  const updatedOrder = await Order.findOneAndUpdate({ _id: id, restaurantId }, update, { returnDocument: 'after' });
  return updatedOrder;
};

exports.updatePayment = async (id, restaurantId, paymentData) => {
  if (paymentData.status === 'Paid') paymentData.paidAt = new Date();
  const order = await Order.findOneAndUpdate(
    { _id: id, restaurantId },
    { payment: paymentData },
    { returnDocument: 'after' }
  );
  if (!order) throw Object.assign(new Error('Order not found'), { statusCode: 404 });
  return order;
};

exports.getMyOrders = async (customerId, pagination) => {
  const query = { customerId };
  const [orders, total] = await Promise.all([
    Order.find(query).skip(pagination.skip).limit(pagination.limit).sort({ createdAt: -1 }),
    Order.countDocuments(query),
  ]);
  return { orders, total };
};

exports.getOrderStats = async (restaurantId, query = {}) => {
  const endDate = query.endDate ? new Date(query.endDate) : new Date();
  const startDate = query.startDate
    ? new Date(query.startDate)
    : new Date(endDate - 30 * 24 * 60 * 60 * 1000);

  const matchStage = {
    restaurantId: new (require('mongoose').Types.ObjectId)(restaurantId),
    status: { $nin: ['Cancelled'] },
    createdAt: { $gte: startDate, $lte: endDate },
  };

  const dailyRevenue = await Order.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        amount: { $sum: '$financials.totalAmount' },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
    { $project: { _id: 0, date: '$_id', amount: 1, count: 1 } },
  ]);

  const [totals] = await Order.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        revenue: { $sum: '$financials.totalAmount' },
        orders: { $sum: 1 },
        avgOrderValue: { $avg: '$financials.totalAmount' },
      },
    },
    { $project: { _id: 0, revenue: 1, orders: 1, avgOrderValue: { $round: ['$avgOrderValue', 2] } } },
  ]);

  return {
    dailyRevenue,
    totals: totals || { revenue: 0, orders: 0, avgOrderValue: 0 },
  };
};

exports.updateItemStatus = async (orderId, restaurantId, itemId, kitchenStatus) => {
  const validStatuses = ['Pending', 'Preparing', 'Ready', 'Served'];
  if (!validStatuses.includes(kitchenStatus)) {
    throw Object.assign(new Error('Invalid kitchen status'), { statusCode: 400 });
  }

  const update = { 'items.$.kitchenStatus': kitchenStatus };

  const order = await Order.findOneAndUpdate(
    { _id: orderId, restaurantId, 'items._id': itemId },
    { $set: update },
    { returnDocument: 'after' }
  );
  if (!order) throw Object.assign(new Error('Order or item not found'), { statusCode: 404 });

  return order;
};

exports.addTip = async (orderId, restaurantId, tipAmount) => {
  if (tipAmount <= 0) throw Object.assign(new Error('Tip amount must be greater than 0'), { statusCode: 400 });

  const order = await Order.findOne({ _id: orderId, restaurantId });
  if (!order) throw Object.assign(new Error('Order not found'), { statusCode: 404 });

  const newTotal = order.financials.totalAmount + tipAmount;

  return Order.findByIdAndUpdate(
    orderId,
    {
      'financials.tipAmount': (order.financials.tipAmount || 0) + tipAmount,
      'financials.totalAmount': newTotal,
    },
    { returnDocument: 'after' }
  );
};

exports.publicFindOrder = async (id) => {
  const order = await Order.findById(id).select('restaurantId');
  if (!order) throw Object.assign(new Error('Order not found'), { statusCode: 404 });
  return order;
};
