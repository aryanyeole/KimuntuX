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

const TrendCard = styled.div`
  background: linear-gradient(135deg, ${props => props.theme.colors.accent}10, ${props => props.theme.colors.primary}10);
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1rem;
`;

const TrendTitle = styled.div`
  font-weight: 600;
  color: ${props => props.theme.colors.primary};
  margin-bottom: 0.5rem;
`;

const TrendValue = styled.div`
  font-size: 1.2rem;
  font-weight: 700;
  color: ${props => props.theme.colors.accent};
  margin-bottom: 0.5rem;
`;

const TrendDescription = styled.div`
  color: ${props => props.theme.colors.text};
  opacity: 0.8;
  font-size: 0.9rem;
`;

const PersonaCard = styled.div`
  background: linear-gradient(135deg, ${props => props.theme.colors.primary}15, ${props => props.theme.colors.accent}15);
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1rem;
`;

const PersonaName = styled.div`
  font-weight: 600;
  color: ${props => props.theme.colors.primary};
  margin-bottom: 0.5rem;
`;

const PersonaStats = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-top: 1rem;
`;

const StatItem = styled.div`
  text-align: center;
`;

const StatValue = styled.div`
  font-size: 1.1rem;
  font-weight: 700;
  color: ${props => props.theme.colors.accent};
`;

const StatLabel = styled.div`
  font-size: 0.8rem;
  color: ${props => props.theme.colors.text};
  opacity: 0.8;
`;

const ROIMatrix = styled.div`
  background: linear-gradient(135deg, ${props => props.theme.colors.primary}10, ${props => props.theme.colors.accent}10);
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1rem;
`;

const ROITitle = styled.div`
  font-weight: 600;
  color: ${props => props.theme.colors.primary};
  margin-bottom: 0.5rem;
`;

const ROIMetrics = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-top: 1rem;
`;

const CommerceIntelligencePage = () => {
  const theme = useTheme();

  const intelligenceMetrics = [
    { label: 'Market Share', value: '12.4%', change: '+2.1%' },
    { label: 'Customer Growth', value: '+23%', change: '+5%' },
    { label: 'Revenue per User', value: '$156', change: '+12%' },
    { label: 'Market Cap', value: '$2.4B', change: '+18%' }
  ];

  const marketTrends = [
    {
      title: 'E-commerce Growth',
      value: '+34%',
      description: 'Online shopping continues to surge with mobile commerce leading the trend'
    },
    {
      title: 'AI Adoption',
      value: '+67%',
      description: 'Businesses are rapidly adopting AI-powered solutions for customer engagement'
    },
    {
      title: 'Blockchain Integration',
      value: '+45%',
      description: 'Smart contracts and tokenization gaining traction in traditional markets'
    },
    {
      title: 'Sustainable Commerce',
      value: '+28%',
      description: 'Consumers increasingly prefer eco-friendly and sustainable business practices'
    }
  ];

  const buyerPersonas = [
    {
      name: 'Tech-Savvy Millennials',
      percentage: 35,
      avgSpend: '$89',
      preferredChannel: 'Mobile App',
      topCategory: 'Electronics'
    },
    {
      name: 'Professional Gen-X',
      percentage: 28,
      avgSpend: '$156',
      preferredChannel: 'Desktop',
      topCategory: 'B2B Services'
    },
    {
      name: 'Digital Natives (Gen-Z)',
      percentage: 22,
      avgSpend: '$67',
      preferredChannel: 'Social Media',
      topCategory: 'Lifestyle'
    },
    {
      name: 'Enterprise Buyers',
      percentage: 15,
      avgSpend: '$2,450',
      preferredChannel: 'Direct Sales',
      topCategory: 'Enterprise Solutions'
    }
  ];

  const roiPerformance = [
    {
      title: 'Email Marketing',
      roi: '4,200%',
      investment: '$5,000',
      revenue: '$215,000'
    },
    {
      title: 'Social Media Ads',
      roi: '3,800%',
      investment: '$8,000',
      revenue: '$312,000'
    },
    {
      title: 'Content Marketing',
      roi: '2,900%',
      investment: '$12,000',
      revenue: '$360,000'
    }
  ];

  return (
    <PageContainer>
      <Container>
        <PageTitle>Commerce Intelligence</PageTitle>
        
        <MetricsGrid>
          {intelligenceMetrics.map((metric, index) => (
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
            <SectionTitle>Market Trend Analysis</SectionTitle>
            {marketTrends.map((trend, index) => (
              <TrendCard key={index}>
                <TrendTitle>{trend.title}</TrendTitle>
                <TrendValue>{trend.value}</TrendValue>
                <TrendDescription>{trend.description}</TrendDescription>
              </TrendCard>
            ))}
          </SectionCard>

          <SectionCard>
            <SectionTitle>Buyer Persona Tracking</SectionTitle>
            {buyerPersonas.map((persona, index) => (
              <PersonaCard key={index}>
                <PersonaName>{persona.name}</PersonaName>
                <div style={{ color: theme.colors.accent, fontSize: '1.2rem', fontWeight: '700', marginBottom: '0.5rem' }}>
                  {persona.percentage}% of customers
                </div>
                <PersonaStats>
                  <StatItem>
                    <StatValue>{persona.avgSpend}</StatValue>
                    <StatLabel>Avg Spend</StatLabel>
                  </StatItem>
                  <StatItem>
                    <StatValue>{persona.preferredChannel}</StatValue>
                    <StatLabel>Top Channel</StatLabel>
                  </StatItem>
                </PersonaStats>
                <div style={{ fontSize: '0.9rem', color: theme.colors.text, opacity: 0.8, marginTop: '0.5rem' }}>
                  Top Category: {persona.topCategory}
                </div>
              </PersonaCard>
            ))}
          </SectionCard>
        </SectionGrid>

        <SectionCard>
          <SectionTitle>ROI Performance Matrix</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
            {roiPerformance.map((roi, index) => (
              <ROIMatrix key={index}>
                <ROITitle>{roi.title}</ROITitle>
                <div style={{ color: theme.colors.accent, fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.5rem' }}>
                  {roi.roi} ROI
                </div>
                <ROIMetrics>
                  <StatItem>
                    <StatValue>{roi.investment}</StatValue>
                    <StatLabel>Investment</StatLabel>
                  </StatItem>
                  <StatItem>
                    <StatValue>{roi.revenue}</StatValue>
                    <StatLabel>Revenue</StatLabel>
                  </StatItem>
                  <StatItem>
                    <StatValue>+{((parseFloat(roi.revenue.replace(/[,$]/g, '')) / parseFloat(roi.investment.replace(/[,$]/g, '')) - 1) * 100).toFixed(0)}%</StatValue>
                    <StatLabel>Growth</StatLabel>
                  </StatItem>
                </ROIMetrics>
              </ROIMatrix>
            ))}
          </div>
        </SectionCard>
      </Container>
    </PageContainer>
  );
};

export default CommerceIntelligencePage;
