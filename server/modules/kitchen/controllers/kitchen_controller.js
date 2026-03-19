const kitchenService = require('../services/kitchen_service');
const asyncHandler = require('../../../utils/asyncHandler');
const { sendSuccess } = require('../../../utils/apiResponse');
const { paginate, paginateMeta } = require('../../../utils/paginate');

exports.getTickets = asyncHandler(async (req, res) => {
  const pagination = paginate(req.query);
  const { tickets, total } = await kitchenService.getTickets(req.params.restaurantId, req.query, pagination);
  sendSuccess(res, { tickets, meta: paginateMeta(total, pagination.page, pagination.limit) });
});

exports.getTicketById = asyncHandler(async (req, res) => {
  const ticket = await kitchenService.getTicketById(req.params.id, req.params.restaurantId);
  sendSuccess(res, ticket);
});

exports.updateTicketStatus = asyncHandler(async (req, res) => {
  const ticket = await kitchenService.updateTicketStatus(req.params.id, req.params.restaurantId, req.body.status);
  sendSuccess(res, ticket, 'Ticket status updated');
});

exports.updateItemStatus = asyncHandler(async (req, res) => {
  const ticket = await kitchenService.updateItemStatus(
    req.params.id, req.params.restaurantId, req.params.itemId, req.body.status
  );
  sendSuccess(res, ticket, 'Item status updated');
});

exports.getStations = asyncHandler(async (req, res) => {
  const stations = await kitchenService.getStations(req.params.restaurantId);
  sendSuccess(res, stations);
});

exports.createStation = asyncHandler(async (req, res) => {
  const station = await kitchenService.createStation({ ...req.body, restaurantId: req.params.restaurantId });
  sendSuccess(res, station, 'Station created', 201);
});

exports.updateStation = asyncHandler(async (req, res) => {
  const station = await kitchenService.updateStation(req.params.id, req.params.restaurantId, req.body);
  sendSuccess(res, station, 'Station updated');
});

exports.deleteStation = asyncHandler(async (req, res) => {
  await kitchenService.deleteStation(req.params.id, req.params.restaurantId);
  sendSuccess(res, null, 'Station deleted');
});
