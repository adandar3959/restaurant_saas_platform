const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Order  = require('../../order/models/order_model');
const Tenant = require('../../tenant/models/tenant_model');
const Plan   = require('../../plans/models/plan_model');

// ─── Customer Order Checkout (food payment, not SaaS) ────────────────────────
exports.createCheckoutSession = async (orderId, restaurantId, customCancelUrl) => {
  const order = await Order.findOne({ _id: orderId, restaurantId }).populate('restaurantId');
  if (!order) throw new Error('Order not found');

  const lineItems = order.items.map(item => ({
    price_data: {
      currency: 'pkr',
      product_data: { name: item.name },
      unit_amount: Math.round(item.unitPrice * 100),
    },
    quantity: item.quantity,
  }));

  if (order.financials.taxAmount > 0) {
    lineItems.push({
      price_data: { currency: 'pkr', product_data: { name: 'Tax' }, unit_amount: Math.round(order.financials.taxAmount * 100) },
      quantity: 1,
    });
  }
  if (order.financials.deliveryFee > 0) {
    lineItems.push({
      price_data: { currency: 'pkr', product_data: { name: 'Delivery Fee' }, unit_amount: Math.round(order.financials.deliveryFee * 100) },
      quantity: 1,
    });
  }

  let cancelUrl = customCancelUrl || `${process.env.CLIENT_URL || 'http://localhost:5173'}/menu/${restaurantId}?cart=open&checkout=true`;
  if (order.tableNumber && !cancelUrl.includes('table=')) {
    cancelUrl += `&table=${encodeURIComponent(order.tableNumber)}`;
  }

  let discountConfig = {};
  if (order.financials.discountAmount > 0) {
    try {
      const stripeCoupon = await stripe.coupons.create({
        amount_off: Math.round(order.financials.discountAmount * 100),
        currency: 'pkr',
        duration: 'once',
        name: 'Promo & Rewards Discount'
      });
      discountConfig = { discounts: [{ coupon: stripeCoupon.id }] };
    } catch (couponError) {
      console.error('Failed to create Stripe coupon', couponError);
    }
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: lineItems,
    mode: 'payment',
    ...discountConfig,
    success_url: `${process.env.CLIENT_URL || 'http://localhost:5173'}/order-success?session_id={CHECKOUT_SESSION_ID}&order_id=${order._id}&restaurant_id=${restaurantId}`,
    cancel_url: cancelUrl,
    metadata: { orderId: order._id.toString(), restaurantId: restaurantId.toString() },
  });

  return session;
};

// ─── SaaS Subscription Checkout ──────────────────────────────────────────────
exports.createSubscriptionSession = async (restaurantId, planType) => {
  const tenant = await Tenant.findById(restaurantId);
  if (!tenant) throw new Error('Restaurant not found');

  const BASE = process.env.CLIENT_URL || 'http://localhost:5173';

  // FREE PLAN — no Stripe needed, activate directly
  if (planType === 'Free') {
    await Tenant.findByIdAndUpdate(restaurantId, {
      'subscription.planType': 'Free',
      'subscription.status': 'Active',
    });
    return { url: `${BASE}/upgrade-success?plan=Free&restaurant_id=${restaurantId}` };
  }

  // Look up plan config from DB (price, stripePriceId, etc.)
  const planConfig = await Plan.findOne({ planId: planType, isActive: true });
  if (!planConfig) throw new Error(`Plan not found: ${planType}`);
  if (!planConfig.stripePriceId) throw new Error(`No Stripe Price ID set for plan: ${planType}. Please configure it in the SuperAdmin dashboard.`);

  const sessionConfig = {
    mode: 'subscription', // ← Recurring! Stripe auto-charges every month
    line_items: [{ price: planConfig.stripePriceId, quantity: 1 }],
    success_url: `${BASE}/upgrade-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${BASE}/pricing`,
    metadata: {
      type: 'subscription_upgrade',
      restaurantId: restaurantId.toString(),
      planType,
    },
  };

  // Reuse existing Stripe customer if available (avoids duplicate customers)
  if (tenant.subscription?.stripeCustomerId) {
    sessionConfig.customer = tenant.subscription.stripeCustomerId;
  }

  const session = await stripe.checkout.sessions.create(sessionConfig);
  return session;
};

