import { useState, useEffect } from 'react';
import { plansApi } from '../api/plans.api';

/**
 * Shared hook — fetches all plans from the DB once.
 * Use this in PricingPage, OnboardingPage, AdminSettings, etc.
 * Returns: { plans, loading, error }
 */
export function usePlans() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    plansApi.getAll()
      .then(res => setPlans(res.data?.data || res.data || []))
      .catch(err => setError(err?.response?.data?.message || 'Failed to load plans'))
      .finally(() => setLoading(false));
  }, []);

  return { plans, loading, error };
}
