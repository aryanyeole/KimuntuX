import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import blockchainService from '../services/blockchainService';

const Container = styled.div`
  background: #121e34;
  border: 1px solid #1a2d4d;
  border-radius: 12px;
  padding: 1.5rem;
`;

const Title = styled.h3`
  color: #2d7aff;
  margin: 0 0 1rem 0;
  font-size: 1.1rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const RefreshButton = styled.button`
  background: #0c1527;
  border: 1px solid #1a2d4d;
  border-radius: 6px;
  color: #6b7fa3;
  padding: 0.5rem 1rem;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    color: #2d7aff;
    border-color: #2d7aff;
  }
  
  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const StatCard = styled.div`
  background: #0c1527;
  border: 1px solid #1a2d4d;
  border-radius: 8px;
  padding: 1rem;
  text-align: center;
`;

const StatValue = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: #2d7aff;
  margin-bottom: 0.25rem;
`;

const StatLabel = styled.div`
  font-size: 0.85rem;
  color: #6b7fa3;
`;

const Section = styled.div`
  margin-bottom: 1.5rem;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const SectionTitle = styled.h4`
  color: #e4eaf4;
  font-size: 0.95rem;
  font-weight: 600;
  margin: 0 0 0.75rem 0;
`;

const Table = styled.div`
  background: #0c1527;
  border: 1px solid #1a2d4d;
  border-radius: 8px;
  overflow: hidden;
`;

const TableRow = styled.div`
  display: grid;
  grid-template-columns: ${props => props.columns || '1fr 1fr 1fr'};
  gap: 1rem;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #1a2d4d;
  
  &:last-child {
    border-bottom: none;
  }
  
  &:first-child {
    background: #060d1b;
    font-weight: 600;
    color: #6b7fa3;
    font-size: 0.85rem;
  }
`;

const TableCell = styled.div`
  color: #e4eaf4;
  font-size: 0.85rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const EmptyState = styled.div`
  padding: 2rem;
  text-align: center;
  color: #6b7fa3;
  font-size: 0.9rem;
`;

const ErrorMessage = styled.div`
  background: #ef444420;
  border: 1px solid #ef4444;
  border-radius: 8px;
  padding: 0.75rem;
  color: #ef4444;
  font-size: 0.85rem;
  margin-bottom: 1rem;
`;

const LoadingSpinner = styled.div`
  text-align: center;
  padding: 2rem;
  color: #6b7fa3;
  font-size: 0.9rem;
`;

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
      // Fetch commission stats and history
      const [commissionStats, commissionHistory, escrowStats] = await Promise.all([
        blockchainService.getContractStats(),
        blockchainService.getCommissionHistory(connectedAddress),
        blockchainService.getEscrowStats()
      ]);

      setStats({
        totalCommissions: commissionHistory.commissions?.length || 0,
        commissionPool: commissionStats.contract_balance_eth || 0,
        activeEscrows: escrowStats.active_escrows || 0,
        lockedValue: escrowStats.total_locked_value || 0
      });

      setCommissions(commissionHistory.commissions || []);
      setEscrows(escrowStats.recent_escrows || []);

    } catch (err) {
      setError(err.message || 'Failed to fetch database data');
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
      const interval = setInterval(fetchData, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh, connectedAddress, fetchData]);

  if (!connectedAddress) {
    return (
      <Container>
        <Title>Database Synchronization</Title>
        <EmptyState>
          Connect a wallet to monitor database synchronization
        </EmptyState>
      </Container>
    );
  }

  return (
    <Container>
      <Title>
        Database Synchronization
        <RefreshButton onClick={fetchData} disabled={loading}>
          {loading ? 'Refreshing...' : '↻ Refresh'}
        </RefreshButton>
      </Title>

      {error && <ErrorMessage>{error}</ErrorMessage>}

      {loading && !stats ? (
        <LoadingSpinner>Loading database records...</LoadingSpinner>
      ) : (
        <>
          {stats && (
            <StatsGrid>
              <StatCard>
                <StatValue>{stats.totalCommissions}</StatValue>
                <StatLabel>Total Commissions</StatLabel>
              </StatCard>
              <StatCard>
                <StatValue>{stats.commissionPool.toFixed(4)}</StatValue>
                <StatLabel>Pool Balance (ETH)</StatLabel>
              </StatCard>
              <StatCard>
                <StatValue>{stats.activeEscrows}</StatValue>
                <StatLabel>Active Escrows</StatLabel>
              </StatCard>
              <StatCard>
                <StatValue>{stats.lockedValue.toFixed(4)}</StatValue>
                <StatLabel>Locked Value (ETH)</StatLabel>
              </StatCard>
            </StatsGrid>
          )}

          <Section>
            <SectionTitle>Recent Commissions (RDS)</SectionTitle>
            {commissions.length > 0 ? (
              <Table>
                <TableRow columns="2fr 1fr 1fr 1fr">
                  <TableCell>Transaction ID</TableCell>
                  <TableCell>Amount (ETH)</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Date</TableCell>
                </TableRow>
                {commissions.slice(0, 5).map((commission, index) => (
                  <TableRow key={index} columns="2fr 1fr 1fr 1fr">
                    <TableCell title={commission.tx_id}>{commission.tx_id}</TableCell>
                    <TableCell>{Number(commission.amount_eth || 0).toFixed(4)}</TableCell>
                    <TableCell>{commission.status}</TableCell>
                    <TableCell>
                      {new Date(commission.created_at * 1000).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </Table>
            ) : (
              <EmptyState>No commission records found</EmptyState>
            )}
          </Section>

          <Section>
            <SectionTitle>Recent Escrows (RDS)</SectionTitle>
            {escrows.length > 0 ? (
              <Table>
                <TableRow columns="1fr 2fr 1fr 1fr">
                  <TableCell>Escrow ID</TableCell>
                  <TableCell>Product ID</TableCell>
                  <TableCell>Amount (ETH)</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
                {escrows.slice(0, 5).map((escrow, index) => (
                  <TableRow key={index} columns="1fr 2fr 1fr 1fr">
                    <TableCell>{escrow.escrow_id}</TableCell>
                    <TableCell title={escrow.product_id}>{escrow.product_id}</TableCell>
                    <TableCell>{Number(escrow.amount_eth || 0).toFixed(4)}</TableCell>
                    <TableCell>{escrow.status}</TableCell>
                  </TableRow>
                ))}
              </Table>
            ) : (
              <EmptyState>No escrow records found</EmptyState>
            )}
          </Section>
        </>
      )}
    </Container>
  );
};

export default DatabaseMonitor;
