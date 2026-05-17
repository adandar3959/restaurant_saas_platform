const paymentService = require('../services/payment_service');
const asyncHandler = require('../../../utils/asyncHandler');
const { sendSuccess } = require('../../../utils/apiResponse');

exports.createCheckoutSession = asyncHandler(async (req, res) => {
  const { orderId, cancelUrl } = req.body;
  const { restaurantId } = req.params;

  const session = await paymentService.createCheckoutSession(orderId, restaurantId, cancelUrl);
  sendSuccess(res, { url: session.url }, 'Checkout session created');
});

exports.stripeWebhook = asyncHandler(async (req, res) => {
  const sig = req.headers['stripe-signature'];
  // Note: For webhooks to work, express.raw() is needed for the webhook route
  await paymentService.handleWebhook(sig, req.body);
  res.json({ received: true });
});
