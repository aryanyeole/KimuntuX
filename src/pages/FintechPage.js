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

const TransactionCard = styled.div`
  background: linear-gradient(135deg, ${props => props.theme.colors.accent}10, ${props => props.theme.colors.primary}10);
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1rem;
`;

const TransactionType = styled.div`
  font-weight: 600;
  color: ${props => props.theme.colors.primary};
  margin-bottom: 0.5rem;
`;

const TransactionAmount = styled.div`
  font-size: 1.2rem;
  font-weight: 700;
  color: ${props => props.theme.colors.accent};
  margin-bottom: 0.5rem;
`;

const TransactionDetails = styled.div`
  color: ${props => props.theme.colors.text};
  opacity: 0.8;
  font-size: 0.9rem;
`;

const ExchangeCard = styled.div`
  background: linear-gradient(135deg, ${props => props.theme.colors.primary}15, ${props => props.theme.colors.accent}15);
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1rem;
`;

const ExchangePair = styled.div`
  font-weight: 600;
  color: ${props => props.theme.colors.primary};
  margin-bottom: 0.5rem;
`;

const ExchangeRate = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: ${props => props.theme.colors.accent};
  margin-bottom: 0.5rem;
`;

const ExchangeChange = styled.div`
  font-size: 0.9rem;
  color: ${props => props.positive ? '#00C896' : '#ff6b6b'};
`;

const ChartPlaceholder = styled.div`
  height: 200px;
  background: linear-gradient(135deg, ${props => props.theme.colors.primary}10, ${props => props.theme.colors.accent}10);
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => props.theme.colors.text};
  opacity: 0.8;
  font-size: 1.1rem;
  margin-bottom: 1rem;
`;

const FintechPage = () => {
  const theme = useTheme();

  const fintechMetrics = [
    { label: 'Total Volume', value: '$2.4M', change: '+15%' },
    { label: 'Transactions', value: '8,945', change: '+22%' },
    { label: 'Avg. Fee', value: '1.2%', change: '-0.1%' },
    { label: 'Success Rate', value: '99.7%', change: '+0.2%' }
  ];

  const recentTransactions = [
    {
      type: 'Crypto to Fiat',
      amount: '$12,450',
      details: 'BTC → USD | Rate: $43,250',
      time: '2 minutes ago',
      status: 'completed'
    },
    {
      type: 'Bank Transfer',
      amount: '$5,670',
      details: 'ACH Transfer | Chase Bank',
      time: '5 minutes ago',
      status: 'processing'
    },
    {
      type: 'International Wire',
      amount: '$23,890',
      details: 'EUR → USD | Rate: 1.08',
      time: '12 minutes ago',
      status: 'completed'
    },
    {
      type: 'Crypto Exchange',
      amount: '2.5 ETH',
      details: 'ETH → USDT | Rate: 1:2,650',
      time: '18 minutes ago',
      status: 'completed'
    }
  ];

  const exchangeRates = [
    {
      pair: 'BTC/USD',
      rate: '$43,250',
      change: '+2.4%',
      positive: true
    },
    {
      pair: 'ETH/USD',
      rate: '$2,650',
      change: '+1.8%',
      positive: true
    },
    {
      pair: 'EUR/USD',
      rate: '1.08',
      change: '-0.3%',
      positive: false
    }
  ];

  return (
    <PageContainer>
      <Container>
        <PageTitle>Fintech Dashboard</PageTitle>
        
        <MetricsGrid>
          {fintechMetrics.map((metric, index) => (
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
            <SectionTitle>Financial Transaction Analytics</SectionTitle>
            <ChartPlaceholder>
              📊 Transaction Volume Chart
              <br />
              <span style={{ fontSize: '0.9rem' }}>
                Real-time financial transaction monitoring and analytics
              </span>
            </ChartPlaceholder>
            
            <div style={{ marginTop: '1.5rem' }}>
              <h4 style={{ color: theme.colors.primary, marginBottom: '1rem' }}>Recent Transactions</h4>
              {recentTransactions.map((transaction, index) => (
                <TransactionCard key={index}>
                  <TransactionType>{transaction.type}</TransactionType>
                  <TransactionAmount>{transaction.amount}</TransactionAmount>
                  <TransactionDetails>
                    {transaction.details} | {transaction.time}
                  </TransactionDetails>
                  <div style={{ 
                    display: 'inline-block',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '20px',
                    fontSize: '0.8rem',
                    fontWeight: '500',
                    backgroundColor: transaction.status === 'completed' ? '#00C89620' : '#DAA52020',
                    color: transaction.status === 'completed' ? '#00C896' : '#DAA520',
                    marginTop: '0.5rem'
                  }}>
                    {transaction.status}
                  </div>
                </TransactionCard>
              ))}
            </div>
          </SectionCard>

          <SectionCard>
            <SectionTitle>Crypto-to-Fiat Exchange</SectionTitle>
            {exchangeRates.map((exchange, index) => (
              <ExchangeCard key={index}>
                <ExchangePair>{exchange.pair}</ExchangePair>
                <ExchangeRate>{exchange.rate}</ExchangeRate>
                <ExchangeChange positive={exchange.positive}>
                  {exchange.change}
                </ExchangeChange>
              </ExchangeCard>
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
                💱 Instant Exchange
              </h4>
              <p style={{ color: theme.colors.text, opacity: 0.8, fontSize: '0.9rem', marginBottom: '1rem' }}>
                Convert between cryptocurrencies and fiat currencies with competitive rates
              </p>
              <button className="btn-primary">Start Exchange</button>
            </div>
          </SectionCard>
        </SectionGrid>
      </Container>
    </PageContainer>
  );
};

export default FintechPage;
