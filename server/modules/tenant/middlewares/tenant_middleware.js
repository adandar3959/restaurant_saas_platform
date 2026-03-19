const { body } = require('express-validator');
const validate = require('../../../utils/validate.middleware');

exports.validateCreateTenant = [
  body('restaurantName').trim().notEmpty().withMessage('Restaurant name is required'),
  body('contactInfo.email').optional().isEmail().withMessage('Valid email required'),
  body('settings.taxRate').optional().isFloat({ min: 0, max: 100 }).withMessage('Tax rate must be 0-100'),
  validate,
];

exports.validateUpdateTenant = [
  body('restaurantName').optional().trim().notEmpty().withMessage('Restaurant name cannot be empty'),
  body('contactInfo.email').optional().isEmail().withMessage('Valid email required'),
  body('settings.taxRate').optional().isFloat({ min: 0, max: 100 }).withMessage('Tax rate must be 0-100'),
  validate,
];

exports.validateSubscription = [
  body('planType').isIn(['Free', 'Pro', 'Enterprise']).withMessage('Invalid plan type'),
  body('status').isIn(['Active', 'Suspended', 'Expired', 'Trial']).withMessage('Invalid status'),
  validate,
];