// ─── Verify session after redirect (used by /upgrade-success page) ──────────
exports.verifySubscriptionSession = async (sessionId) => {
  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ['subscription'],
  });

  if (!session) throw new Error('Session not found');

  const { restaurantId, planType, type } = session.metadata || {};

  // Free plan redirect — no Stripe payment involved
  if (!type && session.metadata?.plan === 'Free') {
    const tenant = await Tenant.findById(restaurantId);
    return { tenant, planType: 'Free' };
  }

  if (type !== 'subscription_upgrade') {
    throw Object.assign(new Error('Invalid session type'), { statusCode: 400 });
  }

  // For recurring subscriptions, check the subscription status
  const sub = session.subscription;
  const isActive = sub?.status === 'active' || sub?.status === 'trialing';
  if (!isActive) {
    throw Object.assign(new Error('Subscription not active'), { statusCode: 402 });
  }

  const tenant = await Tenant.findByIdAndUpdate(
    restaurantId,
    {
      'subscription.planType':            planType,
      'subscription.status':             'Active',
      'subscription.stripeCustomerId':    session.customer,
      'subscription.stripeSubscriptionId': sub?.id,
      'subscription.validUntil':          sub?.current_period_end
        ? new Date(sub.current_period_end * 1000)
        : null,
    },
    { new: true }
  );

  if (!tenant) throw new Error('Restaurant not found');
  return { tenant, planType };
};

// ─── Stripe Webhook Handler ───────────────────────────────────────────────────
exports.handleWebhook = async (sig, payload) => {
  let event;
  try {
    event = stripe.webhooks.constructEvent(payload, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    throw new Error(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {

    // ── Subscription payment succeeded (first + recurring) ────────────────────
    case 'invoice.payment_succeeded': {
      const invoice = event.data.object;
      if (invoice.billing_reason === 'subscription_cycle') {
        // This is a recurring renewal — keep subscription Active and update validUntil
        const sub = await stripe.subscriptions.retrieve(invoice.subscription);
        await Tenant.findOneAndUpdate(
          { 'subscription.stripeSubscriptionId': invoice.subscription },
          {
            'subscription.status':       'Active',
            'subscription.validUntil':   new Date(sub.current_period_end * 1000),
          }
        );
      }
      break;
    }

    // ── Payment failed (card declined on renewal) ──────────────────────────────
    case 'invoice.payment_failed': {
      const invoice = event.data.object;
      await Tenant.findOneAndUpdate(
        { 'subscription.stripeSubscriptionId': invoice.subscription },
        { 'subscription.status': 'Suspended', 'isActive': false }
      );
      break;
    }

    // ── Subscription cancelled / expired ──────────────────────────────────────
    case 'customer.subscription.deleted': {
      const sub = event.data.object;
      await Tenant.findOneAndUpdate(
        { 'subscription.stripeSubscriptionId': sub.id },
        {
          'subscription.planType': 'Free',
          'subscription.status':   'Active',
          'subscription.stripeSubscriptionId': null,
          'isActive': true,
        }
      );
      break;
    }

    // ── checkout.session.completed — for food orders (not SaaS) ──────────────
    case 'checkout.session.completed': {
      const session = event.data.object;
      if (session.metadata?.type !== 'subscription_upgrade') {
        const orderId = session.metadata?.orderId;
        if (orderId) {
          const orderService = require('../../order/services/order_service');
          await orderService.processOrderPaymentSuccess(orderId, session.payment_intent);
        }
      }
      break;
    }

    default:
      break;
  }
};

exports.verifyOrderSession = async (sessionId) => {
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  if (!session) throw new Error('Session not found');

  const { orderId } = session.metadata || {};
  if (!orderId) throw new Error('Order ID not found in session metadata');

  if (session.payment_status !== 'paid') {
    throw Object.assign(new Error('Payment not completed'), { statusCode: 402 });
  }

  const orderService = require('../../order/services/order_service');
  const order = await orderService.processOrderPaymentSuccess(orderId, session.payment_intent);

  return order;
};
