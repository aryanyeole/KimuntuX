import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

/**
 * @param {string|null} leadId - if provided, filters communications to that lead
 */
function useCommunications(leadId = null) {
  const [messages, setMessages] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = leadId ? { lead_id: leadId } : {};
      const data = await api.get('/api/v1/crm/communications', params);
      setMessages(data.data);
      setTotal(data.total);
    } catch (err) {
      setError(err.message || 'Failed to load communications');
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // ── Mutations ──────────────────────────────────────────────────────────────

  const sendMessage = useCallback(async (data) => {
    const created = await api.post('/api/v1/crm/communications', data);
    setMessages(prev => [created, ...prev]);
    setTotal(prev => prev + 1);
    return created;
  }, []);

  const sendEmail = useCallback(async ({ subject, body }) => {
    if (!leadId) throw new Error('sendEmail requires a leadId');
    const created = await api.post(
      `/api/v1/crm/leads/${leadId}/communications/send-email`,
      { subject, body }
    );
    setMessages(prev => [created, ...prev]);
    setTotal(prev => prev + 1);
    return created;
  }, [leadId]);

  return { messages, total, loading, error, refetch: fetchMessages, sendMessage, sendEmail };
}

export default useCommunications;
