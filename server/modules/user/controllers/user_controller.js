const userService = require('../services/user_service');
const asyncHandler = require('../../../utils/asyncHandler');
const { sendSuccess } = require('../../../utils/apiResponse');
const { paginate, paginateMeta } = require('../../../utils/paginate');

exports.register = asyncHandler(async (req, res) => {
  const { user, token } = await userService.register(req.body);
  sendSuccess(res, { user, token }, 'Registered successfully', 201);
});

exports.createStaff = asyncHandler(async (req, res) => {
  const user = await userService.createStaff(req.body, req.user);
  sendSuccess(res, user, 'Staff account created', 201);
});

exports.login = asyncHandler(async (req, res) => {
  const { user, token } = await userService.login(req.body.email, req.body.password);
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
