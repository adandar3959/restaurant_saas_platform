const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Order = require('../../order/models/order_model');

exports.createCheckoutSession = async (orderId, restaurantId, customCancelUrl) => {
  const order = await Order.findOne({ _id: orderId, restaurantId }).populate('restaurantId');
  if (!order) throw new Error('Order not found');

  const lineItems = order.items.map(item => ({
    price_data: {
      currency: 'pkr', // You can make this dynamic from restaurant settings later
      product_data: {
        name: item.name,
        // images: item.image ? [item.image] : [],
      },
      unit_amount: Math.round(item.unitPrice * 100), // Stripe expects amounts in cents
    },
    quantity: item.quantity,
  }));

  // Add tax/delivery if needed
  if (order.financials.taxAmount > 0) {
    lineItems.push({
      price_data: {
        currency: 'pkr',
        product_data: { name: 'Tax' },
        unit_amount: Math.round(order.financials.taxAmount * 100),
      },
      quantity: 1,
    });
  }

  if (order.financials.deliveryFee > 0) {
    lineItems.push({
      price_data: {
        currency: 'pkr',
        product_data: { name: 'Delivery Fee' },
        unit_amount: Math.round(order.financials.deliveryFee * 100),
      },
      quantity: 1,
    });
  }

  let cancelUrl = customCancelUrl || `${process.env.CLIENT_URL || 'http://localhost:5173'}/menu/${restaurantId}?cart=open&checkout=true`;
  if (order.tableNumber && !cancelUrl.includes('table=')) {
    cancelUrl += `&table=${encodeURIComponent(order.tableNumber)}`;
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: lineItems,
    mode: 'payment',
    success_url: `${process.env.CLIENT_URL || 'http://localhost:5173'}/order-success?session_id={CHECKOUT_SESSION_ID}&order_id=${order._id}&restaurant_id=${restaurantId}`,
    cancel_url: cancelUrl,
    metadata: {
      orderId: order._id.toString(),
      restaurantId: restaurantId.toString(),
    },
  });

  return session;
};

exports.handleWebhook = async (sig, payload) => {
  let event;
  try {
    event = stripe.webhooks.constructEvent(payload, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    throw new Error(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const orderId = session.metadata.orderId;

    await Order.findByIdAndUpdate(orderId, {
      'payment.status': 'Paid',
      'payment.method': 'Stripe',
      'payment.transactionId': session.payment_intent,
      'payment.paidAt': new Date(),
      status: 'Accepted' // Automatically accept once paid
    });
  }
};
