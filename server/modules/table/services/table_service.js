const Table = require('../models/table_model');
const Reservation = require('../models/reservation_model');

// ── Tables ───────────────────────────────────────────────────
exports.createTable = async (data) => Table.create(data);

exports.getTables = async (restaurantId, filters) => {
  const query = { restaurantId, isActive: true };
  if (filters.status) query.status = filters.status;
  if (filters.section) query['floorPlan.section'] = filters.section;
  return Table.find(query).sort({ tableNumber: 1 });
};

exports.getTableById = async (id, restaurantId) => {
  const table = await Table.findOne({ _id: id, restaurantId });
  if (!table) throw Object.assign(new Error('Table not found'), { statusCode: 404 });
  return table;
};

exports.updateTable = async (id, restaurantId, data) => {
  const table = await Table.findOneAndUpdate({ _id: id, restaurantId }, data, { new: true, runValidators: true });
  if (!table) throw Object.assign(new Error('Table not found'), { statusCode: 404 });
  return table;
};

exports.updateTableStatus = async (id, restaurantId, status) => {
  const table = await Table.findOneAndUpdate({ _id: id, restaurantId }, { status }, { new: true });
  if (!table) throw Object.assign(new Error('Table not found'), { statusCode: 404 });
  return table;
};

exports.deleteTable = async (id, restaurantId) => {
  const table = await Table.findOneAndUpdate({ _id: id, restaurantId }, { isActive: false }, { new: true });
  if (!table) throw Object.assign(new Error('Table not found'), { statusCode: 404 });
  return table;
};

// ── Reservations ─────────────────────────────────────────────
exports.createReservation = async (data) => Reservation.create(data);

exports.getReservations = async (restaurantId, filters, pagination) => {
  const query = { restaurantId };
  if (filters.status) query.status = filters.status;
  if (filters.date) {
    const start = new Date(filters.date);
    const end = new Date(filters.date);
    end.setDate(end.getDate() + 1);
    query.reservationDate = { $gte: start, $lt: end };
  }
  const [reservations, total] = await Promise.all([
    Reservation.find(query)
      .populate('customerId', 'name email phone')
      .populate('tableId', 'tableNumber capacity')
      .skip(pagination.skip)
      .limit(pagination.limit)
      .sort({ reservationDate: 1 }),
    Reservation.countDocuments(query),
  ]);
  return { reservations, total };
};

exports.getReservationById = async (id, restaurantId) => {
  const res = await Reservation.findOne({ _id: id, restaurantId })
    .populate('customerId', 'name email phone')
    .populate('tableId', 'tableNumber capacity');
  if (!res) throw Object.assign(new Error('Reservation not found'), { statusCode: 404 });
  return res;
};

exports.updateReservation = async (id, restaurantId, data) => {
  const res = await Reservation.findOneAndUpdate({ _id: id, restaurantId }, data, { new: true, runValidators: true });
  if (!res) throw Object.assign(new Error('Reservation not found'), { statusCode: 404 });
  return res;
};

exports.updateReservationStatus = async (id, restaurantId, status, reason) => {
  const update = { status };
  if (status === 'Cancelled') { update.cancelledAt = new Date(); update.cancellationReason = reason; }
  const res = await Reservation.findOneAndUpdate({ _id: id, restaurantId }, update, { new: true });
  if (!res) throw Object.assign(new Error('Reservation not found'), { statusCode: 404 });
  return res;
};
