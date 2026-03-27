import axios from 'axios';
import { API_BASE } from '../lib/constants';

const api = axios.create({ baseURL: API_BASE });

// Attach token from localStorage on every request
api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('rms_token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

export const menuApi = {
  // Categories
  getCategories:   (rid)      => api.get(`/restaurants/${rid}/menu/categories`),
  createCategory:  (rid, data) => api.post(`/restaurants/${rid}/menu/categories`, data),
  updateCategory:  (rid, id, data) => api.patch(`/restaurants/${rid}/menu/categories/${id}`, data),
  deleteCategory:  (rid, id)  => api.delete(`/restaurants/${rid}/menu/categories/${id}`),

  // Items
  getItems:        (rid, params) => api.get(`/restaurants/${rid}/menu/items`, { params }),
  createItem:      (rid, data)   => api.post(`/restaurants/${rid}/menu/items`, data),
  updateItem:      (rid, id, data) => api.patch(`/restaurants/${rid}/menu/items/${id}`, data),
  deleteItem:      (rid, id)     => api.delete(`/restaurants/${rid}/menu/items/${id}`),
  toggleItem:      (rid, id)     => api.patch(`/restaurants/${rid}/menu/items/${id}/toggle`),
};

export default api;
