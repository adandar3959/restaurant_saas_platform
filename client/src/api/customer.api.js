import axios from 'axios';
import { API_BASE } from '../lib/constants';

// Public API — no auth token required for menu browsing
const api = axios.create({ baseURL: API_BASE });

// Attach token only if present (for optional-auth endpoints)
api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('rms_token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

export const customerApi = {
  // Restaurant info — public endpoints
  getRestaurant: (rid) => api.get(`/tenants/public/${rid}`),
  getRestaurantBySlug: (slug) => api.get(`/tenants/public/slug/${slug}`),

  // Public menu — no auth needed
  getCategories: (rid) => api.get(`/restaurants/${rid}/menu/categories`),
  getMenuItems: (rid, params) => api.get(`/restaurants/${rid}/menu/items`, { params }),
  getMenuItem: (rid, id) => api.get(`/restaurants/${rid}/menu/items/${id}`),
  getDeals: (rid) => api.get(`/restaurants/${rid}/menu/deals`),

  // Order placement — optionalAuth, works without login
  placeOrder: (rid, data) => api.post(`/restaurants/${rid}/orders`, data),

  // Order tracking — public by orderId
  getOrderStatus: (rid, orderId) => api.get(`/restaurants/${rid}/orders/${orderId}`),

  // Customer account (requires auth)
  getMyOrders: (rid) => api.get(`/restaurants/${rid}/orders/my`),
};

export default api;
