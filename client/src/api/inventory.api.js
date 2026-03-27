import axios from 'axios';
import { API_BASE } from '../lib/constants';
const api = axios.create({ baseURL: API_BASE });
api.interceptors.request.use(cfg => { const t = localStorage.getItem('rms_token'); if (t) cfg.headers.Authorization = `Bearer ${t}`; return cfg; });

export const inventoryApi = {
  getIngredients:  (rid)         => api.get(`/restaurants/${rid}/inventory/ingredients`),
  getLowStock:     (rid)         => api.get(`/restaurants/${rid}/inventory/ingredients/low-stock`),
  addIngredient:   (rid, data)   => api.post(`/restaurants/${rid}/inventory/ingredients`, data),
  updateIngredient:(rid, id, data)=> api.patch(`/restaurants/${rid}/inventory/ingredients/${id}`, data),
  deleteIngredient:(rid, id)     => api.delete(`/restaurants/${rid}/inventory/ingredients/${id}`),

  getRecipes:   (rid)          => api.get(`/restaurants/${rid}/inventory/recipes`),
  createRecipe: (rid, data)    => api.post(`/restaurants/${rid}/inventory/recipes`, data),
  updateRecipe: (rid, id, data)=> api.patch(`/restaurants/${rid}/inventory/recipes/${id}`, data),

  getSuppliers:   (rid)          => api.get(`/restaurants/${rid}/inventory/suppliers`),
  addSupplier:    (rid, data)    => api.post(`/restaurants/${rid}/inventory/suppliers`, data),
  updateSupplier: (rid, id, data)=> api.patch(`/restaurants/${rid}/inventory/suppliers/${id}`, data),

  getPurchaseOrders:    (rid)          => api.get(`/restaurants/${rid}/inventory/purchase-orders`),
  createPurchaseOrder:  (rid, data)    => api.post(`/restaurants/${rid}/inventory/purchase-orders`, data),
  updatePOStatus:       (rid, id, status)=> api.patch(`/restaurants/${rid}/inventory/purchase-orders/${id}/status`, { status }),
};
export default api;
