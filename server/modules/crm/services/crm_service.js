const Review = require('../models/review_model');
const Coupon = require('../models/coupon_model');
const LoyaltyTransaction = require('../models/loyaltyTransaction_model');
const User = require('../../user/models/user_model');

// ── Reviews ──────────────────────────────────────────────────
exports.createReview = async (data) => Review.create(data);

exports.getReviews = async (restaurantId, filters, pagination) => {
  const query = { restaurantId, isPublished: true };
  if (filters.menuItemId) query.menuItemId = filters.menuItemId;
  const [reviews, total] = await Promise.all([
    Review.find(query)
      .populate('customerId', 'name profileImage')
      .populate('orderId', 'orderNumber')
      .skip(pagination.skip)
      .limit(pagination.limit)
      .sort({ createdAt: -1 }),
    Review.countDocuments(query),
  ]);
  return { reviews, total };
};

exports.respondToReview = async (id, restaurantId, text, userId) => {
  const review = await Review.findOneAndUpdate(
    { _id: id, restaurantId },
    { response: { text, respondedAt: new Date(), respondedBy: userId } },
    { new: true }
  );
  if (!review) throw Object.assign(new Error('Review not found'), { statusCode: 404 });
  return review;
};

exports.flagReview = async (id, restaurantId) => {
  const review = await Review.findOneAndUpdate({ _id: id, restaurantId }, { isFlagged: true }, { new: true });
  if (!review) throw Object.assign(new Error('Review not found'), { statusCode: 404 });
  return review;
};

// ── Coupons ──────────────────────────────────────────────────
exports.createCoupon = async (data) => Coupon.create(data);

exports.getCoupons = async (restaurantId) => Coupon.find({ restaurantId, isActive: true });

exports.getCouponByCode = async (code, restaurantId) => {
  const coupon = await Coupon.findOne({ code: code.toUpperCase(), restaurantId, isActive: true });
  if (!coupon) throw Object.assign(new Error('Invalid or expired coupon'), { statusCode: 404 });
  const now = new Date();
  if (now < coupon.validFrom || now > coupon.validUntil) {
    throw Object.assign(new Error('Coupon is not valid at this time'), { statusCode: 400 });
  }
  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
    throw Object.assign(new Error('Coupon usage limit reached'), { statusCode: 400 });
  }
  return coupon;
};

exports.updateCoupon = async (id, restaurantId, data) => {
  const coupon = await Coupon.findOneAndUpdate({ _id: id, restaurantId }, data, { new: true });
  if (!coupon) throw Object.assign(new Error('Coupon not found'), { statusCode: 404 });
  return coupon;
};

exports.deleteCoupon = async (id, restaurantId) => {
  const coupon = await Coupon.findOneAndUpdate({ _id: id, restaurantId }, { isActive: false }, { new: true });
  if (!coupon) throw Object.assign(new Error('Coupon not found'), { statusCode: 404 });
  return coupon;
};

// ── Loyalty ──────────────────────────────────────────────────
exports.getLoyaltyBalance = async (customerId, restaurantId) => {
  const user = await User.findById(customerId).select('customerDetails.loyalty');
  if (!user) throw Object.assign(new Error('Customer not found'), { statusCode: 404 });
  return user.customerDetails?.loyalty || { points: 0 };
};

exports.getLoyaltyHistory = async (customerId, restaurantId, pagination) => {
  const query = { customerId, restaurantId };
  const [transactions, total] = await Promise.all([
    LoyaltyTransaction.find(query).skip(pagination.skip).limit(pagination.limit).sort({ createdAt: -1 }),
    LoyaltyTransaction.countDocuments(query),
  ]);
  return { transactions, total };
};

exports.awardPoints = async (customerId, restaurantId, orderId, points, description) => {
  const user = await User.findById(customerId);
  if (!user) throw Object.assign(new Error('Customer not found'), { statusCode: 404 });
  const currentPoints = user.customerDetails?.loyalty?.points || 0;
  const newBalance = currentPoints + points;
  await User.findByIdAndUpdate(customerId, {
    'customerDetails.loyalty.points': newBalance,
    $inc: { 'customerDetails.loyalty.totalEarned': points },
  });
  return LoyaltyTransaction.create({ restaurantId, customerId, orderId, type: 'Earn', points, balanceAfter: newBalance, description });
};
