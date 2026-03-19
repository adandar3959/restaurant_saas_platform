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
  const order = await orderService.updateOrderStatus(
    req.params.id,
    req.params.restaurantId,
    req.body.status,
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
