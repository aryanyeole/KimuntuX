import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

/**
 * Fetches a single lead and its activity timeline.
 *
 * @param {string|null} id - lead UUID; pass null to skip fetching
 */
function useLead(id) {
  const [lead, setLead] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(!!id);
  const [error, setError] = useState(null);

  const fetchAll = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const [leadData, activityData] = await Promise.all([
        api.get(`/api/v1/crm/leads/${id}`),
        api.get(`/api/v1/crm/leads/${id}/activities`),
      ]);
      setLead(leadData);
      setActivities(activityData);
    } catch (err) {
      setError(err.message || 'Failed to load lead');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // ── Mutations ──────────────────────────────────────────────────────────────

  const addActivity = useCallback(async (data) => {
    const created = await api.post(`/api/v1/crm/leads/${id}/activities`, data);
    setActivities(prev => [created, ...prev]);
    return created;
  }, [id]);

  const scoreLead = useCallback(async () => {
    const result = await api.post(`/api/v1/crm/leads/${id}/ai/score`);
    // Reflect updated score/classification on the lead object
    setLead(prev => prev
      ? { ...prev, ai_score: result.ai_score, classification: result.classification }
      : prev
    );
    return result;
  }, [id]);

  const generateOutreach = useCallback(async (request) => {
    return api.post(`/api/v1/crm/leads/${id}/ai/outreach`, request);
  }, [id]);

  return {
    lead,
    activities,
    loading,
    error,
    refetch: fetchAll,
    addActivity,
    scoreLead,
    generateOutreach,
  };
}

export default useLead;
