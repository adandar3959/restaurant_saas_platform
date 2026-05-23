require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./utils/db');
const errorHandler = require('./utils/errorHandler');

const app = express();

connectDB();

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'],
  credentials: true,
}));

// Stripe webhook MUST be before express.json() because it needs the raw request body
const paymentController = require('./modules/payment/controllers/payment_controller');
app.post('/api/v1/webhook/stripe', express.raw({ type: 'application/json' }), paymentController.stripeWebhook);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

app.use('/api/v1/auth', require('./modules/user/routes/user_routes'));
app.use('/api/v1/tenants', require('./modules/tenant/routes/tenant_routes'));

const restaurantRouter = express.Router({ mergeParams: true });

restaurantRouter.use('/menu', require('./modules/menu/routes/menu_routes'));
restaurantRouter.use('/orders', require('./modules/order/routes/order_routes'));
restaurantRouter.use('/kitchen', require('./modules/kitchen/routes/kitchen_routes'));
restaurantRouter.use('/tables', require('./modules/table/routes/table_routes'));
restaurantRouter.use('/inventory', require('./modules/inventory/routes/inventory_routes'));
restaurantRouter.use('/delivery', require('./modules/delivery/routes/delivery_routes'));
restaurantRouter.use('/crm', require('./modules/crm/routes/crm_routes'));
restaurantRouter.use('/payment', require('./modules/payment/routes/payment_routes'));

app.use('/api/v1/restaurants/:restaurantId', restaurantRouter);

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = app;
