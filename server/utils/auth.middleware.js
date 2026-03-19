const jwt = require('jsonwebtoken');
const asyncHandler = require('./asyncHandler');
const User = require('../modules/user/models/user_model');

// Verify JWT and attach user to req
exports.protect = asyncHandler(async (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) return res.status(401).json({ success: false, message: 'Not authorized, no token' });

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  req.user = await User.findById(decoded.id).select('-passwordHash');
  if (!req.user) return res.status(401).json({ success: false, message: 'User no longer exists' });
  if (req.user.status === 'Banned') return res.status(403).json({ success: false, message: 'Account banned' });
  next();
});

// Role-based access control — pass allowed roles
exports.authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: `Role '${req.user.role}' is not allowed` });
  }
  next();
};

// Ensure staff belongs to the restaurant they're operating on
exports.belongsToRestaurant = (req, res, next) => {
  const restaurantId = req.params.restaurantId || req.body.restaurantId || req.query.restaurantId;
  if (req.user.role === 'SuperAdmin') return next();
  if (!req.user.restaurantId || req.user.restaurantId.toString() !== restaurantId) {
    return res.status(403).json({ success: false, message: 'Access denied to this restaurant' });
  }
  next();
};
