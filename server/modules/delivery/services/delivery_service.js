const DeliveryZone = require('../models/deliveryZone_model');
const Driver = require('../models/driver_model');
const Dispatch = require('../models/dispatch_model');

exports.createZone = async (data) => DeliveryZone.create(data);

exports.getZones = async (restaurantId) => DeliveryZone.find({ restaurantId, isActive: true });

exports.updateZone = async (id, restaurantId, data) => {
  const zone = await DeliveryZone.findOneAndUpdate({ _id: id, restaurantId }, data, { returnDocument: 'after' });
  if (!zone) throw Object.assign(new Error('Zone not found'), { statusCode: 404 });
  return zone;
};

exports.deleteZone = async (id, restaurantId) => {
  const zone = await DeliveryZone.findOneAndUpdate({ _id: id, restaurantId }, { isActive: false }, { returnDocument: 'after' });
  if (!zone) throw Object.assign(new Error('Zone not found'), { statusCode: 404 });
  return zone;
};

exports.createDriver = async (data) => Driver.create(data);

exports.getDrivers = async (restaurantId, filters) => {
  const query = { restaurantId };
  if (filters.status) query.status = filters.status;
  return Driver.find(query).populate('userId', 'name phone profileImage');
};

exports.updateDriverStatus = async (id, restaurantId, status) => {
  const driver = await Driver.findOneAndUpdate({ _id: id, restaurantId }, { status }, { returnDocument: 'after' });
  if (!driver) throw Object.assign(new Error('Driver not found'), { statusCode: 404 });
  return driver;
};

exports.updateDriverLocation = async (id, restaurantId, coordinates) => {
  const driver = await Driver.findOneAndUpdate(
    { _id: id, restaurantId },
    { currentLocation: { type: 'Point', coordinates }, lastLocationUpdate: new Date() },
    { returnDocument: 'after' }
  );
  if (!driver) throw Object.assign(new Error('Driver not found'), { statusCode: 404 });
  return driver;
};

exports.createDispatch = async (data) => Dispatch.create(data);

exports.getDispatches = async (restaurantId, filters, pagination) => {
  const query = { restaurantId };
  if (filters.status) query.status = filters.status;
  if (filters.driverId) query.driverId = filters.driverId;
  const [dispatches, total] = await Promise.all([
    Dispatch.find(query)
      .populate({
        path: 'orderId',
        populate: { path: 'customerId', select: 'name phone email' }
      })
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
  const dispatch = await Dispatch.findOneAndUpdate({ _id: id, restaurantId }, update, { returnDocument: 'after' });
  if (!dispatch) throw Object.assign(new Error('Dispatch not found'), { statusCode: 404 });

  try {
    const Order = require('../../order/models/order_model');
    if (status === 'PickedUp' || status === 'InTransit') {
       await Order.findByIdAndUpdate(dispatch.orderId, { status: 'OutForDelivery' });
    } else if (status === 'Delivered') {
       const orderService = require('../../order/services/order_service');
       await orderService.updateOrderStatus(dispatch.orderId, restaurantId, 'Completed', null);
       
       const activeCount = await Dispatch.countDocuments({
         driverId: dispatch.driverId,
         status: { $in: ['Assigned', 'PickedUp', 'InTransit'] }
       });
       if (activeCount === 0) {
         await Driver.findByIdAndUpdate(dispatch.driverId, { status: 'Available' });
       }
    }
  } catch (err) {
    console.error('Failed to sync dispatch status to order:', err);
  }

  return dispatch;
};

exports.autoDispatch = async (orderId, restaurantId) => {
  try {
    const existing = await Dispatch.findOne({ orderId, restaurantId });
    if (existing) return existing;

    const availableDrivers = await Driver.find({ 
      restaurantId, 
      status: { $in: ['Available', 'OnDelivery'] } 
    });
    
    if (!availableDrivers.length) {
      console.log(`[AutoDispatch] No available drivers for order ${orderId}`);
      return null;
    }

    let selectedDriver = null;
    let minDispatches = Infinity;

    for (const driver of availableDrivers) {
      const activeCount = await Dispatch.countDocuments({
        driverId: driver._id,
        status: { $in: ['Assigned', 'PickedUp', 'InTransit'] }
      });
      if (activeCount < minDispatches) {
        minDispatches = activeCount;
        selectedDriver = driver;
      }
    }

    if (!selectedDriver) return null;

    const dispatch = await Dispatch.create({
      restaurantId,
      orderId,
      driverId: selectedDriver._id,
      status: 'Assigned',
    });

    // We can keep them as Available or OnDelivery so they can keep receiving
    if (selectedDriver.status === 'Available') {
      await Driver.findByIdAndUpdate(selectedDriver._id, { status: 'OnDelivery' });
    }
    console.log(`[AutoDispatch] Assigned order ${orderId} to driver ${selectedDriver._id}`);
    
    return dispatch;
  } catch (err) {
    console.error('[AutoDispatch] Error:', err);
    return null;
  }
};
