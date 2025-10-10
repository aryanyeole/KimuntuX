import React, { useState } from 'react';
import styled from 'styled-components';
import { useTheme } from '../contexts/ThemeContext';

const PageContainer = styled.div`
  min-height: 100vh;
  background-color: ${props => props.theme.colors.background};
  padding: 2rem 0;
`;

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
`;

const PageTitle = styled.h1`
  color: ${props => props.theme.colors.text};
  margin-bottom: 2rem;
  text-align: center;
`;

const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const MetricCard = styled.div`
  background: linear-gradient(135deg, ${props => props.theme.colors.primary}15, ${props => props.theme.colors.accent}15);
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 12px;
  padding: 1.5rem;
  text-align: center;
  transition: transform 0.3s ease;

  &:hover {
    transform: translateY(-4px);
  }
`;

const MetricValue = styled.div`
  font-size: 2rem;
  font-weight: 700;
  color: ${props => props.theme.colors.primary};
  margin-bottom: 0.5rem;
`;

const MetricLabel = styled.div`
  color: ${props => props.theme.colors.text};
  opacity: 0.8;
  font-size: 0.9rem;
`;

const SectionGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  margin-bottom: 2rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const SectionCard = styled.div`
  background-color: ${props => props.theme.colors.cardBackground};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 12px;
  padding: 1.5rem;
`;

const SectionTitle = styled.h3`
  color: ${props => props.theme.colors.primary};
  margin-bottom: 1rem;
`;

const ContractCard = styled.div`
  background: linear-gradient(135deg, ${props => props.theme.colors.accent}10, ${props => props.theme.colors.primary}10);
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1rem;
`;

const ContractName = styled.div`
  font-weight: 600;
  color: ${props => props.theme.colors.primary};
  margin-bottom: 0.5rem;
`;

const ContractDetails = styled.div`
  color: ${props => props.theme.colors.text};
  opacity: 0.8;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
`;

const ContractStatus = styled.div`
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;
  background-color: ${props => props.status === 'active' ? '#00C89620' : props.status === 'pending' ? '#DAA52020' : '#ff6b6b20'};
  color: ${props => props.status === 'active' ? '#00C896' : props.status === 'pending' ? '#DAA520' : '#ff6b6b'};
`;

const AssetCard = styled.div`
  background: linear-gradient(135deg, ${props => props.theme.colors.primary}15, ${props => props.theme.colors.accent}15);
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1rem;
`;

const AssetName = styled.div`
  font-weight: 600;
  color: ${props => props.theme.colors.primary};
  margin-bottom: 0.5rem;
`;

const AssetValue = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: ${props => props.theme.colors.accent};
  margin-bottom: 0.5rem;
`;

const AssetChange = styled.div`
  font-size: 0.9rem;
  color: ${props => props.positive ? '#00C896' : '#ff6b6b'};
`;

const BlockchainPage = () => {
  const theme = useTheme();

  const blockchainMetrics = [
    { label: 'Active Contracts', value: '156', change: '+12' },
    { label: 'Total Transactions', value: '45.2K', change: '+18%' },
    { label: 'Gas Used (ETH)', value: '2.34', change: '-5%' },
    { label: 'Block Height', value: '18.5M', change: '+1.2K' }
  ];

  const smartContracts = [
    {
      name: 'Insurance Pool Contract',
      type: 'DeFi',
      status: 'active',
      value: '$2.4M',
      participants: 1247
    },
    {
      name: 'Brokerage Agreement',
      type: 'B2B',
      status: 'pending',
      value: '$890K',
      participants: 89
    },
    {
      name: 'Tokenized Asset',
      type: 'NFT',
      status: 'active',
      value: '$156K',
      participants: 234
    }
  ];

  const tokenizedAssets = [
    {
      name: 'Real Estate Token #001',
      value: '$45,000',
      change: '+12.5%',
      positive: true,
      type: 'Property'
    },
    {
      name: 'Art Collection Token',
      value: '$89,000',
      change: '+8.3%',
      positive: true,
      type: 'Collectible'
    },
    {
      name: 'Commodity Futures',
      value: '$23,500',
      change: '-2.1%',
      positive: false,
      type: 'Commodity'
    }
  ];

  return (
    <PageContainer>
      <Container>
        <PageTitle>Blockchain Dashboard</PageTitle>
        
        <MetricsGrid>
          {blockchainMetrics.map((metric, index) => (
            <MetricCard key={index}>
              <MetricValue>{metric.value}</MetricValue>
              <MetricLabel>{metric.label}</MetricLabel>
              <div style={{ color: theme.colors.accent, fontSize: '0.8rem', marginTop: '0.5rem' }}>
                {metric.change}
              </div>
            </MetricCard>
          ))}
        </MetricsGrid>

        <SectionGrid>
          <SectionCard>
            <SectionTitle>Smart Contracts</SectionTitle>
            {smartContracts.map((contract, index) => (
              <ContractCard key={index}>
                <ContractName>{contract.name}</ContractName>
                <ContractDetails>
                  Type: {contract.type} | Value: {contract.value}
                </ContractDetails>
                <ContractDetails>
                  Participants: {contract.participants}
                </ContractDetails>
                <ContractStatus status={contract.status}>{contract.status}</ContractStatus>
              </ContractCard>
            ))}
            
            <div style={{ 
              background: 'linear-gradient(135deg, #00C89615, #DAA52015)', 
              border: `1px solid ${theme.colors.border}`, 
              borderRadius: '12px', 
              padding: '1.5rem',
              textAlign: 'center',
              marginTop: '1rem'
            }}>
              <h4 style={{ color: theme.colors.primary, marginBottom: '0.5rem' }}>
                🔗 Deploy New Contract
              </h4>
              <p style={{ color: theme.colors.text, opacity: 0.8, fontSize: '0.9rem', marginBottom: '1rem' }}>
                AI-powered smart contract generator for custom business needs
              </p>
              <button className="btn-primary">Create Contract</button>
            </div>
          </SectionCard>

          <SectionCard>
            <SectionTitle>Tokenized Assets</SectionTitle>
            {tokenizedAssets.map((asset, index) => (
              <AssetCard key={index}>
                <AssetName>{asset.name}</AssetName>
                <AssetValue>{asset.value}</AssetValue>
                <AssetChange positive={asset.positive}>
                  {asset.change} | {asset.type}
                </AssetChange>
              </AssetCard>
            ))}
            
            <div style={{ 
              background: 'linear-gradient(135deg, #DAA52015, #00C89615)', 
              border: `1px solid ${theme.colors.border}`, 
              borderRadius: '12px', 
              padding: '1.5rem',
              textAlign: 'center',
              marginTop: '1rem'
            }}>
              <h4 style={{ color: theme.colors.primary, marginBottom: '0.5rem' }}>
                💎 Asset Management
              </h4>
              <p style={{ color: theme.colors.text, opacity: 0.8, fontSize: '0.9rem' }}>
                Track, manage, and trade your tokenized assets with real-time blockchain analytics
              </p>
            </div>
          </SectionCard>
        </SectionGrid>
      </Container>
    </PageContainer>
  );
};

export default BlockchainPage;
