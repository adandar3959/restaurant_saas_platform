const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Tenant = require('../../tenant/models/tenant_model');
const Plan   = require('../../plans/models/plan_model');

exports.getSaasMetrics = async () => {
  const [tenants, plans] = await Promise.all([
    Tenant.find({}).lean(),
    Plan.find({}).lean(),
  ]);

  // Build price lookup map from DB
  const priceMap = {};
  plans.forEach(p => { priceMap[p.planId] = p.price; });

  const now = new Date();
  const startOfMonth     = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth   = new Date(now.getFullYear(), now.getMonth(), 0);

  // ── Categorise tenants ────────────────────────────────────────────────────
  const allActive = tenants.filter(t => t.subscription?.status === 'Active');
  const paid      = allActive.filter(t => t.subscription?.planType !== 'Free');
  const free      = allActive.filter(t => t.subscription?.planType === 'Free');
  const pending   = tenants.filter(t => t.subscription?.status === 'Pending');
  const churned   = tenants.filter(t => ['Suspended', 'Expired'].includes(t.subscription?.status));
  const trial     = tenants.filter(t => t.subscription?.status === 'Trial');

  // ── MRR ───────────────────────────────────────────────────────────────────
  const mrr = paid.reduce((sum, t) => sum + (priceMap[t.subscription?.planType] || 0), 0);
  const arr = mrr * 12;

  const mrrByPlan = {};
  ['Pro', 'Enterprise'].forEach(p => {
    const count = paid.filter(t => t.subscription?.planType === p).length;
    mrrByPlan[p] = count * (priceMap[p] || 0);
  });

  // ── Growth ────────────────────────────────────────────────────────────────
  const newThisMonth = tenants.filter(t => new Date(t.createdAt) >= startOfMonth).length;
  const newLastMonth = tenants.filter(t => {
    const d = new Date(t.createdAt);
    return d >= startOfLastMonth && d <= endOfLastMonth;
  }).length;

  // ── Churn & conversion ────────────────────────────────────────────────────
  const churnBase = allActive.length + churned.length;
  const churnRate = churnBase > 0 ? +((churned.length / churnBase) * 100).toFixed(1) : 0;
  const convBase  = allActive.length + pending.length;
  const convRate  = convBase > 0 ? +((allActive.length / convBase) * 100).toFixed(1) : 100;

  // ── Plan distribution ─────────────────────────────────────────────────────
  const byPlan = { Free: 0, Pro: 0, Enterprise: 0 };
  allActive.forEach(t => {
    const plan = t.subscription?.planType || 'Free';
    byPlan[plan] = (byPlan[plan] || 0) + 1;
  });

  // ── SaaS Revenue from Stripe (USD payments only) ─────────────────────────
  // Food orders always use currency:'pkr'
  // SaaS subscriptions always use currency:'usd'
  // → Filtering by currency is the reliable separator, covering both:
  //     - Old mode:'payment' SaaS charges (no invoice, but USD)
  //     - New mode:'subscription' recurring charges (invoice + USD)
  let totalRevenue     = 0;
  let revenueThisMonth = 0;
  let invoiceCount     = 0;
  let revenueByMonth   = {};

  try {
    const startOfMonthUnix = Math.floor(startOfMonth.getTime() / 1000);
    const sixMonthsAgo     = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const allSaasPayments = [];
    let params  = { limit: 100 };
    let hasMore = true;

    while (hasMore) {
      const page = await stripe.paymentIntents.list(params);
      page.data.forEach(pi => {
        // USD = SaaS subscription payment; PKR = restaurant food order
        if (pi.status === 'succeeded' && pi.currency === 'usd') {
          allSaasPayments.push(pi);
        }
      });
      hasMore = page.has_more;
      if (hasMore && page.data.length) {
        params.starting_after = page.data[page.data.length - 1].id;
      }
    }

    invoiceCount = allSaasPayments.length;

    allSaasPayments.forEach(pi => {
      const amountUsd = (pi.amount_received ?? pi.amount) / 100;
      totalRevenue += amountUsd;

      if (pi.created >= startOfMonthUnix) revenueThisMonth += amountUsd;

      const date = new Date(pi.created * 1000);
      if (date >= sixMonthsAgo) {
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        revenueByMonth[key] = (revenueByMonth[key] || 0) + amountUsd;
      }
    });

    revenueByMonth = Object.fromEntries(
      Object.entries(revenueByMonth).sort(([a], [b]) => a.localeCompare(b))
    );
  } catch (err) {
    console.error('[Analytics] Stripe revenue fetch failed:', err.message);
  }



  return {
    mrr,
    arr,
    mrrByPlan,
    totalRevenue:     +totalRevenue.toFixed(2),
    revenueThisMonth: +revenueThisMonth.toFixed(2),
    revenueByMonth,
    invoiceCount,
    churnRate,
    convRate,
    counts: {
      total:        tenants.length,
      active:       allActive.length,
      paid:         paid.length,
      free:         free.length,
      pending:      pending.length,
      churned:      churned.length,
      trial:        trial.length,
      newThisMonth,
      newLastMonth,
    },
    byPlan,
  };
};
