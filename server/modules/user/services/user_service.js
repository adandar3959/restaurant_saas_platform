const jwt = require('jsonwebtoken');
const User = require('../models/user_model');
const Invite = require('../models/invite_model');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

exports.register = async (data) => {
  // Customer registers freely — no token needed
  if (!data.role || data.role === 'Customer') {
    data.role = 'Customer';
    const existing = await User.findOne({ email: data.email });
    if (existing) throw Object.assign(new Error('Email already registered'), { statusCode: 400 });
    const user = await User.create(data);
    const token = signToken(user._id);
    user.passwordHash = undefined;
    return { user, token };
  }

  // Admin registration requires a valid invite token
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

    // Mark invite as used
    invite.usedAt = new Date();
    await invite.save();

    const token = signToken(user._id);
    user.passwordHash = undefined;
    return { user, token };
  }

  // Any other role is blocked from public registration
  throw Object.assign(new Error('You cannot self-assign this role'), { statusCode: 403 });
};

// SuperAdmin generates an invite token for a specific email
exports.createInvite = async (email, superAdminId) => {
  // Invalidate any existing unused invite for this email
  await Invite.deleteMany({ email: email.toLowerCase(), usedAt: null });

  const token = Invite.generateToken();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const invite = await Invite.create({ email, token, createdBy: superAdminId, expiresAt });
  return invite;
};

// SuperAdmin lists all invites
exports.getInvites = async () => Invite.find().populate('createdBy', 'name email').sort({ createdAt: -1 });

// SuperAdmin revokes an invite
exports.revokeInvite = async (id) => {
  const invite = await Invite.findByIdAndDelete(id);
  if (!invite) throw Object.assign(new Error('Invite not found'), { statusCode: 404 });
  return invite;
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
