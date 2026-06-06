const userService = require('../services/user_service');
const asyncHandler = require('../../../utils/asyncHandler');
const { sendSuccess } = require('../../../utils/apiResponse');
const { paginate, paginateMeta } = require('../../../utils/paginate');
const jwt = require('jsonwebtoken');
const User = require('../models/user_model');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

exports.register = asyncHandler(async (req, res) => {
  const { user, token } = await userService.register(req.body);
  sendSuccess(res, { user, token }, 'Registered successfully', 201);
});

// Customer self-registration — accepts { name, email, password, restaurantId? }
exports.customerRegister = asyncHandler(async (req, res) => {
  const { name, email, password, restaurantId } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ message: 'Name is required' });
  }
  if (!email || !/\S+@\S+\.\S+/.test(email)) {
    return res.status(400).json({ message: 'Valid email is required' });
  }
  if (!password || password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters' });
  }

  const exists = await User.findOne({ email: email.toLowerCase(), restaurantId: restaurantId || null });
  if (exists) {
    return res.status(400).json({ message: 'Email already in use at this restaurant' });
  }

  const user = await User.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    passwordHash: password,   // pre-save hook will hash this
    role: 'Customer',
    restaurantId: restaurantId || null,
  });

  const token = signToken(user._id);
  user.passwordHash = undefined;

  sendSuccess(res, { user, token }, 'Account created', 201);
});

exports.onboard = asyncHandler(async (req, res) => {
  const { user, tenant, token } = await userService.onboard(req.body);
  sendSuccess(res, { user, tenant, token }, 'Restaurant registered successfully', 201);
});

exports.createStaff = asyncHandler(async (req, res) => {
  const user = await userService.createStaff(req.body, req.user);
  sendSuccess(res, user, 'Staff account created', 201);
});

exports.createInvite = asyncHandler(async (req, res) => {
  const invite = await userService.createInvite(req.body.email, req.user._id);
  sendSuccess(res, invite, 'Invite created', 201);
});

exports.getInvites = asyncHandler(async (req, res) => {
  const invites = await userService.getInvites();
  sendSuccess(res, invites);
});

exports.revokeInvite = asyncHandler(async (req, res) => {
  await userService.revokeInvite(req.params.id);
  sendSuccess(res, null, 'Invite revoked');
});

exports.login = asyncHandler(async (req, res) => {
  const { user, token } = await userService.login(req.body.email, req.body.password, req.body.restaurantId);
  sendSuccess(res, { user, token }, 'Login successful');
});

exports.getMe = asyncHandler(async (req, res) => {
  const user = await userService.getMe(req.user._id);
  sendSuccess(res, user);
});

exports.updateMe = asyncHandler(async (req, res) => {
  const user = await userService.updateMe(req.user._id, req.body);
  sendSuccess(res, user, 'Profile updated');
});

exports.changePassword = asyncHandler(async (req, res) => {
  const result = await userService.changePassword(req.user._id, req.body.oldPassword, req.body.newPassword);
  sendSuccess(res, result);
});

exports.getAllUsers = asyncHandler(async (req, res) => {
  const pagination = paginate(req.query);
  const { users, total } = await userService.getAllUsers(
    req.user.restaurantId,
    { role: req.query.role, status: req.query.status },
    pagination
  );
  sendSuccess(res, { users, meta: paginateMeta(total, pagination.page, pagination.limit) });
});

exports.getUserById = asyncHandler(async (req, res) => {
  const user = await userService.getUserById(req.params.id);
  sendSuccess(res, user);
});

exports.updateUser = asyncHandler(async (req, res) => {
  const user = await userService.updateUser(req.params.id, req.body);
  sendSuccess(res, user, 'User updated');
});

exports.deleteUser = asyncHandler(async (req, res) => {
  await userService.deleteUser(req.params.id);
  sendSuccess(res, null, 'User deleted');
});
