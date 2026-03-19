const { body } = require('express-validator');
const validate = require('../../../utils/validate.middleware');

exports.validateCategory = [
  body('name').trim().notEmpty().withMessage('Category name is required'),
  validate,
];

exports.validateMenuItem = [
  body('name').trim().notEmpty().withMessage('Item name is required'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('categoryId').isMongoId().withMessage('Valid category ID required'),
  validate,
];
