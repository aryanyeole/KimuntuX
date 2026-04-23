import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

/**
 * @param {Object} params - { niche, network, source, sort_by, sort_dir }
 */
function useOffers(params = {}) {
  const [offers, setOffers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOffers = useCallback(async (overrideParams) => {
    setLoading(true);
    setError(null);
    try {
      const merged = { sort_by: 'gravity', sort_dir: 'desc', ...params, ...overrideParams };
      const data = await api.get('/api/v1/crm/offers', merged);
      setOffers(data.data);
      setTotal(data.total);
    } catch (err) {
      setError(err.message || 'Failed to load offers');
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchOffers();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { offers, total, loading, error, refetch: fetchOffers };
}

export default useOffers;
