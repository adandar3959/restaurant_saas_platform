const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Order = require('../../order/models/order_model');
const Tenant = require('../../tenant/models/tenant_model');

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
    
    // Check if this was a SaaS Subscription Upgrade
    if (session.metadata.type === 'subscription_upgrade') {
      const restaurantId = session.metadata.restaurantId;
      const planType = session.metadata.planType;
      
      await Tenant.findByIdAndUpdate(restaurantId, {
        'subscription.planType': planType,
        'subscription.status': 'Active',
      });
      return;
    }

    // Otherwise, handle regular Customer Order payment
    const orderId = session.metadata.orderId;
    if (orderId) {
      await Order.findByIdAndUpdate(orderId, {
        'payment.status': 'Paid',
        'payment.method': 'Stripe',
        'payment.transactionId': session.payment_intent,
        'payment.paidAt': new Date(),
        status: 'Accepted'
      });
    }
  }
};

exports.createSubscriptionSession = async (restaurantId, planType, successUrl, cancelUrl) => {
  const tenant = await Tenant.findById(restaurantId);
  if (!tenant) throw new Error('Restaurant not found');

  const plans = {
    'Pro': { price: 4900, name: 'DineFlow Pro (Monthly)' }, // 4900 cents = $49.00
    'Enterprise': { price: 14900, name: 'DineFlow Enterprise (Monthly)' }
  };

  const plan = plans[planType];
  if (!plan) throw new Error('Invalid plan type');

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency: 'usd',
        product_data: { name: plan.name },
        unit_amount: plan.price,
      },
      quantity: 1,
    }],
    mode: 'payment',
    success_url: `${process.env.CLIENT_URL || 'http://localhost:5173'}/upgrade-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: cancelUrl || `${process.env.CLIENT_URL || 'http://localhost:5173'}/pricing`,
    metadata: {
      type: 'subscription_upgrade',
      restaurantId: restaurantId.toString(),
      planType: planType
    },
  });

  return session;
};

exports.verifySubscriptionSession = async (sessionId) => {
  const session = await stripe.checkout.sessions.retrieve(sessionId);

  if (!session) throw new Error('Session not found');
  if (session.payment_status !== 'paid') {
    throw Object.assign(new Error('Payment not completed'), { statusCode: 402 });
  }
  if (session.metadata?.type !== 'subscription_upgrade') {
    throw Object.assign(new Error('Invalid session type'), { statusCode: 400 });
  }

  const { restaurantId, planType } = session.metadata;

  const tenant = await Tenant.findByIdAndUpdate(
    restaurantId,
    { 'subscription.planType': planType, 'subscription.status': 'Active' },
    { new: true }
  );

  if (!tenant) throw new Error('Restaurant not found');

  return { tenant, planType };
};
