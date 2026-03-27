import { useState, useCallback } from 'react';

/**
 * useApi — wraps an async API function with loading/error state
 *
 * Usage:
 *   const { request, loading, error } = useApi();
 *   const data = await request(() => menuApi.getItems(restaurantId));
 */
export function useApi() {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const request = useCallback(async (apiFn) => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiFn();
      return result;
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Something went wrong';
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = () => setError(null);

  return { request, loading, error, clearError };
}
