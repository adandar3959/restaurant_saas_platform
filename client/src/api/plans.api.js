import api from './tenant.api'; // reuse the same axios instance — has auth interceptor built-in

export const plansApi = {
  getAll:  ()              => api.get('/plans'),
  update:  (planId, data)  => api.patch(`/plans/${planId}`, data),
};
