const deliveryService = require('../services/delivery_service');
const asyncHandler = require('../../../utils/asyncHandler');
const { sendSuccess } = require('../../../utils/apiResponse');
const { paginate, paginateMeta } = require('../../../utils/paginate');

exports.createZone = asyncHandler(async (req, res) => {
  const zone = await deliveryService.createZone({ ...req.body, restaurantId: req.params.restaurantId });
  sendSuccess(res, zone, 'Delivery zone created', 201);
});

exports.getZones = asyncHandler(async (req, res) => {
  const zones = await deliveryService.getZones(req.params.restaurantId);
  sendSuccess(res, zones);
});

exports.updateZone = asyncHandler(async (req, res) => {
  const zone = await deliveryService.updateZone(req.params.id, req.params.restaurantId, req.body);
  sendSuccess(res, zone, 'Zone updated');
});

exports.deleteZone = asyncHandler(async (req, res) => {
  await deliveryService.deleteZone(req.params.id, req.params.restaurantId);
  sendSuccess(res, null, 'Zone deleted');
});

exports.createDriver = asyncHandler(async (req, res) => {
  const driver = await deliveryService.createDriver({ ...req.body, restaurantId: req.params.restaurantId });
  sendSuccess(res, driver, 'Driver created', 201);
});

exports.getDrivers = asyncHandler(async (req, res) => {
  const drivers = await deliveryService.getDrivers(req.params.restaurantId, req.query);
  sendSuccess(res, drivers);
});

exports.updateDriverStatus = asyncHandler(async (req, res) => {
  const driver = await deliveryService.updateDriverStatus(req.params.id, req.params.restaurantId, req.body.status);
  sendSuccess(res, driver, 'Driver status updated');
});

exports.updateDriverLocation = asyncHandler(async (req, res) => {
  const driver = await deliveryService.updateDriverLocation(req.params.id, req.params.restaurantId, req.body.coordinates);
  sendSuccess(res, driver, 'Location updated');
});

exports.createDispatch = asyncHandler(async (req, res) => {
  const dispatch = await deliveryService.createDispatch({ ...req.body, restaurantId: req.params.restaurantId });
  sendSuccess(res, dispatch, 'Dispatch created', 201);
});

exports.getDispatches = asyncHandler(async (req, res) => {
  const pagination = paginate(req.query);
  const { dispatches, total } = await deliveryService.getDispatches(req.params.restaurantId, req.query, pagination);
  sendSuccess(res, { dispatches, meta: paginateMeta(total, pagination.page, pagination.limit) });
});

exports.updateDispatchStatus = asyncHandler(async (req, res) => {
  const dispatch = await deliveryService.updateDispatchStatus(req.params.id, req.params.restaurantId, req.body.status);
  sendSuccess(res, dispatch, 'Dispatch status updated');
});
