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
  const mongoose = require('mongoose');
  let query = { deletedAt: null };
  
  if (mongoose.Types.ObjectId.isValid(id)) {
    query._id = id;
  } else {
    query.slug = id.toLowerCase();
  }

  const tenant = await Tenant.findOne(query).populate('ownerId', 'name email');
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
  
  // If slug is being changed, check for uniqueness
  if (data.slug) {
    const existing = await Tenant.findOne({ slug: data.slug, _id: { $ne: id } });
    if (existing) throw Object.assign(new Error('Slug already taken'), { statusCode: 400 });
  }

  // Build a flat $set object to avoid touching geo coordinates entirely
  const $set = {};
  if (data.restaurantName)        $set.restaurantName          = data.restaurantName;
  if (data.slug)                  $set.slug                    = data.slug;
  if (data.description !== undefined) $set.description         = data.description;
  if (data.contactInfo?.phone)    $set['contactInfo.phone']    = data.contactInfo.phone;
  if (data.contactInfo?.email)    $set['contactInfo.email']    = data.contactInfo.email;
  if (data.address?.city)         $set['address.city']         = data.address.city;
  if (data.address?.country)      $set['address.country']      = data.address.country;
  if (data.settings?.currency)    $set['settings.currency']    = data.settings.currency;
  if (data.settings?.taxRate !== undefined) $set['settings.taxRate'] = data.settings.taxRate;
  if (data.branding?.primaryColor) $set['branding.primaryColor'] = data.branding.primaryColor;
  if (data.branding?.secondaryColor) $set['branding.secondaryColor'] = data.branding.secondaryColor;
  if (data.branding?.cardColor) $set['branding.cardColor'] = data.branding.cardColor;

  const tenant = await Tenant.findByIdAndUpdate(
    id,
    { $set },
    { returnDocument: 'after', runValidators: false }
  );
  if (!tenant) throw Object.assign(new Error('Restaurant not found'), { statusCode: 404 });
  return tenant;
};

exports.deleteTenant = async (id) => {
  const tenant = await Tenant.findByIdAndUpdate(id, { deletedAt: new Date(), isActive: false }, { returnDocument: 'after' });
  if (!tenant) throw Object.assign(new Error('Restaurant not found'), { statusCode: 404 });
  return tenant;
};

exports.updateSubscription = async (id, subscriptionData) => {
  const tenant = await Tenant.findByIdAndUpdate(
    id,
    { subscription: subscriptionData },
    { returnDocument: 'after', runValidators: true }
  );
  if (!tenant) throw Object.assign(new Error('Restaurant not found'), { statusCode: 404 });
  return tenant;
};
