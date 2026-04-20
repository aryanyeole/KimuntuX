import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import WalletConnector from '../../components/WalletConnector';
import TransactionDemo from '../../components/TransactionDemo';
import DatabaseMonitor from '../../components/DatabaseMonitor';
import blockchainService from '../../services/blockchainService';

const Container = styled.div`
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const Card = styled.div`
  background: #121e34;
  border: 1px solid #1a2d4d;
  border-radius: 12px;
  padding: 1.5rem;
`;

const CardTitle = styled.h3`
  color: #2d7aff;
  margin: 0 0 1rem 0;
  font-size: 1.1rem;
  font-weight: 600;
`;

const StatusRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const StatusLabel = styled.span`
  color: #6b7fa3;
  font-size: 0.9rem;
`;

const StatusValue = styled.span`
  color: #e4eaf4;
  font-size: 0.9rem;
  font-weight: 500;
`;

const StatusBadge = styled.span`
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
  background: ${props => props.status === 'healthy' ? '#22c55e20' : '#ef444420'};
  color: ${props => props.status === 'healthy' ? '#22c55e' : '#ef4444'};
`;

const MetricCard = styled.div`
  background: #0c1527;
  border: 1px solid #1a2d4d;
  border-radius: 8px;
  padding: 1rem;
  text-align: center;
`;

const MetricValue = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: #2d7aff;
  margin-bottom: 0.25rem;
`;

const MetricLabel = styled.div`
  font-size: 0.85rem;
  color: #6b7fa3;
`;

const Section = styled.div`
  margin-bottom: 2rem;
`;

const SectionTitle = styled.h2`
  color: #e4eaf4;
  font-size: 1.3rem;
  font-weight: 600;
  margin: 0 0 1.5rem 0;
`;

const CRMBlockchain = () => {
  const [health, setHealth] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [connectedAddress, setConnectedAddress] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHealthAndMetrics();
    const interval = setInterval(fetchHealthAndMetrics, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchHealthAndMetrics = async () => {
    try {
      const [healthData, commissionStats, escrowStats] = await Promise.all([
        blockchainService.getHealth(),
        blockchainService.getContractStats(),
        blockchainService.getEscrowStats()
      ]);

      setHealth(healthData);
      setMetrics({
        commissionPool: commissionStats.contract_balance_eth || 0,
        totalPaid: commissionStats.total_paid_eth || 0,
        activeEscrows: escrowStats.active_escrows || 0,
        lockedValue: escrowStats.total_locked_value || 0
      });
    } catch (error) {
      console.error('Failed to fetch health and metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleWalletConnected = (address, walletData) => {
    setConnectedAddress(address);
  };

  return (
    <Container>
      <Section>
        <SectionTitle>Blockchain Operations</SectionTitle>
        
        <Grid>
          <Card>
            <CardTitle>Connection Status</CardTitle>
            {loading ? (
              <StatusRow>
                <StatusLabel>Loading...</StatusLabel>
              </StatusRow>
            ) : health ? (
              <>
                <StatusRow>
                  <StatusLabel>Network:</StatusLabel>
                  <StatusValue>{blockchainService.network}</StatusValue>
                </StatusRow>
                <StatusRow>
                  <StatusLabel>Latest Block:</StatusLabel>
                  <StatusValue>{health.latest_block || 'N/A'}</StatusValue>
                </StatusRow>
                <StatusRow>
                  <StatusLabel>Gas Price:</StatusLabel>
                  <StatusValue>{health.gas_price_gwei ? `${health.gas_price_gwei.toFixed(2)} gwei` : 'N/A'}</StatusValue>
                </StatusRow>
                <StatusRow>
                  <StatusLabel>Platform Balance:</StatusLabel>
                  <StatusValue>{health.platform_balance_eth ? `${health.platform_balance_eth.toFixed(4)} ETH` : 'N/A'}</StatusValue>
                </StatusRow>
                <StatusRow>
                  <StatusLabel>Status:</StatusLabel>
                  <StatusBadge status={health.status}>{health.status || 'unknown'}</StatusBadge>
                </StatusRow>
                <StatusRow>
                  <StatusLabel>Contracts:</StatusLabel>
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
                <StatusLabel>Unable to connect</StatusLabel>
              </StatusRow>
            )}
          </Card>

          <Card>
            <CardTitle>Platform Metrics</CardTitle>
            {loading ? (
              <StatusRow>
                <StatusLabel>Loading...</StatusLabel>
              </StatusRow>
            ) : metrics ? (
              <Grid style={{ gap: '1rem' }}>
                <MetricCard>
                  <MetricValue>{metrics.commissionPool.toFixed(4)}</MetricValue>
                  <MetricLabel>Commission Pool (ETH)</MetricLabel>
                </MetricCard>
                <MetricCard>
                  <MetricValue>{metrics.totalPaid}</MetricValue>
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
              </Grid>
            ) : (
              <StatusRow>
                <StatusLabel>Unable to load metrics</StatusLabel>
              </StatusRow>
            )}
          </Card>
        </Grid>
      </Section>

      <Section>
        <SectionTitle>Wallet Management</SectionTitle>
        <WalletConnector onWalletConnected={handleWalletConnected} />
      </Section>

      {connectedAddress && (
        <>
          <Section>
            <SectionTitle>Transaction Operations</SectionTitle>
            <TransactionDemo connectedAddress={connectedAddress} />
          </Section>

          <Section>
            <SectionTitle>Database Synchronization</SectionTitle>
            <DatabaseMonitor connectedAddress={connectedAddress} autoRefresh={true} />
          </Section>
        </>
      )}
    </Container>
  );
};

export default CRMBlockchain;
