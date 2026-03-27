import axios from 'axios';
import { API_BASE } from '../lib/constants';
const api = axios.create({ baseURL: API_BASE });
api.interceptors.request.use(cfg => { const t = localStorage.getItem('rms_token'); if (t) cfg.headers.Authorization = `Bearer ${t}`; return cfg; });

export const crmApi = {
  getReviews:    (rid, params)   => api.get(`/restaurants/${rid}/crm/reviews`, { params }),
  respondReview: (rid, id, text) => api.patch(`/restaurants/${rid}/crm/reviews/${id}/respond`, { text }),
  flagReview:    (rid, id)       => api.patch(`/restaurants/${rid}/crm/reviews/${id}/flag`),

  getCoupons:    (rid)           => api.get(`/restaurants/${rid}/crm/coupons`),
  createCoupon:  (rid, data)     => api.post(`/restaurants/${rid}/crm/coupons`, data),
  updateCoupon:  (rid, id, data) => api.patch(`/restaurants/${rid}/crm/coupons/${id}`, data),
  deleteCoupon:  (rid, id)       => api.delete(`/restaurants/${rid}/crm/coupons/${id}`),
  validateCoupon:(rid, code)     => api.get(`/restaurants/${rid}/crm/coupons/validate/${code}`),

  getLoyalty:    (rid, customerId)        => api.get(`/restaurants/${rid}/crm/loyalty/${customerId}`),
  getLoyaltyHistory:(rid, customerId)     => api.get(`/restaurants/${rid}/crm/loyalty/${customerId}/history`),
  awardPoints:   (rid, customerId, data)  => api.post(`/restaurants/${rid}/crm/loyalty/${customerId}/award`, data),
};
export default api;
