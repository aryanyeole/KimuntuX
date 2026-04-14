import React, { useState } from 'react';
import styled, { keyframes } from 'styled-components';
import PayoutsPanel from '../components/PayoutsPanel';
import WalletPanel from '../components/WalletPanel';

// ── Palette (matches CRMLayout / CRMDashboard) ────────────────────────────────
const C = {
  bg: '#060d1b',
  surface: '#0c1527',
  card: '#121e34',
  border: '#1a2d4d',
  text: '#e4eaf4',
  muted: '#6b7fa3',
  accent: '#2d7aff',
  success: '#00c48c',
  warning: '#ffb020',
  danger: '#ff4757',
  purple: '#8b5cf6',
};

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const PageContainer = styled.div`
  min-height: 100vh;
  background: ${C.bg};
  padding: 120px 0 2rem 0;
  animation: ${fadeIn} 0.25s ease;

  @media (max-width: 768px) {
    padding-top: 100px;
  }
`;

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
`;

const PageTitle = styled.h1`
  color: ${C.text};
  margin-bottom: 0.5rem;
  text-align: center;
  font-size: 2rem;
  font-weight: 800;
`;

const PageSubtitle = styled.p`
  color: ${C.muted};
  text-align: center;
  margin-bottom: 2rem;
  font-size: 0.95rem;
`;

const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
  margin-bottom: 24px;
`;

const MetricCard = styled.div`
  background: ${C.card};
  border: 1px solid ${C.border};
  border-radius: 12px;
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  transition: transform 0.2s ease;

  &:hover { transform: translateY(-3px); }
`;

const MetricLabel = styled.div`
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: ${C.muted};
`;

const MetricValue = styled.div`
  font-size: 28px;
  font-weight: 800;
  color: ${({ $color }) => $color || C.text};
  line-height: 1;
`;

const MetricSub = styled.div`
  font-size: 11px;
  color: ${({ $positive }) => $positive === false ? C.danger : $positive ? C.success : C.muted};
`;

const SectionGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 20px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const SectionCard = styled.div`
  background: ${C.card};
  border: 1px solid ${C.border};
  border-radius: 12px;
  padding: 20px;
`;

const SectionTitle = styled.h3`
  color: ${C.text};
  font-size: 14px;
  font-weight: 700;
  margin: 0 0 16px 0;
`;

const TxCard = styled.div`
  background: ${C.surface};
  border: 1px solid ${C.border};
  border-left: 3px solid ${({ $color }) => $color || C.accent};
  border-radius: 10px;
  padding: 12px 14px;
  margin-bottom: 10px;
`;

const TxType = styled.div`
  font-weight: 600;
  color: ${C.text};
  font-size: 13px;
  margin-bottom: 2px;
`;

const TxAmount = styled.div`
  font-size: 16px;
  font-weight: 800;
  color: ${C.accent};
  margin-bottom: 2px;
`;

const TxMeta = styled.div`
  color: ${C.muted};
  font-size: 11px;
  margin-bottom: 6px;
`;

const StatusBadge = styled.span`
  display: inline-block;
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #fff;
  background: ${({ $status }) =>
    $status === 'completed' ? C.success :
    $status === 'processing' ? C.warning :
                               C.danger};
`;

const ExchangeCard = styled.div`
  background: ${C.surface};
  border: 1px solid ${C.border};
  border-radius: 10px;
  padding: 14px;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const ExchangeLeft = styled.div``;

const ExchangePair = styled.div`
  font-weight: 700;
  color: ${C.text};
  font-size: 14px;
`;

const ExchangeChange = styled.div`
  font-size: 11px;
  font-weight: 600;
  color: ${({ $positive }) => $positive ? C.success : C.danger};
  margin-top: 2px;
`;

const ExchangeRate = styled.div`
  font-size: 18px;
  font-weight: 800;
  color: ${C.accent};
`;

const ActionCard = styled.div`
  background: linear-gradient(135deg, ${C.accent}18, ${C.success}18);
  border: 1px solid ${C.border};
  border-radius: 10px;
  padding: 16px;
  text-align: center;
  margin-top: 12px;
`;

const ActionTitle = styled.h4`
  color: ${C.text};
  font-size: 13px;
  font-weight: 700;
  margin: 0 0 6px 0;
