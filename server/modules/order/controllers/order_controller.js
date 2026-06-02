const orderService = require('../services/order_service');
const asyncHandler = require('../../../utils/asyncHandler');
const { sendSuccess } = require('../../../utils/apiResponse');
const { paginate, paginateMeta } = require('../../../utils/paginate');

exports.createOrder = asyncHandler(async (req, res) => {
  const order = await orderService.createOrder(
    { ...req.body, customerId: req.user?._id },
    req.params.restaurantId
  );
  sendSuccess(res, order, 'Order placed', 201);
});

exports.getOrders = asyncHandler(async (req, res) => {
  const pagination = paginate(req.query);
  const { orders, total } = await orderService.getOrders(req.params.restaurantId, req.query, pagination);
  sendSuccess(res, { orders, meta: paginateMeta(total, pagination.page, pagination.limit) });
});

exports.getOrderById = asyncHandler(async (req, res) => {
  const order = await orderService.getOrderById(req.params.id, req.params.restaurantId);
  sendSuccess(res, order);
});

exports.updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const role = req.user.role;

  const roleStatusMap = {
    Accepted: ['Chef'],
    Preparing: ['Chef'],
    Ready: ['Chef'],
    OutForDelivery: ['Driver'],
    Completed: ['Waiter', 'Driver', 'Chef'],
    Cancelled: ['Admin', 'Manager'],
  };

  const allowed = roleStatusMap[status];
  if (allowed && !allowed.includes(role)) {
    return res.status(403).json({ success: false, message: `Role '${role}' cannot set status to '${status}'` });
  }

  const order = await orderService.updateOrderStatus(
    req.params.id,
    req.params.restaurantId,
    status,
    req.user._id
  );
  sendSuccess(res, order, 'Order status updated');
});

exports.updatePayment = asyncHandler(async (req, res) => {
  const order = await orderService.updatePayment(req.params.id, req.params.restaurantId, req.body);
  sendSuccess(res, order, 'Payment updated');
});

exports.getMyOrders = asyncHandler(async (req, res) => {
  const pagination = paginate(req.query);
  const { orders, total } = await orderService.getMyOrders(req.user._id, pagination);
  sendSuccess(res, { orders, meta: paginateMeta(total, pagination.page, pagination.limit) });
});

exports.getOrderStats = asyncHandler(async (req, res) => {
  const stats = await orderService.getOrderStats(req.params.restaurantId, req.query);
  sendSuccess(res, stats);
});

exports.updateItemStatus = asyncHandler(async (req, res) => {
  const order = await orderService.updateItemStatus(
    req.params.id,
    req.params.restaurantId,
    req.params.itemId,
    req.body.kitchenStatus
  );
  sendSuccess(res, order, 'Item status updated');
});

exports.addTip = asyncHandler(async (req, res) => {
  const order = await orderService.addTip(
    req.params.id,
    req.params.restaurantId,
    req.body.tipAmount
  );
  sendSuccess(res, order, 'Tip added');
});

exports.publicFindOrder = asyncHandler(async (req, res) => {
  const order = await orderService.publicFindOrder(req.params.id);
  sendSuccess(res, order);
});

exports.addItemsToOrder = asyncHandler(async (req, res) => {
  const order = await orderService.addItemsToOrder(
    req.params.id,
    req.params.restaurantId,
    req.body.items
  );
  sendSuccess(res, order, 'Items added to order successfully');
});
