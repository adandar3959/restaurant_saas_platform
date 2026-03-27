import axios from 'axios';
import { API_BASE } from '../lib/constants';
const api = axios.create({ baseURL: API_BASE });
api.interceptors.request.use(cfg => { const t = localStorage.getItem('rms_token'); if (t) cfg.headers.Authorization = `Bearer ${t}`; return cfg; });

export const tablesApi = {
  getTables:         (rid, params) => api.get(`/restaurants/${rid}/tables/tables`, { params }),
  createTable:       (rid, data)   => api.post(`/restaurants/${rid}/tables/tables`, data),
  updateTable:       (rid, id, data)   => api.patch(`/restaurants/${rid}/tables/tables/${id}`, data),
  updateTableStatus: (rid, id, status) => api.patch(`/restaurants/${rid}/tables/tables/${id}/status`, { status }),
  deleteTable:       (rid, id)     => api.delete(`/restaurants/${rid}/tables/tables/${id}`),

  getReservations:       (rid, params)   => api.get(`/restaurants/${rid}/tables/reservations`, { params }),
  createReservation:     (rid, data)     => api.post(`/restaurants/${rid}/tables/reservations`, data),
  updateReservation:     (rid, id, data) => api.patch(`/restaurants/${rid}/tables/reservations/${id}`, data),
  updateReservationStatus: (rid, id, status, reason) =>
    api.patch(`/restaurants/${rid}/tables/reservations/${id}/status`, { status, cancellationReason: reason }),
};
export default api;
