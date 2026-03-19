const Order = require('../models/order_model');
const MenuItem = require('../../menu/models/menuItem_model');
const Tenant = require('../../tenant/models/tenant_model');
const KitchenTicket = require('../../kitchen/models/kitchenTicket_model');

// Generate human-readable order number e.g. "ORD-1042"
const generateOrderNumber = async (restaurantId) => {
  const tenant = await Tenant.findById(restaurantId).select('settings.orderPrefix');
  const prefix = tenant?.settings?.orderPrefix || 'ORD';
  const count = await Order.countDocuments({ restaurantId });
  return `${prefix}-${String(count + 1).padStart(4, '0')}`;
};

exports.createOrder = async (data, restaurantId) => {
  data.restaurantId = restaurantId;
  data.orderNumber = await generateOrderNumber(restaurantId);

  // Fetch menu items and calculate financials
  const tenant = await Tenant.findById(restaurantId).select('settings');
  const taxRate = tenant?.settings?.taxRate || 0;

  let subTotal = 0;
  const enrichedItems = await Promise.all(
    data.items.map(async (item) => {
      const menuItem = await MenuItem.findOne({ _id: item.menuItemId, restaurantId, isAvailable: true });
      if (!menuItem) throw Object.assign(new Error(`Item ${item.menuItemId} not found or unavailable`), { statusCode: 400 });
      const modifierTotal = (item.selectedModifiers || []).reduce((sum, m) => sum + (m.extraPrice || 0), 0);
      const itemTotal = (menuItem.price + modifierTotal) * item.quantity;
      subTotal += itemTotal;
      return { ...item, name: menuItem.name, image: menuItem.image, unitPrice: menuItem.price, itemTotal };
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

  // Auto-create kitchen ticket
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

exports.updateOrderStatus = async (id, restaurantId, status, userId) => {
  const update = { status, [`statusTimestamps.${status.charAt(0).toLowerCase() + status.slice(1)}At`]: new Date() };
  if (status === 'Cancelled') update.cancelledBy = userId;
  const order = await Order.findOneAndUpdate({ _id: id, restaurantId }, update, { new: true });
  if (!order) throw Object.assign(new Error('Order not found'), { statusCode: 404 });
  return order;
};

exports.updatePayment = async (id, restaurantId, paymentData) => {
  if (paymentData.status === 'Paid') paymentData.paidAt = new Date();
  const order = await Order.findOneAndUpdate(
    { _id: id, restaurantId },
    { payment: paymentData },
    { new: true }
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
