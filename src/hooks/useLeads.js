import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

/**
 * Fetches a paginated, filtered list of leads.
 *
 * @param {Object} params - query parameters forwarded to the API
 *   search, source, stage, classification, sort_by, sort_dir, page, limit
 */
function useLeads(params = {}) {
  const [leads, setLeads] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(params.page || 1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLeads = useCallback(async (overrideParams) => {
    setLoading(true);
    setError(null);
    try {
      const merged = { page: 1, limit: 20, ...params, ...overrideParams };
      const data = await api.get('/api/v1/crm/leads', merged);
      setLeads(data.data);
      setTotal(data.total);
      setPage(data.page);
      setTotalPages(data.total_pages);
    } catch (err) {
      setError(err.message || 'Failed to load leads');
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchLeads();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Mutations ──────────────────────────────────────────────────────────────

  const createLead = useCallback(async (data) => {
    const created = await api.post('/api/v1/crm/leads', data);
    await fetchLeads();
    return created;
  }, [fetchLeads]);

  const updateLead = useCallback(async (id, data) => {
    const updated = await api.patch(`/api/v1/crm/leads/${id}`, data);
    setLeads(prev => prev.map(l => l.id === id ? updated : l));
    return updated;
  }, []);

  const deleteLead = useCallback(async (id) => {
    await api.delete(`/api/v1/crm/leads/${id}`);
    setLeads(prev => prev.filter(l => l.id !== id));
    setTotal(prev => prev - 1);
  }, []);

  const updateStage = useCallback(async (id, stage) => {
    const updated = await api.patch(`/api/v1/crm/leads/${id}/stage`, { stage });
    setLeads(prev => prev.map(l => l.id === id ? updated : l));
    return updated;
  }, []);

  return {
    leads,
    total,
    page,
    totalPages,
    loading,
    error,
    refetch: fetchLeads,
    createLead,
    updateLead,
    deleteLead,
    updateStage,
  };
}

export default useLeads;
