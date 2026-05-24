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
  const allActive  = tenants.filter(t => t.subscription?.status === 'Active');
  const paid       = allActive.filter(t => t.subscription?.planType !== 'Free');
  const free       = allActive.filter(t => t.subscription?.planType === 'Free');
  const pending    = tenants.filter(t => t.subscription?.status === 'Pending');
  const churned    = tenants.filter(t => ['Suspended', 'Expired'].includes(t.subscription?.status));
  const trial      = tenants.filter(t => t.subscription?.status === 'Trial');

  // ── MRR ───────────────────────────────────────────────────────────────────
  const mrr = paid.reduce((sum, t) => sum + (priceMap[t.subscription?.planType] || 0), 0);

  // MRR breakdown per plan
  const mrrByPlan = {};
  ['Pro', 'Enterprise'].forEach(p => {
    const count = paid.filter(t => t.subscription?.planType === p).length;
    mrrByPlan[p] = count * (priceMap[p] || 0);
  });

  // ── Growth (new tenants this month vs last month) ─────────────────────────
  const newThisMonth  = tenants.filter(t => new Date(t.createdAt) >= startOfMonth).length;
  const newLastMonth  = tenants.filter(t => {
    const d = new Date(t.createdAt);
    return d >= startOfLastMonth && d <= endOfLastMonth;
  }).length;

  // ── Churn rate ────────────────────────────────────────────────────────────
  const churnBase  = allActive.length + churned.length;
  const churnRate  = churnBase > 0 ? +((churned.length / churnBase) * 100).toFixed(1) : 0;

  // ── Conversion rate (Pending → Active) ───────────────────────────────────
  const convBase   = allActive.length + pending.length;
  const convRate   = convBase > 0 ? +((allActive.length / convBase) * 100).toFixed(1) : 100;

  // ── Plan distribution ─────────────────────────────────────────────────────
  const byPlan = { Free: 0, Pro: 0, Enterprise: 0 };
  allActive.forEach(t => {
    const plan = t.subscription?.planType || 'Free';
    byPlan[plan] = (byPlan[plan] || 0) + 1;
  });

  // ── ARR ───────────────────────────────────────────────────────────────────
  const arr = mrr * 12;

  return {
    mrr,
    arr,
    mrrByPlan,
    churnRate,
    convRate,
    counts: {
      total:         tenants.length,
      active:        allActive.length,
      paid:          paid.length,
      free:          free.length,
      pending:       pending.length,
      churned:       churned.length,
      trial:         trial.length,
      newThisMonth,
      newLastMonth,
    },
    byPlan,
  };
};
