const { body } = require('express-validator');
const validate = require('../../../utils/validate.middleware');

exports.validateRegister = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('passwordHash').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').optional().isIn(['Admin', 'Customer']).withMessage('Invalid role'),
  body('inviteToken').if(body('role').equals('Admin')).notEmpty().withMessage('Invite token is required for Admin registration'),
  validate,
];

exports.validateInvite = [
  body('email').isEmail().withMessage('Valid email is required'),
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
