import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';

// ── Standalone mutation helpers ───────────────────────────────────────────────
// These are plain async functions — import them directly in pages that
// don't need the list/detail state.

export async function createFunnel(payload) {
  return api.post('/api/v1/crm/funnels', payload);
}

export async function generateFunnel(id) {
  return api.post(`/api/v1/crm/funnels/${id}/generate`);
}

export async function regenerateFunnel(id) {
  return api.post(`/api/v1/crm/funnels/${id}/regenerate`);
}

export async function renameFunnel(id, title) {
  return api.patch(`/api/v1/crm/funnels/${id}`, { title });
}

export async function deleteFunnel(id) {
  return api.delete(`/api/v1/crm/funnels/${id}`);
}

// ── useFunnels — paginated list ───────────────────────────────────────────────

function useFunnels() {
  const [funnels, setFunnels] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchFunnels = useCallback(async (pageNum = 1) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get('/api/v1/crm/funnels', { page: pageNum, limit: 20 });
      setFunnels(data.items || []);
      setTotal(data.total || 0);
    } catch (err) {
      setError(err.message || 'Failed to load funnels');
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchFunnels(page);
  }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    funnels,
    total,
    loading,
    error,
    page,
    setPage,
    refresh: () => fetchFunnels(page),
  };
}

// ── useFunnel — single funnel ─────────────────────────────────────────────────

export function useFunnel(id) {
  const [funnel, setFunnel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    if (!id) return;
    setError(null);
    try {
      const data = await api.get(`/api/v1/crm/funnels/${id}`);
      setFunnel(data);
    } catch (err) {
      setError(err.message || 'Failed to load funnel');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    setLoading(true);
    setFunnel(null);
    refresh();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  return { funnel, loading, error, refresh };
}

// ── useFunnelPolling — auto-refreshes while status=generating ─────────────────

export function useFunnelPolling(id, { enabled = true, intervalMs = 2000 } = {}) {
  const { funnel, loading, error, refresh } = useFunnel(id);
  const intervalRef = useRef(null);

  useEffect(() => {
    // Clear any previous interval when deps change
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (!enabled || !id || !funnel || funnel.status !== 'generating') return;

    intervalRef.current = setInterval(refresh, intervalMs);
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, id, funnel?.status, intervalMs, refresh]); // eslint-disable-line react-hooks/exhaustive-deps

  return { funnel, loading, error, refresh };
}

export default useFunnels;
