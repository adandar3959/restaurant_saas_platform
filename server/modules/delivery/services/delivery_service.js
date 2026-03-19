const DeliveryZone = require('../models/deliveryZone_model');
const Driver = require('../models/driver_model');
const Dispatch = require('../models/dispatch_model');

// ── Delivery Zones ───────────────────────────────────────────
exports.createZone = async (data) => DeliveryZone.create(data);

exports.getZones = async (restaurantId) => DeliveryZone.find({ restaurantId, isActive: true });

exports.updateZone = async (id, restaurantId, data) => {
  const zone = await DeliveryZone.findOneAndUpdate({ _id: id, restaurantId }, data, { new: true });
  if (!zone) throw Object.assign(new Error('Zone not found'), { statusCode: 404 });
  return zone;
};

exports.deleteZone = async (id, restaurantId) => {
  const zone = await DeliveryZone.findOneAndUpdate({ _id: id, restaurantId }, { isActive: false }, { new: true });
  if (!zone) throw Object.assign(new Error('Zone not found'), { statusCode: 404 });
  return zone;
};

// ── Drivers ──────────────────────────────────────────────────
exports.createDriver = async (data) => Driver.create(data);

exports.getDrivers = async (restaurantId, filters) => {
  const query = { restaurantId };
  if (filters.status) query.status = filters.status;
  return Driver.find(query).populate('userId', 'name phone profileImage');
};

exports.updateDriverStatus = async (id, restaurantId, status) => {
  const driver = await Driver.findOneAndUpdate({ _id: id, restaurantId }, { status }, { new: true });
  if (!driver) throw Object.assign(new Error('Driver not found'), { statusCode: 404 });
  return driver;
};

exports.updateDriverLocation = async (id, restaurantId, coordinates) => {
  const driver = await Driver.findOneAndUpdate(
    { _id: id, restaurantId },
    { currentLocation: { type: 'Point', coordinates }, lastLocationUpdate: new Date() },
    { new: true }
  );
  if (!driver) throw Object.assign(new Error('Driver not found'), { statusCode: 404 });
  return driver;
};

// ── Dispatches ───────────────────────────────────────────────
exports.createDispatch = async (data) => Dispatch.create(data);

exports.getDispatches = async (restaurantId, filters, pagination) => {
  const query = { restaurantId };
  if (filters.status) query.status = filters.status;
  if (filters.driverId) query.driverId = filters.driverId;
  const [dispatches, total] = await Promise.all([
    Dispatch.find(query)
      .populate('orderId', 'orderNumber totalAmount')
      .populate('driverId')
      .skip(pagination.skip)
      .limit(pagination.limit)
      .sort({ createdAt: -1 }),
    Dispatch.countDocuments(query),
  ]);
  return { dispatches, total };
};

exports.updateDispatchStatus = async (id, restaurantId, status) => {
  const update = { status };
  if (status === 'PickedUp') update.pickedUpAt = new Date();
  if (status === 'Delivered') update.deliveredAt = new Date();
  const dispatch = await Dispatch.findOneAndUpdate({ _id: id, restaurantId }, update, { new: true });
  if (!dispatch) throw Object.assign(new Error('Dispatch not found'), { statusCode: 404 });
  return dispatch;
};
