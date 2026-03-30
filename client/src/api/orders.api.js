import axios from 'axios';
import { API_BASE } from '../lib/constants';

const api = axios.create({ baseURL: API_BASE });
api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('rms_token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

export const ordersApi = {
  getOrders:     (rid, params) => api.get(`/restaurants/${rid}/orders`, { params }),
  getMyOrders:   (rid)         => api.get(`/restaurants/${rid}/orders/my`),
  getOrder:      (rid, id)     => api.get(`/restaurants/${rid}/orders/${id}`),
  placeOrder:    (rid, data)   => api.post(`/restaurants/${rid}/orders`, data),
  updateStatus:  (rid, id, status)  => api.patch(`/restaurants/${rid}/orders/${id}/status`, { status }),
  recordPayment: (rid, id, data)    => api.patch(`/restaurants/${rid}/orders/${id}/payment`, data),
  updateItemStatus: (rid, id, itemId, kitchenStatus) => api.patch(`/restaurants/${rid}/orders/${id}/items/${itemId}`, { kitchenStatus }),
};

export default api;
