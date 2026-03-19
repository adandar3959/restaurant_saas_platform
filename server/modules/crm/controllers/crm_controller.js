const crmService = require('../services/crm_service');
const asyncHandler = require('../../../utils/asyncHandler');
const { sendSuccess } = require('../../../utils/apiResponse');
const { paginate, paginateMeta } = require('../../../utils/paginate');

exports.createReview = asyncHandler(async (req, res) => {
  const review = await crmService.createReview({ ...req.body, restaurantId: req.params.restaurantId, customerId: req.user._id });
  sendSuccess(res, review, 'Review submitted', 201);
});

exports.getReviews = asyncHandler(async (req, res) => {
  const pagination = paginate(req.query);
  const { reviews, total } = await crmService.getReviews(req.params.restaurantId, req.query, pagination);
  sendSuccess(res, { reviews, meta: paginateMeta(total, pagination.page, pagination.limit) });
});

exports.respondToReview = asyncHandler(async (req, res) => {
  const review = await crmService.respondToReview(req.params.id, req.params.restaurantId, req.body.text, req.user._id);
  sendSuccess(res, review, 'Response added');
});

exports.flagReview = asyncHandler(async (req, res) => {
  const review = await crmService.flagReview(req.params.id, req.params.restaurantId);
  sendSuccess(res, review, 'Review flagged');
});

exports.createCoupon = asyncHandler(async (req, res) => {
  const coupon = await crmService.createCoupon({ ...req.body, restaurantId: req.params.restaurantId, createdBy: req.user._id });
  sendSuccess(res, coupon, 'Coupon created', 201);
});

exports.getCoupons = asyncHandler(async (req, res) => {
  const coupons = await crmService.getCoupons(req.params.restaurantId);
  sendSuccess(res, coupons);
});

exports.validateCoupon = asyncHandler(async (req, res) => {
  const coupon = await crmService.getCouponByCode(req.params.code, req.params.restaurantId);
  sendSuccess(res, coupon, 'Coupon is valid');
});

exports.updateCoupon = asyncHandler(async (req, res) => {
  const coupon = await crmService.updateCoupon(req.params.id, req.params.restaurantId, req.body);
  sendSuccess(res, coupon, 'Coupon updated');
});

exports.deleteCoupon = asyncHandler(async (req, res) => {
  await crmService.deleteCoupon(req.params.id, req.params.restaurantId);
  sendSuccess(res, null, 'Coupon deleted');
});

exports.getLoyaltyBalance = asyncHandler(async (req, res) => {
  const balance = await crmService.getLoyaltyBalance(req.params.customerId, req.params.restaurantId);
  sendSuccess(res, balance);
});

exports.getLoyaltyHistory = asyncHandler(async (req, res) => {
  const pagination = paginate(req.query);
  const { transactions, total } = await crmService.getLoyaltyHistory(req.params.customerId, req.params.restaurantId, pagination);
  sendSuccess(res, { transactions, meta: paginateMeta(total, pagination.page, pagination.limit) });
});

exports.awardPoints = asyncHandler(async (req, res) => {
  const tx = await crmService.awardPoints(
    req.params.customerId, req.params.restaurantId, req.body.orderId, req.body.points, req.body.description
  );
  sendSuccess(res, tx, 'Points awarded');
});
