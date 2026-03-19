const { body } = require('express-validator');
const validate = require('../../../utils/validate.middleware');

exports.validateCreateOrder = [
  body('orderType').isIn(['Dine-In', 'Takeaway', 'Delivery']).withMessage('Invalid order type'),
  body('items').isArray({ min: 1 }).withMessage('Order must have at least one item'),
  body('items.*.menuItemId').isMongoId().withMessage('Valid menu item ID required'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('deliveryAddress').if(body('orderType').equals('Delivery')).notEmpty().withMessage('Delivery address required'),
  validate,
];

exports.validateUpdateStatus = [
  body('status')
    .isIn(['Pending', 'Accepted', 'Preparing', 'Ready', 'OutForDelivery', 'Completed', 'Cancelled'])
    .withMessage('Invalid status'),
  validate,
];

exports.validatePayment = [
  body('method').isIn(['Cash', 'CreditCard', 'Wallet', 'Stripe', 'PayPal']).withMessage('Invalid payment method'),
  validate,
];
