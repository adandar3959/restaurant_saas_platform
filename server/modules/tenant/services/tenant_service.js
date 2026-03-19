const Tenant = require('../models/tenant_model');
const slugify = require('../../../utils/slugify');
const { paginate } = require('../../../utils/paginate');

exports.createTenant = async (data, ownerId) => {
  data.ownerId = ownerId;
  data.slug = data.slug || slugify(data.restaurantName);
  const existing = await Tenant.findOne({ slug: data.slug });
  if (existing) throw Object.assign(new Error('Slug already taken'), { statusCode: 400 });
  return Tenant.create(data);
};

exports.getAllTenants = async (filters, pagination) => {
  const query = { deletedAt: null };
  if (filters.isActive !== undefined) query.isActive = filters.isActive === 'true';
  if (filters.planType) query['subscription.planType'] = filters.planType;
  const [tenants, total] = await Promise.all([
    Tenant.find(query).populate('ownerId', 'name email').skip(pagination.skip).limit(pagination.limit).sort({ createdAt: -1 }),
    Tenant.countDocuments(query),
  ]);
  return { tenants, total };
};

exports.getTenantById = async (id) => {
  const tenant = await Tenant.findOne({ _id: id, deletedAt: null }).populate('ownerId', 'name email');
  if (!tenant) throw Object.assign(new Error('Restaurant not found'), { statusCode: 404 });
  return tenant;
};

exports.getTenantBySlug = async (slug) => {
  const tenant = await Tenant.findOne({ slug, deletedAt: null, isActive: true });
  if (!tenant) throw Object.assign(new Error('Restaurant not found'), { statusCode: 404 });
  return tenant;
};

exports.updateTenant = async (id, data) => {
  if (data.restaurantName && !data.slug) data.slug = slugify(data.restaurantName);
  const tenant = await Tenant.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!tenant) throw Object.assign(new Error('Restaurant not found'), { statusCode: 404 });
  return tenant;
};

exports.deleteTenant = async (id) => {
  const tenant = await Tenant.findByIdAndUpdate(id, { deletedAt: new Date(), isActive: false }, { new: true });
  if (!tenant) throw Object.assign(new Error('Restaurant not found'), { statusCode: 404 });
  return tenant;
};

exports.updateSubscription = async (id, subscriptionData) => {
  const tenant = await Tenant.findByIdAndUpdate(
    id,
    { subscription: subscriptionData },
    { new: true, runValidators: true }
  );
  if (!tenant) throw Object.assign(new Error('Restaurant not found'), { statusCode: 404 });
  return tenant;
};
