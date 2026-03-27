import axios from 'axios';
import { API_BASE } from '../lib/constants';
const api = axios.create({ baseURL: API_BASE });
api.interceptors.request.use(cfg => { const t = localStorage.getItem('rms_token'); if (t) cfg.headers.Authorization = `Bearer ${t}`; return cfg; });

export const deliveryApi = {
  getZones:    (rid)         => api.get(`/restaurants/${rid}/delivery/zones`),
  createZone:  (rid, data)   => api.post(`/restaurants/${rid}/delivery/zones`, data),
  updateZone:  (rid, id, data)=> api.patch(`/restaurants/${rid}/delivery/zones/${id}`, data),
  deleteZone:  (rid, id)     => api.delete(`/restaurants/${rid}/delivery/zones/${id}`),

  getDrivers:      (rid, params)  => api.get(`/restaurants/${rid}/delivery/drivers`, { params }),
  registerDriver:  (rid, data)    => api.post(`/restaurants/${rid}/delivery/drivers`, data),
  updateDriverStatus: (rid, id, status) => api.patch(`/restaurants/${rid}/delivery/drivers/${id}/status`, { status }),
  updateDriverLocation:(rid, id, coords) => api.patch(`/restaurants/${rid}/delivery/drivers/${id}/location`, { coordinates: coords }),

  getDispatches:   (rid, params)  => api.get(`/restaurants/${rid}/delivery/dispatches`, { params }),
  createDispatch:  (rid, data)    => api.post(`/restaurants/${rid}/delivery/dispatches`, data),
  updateDispatch:  (rid, id, status) => api.patch(`/restaurants/${rid}/delivery/dispatches/${id}/status`, { status }),
};
export default api;
