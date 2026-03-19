const tenantService = require('../services/tenant_service');
const asyncHandler = require('../../../utils/asyncHandler');
const { sendSuccess } = require('../../../utils/apiResponse');
const { paginate, paginateMeta } = require('../../../utils/paginate');

exports.createTenant = asyncHandler(async (req, res) => {
  const tenant = await tenantService.createTenant(req.body, req.user._id);
  sendSuccess(res, tenant, 'Restaurant created', 201);
});

exports.getAllTenants = asyncHandler(async (req, res) => {
  const pagination = paginate(req.query);
  const { tenants, total } = await tenantService.getAllTenants(req.query, pagination);
  sendSuccess(res, { tenants, meta: paginateMeta(total, pagination.page, pagination.limit) });
});

exports.getTenantById = asyncHandler(async (req, res) => {
  const tenant = await tenantService.getTenantById(req.params.id);
  sendSuccess(res, tenant);
});

exports.getTenantBySlug = asyncHandler(async (req, res) => {
  const tenant = await tenantService.getTenantBySlug(req.params.slug);
  sendSuccess(res, tenant);
});

exports.updateTenant = asyncHandler(async (req, res) => {
  const tenant = await tenantService.updateTenant(req.params.id, req.body);
  sendSuccess(res, tenant, 'Restaurant updated');
});

exports.deleteTenant = asyncHandler(async (req, res) => {
  await tenantService.deleteTenant(req.params.id);
  sendSuccess(res, null, 'Restaurant deleted');
});

exports.updateSubscription = asyncHandler(async (req, res) => {
  const tenant = await tenantService.updateSubscription(req.params.id, req.body);
  sendSuccess(res, tenant, 'Subscription updated');
});
