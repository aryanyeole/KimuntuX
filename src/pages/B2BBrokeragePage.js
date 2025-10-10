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

const QuoteCard = styled.div`
  background: linear-gradient(135deg, ${props => props.theme.colors.accent}10, ${props => props.theme.colors.primary}10);
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1rem;
`;

const QuoteProvider = styled.div`
  font-weight: 600;
  color: ${props => props.theme.colors.primary};
  margin-bottom: 0.5rem;
`;

const QuotePrice = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: ${props => props.theme.colors.accent};
  margin-bottom: 0.5rem;
`;

const QuoteDetails = styled.div`
  color: ${props => props.theme.colors.text};
  opacity: 0.8;
  font-size: 0.9rem;
`;

const ContractTemplate = styled.div`
  background-color: ${props => props.theme.colors.cardBackground};
  border: 2px dashed ${props => props.theme.colors.border};
  border-radius: 12px;
  padding: 2rem;
  text-align: center;
  margin-top: 1rem;
`;

const TemplateIcon = styled.div`
  font-size: 3rem;
  margin-bottom: 1rem;
  color: ${props => props.theme.colors.primary};
`;

const B2BBrokeragePage = () => {
  const theme = useTheme();

  const brokerMetrics = [
    { label: 'Active Brokers', value: '156', change: '+8%' },
    { label: 'Pending Quotes', value: '23', change: '+12%' },
    { label: 'Avg. Deal Size', value: '$45K', change: '+5%' },
    { label: 'Success Rate', value: '78%', change: '+3%' }
  ];

  const quoteComparison = [
    {
      provider: 'Global Insurance Co.',
      price: '$2,450/month',
      coverage: 'Full Coverage',
      features: ['24/7 Support', 'Global Coverage', 'Quick Claims'],
      rating: 4.8
    },
    {
      provider: 'Premier Brokerage',
      price: '$2,680/month',
      coverage: 'Premium Plus',
      features: ['Dedicated Manager', 'Custom Solutions', 'Risk Assessment'],
      rating: 4.9
    },
    {
      provider: 'SecureCorp Ltd.',
      price: '$2,320/month',
      coverage: 'Standard Plus',
      features: ['Online Portal', 'Mobile App', 'Flexible Terms'],
      rating: 4.6
    }
  ];

  const contractTemplates = [
    { name: 'Standard B2B Contract', type: 'Insurance', complexity: 'Medium' },
    { name: 'Premium Partnership Agreement', type: 'Partnership', complexity: 'High' },
    { name: 'Quick Service Contract', type: 'Service', complexity: 'Low' }
  ];

  return (
    <PageContainer>
      <Container>
        <PageTitle>B2B Brokerage Portal</PageTitle>
        
        <MetricsGrid>
          {brokerMetrics.map((metric, index) => (
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
            <SectionTitle>Quote Comparison Tool</SectionTitle>
            {quoteComparison.map((quote, index) => (
              <QuoteCard key={index}>
                <QuoteProvider>{quote.provider}</QuoteProvider>
                <QuotePrice>{quote.price}</QuotePrice>
                <QuoteDetails>
                  <div>Coverage: {quote.coverage}</div>
                  <div>Rating: ⭐ {quote.rating}/5</div>
                  <div style={{ marginTop: '0.5rem' }}>
                    Features: {quote.features.join(', ')}
                  </div>
                </QuoteDetails>
              </QuoteCard>
            ))}
          </SectionCard>

          <SectionCard>
            <SectionTitle>Smart Contract Templates</SectionTitle>
            <p style={{ color: theme.colors.text, opacity: 0.8, marginBottom: '1rem' }}>
              AI-powered contract generation and management
            </p>
            
            {contractTemplates.map((template, index) => (
              <div key={index} style={{ 
                padding: '1rem', 
                border: `1px solid ${theme.colors.border}`, 
                borderRadius: '8px', 
                marginBottom: '0.5rem',
                backgroundColor: theme.colors.cardBackground
              }}>
                <div style={{ fontWeight: '600', color: theme.colors.primary, marginBottom: '0.25rem' }}>
                  {template.name}
                </div>
                <div style={{ fontSize: '0.9rem', color: theme.colors.text, opacity: 0.8 }}>
                  Type: {template.type} | Complexity: {template.complexity}
                </div>
              </div>
            ))}

            <ContractTemplate>
              <TemplateIcon>📄</TemplateIcon>
              <h4 style={{ color: theme.colors.primary, marginBottom: '0.5rem' }}>
                Generate Custom Contract
              </h4>
              <p style={{ color: theme.colors.text, opacity: 0.8, marginBottom: '1rem' }}>
                AI-powered contract builder for unique business needs
              </p>
              <button className="btn-primary">
                Start Building
              </button>
            </ContractTemplate>
          </SectionCard>
        </SectionGrid>
      </Container>
    </PageContainer>
  );
};

export default B2BBrokeragePage;
