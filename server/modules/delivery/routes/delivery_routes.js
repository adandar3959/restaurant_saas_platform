const router = require('express').Router({ mergeParams: true });
const ctrl = require('../controllers/delivery_controller');
const { protect, authorize } = require('../../../utils/auth.middleware');

const staff = ['SuperAdmin', 'Admin', 'Manager'];

// Zones
router.get('/zones', protect, ctrl.getZones);
router.post('/zones', protect, authorize(...staff), ctrl.createZone);
router.patch('/zones/:id', protect, authorize(...staff), ctrl.updateZone);
router.delete('/zones/:id', protect, authorize(...staff), ctrl.deleteZone);

// Drivers
router.get('/drivers', protect, authorize(...staff), ctrl.getDrivers);
router.post('/drivers', protect, authorize(...staff), ctrl.createDriver);
router.patch('/drivers/:id/status', protect, authorize(...staff, 'Driver'), ctrl.updateDriverStatus);
router.patch('/drivers/:id/location', protect, authorize('Driver'), ctrl.updateDriverLocation);

// Dispatches
router.get('/dispatches', protect, authorize(...staff), ctrl.getDispatches);
router.post('/dispatches', protect, authorize(...staff), ctrl.createDispatch);
router.patch('/dispatches/:id/status', protect, authorize(...staff, 'Driver'), ctrl.updateDispatchStatus);

module.exports = router;
