const router = require('express').Router({ mergeParams: true });
const ctrl = require('../controllers/table_controller');
const { protect, authorize } = require('../../../utils/auth.middleware');

const staff = ['SuperAdmin', 'Admin', 'Manager'];

// Tables
router.get('/tables', protect, ctrl.getTables);
router.post('/tables', protect, authorize(...staff), ctrl.createTable);
router.get('/tables/:id', protect, ctrl.getTableById);
router.patch('/tables/:id', protect, authorize(...staff), ctrl.updateTable);
router.patch('/tables/:id/status', protect, authorize(...staff, 'Waiter'), ctrl.updateTableStatus);
router.delete('/tables/:id', protect, authorize(...staff), ctrl.deleteTable);

// Reservations
router.get('/reservations', protect, ctrl.getReservations);
router.post('/reservations', protect, ctrl.createReservation);
router.get('/reservations/:id', protect, ctrl.getReservationById);
router.patch('/reservations/:id', protect, authorize(...staff), ctrl.updateReservation);
router.patch('/reservations/:id/status', protect, authorize(...staff), ctrl.updateReservationStatus);

module.exports = router;
