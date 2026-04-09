import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { useTheme } from '../contexts/ThemeContext';
import api from '../services/api';

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
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ContractCard = styled.div`
  background: ${C.surface};
  border: 1px solid ${C.border};
  border-left: 3px solid ${({ $color }) => $color || C.accent};
  border-radius: 10px;
  padding: 14px;
  margin-bottom: 10px;
`;

const ContractName = styled.div`
  font-weight: 600;
  color: ${C.text};
  font-size: 13px;
  margin-bottom: 4px;
`;

const ContractMeta = styled.div`
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
    $status === 'active'  ? C.success :
    $status === 'pending' ? C.warning :
                            C.danger};
`;

const AssetCard = styled.div`
  background: ${C.surface};
  border: 1px solid ${C.border};
  border-radius: 10px;
  padding: 14px;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const AssetLeft = styled.div``;

const AssetName = styled.div`
  font-weight: 600;
  color: ${C.text};
  font-size: 13px;
  margin-bottom: 2px;
`;

const AssetType = styled.div`
  font-size: 11px;
  color: ${C.muted};
`;

const AssetRight = styled.div`
  text-align: right;
`;

const AssetValue = styled.div`
  font-size: 16px;
  font-weight: 800;
  color: ${C.accent};
`;

const AssetChange = styled.div`
  font-size: 11px;
  font-weight: 600;
  color: ${({ $positive }) => $positive ? C.success : C.danger};
`;

const ActionCard = styled.div`
  background: linear-gradient(135deg, ${C.accent}18, ${C.purple}18);
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

const HealthBanner = styled.div`
  background: ${({ $ok }) => $ok ? C.success + '18' : C.warning + '18'};
  border: 1px solid ${({ $ok }) => $ok ? C.success : C.warning};
  border-radius: 10px;
  padding: 10px 16px;
  margin-bottom: 20px;
  font-size: 12px;
  color: ${({ $ok }) => $ok ? C.success : C.warning};
  display: flex;
  align-items: center;
  gap: 8px;
`;

const BlockchainPage = () => {
  const [health, setHealth] = useState(null);

  useEffect(() => {
    api.get('/health').then(data => setHealth(data?.blockchain)).catch(() => {});
  }, []);

  const blockchainMetrics = [
    { label: 'Active Contracts', value: '156', sub: '+12 this week', positive: true },
    { label: 'Total Transactions', value: '45.2K', sub: '+18%', positive: true },
    { label: 'Gas Used (ETH)', value: '2.34', sub: '-5%', positive: false },
    { label: 'Block Height', value: '18.5M', sub: '+1.2K blocks', positive: true },
  ];

  const smartContracts = [
    { name: 'KimuntuX Commission System', type: 'Affiliate', status: 'active', value: '$2.4M', participants: 1247, color: C.success },
    { name: 'KimuntuX Wallet', type: 'Payments', status: 'active', value: '$890K', participants: 89, color: C.accent },
    { name: 'Payment Escrow', type: 'Escrow', status: 'pending', value: '$156K', participants: 234, color: C.warning },
  ];

  const tokenizedAssets = [
    { name: 'Real Estate Token #001', value: '$45,000', change: '+12.5%', positive: true, type: 'Property' },
    { name: 'Art Collection Token', value: '$89,000', change: '+8.3%', positive: true, type: 'Collectible' },
    { name: 'Commodity Futures', value: '$23,500', change: '-2.1%', positive: false, type: 'Commodity' },
  ];

  const isHealthy = health?.status === 'healthy';

  return (
    <PageContainer>
      <Container>
        <PageTitle>Blockchain Dashboard</PageTitle>
        <PageSubtitle>Smart contracts, tokenized assets, and on-chain analytics</PageSubtitle>

        {health && (
          <HealthBanner $ok={isHealthy}>
            {isHealthy ? '🟢' : '🟡'}
            {isHealthy
              ? `Connected to Sepolia — Block #${health.latest_block?.toLocaleString()} · Gas ${health.gas_price_gwei} gwei · Balance ${health.platform_balance_eth} ETH`
              : `Blockchain: ${health.error || 'unavailable — configure .env to connect'}`}
          </HealthBanner>
        )}

        <MetricsGrid>
          {blockchainMetrics.map((m, i) => (
            <MetricCard key={i}>
              <MetricLabel>{m.label}</MetricLabel>
              <MetricValue $color={i === 0 ? C.accent : i === 2 ? C.warning : C.text}>{m.value}</MetricValue>
              <MetricSub $positive={m.positive}>{m.sub}</MetricSub>
            </MetricCard>
          ))}
        </MetricsGrid>

        <SectionGrid>
          <SectionCard>
            <SectionTitle>🔗 Smart Contracts</SectionTitle>
            {smartContracts.map((c, i) => (
              <ContractCard key={i} $color={c.color}>
                <ContractName>{c.name}</ContractName>
                <ContractMeta>Type: {c.type} · Value: {c.value} · {c.participants} participants</ContractMeta>
                <StatusBadge $status={c.status}>{c.status}</StatusBadge>
              </ContractCard>
            ))}
            <ActionCard>
              <ActionTitle>🚀 Deploy New Contract</ActionTitle>
              <ActionDesc>AI-powered smart contract generator for custom business needs</ActionDesc>
              <ActionBtn>Create Contract</ActionBtn>
            </ActionCard>
          </SectionCard>

          <SectionCard>
            <SectionTitle>💎 Tokenized Assets</SectionTitle>
            {tokenizedAssets.map((a, i) => (
              <AssetCard key={i}>
                <AssetLeft>
                  <AssetName>{a.name}</AssetName>
                  <AssetType>{a.type}</AssetType>
                </AssetLeft>
                <AssetRight>
                  <AssetValue>{a.value}</AssetValue>
                  <AssetChange $positive={a.positive}>{a.change}</AssetChange>
                </AssetRight>
              </AssetCard>
            ))}
            <ActionCard>
              <ActionTitle>📊 Asset Management</ActionTitle>
              <ActionDesc>Track, manage, and trade your tokenized assets with real-time blockchain analytics</ActionDesc>
            </ActionCard>
          </SectionCard>
        </SectionGrid>
      </Container>
    </PageContainer>
  );
};

export default BlockchainPage;
