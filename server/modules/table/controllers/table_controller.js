const tableService = require('../services/table_service');
const asyncHandler = require('../../../utils/asyncHandler');
const { sendSuccess } = require('../../../utils/apiResponse');
const { paginate, paginateMeta } = require('../../../utils/paginate');

// ── Tables ───────────────────────────────────────────────────
exports.createTable = asyncHandler(async (req, res) => {
  const table = await tableService.createTable({ ...req.body, restaurantId: req.params.restaurantId });
  sendSuccess(res, table, 'Table created', 201);
});

exports.getTables = asyncHandler(async (req, res) => {
  const tables = await tableService.getTables(req.params.restaurantId, req.query);
  sendSuccess(res, tables);
});

exports.getTableById = asyncHandler(async (req, res) => {
  const table = await tableService.getTableById(req.params.id, req.params.restaurantId);
  sendSuccess(res, table);
});

exports.updateTable = asyncHandler(async (req, res) => {
  const table = await tableService.updateTable(req.params.id, req.params.restaurantId, req.body);
  sendSuccess(res, table, 'Table updated');
});

exports.updateTableStatus = asyncHandler(async (req, res) => {
  const table = await tableService.updateTableStatus(req.params.id, req.params.restaurantId, req.body.status);
  sendSuccess(res, table, 'Table status updated');
});

exports.deleteTable = asyncHandler(async (req, res) => {
  await tableService.deleteTable(req.params.id, req.params.restaurantId);
  sendSuccess(res, null, 'Table deleted');
});

// ── Reservations ─────────────────────────────────────────────
exports.createReservation = asyncHandler(async (req, res) => {
  const reservation = await tableService.createReservation({ ...req.body, restaurantId: req.params.restaurantId });
  sendSuccess(res, reservation, 'Reservation created', 201);
});

exports.getReservations = asyncHandler(async (req, res) => {
  const pagination = paginate(req.query);
  const { reservations, total } = await tableService.getReservations(req.params.restaurantId, req.query, pagination);
  sendSuccess(res, { reservations, meta: paginateMeta(total, pagination.page, pagination.limit) });
});

exports.getReservationById = asyncHandler(async (req, res) => {
  const reservation = await tableService.getReservationById(req.params.id, req.params.restaurantId);
  sendSuccess(res, reservation);
});

exports.updateReservation = asyncHandler(async (req, res) => {
  const reservation = await tableService.updateReservation(req.params.id, req.params.restaurantId, req.body);
  sendSuccess(res, reservation, 'Reservation updated');
});

exports.updateReservationStatus = asyncHandler(async (req, res) => {
  const reservation = await tableService.updateReservationStatus(
    req.params.id, req.params.restaurantId, req.body.status, req.body.cancellationReason
  );
  sendSuccess(res, reservation, 'Reservation status updated');
});
