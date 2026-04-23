import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import blockchainService from '../services/blockchainService';
import { crm as C } from '../styles/crmTheme';

const Container = styled.div`
  background: ${C.surface};
  border: 1px solid ${C.border};
  border-radius: ${C.radiusLg};
  padding: 1.5rem;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
`;

const TitleWrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
`;

const Title = styled.h3`
  color: ${C.text};
  margin: 0;
  font-size: 1.05rem;
  font-weight: 700;
`;

const Copy = styled.p`
  margin: 0;
  color: ${C.textMuted};
  font-size: 0.85rem;
  line-height: 1.55;
`;

const RefreshButton = styled.button`
  background: ${C.surfaceAlt};
  border: 1px solid ${C.border};
  border-radius: ${C.radius};
  color: ${C.text};
  padding: 0.65rem 1rem;
  font-size: 0.84rem;
  font-weight: 700;
  cursor: pointer;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 0.9rem;
  margin-bottom: 1.25rem;
`;

const StatCard = styled.div`
  background: ${C.card};
  border: 1px solid ${C.border};
  border-radius: ${C.radius};
  padding: 1rem;
`;

const StatValue = styled.div`
  font-size: 1.2rem;
  font-weight: 800;
  color: ${C.text};
  margin-bottom: 0.2rem;
`;

const StatLabel = styled.div`
  font-size: 0.8rem;
  color: ${C.textMuted};
  line-height: 1.4;
`;

const SplitGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;

  @media (max-width: 980px) {
    grid-template-columns: 1fr;
  }
`;

const Section = styled.div`
  background: ${C.card};
  border: 1px solid ${C.border};
  border-radius: ${C.radius};
  padding: 1rem;
`;

const SectionTitle = styled.h4`
  color: ${C.text};
  font-size: 0.95rem;
  font-weight: 700;
  margin: 0 0 0.8rem;
`;

const RowList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
`;

const ActivityRow = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1.5fr) minmax(110px, 0.8fr) minmax(90px, 0.8fr);
  gap: 0.8rem;
  align-items: center;
  padding: 0.8rem 0.9rem;
  background: ${C.surfaceAlt};
  border: 1px solid ${C.border};
  border-radius: ${C.radius};
`;

const MainCell = styled.div`
  min-width: 0;
`;

const Primary = styled.div`
  color: ${C.text};
  font-size: 0.88rem;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const Secondary = styled.div`
  color: ${C.textMuted};
  font-size: 0.78rem;
  margin-top: 0.18rem;
`;

const ValueCell = styled.div`
  color: ${C.text};
  font-size: 0.86rem;
  font-weight: 700;
  text-align: right;
`;

const StatusCell = styled.div`
  color: ${({ $positive }) => ($positive ? C.success : C.textMuted)};
  font-size: 0.82rem;
  font-weight: 800;
  text-align: right;
`;

const ErrorMessage = styled.div`
  background: ${C.dangerBg};
  border: 1px solid ${C.danger};
  border-radius: ${C.radius};
  padding: 0.8rem 0.9rem;
  color: ${C.danger};
  font-size: 0.85rem;
  margin-bottom: 1rem;
`;

const EmptyState = styled.div`
  padding: 1rem 0.25rem;
  color: ${C.textMuted};
  font-size: 0.88rem;
  line-height: 1.6;
`;

const LoadingState = styled.div`
  padding: 1rem 0.25rem;
  color: ${C.textMuted};
  font-size: 0.88rem;
