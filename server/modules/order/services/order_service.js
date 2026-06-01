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

  // If the order is paid online (Stripe), we DEFER coupon usage, loyalty deductions, and KDS tickets
  // until the payment succeeds!
  const isOnlinePayment = 
    (order.payment?.method === 'Stripe') || 
    (data.payment?.method === 'Stripe') ||
    (data.payment?.method?.toLowerCase() === 'stripe');

  try {
    const fs = require('fs');
    fs.appendFileSync('debug_order.log', JSON.stringify({
      timestamp: new Date().toISOString(),
      orderId: order._id,
      orderPayment: order.payment,
      dataPayment: data.payment,
      isOnlinePayment
    }, null, 2) + '\n');
  } catch (logErr) {
    console.error('Failed to write debug log:', logErr);
  }

  if (!isOnlinePayment) {
    // Auto-increment coupon usage count on order placement
    const couponIdToUse = order.couponId || data.couponId;
    const couponCodeToUse = order.couponCode || data.couponCode;
    if (couponIdToUse || couponCodeToUse) {
      try {
        const Coupon = require('../../crm/models/coupon_model');
        if (couponIdToUse) {
          await Coupon.findByIdAndUpdate(couponIdToUse, { $inc: { usedCount: 1 } });
        } else if (couponCodeToUse) {
          await Coupon.findOneAndUpdate(
            { code: couponCodeToUse.toUpperCase(), restaurantId: order.restaurantId },
            { $inc: { usedCount: 1 } }
          );
        }
      } catch (couponErr) {
        console.error('Failed to increment coupon uses during order creation:', couponErr);
      }
    }

    if (order.customerId && order.loyaltyPointsRedeemed > 0) {
      try {
        const User = require('../../user/models/user_model');
        const LoyaltyTransaction = require('../../crm/models/loyaltyTransaction_model');
        const userObj = await User.findById(order.customerId);
        const currentPoints = userObj?.customerDetails?.loyalty?.points || 0;
        const deductPoints = Math.min(currentPoints, order.loyaltyPointsRedeemed);
        if (deductPoints > 0) {
          const newBalance = currentPoints - deductPoints;
          await User.findByIdAndUpdate(order.customerId, {
            'customerDetails.loyalty.points': newBalance,
            $inc: { 'customerDetails.loyalty.totalRedeemed': deductPoints }
          });
          await LoyaltyTransaction.create({
            restaurantId,
            customerId: order.customerId,
            orderId: order._id,
            type: 'Redeem',
            points: deductPoints,
            balanceAfter: newBalance,
            description: `Redeemed ${deductPoints} points as discount for order #${order.orderNumber}`
          });
        }
      } catch (err) {
        console.error('Failed to deduct loyalty points during order creation:', err);
      }
    }

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
  }

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

  // Exclude unpaid Stripe/online-card orders — they haven't been paid for yet
  // so they should not appear on KDS, admin orders, or any staff view
  query.$or = [
    { 'payment.method': { $exists: false } },
    { 'payment.method': null },
    { 'payment.method': 'Cash' },
    { 'payment.method': 'CreditCard' },
    { 'payment.method': 'Wallet' },
    { 'payment.method': 'PayPal' },
    { 'payment.method': 'Stripe', 'payment.status': 'Paid' },
  ];

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

  if (status === 'Ready' && order.orderType === 'Delivery') {
    try {
      const deliveryService = require('../../delivery/services/delivery_service');
      deliveryService.autoDispatch(id, restaurantId).catch(err => 
        console.error('Auto dispatch failed:', err)
      );
    } catch (err) {
      console.error('Could not load delivery service for auto dispatch', err);
    }
  }

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
    // Auto-award loyalty points on order completion
    if (order.customerId && !order.loyaltyPointsEarned) {
      try {
        const crmService = require('../../crm/services/crm_service');
        const pointsEarned = Math.floor((order.financials.subTotal || 0) / 10);
        if (pointsEarned > 0) {
          await crmService.awardPoints(
            order.customerId,
            order.restaurantId,
            order._id,
            pointsEarned,
            `Earned points from order #${order.orderNumber}`
          );
          update.loyaltyPointsEarned = pointsEarned;
        }
      } catch (err) {
        console.error('Failed to award loyalty points on order completion:', err);
      }
    }

    // Auto-increment coupon usage count on order completion
    if (order.couponId) {
      try {
        const Coupon = require('../../crm/models/coupon_model');
        await Coupon.findByIdAndUpdate(order.couponId, { $inc: { usedCount: 1 } });
      } catch (couponErr) {
        console.error('Failed to increment coupon uses on order completion:', couponErr);
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
    $or: [
      { 'payment.method': { $ne: 'Stripe' } },
      { 'payment.status': 'Paid' }
    ]
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

exports.processOrderPaymentSuccess = async (orderId, transactionId) => {
  const order = await Order.findById(orderId);
  if (!order) return null;

  // Prevent double processing
  if (order.payment?.status === 'Paid') {
    return order;
  }

  // Update payment status and accept order
  order.payment.status = 'Paid';
  order.payment.paidAt = new Date();
  order.payment.method = 'Stripe';
  if (transactionId) {
    order.payment.transactionId = transactionId;
  }
  order.status = 'Accepted';
  order.statusTimestamps.acceptedAt = new Date();

  // 1. Create KDS Kitchen Ticket
  try {
    const KitchenTicket = require('../../kitchen/models/kitchenTicket_model');
    await KitchenTicket.create({
      restaurantId: order.restaurantId,
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
  } catch (kdsErr) {
    console.error('Failed to create kitchen ticket on payment success:', kdsErr);
  }

  // 2. Deduct Loyalty Points
  if (order.customerId && order.loyaltyPointsRedeemed > 0) {
    try {
      const User = require('../../user/models/user_model');
      const LoyaltyTransaction = require('../../crm/models/loyaltyTransaction_model');
      const userObj = await User.findById(order.customerId);
      const currentPoints = userObj?.customerDetails?.loyalty?.points || 0;
      const deductPoints = Math.min(currentPoints, order.loyaltyPointsRedeemed);
      if (deductPoints > 0) {
        const newBalance = currentPoints - deductPoints;
        await User.findByIdAndUpdate(order.customerId, {
          'customerDetails.loyalty.points': newBalance,
          $inc: { 'customerDetails.loyalty.totalRedeemed': deductPoints }
        });
        await LoyaltyTransaction.create({
          restaurantId: order.restaurantId,
          customerId: order.customerId,
          orderId: order._id,
          type: 'Redeem',
          points: deductPoints,
          balanceAfter: newBalance,
          description: `Redeemed ${deductPoints} points as discount for order #${order.orderNumber}`
        });
      }
    } catch (err) {
      console.error('Failed to deduct loyalty points on payment success:', err);
    }
  }

  // 3. Increment Coupon usage count
  if (order.couponId || order.couponCode) {
    try {
      const Coupon = require('../../crm/models/coupon_model');
      if (order.couponId) {
        await Coupon.findByIdAndUpdate(order.couponId, { $inc: { usedCount: 1 } });
      } else if (order.couponCode) {
        await Coupon.findOneAndUpdate(
          { code: order.couponCode.toUpperCase(), restaurantId: order.restaurantId },
          { $inc: { usedCount: 1 } }
        );
      }
    } catch (couponErr) {
      console.error('Failed to increment coupon uses on payment success:', couponErr);
    }
  }

  await order.save();
  return order;
};
