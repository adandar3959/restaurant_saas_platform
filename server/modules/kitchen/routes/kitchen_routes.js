const router = require('express').Router({ mergeParams: true });
const ctrl = require('../controllers/kitchen_controller');
const { protect, authorize } = require('../../../utils/auth.middleware');

const kitchen = ['SuperAdmin', 'Admin', 'Manager', 'Chef'];

router.get('/tickets', protect, authorize(...kitchen), ctrl.getTickets);
router.get('/tickets/:id', protect, authorize(...kitchen), ctrl.getTicketById);
router.patch('/tickets/:id/status', protect, authorize(...kitchen), ctrl.updateTicketStatus);
router.patch('/tickets/:id/items/:itemId/status', protect, authorize(...kitchen), ctrl.updateItemStatus);

router.get('/stations', protect, authorize(...kitchen), ctrl.getStations);
router.post('/stations', protect, authorize('SuperAdmin', 'Admin', 'Manager'), ctrl.createStation);
router.patch('/stations/:id', protect, authorize('SuperAdmin', 'Admin', 'Manager'), ctrl.updateStation);
router.delete('/stations/:id', protect, authorize('SuperAdmin', 'Admin', 'Manager'), ctrl.deleteStation);

module.exports = router;
