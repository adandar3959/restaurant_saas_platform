import axios from 'axios';
import { API_BASE } from '../lib/constants';
const api = axios.create({ baseURL: API_BASE });
api.interceptors.request.use(cfg => { const t = localStorage.getItem('rms_token'); if (t) cfg.headers.Authorization = `Bearer ${t}`; return cfg; });

export const kitchenApi = {
  getTickets:       (rid, params)    => api.get(`/restaurants/${rid}/kitchen/tickets`, { params }),
  getTicket:        (rid, id)        => api.get(`/restaurants/${rid}/kitchen/tickets/${id}`),
  updateTicket:     (rid, id, status)=> api.patch(`/restaurants/${rid}/kitchen/tickets/${id}/status`, { status }),
  updateTicketItem: (rid, tid, iid, status) => api.patch(`/restaurants/${rid}/kitchen/tickets/${tid}/items/${iid}/status`, { status }),
  getStations:      (rid)            => api.get(`/restaurants/${rid}/kitchen/stations`),
  createStation:    (rid, data)      => api.post(`/restaurants/${rid}/kitchen/stations`, data),
  updateStation:    (rid, id, data)  => api.patch(`/restaurants/${rid}/kitchen/stations/${id}`, data),
  deleteStation:    (rid, id)        => api.delete(`/restaurants/${rid}/kitchen/stations/${id}`),
};
export default api;
