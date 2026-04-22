const mongoose = require('mongoose');

const ticketItemSchema = new mongoose.Schema(
  {
    menuItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true },
    name: { type: String, required: true },
    quantity: { type: Number, required: true },
    selectedModifiers: [{ name: String, groupName: String }],
    specialInstructions: { type: String },
    prepStation: { type: String },
    status: {
      type: String,
      enum: ['Pending', 'Preparing', 'Ready', 'Served'],
      default: 'Pending',
    },
    startedAt: { type: Date },
    completedAt: { type: Date },
  },
  { _id: true }
);

const kitchenTicketSchema = new mongoose.Schema(
  {
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    orderNumber: { type: String, required: true },
    orderType: { type: String, enum: ['Dine-In', 'Takeaway', 'Delivery'] },
    tableNumber: { type: String },

    items: [ticketItemSchema],

    status: {
      type: String,
      enum: ['Open', 'InProgress', 'Completed', 'Voided'],
      default: 'Open',
    },

    priority: { type: String, enum: ['Normal', 'Rush'], default: 'Normal' },

    assignedStation: { type: String },

    printedAt: { type: Date },
    completedAt: { type: Date },
    voidedAt: { type: Date },
    voidReason: { type: String },
  },
  { timestamps: true }
);

kitchenTicketSchema.index({ restaurantId: 1, status: 1 });
kitchenTicketSchema.index({ orderId: 1 });

module.exports = mongoose.model('KitchenTicket', kitchenTicketSchema);
