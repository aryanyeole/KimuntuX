import React, { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';

const API_BASE = 'http://localhost:5000/api';
const WORKSPACE_HEADERS = {
  'Content-Type': 'application/json',
  'x-workspace-id': 'demo-workspace',
};

const PanelStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
`;

const Banner = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 13px;
  padding: 0.8rem 1rem;
  border-radius: 12px;
  background: ${props => props.$error ? 'rgba(239,68,68,0.1)' : 'rgba(0,200,150,0.08)'};
  border: 1px solid ${props => props.$error ? 'rgba(239,68,68,0.25)' : 'rgba(0,200,150,0.18)'};
  color: ${props => props.$error ? 'var(--crm-red)' : 'var(--crm-accent)'};
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1.25rem;

  @media (max-width: 960px) {
    grid-template-columns: 1fr;
  }
`;

const Card = styled.div`
  background: var(--crm-panel);
  border: 1px solid var(--crm-border);
  border-radius: 16px;
  padding: 1.35rem;
  backdrop-filter: blur(8px);
`;

const CardTop = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1rem;
`;

const ProviderMeta = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
`;

const ProviderName = styled.h3`
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: var(--crm-text);
`;

const ProviderSubtext = styled.div`
  font-size: 12px;
  color: var(--crm-muted);
  line-height: 1.5;
`;

const StatusTag = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.3rem 0.7rem;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  background: ${props => props.$connected ? 'rgba(34,197,94,0.12)' : 'rgba(148,163,184,0.12)'};
  color: ${props => props.$connected ? 'var(--crm-green)' : 'var(--crm-muted)'};
`;

const StatList = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.85rem;
  margin-bottom: 1rem;

  @media (max-width: 560px) {
    grid-template-columns: 1fr;
  }
`;

const StatBox = styled.div`
  background: var(--crm-panel2);
  border: 1px solid var(--crm-border);
  border-radius: 12px;
  padding: 0.8rem 0.9rem;
`;

const StatLabel = styled.div`
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--crm-muted);
  margin-bottom: 0.35rem;
`;

const StatValue = styled.div`
  font-size: 13px;
  color: var(--crm-text);
  word-break: break-word;
`;

const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem;
`;

const ActionButton = styled.button`
  border: 1px solid ${props => props.$primary ? 'rgba(0,200,150,0.3)' : 'var(--crm-border)'};
  background: ${props => props.$primary ? 'linear-gradient(135deg, rgba(0,200,150,0.18), rgba(99,102,241,0.14))' : 'var(--crm-panel2)'};
  color: ${props => props.$primary ? 'var(--crm-accent)' : 'var(--crm-text)'};
  border-radius: 10px;
  padding: 0.65rem 0.95rem;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.18s;

  &:hover:not(:disabled) {
    border-color: rgba(0,200,150,0.35);
    color: var(--crm-accent);
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.55;
    cursor: wait;
    transform: none;
  }
`;

const ActivityGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1.25rem;

  @media (max-width: 960px) {
    grid-template-columns: 1fr;
  }
`;

const ActivityCard = styled(Card)`
  padding: 0;
  overflow: hidden;
`;

const ActivityHeader = styled.div`
  padding: 1rem 1.2rem;
  border-bottom: 1px solid var(--crm-border);
  font-size: 13.5px;
  font-weight: 600;
  color: var(--crm-text);
`;

const ActivityList = styled.div`
  display: flex;
  flex-direction: column;
`;

const ActivityItem = styled.div`
  padding: 0.95rem 1.2rem;
  border-bottom: 1px solid var(--crm-border);
  display: flex;
  flex-direction: column;
  gap: 0.25rem;

  &:last-child {
    border-bottom: none;
  }
`;

const ActivityTitle = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  font-size: 12.5px;
  color: var(--crm-text);
`;

const ActivityMeta = styled.div`
  font-size: 11px;
  color: var(--crm-muted);
  line-height: 1.5;
`;

const EmptyState = styled.div`
  padding: 1.2rem;
  font-size: 12.5px;
  color: var(--crm-muted);
`;

function formatDate(value) {
  if (!value) return 'Never';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Never';
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

async function parseJson(response) {
  const text = await response.text();
  return text ? JSON.parse(text) : {};
}

export default function PlatformIntegrationsPanel({ onDataRefresh }) {
  const [data, setData] = useState({ integrations: [], recentRuns: [], recentEvents: [] });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [pendingAction, setPendingAction] = useState('');

  const integrationsByProvider = useMemo(() => {
    const map = new Map();
    data.integrations.forEach((integration) => {
      map.set(integration.provider, integration);
    });
    return map;
  }, [data.integrations]);

  const google = integrationsByProvider.get('google');
  const tracking = integrationsByProvider.get('tracking');

  const refreshIntegrations = async () => {
    const response = await fetch(`${API_BASE}/integrations`, {
      headers: { 'x-workspace-id': 'demo-workspace' },
    });

    if (!response.ok) {
      throw new Error('Failed to load platform integrations');
    }

    const payload = await parseJson(response);
    setData({
      integrations: Array.isArray(payload.integrations) ? payload.integrations : [],
      recentRuns: Array.isArray(payload.recentRuns) ? payload.recentRuns : [],
      recentEvents: Array.isArray(payload.recentEvents) ? payload.recentEvents : [],
    });
    return payload;
  };

  useEffect(() => {
    let alive = true;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        await refreshIntegrations();
      } catch (err) {
        if (alive) {
          setError(err.message || 'Failed to load integrations');
        }
      } finally {
        if (alive) {
          setLoading(false);
        }
      }
    };

    load();
    return () => {
      alive = false;
    };
  }, []);

  const runAction = async (actionKey, path) => {
    try {
      setPendingAction(actionKey);
      setError(null);
      setMessage(null);

      const response = await fetch(`${API_BASE}${path}`, {
        method: 'POST',
        headers: WORKSPACE_HEADERS,
      });

      const payload = await parseJson(response);
      if (!response.ok) {
        throw new Error(payload.error || payload.message || 'Integration action failed');
      }

      await refreshIntegrations();
      if (onDataRefresh) {
        onDataRefresh();
      }

      setMessage(payload.message || 'Integration action completed');
    } catch (err) {
      setError(err.message || 'Integration action failed');
    } finally {
      setPendingAction('');
    }
  };

  const cardModels = [
    {
      key: 'google',
      name: 'Google',
      description: 'Connect Sheets and Gmail to import demo leads into the CRM pipeline.',
      integration: google,
      actions: [
        { key: 'google-connect', label: 'Connect', path: '/integrations/google/connect', primary: true },
        { key: 'google-sheets', label: 'Sync Sheets', path: '/integrations/google/sheets/sync' },
        { key: 'google-gmail', label: 'Scan Gmail', path: '/integrations/google/gmail/scan' },
        { key: 'google-disconnect', label: 'Disconnect', path: '/integrations/google/disconnect' },
      ],
    },
    {
      key: 'tracking',
      name: 'Tracking',
      description: 'Generate tracking events and demo leads that immediately appear in CRM activity.',
      integration: tracking,
      actions: [
        { key: 'tracking-connect', label: 'Connect', path: '/integrations/tracking/connect', primary: true },
        { key: 'tracking-test', label: 'Send Test Event', path: '/integrations/tracking/test' },
        { key: 'tracking-disconnect', label: 'Disconnect', path: '/integrations/tracking/disconnect' },
      ],
    },
  ];

  return (
    <PanelStack>
      <div>
        <h2 style={{ margin: 0, fontSize: 20, color: 'var(--crm-text)' }}>Platform Integrations</h2>
        <p style={{ margin: '0.35rem 0 0 0', fontSize: 13, color: 'var(--crm-muted)' }}>
          Connect demo integrations, sync sample leads, and review recent activity without leaving the CRM.
        </p>
      </div>

      {loading && <Banner>⏳ Loading integration status…</Banner>}
      {message && <Banner>{message}</Banner>}
      {error && <Banner $error>⚠️ {error}</Banner>}

      <Grid>
        {cardModels.map(({ key, name, description, integration, actions }) => {
          const isConnected = integration?.status === 'connected';

          return (
            <Card key={key}>
              <CardTop>
                <ProviderMeta>
                  <ProviderName>{name}</ProviderName>
                  <ProviderSubtext>{description}</ProviderSubtext>
                </ProviderMeta>
                <StatusTag $connected={isConnected}>{isConnected ? 'Connected' : 'Disconnected'}</StatusTag>
              </CardTop>

              <StatList>
                <StatBox>
                  <StatLabel>Last Sync</StatLabel>
                  <StatValue>{formatDate(integration?.lastSyncAt)}</StatValue>
                </StatBox>
                <StatBox>
                  <StatLabel>{key === 'tracking' ? 'API Key' : 'Workspace'}</StatLabel>
                  <StatValue>{key === 'tracking' ? integration?.apiKey || 'Not generated' : 'demo-workspace'}</StatValue>
                </StatBox>
              </StatList>

              <Actions>
                {actions.map((action) => (
                  <ActionButton
                    key={action.key}
                    $primary={action.primary}
                    onClick={() => runAction(action.key, action.path)}
                    disabled={pendingAction === action.key}
                  >
                    {pendingAction === action.key ? 'Working…' : action.label}
                  </ActionButton>
                ))}
              </Actions>
            </Card>
          );
        })}
      </Grid>

      <ActivityGrid>
        <ActivityCard>
          <ActivityHeader>Recent Runs</ActivityHeader>
          {data.recentRuns.length > 0 ? (
            <ActivityList>
              {data.recentRuns.map((run) => (
                <ActivityItem key={run.id}>
                  <ActivityTitle>
                    <span>{run.provider} · {run.action}</span>
                    <StatusTag $connected={run.status === 'success'}>{run.status}</StatusTag>
                  </ActivityTitle>
                  <ActivityMeta>{run.message}</ActivityMeta>
                  <ActivityMeta>{formatDate(run.createdAt)}</ActivityMeta>
                </ActivityItem>
              ))}
            </ActivityList>
          ) : (
            <EmptyState>No integration runs yet.</EmptyState>
          )}
        </ActivityCard>

        <ActivityCard>
          <ActivityHeader>Recent Events</ActivityHeader>
          {data.recentEvents.length > 0 ? (
            <ActivityList>
              {data.recentEvents.map((event) => (
                <ActivityItem key={event.id}>
                  <ActivityTitle>
                    <span>{event.type} · {event.source}</span>
                    <span style={{ color: 'var(--crm-muted)', fontSize: 11 }}>{formatDate(event.createdAt)}</span>
                  </ActivityTitle>
                  <ActivityMeta>
                    {event.email || event.name || event.leadId || 'Platform activity recorded'}
                  </ActivityMeta>
                </ActivityItem>
              ))}
            </ActivityList>
          ) : (
            <EmptyState>No platform events yet.</EmptyState>
          )}
        </ActivityCard>
      </ActivityGrid>
    </PanelStack>
  );
}
