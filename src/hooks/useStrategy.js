import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

function useStrategy() {
  const [strategies, setStrategies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStrategies = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get('/api/v1/crm/strategy');
      setStrategies(data.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load strategies');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStrategies();
  }, [fetchStrategies]);

  const createStrategy = useCallback(async (wizardData) => {
    const strategy = await api.post('/api/v1/crm/strategy', wizardData);
    setStrategies(prev => [strategy, ...prev]);
    return strategy;
  }, []);

  const getStrategy = useCallback(async (id) => {
    return api.get(`/api/v1/crm/strategy/${id}`);
  }, []);

  return { strategies, loading, error, refetch: fetchStrategies, createStrategy, getStrategy };
}

export default useStrategy;