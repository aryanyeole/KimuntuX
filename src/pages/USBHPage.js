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

const BrokerageCard = styled.div`
  background: linear-gradient(135deg, ${props => props.theme.colors.accent}10, ${props => props.theme.colors.primary}10);
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1rem;
`;

const BrokerageTitle = styled.div`
  font-weight: 600;
  color: ${props => props.theme.colors.primary};
  margin-bottom: 0.5rem;
`;

const BrokerageStats = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-top: 1rem;
`;

const StatItem = styled.div`
  text-align: center;
`;

const StatValue = styled.div`
  font-size: 1.2rem;
  font-weight: 700;
  color: ${props => props.theme.colors.accent};
`;

const StatLabel = styled.div`
  font-size: 0.8rem;
  color: ${props => props.theme.colors.text};
  opacity: 0.8;
`;

const TemplateCard = styled.div`
  background: linear-gradient(135deg, ${props => props.theme.colors.primary}15, ${props => props.theme.colors.accent}15);
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1rem;
`;

const TemplateTitle = styled.div`
  font-weight: 600;
  color: ${props => props.theme.colors.primary};
  margin-bottom: 0.5rem;
`;

const TemplateDescription = styled.div`
  color: ${props => props.theme.colors.text};
  opacity: 0.8;
  font-size: 0.9rem;
  margin-bottom: 1rem;
`;

const TemplateFeatures = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
`;

const FeatureTag = styled.span`
  background-color: ${props => props.theme.colors.primary}20;
  color: ${props => props.theme.colors.primary};
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
`;

const UnifiedInterface = styled.div`
  background: linear-gradient(135deg, ${props => props.theme.colors.accent}15, ${props => props.theme.colors.primary}15);
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 12px;
  padding: 2rem;
  text-align: center;
  margin-bottom: 1.5rem;
`;

const InterfaceIcon = styled.div`
  font-size: 3rem;
  margin-bottom: 1rem;
  color: ${props => props.theme.colors.primary};
`;

const InterfaceTitle = styled.h4`
  color: ${props => props.theme.colors.primary};
  margin-bottom: 1rem;
`;

const InterfaceDescription = styled.p`
  color: ${props => props.theme.colors.text};
  opacity: 0.8;
  margin-bottom: 1.5rem;
`;

const USBHPage = () => {
  const theme = useTheme();

  const usbhMetrics = [
    { label: 'Active Brokers', value: '89', change: '+12' },
    { label: 'Total Contracts', value: '1,247', change: '+156' },
    { label: 'Success Rate', value: '94.2%', change: '+2.1%' },
    { label: 'AI Efficiency', value: '87%', change: '+5%' }
  ];

  const brokerageChannels = [
    {
      name: 'Insurance Brokerage',
      deals: 45,
      revenue: '$2.4M',
      status: 'Active'
    },
    {
      name: 'Real Estate',
      deals: 23,
      revenue: '$1.8M',
      status: 'Active'
    },
    {
      name: 'Financial Services',
      deals: 34,
      revenue: '$3.2M',
      status: 'Growing'
    },
    {
      name: 'Technology Services',
      deals: 18,
      revenue: '$890K',
      status: 'Active'
    }
  ];

  const contractTemplates = [
    {
      name: 'Standard Insurance Agreement',
      description: 'Comprehensive insurance brokerage contract with automated risk assessment',
      features: ['Risk Analysis', 'Premium Calculation', 'Claims Processing', 'Renewal Management']
    },
    {
      name: 'Real Estate Brokerage',
      description: 'Property transaction management with smart contract integration',
      features: ['Property Valuation', 'Transaction Tracking', 'Document Management', 'Commission Split']
    },
    {
      name: 'Financial Advisory',
      description: 'Investment advisory contract with compliance monitoring',
      features: ['Portfolio Management', 'Compliance Check', 'Performance Tracking', 'Client Reporting']
    }
  ];

  return (
    <PageContainer>
      <Container>
        <PageTitle>Unified Smart Business Hub (USBH)</PageTitle>
        
        <MetricsGrid>
          {usbhMetrics.map((metric, index) => (
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
            <SectionTitle>Unified AI Brokerage Interface</SectionTitle>
            <UnifiedInterface>
              <InterfaceIcon>🤖</InterfaceIcon>
              <InterfaceTitle>AI-Powered Brokerage Hub</InterfaceTitle>
              <InterfaceDescription>
                Centralized platform connecting all brokerage channels with intelligent automation, 
                smart contract management, and real-time analytics.
              </InterfaceDescription>
              <button className="btn-primary">Launch Interface</button>
            </UnifiedInterface>
            
            <SectionTitle>Brokerage Channels</SectionTitle>
            {brokerageChannels.map((channel, index) => (
              <BrokerageCard key={index}>
                <BrokerageTitle>{channel.name}</BrokerageTitle>
                <div style={{ 
                  display: 'inline-block',
                  backgroundColor: channel.status === 'Active' ? '#00C89620' : '#DAA52020',
                  color: channel.status === 'Active' ? '#00C896' : '#DAA520',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '20px',
                  fontSize: '0.8rem',
                  fontWeight: '500',
                  marginBottom: '1rem'
                }}>
                  {channel.status}
                </div>
                <BrokerageStats>
                  <StatItem>
                    <StatValue>{channel.deals}</StatValue>
                    <StatLabel>Deals</StatLabel>
                  </StatItem>
                  <StatItem>
                    <StatValue>{channel.revenue}</StatValue>
                    <StatLabel>Revenue</StatLabel>
                  </StatItem>
                </BrokerageStats>
              </BrokerageCard>
            ))}
          </SectionCard>

          <SectionCard>
            <SectionTitle>Smart Contract Templates</SectionTitle>
            {contractTemplates.map((template, index) => (
              <TemplateCard key={index}>
                <TemplateTitle>{template.name}</TemplateTitle>
                <TemplateDescription>{template.description}</TemplateDescription>
                <TemplateFeatures>
                  {template.features.map((feature, idx) => (
                    <FeatureTag key={idx}>{feature}</FeatureTag>
                  ))}
                </TemplateFeatures>
                <button className="btn-secondary" style={{ width: '100%' }}>
                  Use Template
                </button>
              </TemplateCard>
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
                ⚡ Smart Automation
              </h4>
              <p style={{ color: theme.colors.text, opacity: 0.8, fontSize: '0.9rem', marginBottom: '1rem' }}>
                AI-powered contract generation, automated compliance checking, and intelligent risk assessment
              </p>
              <button className="btn-primary">Create Custom Contract</button>
            </div>
          </SectionCard>
        </SectionGrid>
      </Container>
    </PageContainer>
  );
};

export default USBHPage;
