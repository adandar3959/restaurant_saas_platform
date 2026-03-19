const jwt = require('jsonwebtoken');
const User = require('../models/user_model');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

exports.register = async (data) => {
  // Public registration can only create Customer or Admin accounts.
  // SuperAdmin is seeded directly in DB. Staff roles are created by Admin/Manager only.
  const allowedPublicRoles = ['Customer', 'Admin'];
  if (data.role && !allowedPublicRoles.includes(data.role)) {
    throw Object.assign(new Error('You cannot self-assign this role'), { statusCode: 403 });
  }

  // Default to Customer if no role provided
  if (!data.role) data.role = 'Customer';

  const existing = await User.findOne({ email: data.email });
  if (existing) throw Object.assign(new Error('Email already registered'), { statusCode: 400 });
  const user = await User.create(data);
  const token = signToken(user._id);
  user.passwordHash = undefined;
  return { user, token };
};

// Called by Admin/Manager to create staff accounts (Waiter, Chef, Driver, Manager)
exports.createStaff = async (data, createdBy) => {
  const staffRoles = ['Manager', 'Chef', 'Waiter', 'Driver'];
  if (!staffRoles.includes(data.role)) {
    throw Object.assign(new Error('Invalid staff role'), { statusCode: 400 });
  }
  data.restaurantId = createdBy.restaurantId;
  const existing = await User.findOne({ email: data.email });
  if (existing) throw Object.assign(new Error('Email already registered'), { statusCode: 400 });
  return User.create(data);
};

exports.login = async (email, password) => {
  const user = await User.findOne({ email }).select('+passwordHash');
  if (!user || !(await user.comparePassword(password))) {
    throw Object.assign(new Error('Invalid email or password'), { statusCode: 401 });
  }
  if (user.status !== 'Active') {
    throw Object.assign(new Error('Account is not active'), { statusCode: 403 });
  }
  user.lastLoginAt = new Date();
  await user.save({ validateBeforeSave: false });
  const token = signToken(user._id);
  user.passwordHash = undefined;
  return { user, token };
};

exports.getAllUsers = async (restaurantId, filters, pagination) => {
  const query = { restaurantId, deletedAt: null };
  if (filters.role) query.role = filters.role;
  if (filters.status) query.status = filters.status;
  const [users, total] = await Promise.all([
    User.find(query).skip(pagination.skip).limit(pagination.limit).sort({ createdAt: -1 }),
    User.countDocuments(query),
  ]);
  return { users, total };
};

exports.getUserById = async (id) => {
  const user = await User.findOne({ _id: id, deletedAt: null });
  if (!user) throw Object.assign(new Error('User not found'), { statusCode: 404 });
  return user;
};

exports.updateUser = async (id, data) => {
  const user = await User.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!user) throw Object.assign(new Error('User not found'), { statusCode: 404 });
  return user;
};

exports.deleteUser = async (id) => {
  const user = await User.findByIdAndUpdate(id, { deletedAt: new Date(), status: 'Inactive' }, { new: true });
  if (!user) throw Object.assign(new Error('User not found'), { statusCode: 404 });
  return user;
};

exports.getMe = async (id) => {
  const user = await User.findById(id);
  if (!user) throw Object.assign(new Error('User not found'), { statusCode: 404 });
  return user;
};

exports.updateMe = async (id, data) => {
  // Prevent role/status changes through this endpoint
  const forbidden = ['role', 'status', 'passwordHash', 'restaurantId'];
  forbidden.forEach((f) => delete data[f]);
  return User.findByIdAndUpdate(id, data, { new: true, runValidators: true });
};
