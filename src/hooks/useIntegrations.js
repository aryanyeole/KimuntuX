import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

function useIntegrations() {
  const [integrations, setIntegrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ── ClickBank account state ─────────────────────────────────────────────────
  const [clickbankAccount, setClickbankAccount] = useState(null);
  const [clickbankAccountLoading, setClickbankAccountLoading] = useState(false);

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

  // ── Generic platform mutations ──────────────────────────────────────────────

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

  // ── ClickBank account ───────────────────────────────────────────────────────

  const fetchClickbankAccountStatus = useCallback(async () => {
    try {
      const data = await api.get('/api/v1/crm/integrations/clickbank/account/status');
      setClickbankAccount(data);
    } catch {
      setClickbankAccount({ connected: false, offer_count: 0 });
    }
  }, []);

  const connectClickbankAccount = useCallback(async ({ developerKey, accountNickname }) => {
    setClickbankAccountLoading(true);
    try {
      const result = await api.post('/api/v1/crm/integrations/clickbank/account/connect', {
        developer_key: developerKey,
        account_nickname: accountNickname || null,
      });
      setClickbankAccount(result);
      await fetchIntegrations();
      return result;
    } finally {
      setClickbankAccountLoading(false);
    }
  }, [fetchIntegrations]);

  const disconnectClickbankAccount = useCallback(async () => {
    setClickbankAccountLoading(true);
    try {
      await api.delete('/api/v1/crm/integrations/clickbank/account/disconnect');
      setClickbankAccount({ connected: false, offer_count: 0 });
      await fetchIntegrations();
    } finally {
      setClickbankAccountLoading(false);
    }
  }, [fetchIntegrations]);

  const syncClickbankAccount = useCallback(async () => {
    setClickbankAccountLoading(true);
    try {
      const result = await api.post('/api/v1/crm/integrations/clickbank/account/sync');
      await fetchClickbankAccountStatus();
      return result;
    } finally {
      setClickbankAccountLoading(false);
    }
  }, [fetchClickbankAccountStatus]);

  // ── SendGrid email-sender config ────────────────────────────────────────────

  const sendgridIntegration = integrations.find(i => i.platform_name === 'sendgrid') || null;
  const isSendGridConnected = sendgridIntegration?.status === 'connected';

  const connectSendGrid = useCallback(async ({ senderEmail, senderName }) => {
    const result = await api.post('/api/v1/crm/integrations/sendgrid/connect', {
      sender_email: senderEmail,
      sender_name: senderName,
    });
    await fetchIntegrations();
    return result;
  }, [fetchIntegrations]);

  const disconnectSendGrid = useCallback(async () => {
    const result = await api.delete('/api/v1/crm/integrations/sendgrid/disconnect');
    await fetchIntegrations();
    return result;
  }, [fetchIntegrations]);

  const sendSendGridTestEmail = useCallback(async () => {
    return api.post('/api/v1/crm/integrations/sendgrid/test-send');
  }, []);

  return {
    integrations,
    loading,
    error,
    refetch: fetchIntegrations,
    connect,
    disconnect,
    // sendgrid email sender
    sendgridIntegration,
    isSendGridConnected,
    connectSendGrid,
    disconnectSendGrid,
    sendSendGridTestEmail,
    // clickbank account
    clickbankAccount,
    clickbankAccountLoading,
    fetchClickbankAccountStatus,
    connectClickbankAccount,
    disconnectClickbankAccount,
    syncClickbankAccount,
  };
}

export default useIntegrations;
