import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

function useIntegrations() {
  const [integrations, setIntegrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchIntegrations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get('/api/v1/crm/integrations');
      setIntegrations(data.data);
    } catch (err) {
      setError(err.message || 'Failed to load integrations');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIntegrations();
  }, [fetchIntegrations]);

  // ── Mutations ──────────────────────────────────────────────────────────────

  const connect = useCallback(async (platformName) => {
    const updated = await api.post(`/api/v1/crm/integrations/${encodeURIComponent(platformName)}/connect`);
    setIntegrations(prev => prev.map(i => i.platform_name === platformName ? updated : i));
    return updated;
  }, []);

  const disconnect = useCallback(async (platformName) => {
    const updated = await api.delete(`/api/v1/crm/integrations/${encodeURIComponent(platformName)}/disconnect`);
    setIntegrations(prev => prev.map(i => i.platform_name === platformName ? updated : i));
    return updated;
  }, []);

  return { integrations, loading, error, refetch: fetchIntegrations, connect, disconnect };
}

export default useIntegrations;