`;

const formatEth = (value) => Number(value || 0).toFixed(4);

const DatabaseMonitor = ({ connectedAddress, autoRefresh = true }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [stats, setStats] = useState(null);
  const [commissions, setCommissions] = useState([]);
  const [escrows, setEscrows] = useState([]);

  const fetchData = useCallback(async () => {
    if (!connectedAddress) return;

    setLoading(true);
    setError('');

    try {
      const [commissionStats, commissionHistory, escrowStats] = await Promise.all([
        blockchainService.getContractStats(),
        blockchainService.getCommissionHistory(connectedAddress),
        blockchainService.getEscrowStats(),
      ]);

      setStats({
        totalCommissions: commissionHistory.commissions?.length || 0,
        commissionPool: commissionStats.contract_balance_eth || 0,
        activeEscrows: escrowStats.active_escrows || 0,
        lockedValue: escrowStats.total_locked_value || 0,
      });

      setCommissions(commissionHistory.commissions || []);
      setEscrows(escrowStats.recent_escrows || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch blockchain activity.');
      console.error('Database monitor error:', err);
    } finally {
      setLoading(false);
    }
  }, [connectedAddress]);

  useEffect(() => {
    if (connectedAddress) {
      fetchData();
    }
  }, [connectedAddress, fetchData]);

  useEffect(() => {
    if (autoRefresh && connectedAddress) {
      const interval = setInterval(fetchData, 30000);
      return () => clearInterval(interval);
    }
    return undefined;
  }, [autoRefresh, connectedAddress, fetchData]);

  if (!connectedAddress) {
    return (
      <Container>
        <Title>Settlement Activity</Title>
        <EmptyState>Connect a wallet to review commission history and escrow activity.</EmptyState>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <TitleWrap>
          <Title>Settlement Activity</Title>
          <Copy>
            A concise operating feed for the connected wallet, including recent commissions and escrow activity.
          </Copy>
        </TitleWrap>
        <RefreshButton onClick={fetchData} disabled={loading}>
          {loading ? 'Refreshing...' : 'Refresh'}
        </RefreshButton>
      </Header>

      {error && <ErrorMessage>{error}</ErrorMessage>}

      {loading && !stats ? (
        <LoadingState>Loading wallet activity...</LoadingState>
      ) : (
        <>
          {stats && (
            <StatsGrid>
              <StatCard>
                <StatValue>{stats.totalCommissions}</StatValue>
                <StatLabel>Commission records</StatLabel>
              </StatCard>
              <StatCard>
                <StatValue>{formatEth(stats.commissionPool)}</StatValue>
                <StatLabel>Commission pool (ETH)</StatLabel>
              </StatCard>
              <StatCard>
                <StatValue>{stats.activeEscrows}</StatValue>
                <StatLabel>Active escrows</StatLabel>
              </StatCard>
              <StatCard>
                <StatValue>{formatEth(stats.lockedValue)}</StatValue>
                <StatLabel>Locked value (ETH)</StatLabel>
              </StatCard>
            </StatsGrid>
          )}

          <SplitGrid>
            <Section>
              <SectionTitle>Recent Commissions</SectionTitle>
              {commissions.length ? (
                <RowList>
                  {commissions.slice(0, 5).map((commission, index) => (
                    <ActivityRow key={`${commission.tx_id}-${index}`}>
                      <MainCell>
                        <Primary title={commission.tx_id}>{commission.tx_id}</Primary>
                        <Secondary>{new Date(commission.created_at * 1000).toLocaleDateString()}</Secondary>
                      </MainCell>
                      <ValueCell>{formatEth(commission.amount_eth)}</ValueCell>
                      <StatusCell $positive={String(commission.status).toLowerCase() === 'approved'}>
                        {commission.status}
                      </StatusCell>
                    </ActivityRow>
                  ))}
                </RowList>
              ) : (
                <EmptyState>No commission history has been recorded for this wallet yet.</EmptyState>
              )}
            </Section>

            <Section>
              <SectionTitle>Recent Escrows</SectionTitle>
              {escrows.length ? (
                <RowList>
                  {escrows.slice(0, 5).map((escrow, index) => (
                    <ActivityRow key={`${escrow.escrow_id}-${index}`}>
                      <MainCell>
                        <Primary title={escrow.product_id}>Escrow #{escrow.escrow_id}</Primary>
                        <Secondary>{escrow.product_id}</Secondary>
                      </MainCell>
                      <ValueCell>{formatEth(escrow.amount_eth)}</ValueCell>
                      <StatusCell $positive={String(escrow.status).toLowerCase() === 'released'}>
                        {escrow.status}
                      </StatusCell>
                    </ActivityRow>
                  ))}
                </RowList>
              ) : (
                <EmptyState>No escrow records are available yet.</EmptyState>
              )}
            </Section>
          </SplitGrid>
        </>
      )}
    </Container>
  );
};

export default DatabaseMonitor;
