require('dotenv').config();
const express = require('express');
const connectDB = require('./utils/db');
const errorHandler = require('./utils/errorHandler');

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// Routes — to be mounted as each module's router is built
// app.use('/api/v1/auth',       require('./modules/user/user.routes'));
// app.use('/api/v1/tenants',    require('./modules/tenant/tenant.routes'));
// app.use('/api/v1/menu',       require('./modules/menu/menu.routes'));
// app.use('/api/v1/orders',     require('./modules/order/order.routes'));
// app.use('/api/v1/kitchen',    require('./modules/kitchen/kitchen.routes'));
// app.use('/api/v1/tables',     require('./modules/table/table.routes'));
// app.use('/api/v1/inventory',  require('./modules/inventory/inventory.routes'));
// app.use('/api/v1/delivery',   require('./modules/delivery/delivery.routes'));
// app.use('/api/v1/crm',        require('./modules/crm/crm.routes'));

// Global error handler — must be last
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = app;