`;

const ActionDesc = styled.p`
  color: ${C.muted};
  font-size: 11px;
  margin: 0 0 12px 0;
  line-height: 1.5;
`;

const ActionBtn = styled.button`
  background: ${C.accent};
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 8px 20px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s ease;

  &:hover { background: #4d93ff; }
`;

const FintechPage = () => {
  const fintechMetrics = [
    { label: 'Total Volume', value: '$2.4M', sub: '+15% this month', positive: true },
    { label: 'Transactions', value: '8,945', sub: '+22%', positive: true },
    { label: 'Avg. Fee', value: '1.2%', sub: '-0.1%', positive: true },
    { label: 'Success Rate', value: '99.7%', sub: '+0.2%', positive: true },
  ];

  const recentTransactions = [
    { type: 'Crypto to Fiat', amount: '$12,450', details: 'BTC → USD · Rate: $43,250', time: '2 min ago', status: 'completed', color: C.success },
    { type: 'Bank Transfer', amount: '$5,670', details: 'ACH Transfer · Chase Bank', time: '5 min ago', status: 'processing', color: C.warning },
    { type: 'International Wire', amount: '$23,890', details: 'EUR → USD · Rate: 1.08', time: '12 min ago', status: 'completed', color: C.success },
    { type: 'Crypto Exchange', amount: '2.5 ETH', details: 'ETH → USDT · Rate: 1:2,650', time: '18 min ago', status: 'completed', color: C.success },
  ];

  const exchangeRates = [
    { pair: 'BTC/USD', rate: '$43,250', change: '+2.4%', positive: true },
    { pair: 'ETH/USD', rate: '$2,650', change: '+1.8%', positive: true },
    { pair: 'EUR/USD', rate: '1.08', change: '-0.3%', positive: false },
  ];

  return (
    <PageContainer>
      <Container>
        <PageTitle>Fintech Dashboard</PageTitle>
        <PageSubtitle>Financial transactions, crypto-to-fiat exchange, and payout management</PageSubtitle>

        <MetricsGrid>
          {fintechMetrics.map((m, i) => (
            <MetricCard key={i}>
              <MetricLabel>{m.label}</MetricLabel>
              <MetricValue $color={i === 0 ? C.success : i === 2 ? C.warning : C.text}>{m.value}</MetricValue>
              <MetricSub $positive={m.positive}>{m.sub}</MetricSub>
            </MetricCard>
          ))}
        </MetricsGrid>

        <SectionGrid>
          <SectionCard>
            <SectionTitle>📊 Recent Transactions</SectionTitle>
            {recentTransactions.map((tx, i) => (
              <TxCard key={i} $color={tx.color}>
                <TxType>{tx.type}</TxType>
                <TxAmount>{tx.amount}</TxAmount>
                <TxMeta>{tx.details} · {tx.time}</TxMeta>
                <StatusBadge $status={tx.status}>{tx.status}</StatusBadge>
              </TxCard>
            ))}
          </SectionCard>

          <SectionCard>
            <SectionTitle>💱 Crypto-to-Fiat Exchange</SectionTitle>
            {exchangeRates.map((ex, i) => (
              <ExchangeCard key={i}>
                <ExchangeLeft>
                  <ExchangePair>{ex.pair}</ExchangePair>
                  <ExchangeChange $positive={ex.positive}>{ex.change}</ExchangeChange>
                </ExchangeLeft>
                <ExchangeRate>{ex.rate}</ExchangeRate>
              </ExchangeCard>
            ))}
            <ActionCard>
              <ActionTitle>⚡ Instant Exchange</ActionTitle>
              <ActionDesc>Convert between cryptocurrencies and fiat currencies with competitive rates</ActionDesc>
              <ActionBtn>Start Exchange</ActionBtn>
            </ActionCard>

            <div style={{ marginTop: 16 }}>
              <SectionTitle>🔗 On-Chain Wallet</SectionTitle>
              <WalletPanel />
            </div>

            <div style={{ marginTop: 16 }}>
              <SectionTitle>💸 Affiliate Payouts</SectionTitle>
              <PayoutsPanel />
            </div>
          </SectionCard>
        </SectionGrid>
      </Container>
    </PageContainer>
  );
};

export default FintechPage;
