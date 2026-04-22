import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import WalletConnector from './WalletConnector';
import TransactionDemo from './TransactionDemo';
import DatabaseMonitor from './DatabaseMonitor';
import blockchainService from '../services/blockchainService';
import { crm as C } from '../styles/crmTheme';

const Section = styled.section`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.25rem;
`;

const Card = styled.div`
  background: ${C.surface};
  border: 1px solid ${C.border};
  border-radius: ${C.radiusLg};
  padding: 1.4rem;
  box-shadow: 0 14px 40px rgba(0, 0, 0, 0.18);
`;

const SectionTitle = styled.h2`
  margin: 0;
  color: ${C.text};
  font-size: 1.15rem;
  font-weight: 700;
`;

const CardTitle = styled.h3`
  color: ${C.accent};
  margin: 0 0 1rem 0;
  font-size: 1rem;
  font-weight: 700;
`;

const StatusRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.8rem;

  &:last-child {
    margin-bottom: 0;
  }
`;

const StatusLabel = styled.span`
  color: ${C.textMuted};
  font-size: 0.9rem;
`;

const StatusValue = styled.span`
  color: ${C.text};
  font-size: 0.9rem;
  font-weight: 600;
  text-align: right;
`;

const StatusBadge = styled.span`
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  font-size: 0.82rem;
  font-weight: 700;
  background: ${({ $status }) => ($status === 'healthy' ? C.successBg : C.dangerBg)};
  color: ${({ $status }) => ($status === 'healthy' ? C.success : C.danger)};
  border: 1px solid ${({ $status }) => ($status === 'healthy' ? `${C.success}44` : `${C.danger}44`)};
`;

const MetricGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.9rem;
`;

const MetricCard = styled.div`
  background: ${C.card};
  border: 1px solid ${C.border};
  border-radius: ${C.radius};
  padding: 1rem;
`;

const MetricValue = styled.div`
  font-size: 1.35rem;
  font-weight: 800;
  color: ${C.accent};
  margin-bottom: 0.25rem;
`;

const MetricLabel = styled.div`
  font-size: 0.8rem;
  color: ${C.textMuted};
`;

const ErrorCard = styled(Card)`
  border-color: ${C.danger}55;
  background: linear-gradient(180deg, rgba(239, 68, 68, 0.08), rgba(20, 20, 20, 0.96));
`;

const ErrorText = styled.p`
  margin: 0;
  color: ${C.text};
  font-size: 0.95rem;
  line-height: 1.5;
`;

const BlockchainWorkspace = ({ showHeader = true }) => {
  const [health, setHealth] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [connectedAddress, setConnectedAddress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const [healthData, commissionStats, escrowStats] = await Promise.all([
          blockchainService.getHealth(),
          blockchainService.getContractStats(),
          blockchainService.getEscrowStats(),
        ]);

        if (!active) {
          return;
        }

        setHealth(healthData);
        setMetrics({
          commissionPool: commissionStats.contract_balance_eth || 0,
          totalPaid: commissionStats.total_paid_eth || 0,
          activeEscrows: escrowStats.active_escrows || 0,
          lockedValue: escrowStats.total_locked_value || 0,
        });
        setLoadError('');
      } catch (error) {
        if (!active) {
          return;
        }
        setLoadError(error.message || 'Unable to load blockchain metrics.');
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    load();
    const interval = setInterval(load, 30000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <Section>
      {showHeader && <SectionTitle>Blockchain Operations</SectionTitle>}

      {loadError && (
        <ErrorCard>
          <CardTitle>Connection Alert</CardTitle>
          <ErrorText>{loadError}</ErrorText>
        </ErrorCard>
      )}

      <Grid>
        <Card>
          <CardTitle>Connection Status</CardTitle>
          {loading ? (
            <StatusRow>
              <StatusLabel>Checking network</StatusLabel>
              <StatusValue>Loading…</StatusValue>
            </StatusRow>
          ) : health ? (
            <>
              <StatusRow>
                <StatusLabel>Network</StatusLabel>
                <StatusValue>{blockchainService.networkLabel}</StatusValue>
              </StatusRow>
              <StatusRow>
                <StatusLabel>Chain ID</StatusLabel>
                <StatusValue>{health.chain_id || 'N/A'}</StatusValue>
              </StatusRow>
              <StatusRow>
                <StatusLabel>Latest Block</StatusLabel>
                <StatusValue>{health.latest_block || 'N/A'}</StatusValue>
              </StatusRow>
              <StatusRow>
                <StatusLabel>Gas Price</StatusLabel>
                <StatusValue>{health.gas_price_gwei ? `${health.gas_price_gwei.toFixed(2)} gwei` : 'N/A'}</StatusValue>
              </StatusRow>
              <StatusRow>
                <StatusLabel>Platform Balance</StatusLabel>
                <StatusValue>{health.platform_balance_eth ? `${health.platform_balance_eth.toFixed(4)} ETH` : 'N/A'}</StatusValue>
              </StatusRow>
              <StatusRow>
                <StatusLabel>Status</StatusLabel>
                <StatusBadge $status={health.status}>{health.status || 'unknown'}</StatusBadge>
              </StatusRow>
              <StatusRow>
                <StatusLabel>Contracts</StatusLabel>
                <StatusValue>
                  {Object.entries(health.contracts || {})
                    .filter(([, contract]) => contract?.loaded)
                    .map(([name]) => name)
                    .join(', ') || 'None'}
                </StatusValue>
              </StatusRow>
            </>
          ) : (
            <StatusRow>
              <StatusLabel>Connection</StatusLabel>
              <StatusValue>Unavailable</StatusValue>
            </StatusRow>
          )}
        </Card>

        <Card>
          <CardTitle>Protocol Metrics</CardTitle>
          {loading ? (
            <StatusRow>
              <StatusLabel>Preparing dashboard</StatusLabel>
              <StatusValue>Loading…</StatusValue>
            </StatusRow>
          ) : metrics ? (
            <MetricGrid>
              <MetricCard>
                <MetricValue>{metrics.commissionPool.toFixed(4)}</MetricValue>
                <MetricLabel>Commission Pool (ETH)</MetricLabel>
              </MetricCard>
              <MetricCard>
                <MetricValue>{metrics.totalPaid.toFixed(4)}</MetricValue>
                <MetricLabel>Total Paid (ETH)</MetricLabel>
              </MetricCard>
              <MetricCard>
                <MetricValue>{metrics.activeEscrows}</MetricValue>
                <MetricLabel>Active Escrows</MetricLabel>
              </MetricCard>
              <MetricCard>
                <MetricValue>{metrics.lockedValue.toFixed(4)}</MetricValue>
                <MetricLabel>Locked Value (ETH)</MetricLabel>
              </MetricCard>
            </MetricGrid>
          ) : (
            <StatusRow>
              <StatusLabel>Metrics</StatusLabel>
              <StatusValue>Unavailable</StatusValue>
            </StatusRow>
          )}
        </Card>
      </Grid>

      <SectionTitle>Wallet Management</SectionTitle>
      <WalletConnector onWalletConnected={setConnectedAddress} />

      {connectedAddress && (
        <>
          <SectionTitle>Transaction Operations</SectionTitle>
          <TransactionDemo connectedAddress={connectedAddress} />

          <SectionTitle>Database Synchronization</SectionTitle>
          <DatabaseMonitor connectedAddress={connectedAddress} autoRefresh={true} />
        </>
      )}
    </Section>
  );
};

export default BlockchainWorkspace;
