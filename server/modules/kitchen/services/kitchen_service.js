const KitchenTicket = require('../models/kitchenTicket_model');
const PrepStation = require('../models/prepStation_model');

exports.getTickets = async (restaurantId, filters, pagination) => {
  const query = { restaurantId };
  if (filters.status) query.status = filters.status;
  if (filters.assignedStation) query.assignedStation = filters.assignedStation;
  const [tickets, total] = await Promise.all([
    KitchenTicket.find(query).skip(pagination.skip).limit(pagination.limit).sort({ createdAt: 1 }),
    KitchenTicket.countDocuments(query),
  ]);
  return { tickets, total };
};

exports.getTicketById = async (id, restaurantId) => {
  const ticket = await KitchenTicket.findOne({ _id: id, restaurantId }).populate('orderId', 'orderNumber orderType tableNumber');
  if (!ticket) throw Object.assign(new Error('Ticket not found'), { statusCode: 404 });
  return ticket;
};

exports.updateTicketStatus = async (id, restaurantId, status) => {
  const update = { status };
  if (status === 'Completed') update.completedAt = new Date();
  if (status === 'Voided') update.voidedAt = new Date();
  const ticket = await KitchenTicket.findOneAndUpdate({ _id: id, restaurantId }, update, { new: true });
  if (!ticket) throw Object.assign(new Error('Ticket not found'), { statusCode: 404 });
  return ticket;
};

exports.updateItemStatus = async (ticketId, restaurantId, itemId, status) => {
  const update = { 'items.$.status': status };
  if (status === 'Preparing') update['items.$.startedAt'] = new Date();
  if (status === 'Ready') update['items.$.completedAt'] = new Date();
  const ticket = await KitchenTicket.findOneAndUpdate(
    { _id: ticketId, restaurantId, 'items._id': itemId },
    { $set: update },
    { new: true }
  );
  if (!ticket) throw Object.assign(new Error('Ticket or item not found'), { statusCode: 404 });
  return ticket;
};

// Prep Stations
exports.getStations = async (restaurantId) => PrepStation.find({ restaurantId, isActive: true });

exports.createStation = async (data) => PrepStation.create(data);

exports.updateStation = async (id, restaurantId, data) => {
  const station = await PrepStation.findOneAndUpdate({ _id: id, restaurantId }, data, { new: true });
  if (!station) throw Object.assign(new Error('Station not found'), { statusCode: 404 });
  return station;
};

exports.deleteStation = async (id, restaurantId) => {
  const station = await PrepStation.findOneAndUpdate({ _id: id, restaurantId }, { isActive: false }, { new: true });
  if (!station) throw Object.assign(new Error('Station not found'), { statusCode: 404 });
  return station;
};
