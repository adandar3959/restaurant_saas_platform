const { body } = require('express-validator');
const validate = require('../../../utils/validate.middleware');

exports.validateRegister = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('passwordHash').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role')
    .isIn(['SuperAdmin', 'Admin', 'Manager', 'Chef', 'Waiter', 'Driver', 'Customer'])
    .withMessage('Invalid role'),
  validate,
];

exports.validateLogin = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
  validate,
];

exports.validateUpdateUser = [
  body('email').optional().isEmail().withMessage('Valid email is required'),
  body('phone').optional().isMobilePhone().withMessage('Valid phone number required'),
  validate,
];
