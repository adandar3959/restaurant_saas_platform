const jwt = require('jsonwebtoken');
const User = require('../models/user_model');
const Invite = require('../models/invite_model');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

exports.register = async (data) => {
  if (!data.role || data.role === 'Customer') {
    data.role = 'Customer';
    const existing = await User.findOne({ email: data.email });
    if (existing) throw Object.assign(new Error('Email already registered'), { statusCode: 400 });
    const user = await User.create(data);
    const token = signToken(user._id);
    user.passwordHash = undefined;
    return { user, token };
  }

  if (data.role === 'Admin') {
    if (!data.inviteToken) {
      throw Object.assign(new Error('An invite token is required to register as Admin'), { statusCode: 403 });
    }

    const invite = await Invite.findOne({ token: data.inviteToken, usedAt: null });
    if (!invite) throw Object.assign(new Error('Invalid or already used invite token'), { statusCode: 403 });
    if (invite.expiresAt < new Date()) throw Object.assign(new Error('Invite token has expired'), { statusCode: 403 });
    if (invite.email !== data.email.toLowerCase()) {
      throw Object.assign(new Error('This invite token was issued for a different email'), { statusCode: 403 });
    }

    const existing = await User.findOne({ email: data.email });
    if (existing) throw Object.assign(new Error('Email already registered'), { statusCode: 400 });

    const user = await User.create(data);

    invite.usedAt = new Date();
    await invite.save();

    const token = signToken(user._id);
    user.passwordHash = undefined;
    return { user, token };
  }

  throw Object.assign(new Error('You cannot self-assign this role'), { statusCode: 403 });
};

exports.onboard = async (data) => {
  const existing = await User.findOne({ email: data.email });
  if (existing) throw Object.assign(new Error('Email already registered'), { statusCode: 400 });

  const Tenant = require('../../tenant/models/tenant_model');
  const slugify = require('../../../utils/slugify');

  const user = await User.create({
    name: data.name,
    email: data.email,
    passwordHash: data.password,
    role: 'Admin',
    phone: data.phone || null,
  });

  const slug = slugify(data.restaurantName);
  const tenant = await Tenant.create({
    ownerId: user._id,
    restaurantName: data.restaurantName,
    slug,
    subscription: {
      planType: data.planType || 'Free',
      status: 'Pending', // Always Pending until Stripe payment is verified
    },
  });

  await User.findByIdAndUpdate(user._id, { restaurantId: tenant._id });
  user.restaurantId = tenant._id;

  const token = signToken(user._id);
  user.passwordHash = undefined;
  return { user, tenant, token };
};

exports.createInvite = async (email, superAdminId) => {
  await Invite.deleteMany({ email: email.toLowerCase(), usedAt: null });

  const token = Invite.generateToken();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const invite = await Invite.create({ email, token, createdBy: superAdminId, expiresAt });
  return invite;
};

exports.getInvites = async () => Invite.find().populate('createdBy', 'name email').sort({ createdAt: -1 });

exports.revokeInvite = async (id) => {
  const invite = await Invite.findByIdAndDelete(id);
  if (!invite) throw Object.assign(new Error('Invite not found'), { statusCode: 404 });
  return invite;
};

exports.createStaff = async (data, createdBy) => {
  const staffRoles = ['Manager', 'Chef', 'Waiter', 'Driver'];
  if (!staffRoles.includes(data.role)) {
    throw Object.assign(new Error('Invalid staff role'), { statusCode: 400 });
  }
  data.restaurantId = createdBy.restaurantId;
  const existing = await User.findOne({ email: data.email });
  if (existing) throw Object.assign(new Error('Email already registered'), { statusCode: 400 });
  const user = await User.create(data);

  if (user.role === 'Driver') {
    try {
      const Driver = require('../../delivery/models/driver_model');
      await Driver.create({
        restaurantId: user.restaurantId,
        userId: user._id,
        status: 'Offline',
        currentLocation: { type: 'Point', coordinates: [0, 0] }
      });
    } catch (err) {
      console.error('Failed to create driver profile:', err);
    }
  }

  return user;
};

exports.login = async (email, password) => {
  const user = await User.findOne({ email }).select('+passwordHash');
  if (!user || !(await user.comparePassword(password))) {
    throw Object.assign(new Error('Invalid email or password'), { statusCode: 401 });
  }
  if (user.status !== 'Active') {
    throw Object.assign(new Error('Account is not active'), { statusCode: 403 });
  }
  await User.updateOne({ _id: user._id }, { lastLoginAt: new Date() });
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
  const user = await User.findByIdAndUpdate(id, data, { returnDocument: 'after', runValidators: true });
  if (!user) throw Object.assign(new Error('User not found'), { statusCode: 404 });
  return user;
};

exports.deleteUser = async (id) => {
  const user = await User.findByIdAndUpdate(id, { deletedAt: new Date(), status: 'Inactive' }, { returnDocument: 'after' });
  if (!user) throw Object.assign(new Error('User not found'), { statusCode: 404 });
  return user;
};

exports.getMe = async (id) => {
  const user = await User.findById(id);
  if (!user) throw Object.assign(new Error('User not found'), { statusCode: 404 });
  return user;
};

exports.updateMe = async (id, data) => {
  const forbidden = ['role', 'status', 'passwordHash', 'restaurantId'];
  forbidden.forEach((f) => delete data[f]);
  return User.findByIdAndUpdate(id, data, { returnDocument: 'after', runValidators: true });
};

exports.changePassword = async (id, oldPassword, newPassword) => {
  const user = await User.findById(id).select('+passwordHash');
  if (!user) throw Object.assign(new Error('User not found'), { statusCode: 404 });

  const isMatch = await user.comparePassword(oldPassword);
  if (!isMatch) throw Object.assign(new Error('Old password is incorrect'), { statusCode: 401 });

  user.passwordHash = await require('bcryptjs').hash(newPassword, 12);
  await User.updateOne({ _id: id }, { passwordHash: user.passwordHash });
  return { message: 'Password changed successfully' };
};
