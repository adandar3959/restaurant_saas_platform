import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

export const plansApi = {
  getAll: () => axios.get(`${BASE}/plans`),
  update: (planId, data, token) =>
    axios.patch(`${BASE}/plans/${planId}`, data, {
      headers: { Authorization: `Bearer ${token}` },
    }),
};
