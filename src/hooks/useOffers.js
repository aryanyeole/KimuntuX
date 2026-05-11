import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

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

  const addOffer = useCallback(async (payload) => {
    const result = await api.post('/api/v1/crm/offers', payload);
    await fetchOffers();
    return result;
  }, [fetchOffers]);

  const updateOffer = useCallback(async (offerId, payload) => {
    const result = await api.patch(`/api/v1/crm/offers/${offerId}`, payload);
    setOffers(prev => prev.map(o => o.id === offerId ? result : o));
    return result;
  }, []);

  const deleteOffer = useCallback(async (offerId) => {
    await api.delete(`/api/v1/crm/offers/${offerId}`);
    setOffers(prev => prev.filter(o => o.id !== offerId));
  }, []);

  return { offers, total, loading, error, refetch: fetchOffers, addOffer, updateOffer, deleteOffer };
}

export default useOffers;
