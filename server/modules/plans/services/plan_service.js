const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Plan   = require('../models/plan_model');

exports.getAllPlans = async () => {
  return Plan.find({ isActive: true }).sort({ order: 1 });
};

exports.getPlanById = async (planId) => {
  const plan = await Plan.findOne({ planId });
  if (!plan) throw Object.assign(new Error(`Plan not found: ${planId}`), { statusCode: 404 });
  return plan;
};

exports.updatePlan = async (planId, data) => {
  delete data.planId; // prevent overwriting the identifier

  const existing = await Plan.findOne({ planId });
  if (!existing) throw Object.assign(new Error('Plan not found'), { statusCode: 404 });

  const newPrice    = data.price !== undefined ? Number(data.price) : null;
  const targetPrice = newPrice !== null ? newPrice : existing.price;
  const priceChanged = newPrice !== null && newPrice !== existing.price;

  // ── Decide whether to sync a new Stripe Price ─────────────────────────────
  // Sync if: (1) price explicitly changed, OR (2) price was submitted and
  // Stripe's actual amount doesn't match our DB (fixes the "stuck" state).
  let shouldSyncStripe = false;

  if (planId !== 'Free' && targetPrice > 0 && existing.stripePriceId) {
    if (priceChanged) {
      shouldSyncStripe = true;
    } else if (data.price !== undefined) {
      // Same number submitted — check if Stripe is actually out of sync
      try {
        const currentStripePrice = await stripe.prices.retrieve(existing.stripePriceId);
        const stripeAmount = currentStripePrice.unit_amount / 100;
        if (stripeAmount !== targetPrice) shouldSyncStripe = true;
      } catch {
        // Stripe lookup failed — skip sync, don't block the save
      }
    }
  }

  // ── Auto-create new Stripe Price if needed ────────────────────────────────
  if (shouldSyncStripe) {
    let stripeProductId = null;

    try {
      // Derive the Product ID from the existing Price object
      const existingStripePrice = await stripe.prices.retrieve(existing.stripePriceId);
      stripeProductId = existingStripePrice.product;

      // Archive the old price (best practice — keep Stripe dashboard clean)
      await stripe.prices.update(existing.stripePriceId, { active: false });
    } catch {
      // If retrieval fails we still try to proceed if we have a product ID
    }

    if (!stripeProductId) {
      throw Object.assign(
        new Error('Cannot auto-create Stripe Price: missing Product ID. Please set a Stripe Price ID first via the SuperAdmin editor.'),
        { statusCode: 400 }
      );
    }

    const newStripePrice = await stripe.prices.create({
      product:     stripeProductId,
      unit_amount: Math.round(targetPrice * 100),
      currency:    existing.currency || 'usd',
      recurring:   { interval: 'month' },
    });

    // Inject the new Price ID into the update payload automatically
    data.stripePriceId = newStripePrice.id;
  }

  // Keep priceInCents in sync
  if (newPrice !== null) {
    data.priceInCents = Math.round(newPrice * 100);
  }

  const plan = await Plan.findOneAndUpdate(
    { planId },
    { $set: data },
    { returnDocument: 'after', runValidators: true }
  );

  return plan;
};
