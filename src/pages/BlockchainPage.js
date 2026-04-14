import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import api from '../services/api';
import WalletPanel from '../components/WalletPanel';
import CommissionPanel from '../components/CommissionPanel';

const C = {
  bg:      '#060d1b',
  surface: '#0c1527',
  card:    '#121e34',
  border:  '#1a2d4d',
  text:    '#e4eaf4',
  muted:   '#6b7fa3',
  accent:  '#2d7aff',
  success: '#00c48c',
  warning: '#ffb020',
  danger:  '#ff4757',
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
  @media (max-width: 768px) { padding-top: 100px; }
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

const MainGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 20px;
  @media (max-width: 768px) { grid-template-columns: 1fr; }
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
  color: #fff;
  background: ${({ $status }) =>
    $status === 'active'  ? C.success :
    $status === 'pending' ? C.warning : C.danger};
`;

const EtherscanLink = styled.a`
  color: ${C.accent};
  font-size: 10px;
  text-decoration: none;
  margin-left: 8px;
  &:hover { text-decoration: underline; }
`;

const HealthBanner = styled.div`
  background: ${({ $ok }) => $ok ? C.success + '18' : C.warning + '18'};
  border: 1px solid ${({ $ok }) => $ok ? C.success : C.warning};
  border-radius: 10px;
  padding: 10px 16px;
  margin-bottom: 20px;
  font-size: 12px;
  color: ${({ $ok }) => $ok ? C.success : C.warning};
`;

const WALLET_ADDR    = process.env.REACT_APP_WALLET_CONTRACT_ADDRESS;
const COMMISSION_ADDR = process.env.REACT_APP_COMMISSION_CONTRACT_ADDRESS;

const BlockchainPage = () => {
  const [health, setHealth] = useState(null);

  useEffect(() => {
    api.get('/health').then(d => setHealth(d?.blockchain)).catch(() => {});
  }, []);

  const metrics = [
    { label: 'Active Contracts', value: '3',      sub: 'Deployed on Sepolia', positive: null },
    { label: 'Total Wallets',    value: '—',       sub: 'Live from contract',  positive: null },
    { label: 'Gas Used (ETH)',   value: '~0.05',   sub: 'Deployment cost',     positive: null },
    { label: 'Network',          value: 'Sepolia', sub: 'Chain ID 11155111',   positive: null },
  ];

  const contracts = [
    {
      name: 'KimuntuX Wallet',
      type: 'Payments',
      address: WALLET_ADDR,
      status: WALLET_ADDR ? 'active' : 'pending',
      color: C.success,
      desc: 'User wallet creation, ETH deposits, withdrawals, and transfers',
    },
    {
      name: 'KimuntuX Commission System',
      type: 'Affiliate',
      address: COMMISSION_ADDR,
      status: COMMISSION_ADDR ? 'active' : 'pending',
      color: C.accent,
      desc: 'Commission recording, approval, and affiliate payouts',
    },
  ];

  const isHealthy = health?.status === 'healthy';

  return (
    <PageContainer>
      <Container>
        <PageTitle>Blockchain Dashboard</PageTitle>
        <PageSubtitle>Smart contracts, on-chain wallets, and commission management</PageSubtitle>

        {health && (
          <HealthBanner $ok={isHealthy}>
            {isHealthy
              ? `🟢 Backend connected to Sepolia — Block #${health.latest_block?.toLocaleString()} · Gas ${health.gas_price_gwei} gwei · Platform balance ${health.platform_balance_eth} ETH`
              : `🟡 Blockchain backend: ${health.error || 'configure .env with contract addresses to connect'}`}
          </HealthBanner>
        )}

        <MetricsGrid>
          {metrics.map((m, i) => (
            <MetricCard key={i}>
              <MetricLabel>{m.label}</MetricLabel>
              <MetricValue $color={i === 3 ? C.accent : C.text}>{m.value}</MetricValue>
              <MetricSub $positive={m.positive}>{m.sub}</MetricSub>
            </MetricCard>
          ))}
        </MetricsGrid>

        <MainGrid>
          {/* Left — Wallet interaction */}
          <div>
            <WalletPanel />
          </div>

          {/* Right — Commission panel */}
          <div>
            <CommissionPanel />
          </div>
        </MainGrid>

        {/* Deployed contracts info */}
        <SectionCard>
          <SectionTitle>🔗 Deployed Contracts</SectionTitle>
          {contracts.map((c, i) => (
            <ContractCard key={i} $color={c.color}>
              <ContractName>
                {c.name}
                {c.address && (
                  <EtherscanLink
                    href={`https://sepolia.etherscan.io/address/${c.address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View on Etherscan ↗
                  </EtherscanLink>
                )}
              </ContractName>
              <ContractMeta>
                {c.address
                  ? `${c.address.slice(0, 10)}…${c.address.slice(-8)}`
                  : 'Not deployed — add address to .env.local'}
              </ContractMeta>
              <ContractMeta>{c.desc}</ContractMeta>
              <StatusBadge $status={c.status}>{c.status}</StatusBadge>
            </ContractCard>
          ))}

          {!WALLET_ADDR && !COMMISSION_ADDR && (
            <div style={{ color: C.muted, fontSize: 12, marginTop: 12, lineHeight: 1.6 }}>
              <strong style={{ color: C.warning }}>To deploy contracts:</strong>
              <ol style={{ paddingLeft: 16, marginTop: 6 }}>
                <li>Add your Alchemy RPC URL and private key to <code>KimuntuX_BlockchainIntegration/.env</code></li>
                <li>Run: <code>cd KimuntuX_BlockchainIntegration && npm install && npx hardhat run scripts/deploy-all.js --network sepolia</code></li>
                <li>Copy the deployed addresses to <code>.env.local</code> as <code>REACT_APP_WALLET_CONTRACT_ADDRESS</code> and <code>REACT_APP_COMMISSION_CONTRACT_ADDRESS</code></li>
                <li>Also add them to <code>backend/.env</code> as <code>WALLET_CONTRACT_ADDRESS</code> and <code>COMMISSION_CONTRACT_ADDRESS</code></li>
              </ol>
            </div>
          )}
        </SectionCard>
      </Container>
    </PageContainer>
  );
};

export default BlockchainPage;
