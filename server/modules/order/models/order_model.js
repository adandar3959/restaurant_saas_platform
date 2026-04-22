const mongoose = require('mongoose');

const selectedModifierSchema = new mongoose.Schema(
  {
    groupName: { type: String },
    name: { type: String, required: true },
    extraPrice: { type: Number, default: 0 },
  },
  { _id: false }
);

const orderItemSchema = new mongoose.Schema(
  {
    menuItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true },
    name: { type: String, required: true },
    image: { type: String },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true },
    selectedModifiers: [selectedModifierSchema],
    itemTotal: { type: Number, required: true },
    specialInstructions: { type: String },
    kitchenStatus: {
      type: String,
      enum: ['Pending', 'Preparing', 'Ready', 'Served'],
      default: 'Pending',
    },
    prepStation: { type: String },
  },
  { _id: true }
);

const deliveryAddressSchema = new mongoose.Schema(
  {
    street: { type: String },
    city: { type: String },
    state: { type: String },
    zipCode: { type: String },
    coordinates: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number] },
    },
    deliveryInstructions: { type: String },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, unique: true },
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    waiterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

    orderType: {
      type: String,
      enum: ['Dine-In', 'Takeaway', 'Delivery'],
      required: true,
    },

    tableId: { type: mongoose.Schema.Types.ObjectId, ref: 'Table', default: null },
    tableNumber: { type: String },

    deliveryAddress: deliveryAddressSchema,
    estimatedDeliveryTime: { type: Date },
    actualDeliveryTime: { type: Date },

    scheduledFor: { type: Date, default: null },

    items: [orderItemSchema],

    financials: {
      subTotal: { type: Number, required: true },
      taxAmount: { type: Number, default: 0 },
      serviceCharge: { type: Number, default: 0 },
      deliveryFee: { type: Number, default: 0 },
      discountAmount: { type: Number, default: 0 },
      tipAmount: { type: Number, default: 0 },
      totalAmount: { type: Number, required: true },
    },

    couponCode: { type: String },
    couponId: { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon', default: null },

    status: {
      type: String,
      enum: ['Pending', 'Accepted', 'Preparing', 'Ready', 'OutForDelivery', 'Completed', 'Cancelled'],
      default: 'Pending',
    },

    payment: {
      status: { type: String, enum: ['Unpaid', 'Paid', 'Refunded', 'PartialRefund'], default: 'Unpaid' },
      method: { type: String, enum: ['Cash', 'CreditCard', 'Wallet', 'Stripe', 'PayPal'] },
      transactionId: { type: String },
      paidAt: { type: Date },
      refundedAt: { type: Date },
      refundAmount: { type: Number },
    },

    customerNotes: { type: String },
    cancellationReason: { type: String },
    cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    statusTimestamps: {
      acceptedAt: { type: Date },
      preparingAt: { type: Date },
      readyAt: { type: Date },
      outForDeliveryAt: { type: Date },
      completedAt: { type: Date },
      cancelledAt: { type: Date },
    },

    loyaltyPointsEarned: { type: Number, default: 0 },
    loyaltyPointsRedeemed: { type: Number, default: 0 },

    source: { type: String, enum: ['Web', 'App', 'POS', 'QR'], default: 'Web' },
  },
  { timestamps: true }
);

orderSchema.index({ restaurantId: 1, status: 1 });
orderSchema.index({ restaurantId: 1, createdAt: -1 });
orderSchema.index({ customerId: 1 });

module.exports = mongoose.model('Order', orderSchema);
