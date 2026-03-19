const router = require('express').Router({ mergeParams: true });
const ctrl = require('../controllers/crm_controller');
const { protect, authorize } = require('../../../utils/auth.middleware');

const staff = ['SuperAdmin', 'Admin', 'Manager'];

// Reviews
router.get('/reviews', ctrl.getReviews);
router.post('/reviews', protect, authorize('Customer'), ctrl.createReview);
router.patch('/reviews/:id/respond', protect, authorize(...staff), ctrl.respondToReview);
router.patch('/reviews/:id/flag', protect, authorize(...staff), ctrl.flagReview);

// Coupons
router.get('/coupons', protect, authorize(...staff), ctrl.getCoupons);
router.post('/coupons', protect, authorize(...staff), ctrl.createCoupon);
router.get('/coupons/validate/:code', protect, ctrl.validateCoupon);
router.patch('/coupons/:id', protect, authorize(...staff), ctrl.updateCoupon);
router.delete('/coupons/:id', protect, authorize(...staff), ctrl.deleteCoupon);

// Loyalty
router.get('/loyalty/:customerId', protect, ctrl.getLoyaltyBalance);
router.get('/loyalty/:customerId/history', protect, ctrl.getLoyaltyHistory);
router.post('/loyalty/:customerId/award', protect, authorize(...staff), ctrl.awardPoints);

module.exports = router;
