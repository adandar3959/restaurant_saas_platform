const jwt     = require('jsonwebtoken');
const { getCache } = require('../modules/settings/services/settings_service');

// Paths always allowed even during maintenance (relative to /api/v1 mount)
const BYPASS_PATHS = [
  '/auth/login',
  '/auth/superadmin-login',
  '/settings/public',
  '/settings/system',
  '/webhook/stripe',
];

module.exports = (req, res, next) => {
  const { maintenanceMode } = getCache();
  if (!maintenanceMode) return next(); // Fast path — no DB hit

  // Always allow bypass paths
  if (BYPASS_PATHS.some(p => req.path.startsWith(p.replace('/api/v1', '')))) {
    return next();
  }

  // Allow SuperAdmin through even during maintenance
  try {
    const token   = req.headers.authorization?.split(' ')[1] || req.cookies?.rms_token;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role === 'SuperAdmin') return next();
  } catch {
    // Token missing or invalid — fall through to maintenance block
  }

  return res.status(503).json({
    status:  'maintenance',
    message: 'The platform is currently under maintenance. Please try again later.',
  });
};
