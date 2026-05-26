const paymentService = require('../services/payment_service');
const asyncHandler = require('../../../utils/asyncHandler');
const { sendSuccess } = require('../../../utils/apiResponse');

exports.createCheckoutSession = asyncHandler(async (req, res) => {
  const { orderId, cancelUrl } = req.body;
  const { restaurantId } = req.params;

  const session = await paymentService.createCheckoutSession(orderId, restaurantId, cancelUrl);
  sendSuccess(res, { url: session.url }, 'Checkout session created');
});

exports.createSubscriptionSession = asyncHandler(async (req, res) => {
  const { planType, successUrl, cancelUrl } = req.body;
  const { restaurantId } = req.params;

  if (!planType) {
    return res.status(400).json({ success: false, message: 'Plan type is required' });
  }

  const session = await paymentService.createSubscriptionSession(restaurantId, planType, successUrl, cancelUrl);
  sendSuccess(res, { url: session.url }, 'Subscription checkout session created');
});

exports.verifySubscriptionSession = asyncHandler(async (req, res) => {
  const { session_id } = req.query;
  if (!session_id) {
    return res.status(400).json({ success: false, message: 'session_id is required' });
  }
  const result = await paymentService.verifySubscriptionSession(session_id);
  sendSuccess(res, result, `Successfully upgraded to ${result.planType} plan`);
});

exports.verifyOrderSession = asyncHandler(async (req, res) => {
  const { session_id } = req.query;
  if (!session_id) {
    return res.status(400).json({ success: false, message: 'session_id is required' });
  }
  const order = await paymentService.verifyOrderSession(session_id);
  sendSuccess(res, order, 'Payment verified and order placed successfully');
});

exports.stripeWebhook = asyncHandler(async (req, res) => {
  const sig = req.headers['stripe-signature'];
  // Note: For webhooks to work, express.raw() is needed for the webhook route
  await paymentService.handleWebhook(sig, req.body);
  res.json({ received: true });
});
