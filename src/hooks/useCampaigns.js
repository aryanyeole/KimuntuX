import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

function useCampaigns(params = {}) {
  const [campaigns, setCampaigns] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCampaigns = useCallback(async (overrideParams) => {
    setLoading(true);
    setError(null);
    try {
      const merged = { page: 1, limit: 50, ...params, ...overrideParams };
      const data = await api.get('/api/v1/crm/campaigns', merged);
      setCampaigns(data.data);
      setTotal(data.total);
    } catch (err) {
      setError(err.message || 'Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchCampaigns();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Mutations ──────────────────────────────────────────────────────────────

  const createCampaign = useCallback(async (data) => {
    const created = await api.post('/api/v1/crm/campaigns', data);
    setCampaigns(prev => [created, ...prev]);
    setTotal(prev => prev + 1);
    return created;
  }, []);

  const updateCampaign = useCallback(async (id, data) => {
    const updated = await api.patch(`/api/v1/crm/campaigns/${id}`, data);
    setCampaigns(prev => prev.map(c => c.id === id ? updated : c));
    return updated;
  }, []);

  return {
    campaigns,
    total,
    loading,
    error,
    refetch: fetchCampaigns,
    createCampaign,
    updateCampaign,
  };
}

export default useCampaigns;
