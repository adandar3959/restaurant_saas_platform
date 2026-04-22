import axios from 'axios';
import { API_BASE } from '../lib/constants';
const api = axios.create({ baseURL: API_BASE });
api.interceptors.request.use(cfg => { const t = localStorage.getItem('rms_token'); if (t) cfg.headers.Authorization = `Bearer ${t}`; return cfg; });

export const tenantApi = {
  getRestaurant:       (id)      => api.get(`/tenants/${id}`),
  getBySlug:           (slug)    => api.get(`/tenants/slug/${slug}`),
  updateRestaurant:    (id, data)=> api.patch(`/tenants/${id}`, data),
  updateSubscription:  (id, data)=> api.patch(`/tenants/${id}/subscription`, data),
  getAllRestaurants:    (params)  => api.get('/tenants', { params }),
  deleteRestaurant:    (id)      => api.delete(`/tenants/${id}`),
};

export const authApi = {
  login:        (data) => api.post('/auth/login', data),
  register:     (data) => api.post('/auth/register', data),
  onboard:      (data) => api.post('/auth/onboard', data),
  getMe:        ()     => api.get('/auth/me'),
  updateMe:     (data) => api.patch('/auth/me', data),
  createStaff:  (data) => api.post('/auth/staff', data),
  getStaff:     (params) => api.get('/auth/', { params }),
  getUser:      (id)   => api.get(`/auth/${id}`),
  updateUser:   (id, data) => api.patch(`/auth/${id}`, data),
  deleteUser:   (id)   => api.delete(`/auth/${id}`),
  createInvite: (data) => api.post('/auth/invites', data),
  getInvites:   ()     => api.get('/auth/invites'),
  revokeInvite: (id)   => api.delete(`/auth/invites/${id}`),
};

export default api;
