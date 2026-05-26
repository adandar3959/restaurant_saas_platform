const router = require('express').Router({ mergeParams: true });
const ctrl = require('../controllers/payment_controller');

router.post('/create-checkout-session', ctrl.createCheckoutSession);
router.post('/subscription-checkout', ctrl.createSubscriptionSession);
router.get('/verify-subscription', ctrl.verifySubscriptionSession);
router.get('/verify-order', ctrl.verifyOrderSession);
// Webhook usually sits at a more global level, but we can register it here too
// Note: Webhook needs raw body, so we handle that in index.js usually
router.post('/webhook', ctrl.stripeWebhook);

module.exports = router;
