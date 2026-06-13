require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./utils/db');
const settingsService = require('./modules/settings/services/settings_service');
const maintenanceMode = require('./middlewares/maintenanceMode');
const errorHandler = require('./utils/errorHandler');

const app = express();

app.use(cookieParser());
connectDB().then(() => settingsService.loadCache().catch(console.error));

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000'
];

if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL.replace(/\/$/, ''));
}

app.use(cors({
  origin: (origin, callback) => {
    // Allow server-to-server or REST client requests
    if (!origin) return callback(null, true);

    const isAllowed = allowedOrigins.includes(origin) || origin.endsWith('.vercel.app');
    if (isAllowed) {
      callback(null, true);
    } else {
      console.warn(`Blocked by CORS: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

// Stripe webhook MUST be before express.json() because it needs the raw request body
const paymentController = require('./modules/payment/controllers/payment_controller');
app.post('/api/v1/webhook/stripe', express.raw({ type: 'application/json' }), paymentController.stripeWebhook);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// Maintenance mode — applied after webhook (Stripe always passes), before all app routes
app.use('/api/v1', maintenanceMode);

app.use('/api/v1/auth', require('./modules/user/routes/user_routes'));
app.use('/api/v1/settings', require('./modules/settings/routes/settings_routes'));
app.use('/api/v1/tenants', require('./modules/tenant/routes/tenant_routes'));
app.use('/api/v1/plans', require('./modules/plans/routes/plan_routes'));
app.use('/api/v1/analytics', require('./modules/analytics/routes/analytics_routes'));

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
