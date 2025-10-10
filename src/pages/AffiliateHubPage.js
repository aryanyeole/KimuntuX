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

const CampaignCard = styled.div`
  background: linear-gradient(135deg, ${props => props.theme.colors.accent}10, ${props => props.theme.colors.primary}10);
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1rem;
`;

const CampaignName = styled.div`
  font-weight: 600;
  color: ${props => props.theme.colors.primary};
  margin-bottom: 0.5rem;
`;

const CampaignStats = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
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
`;

const OptimizerCard = styled.div`
  background: linear-gradient(135deg, ${props => props.theme.colors.primary}15, ${props => props.theme.colors.accent}15);
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1rem;
`;

const OptimizerTitle = styled.div`
  font-weight: 600;
  color: ${props => props.theme.colors.primary};
  margin-bottom: 0.5rem;
`;

const OptimizerDescription = styled.div`
  color: ${props => props.theme.colors.text};
  opacity: 0.8;
  font-size: 0.9rem;
  margin-bottom: 1rem;
`;

const OptimizerButton = styled.button`
  background-color: ${props => props.theme.colors.primary};
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: #00B085;
  }
`;

const AffiliateHubPage = () => {
  const theme = useTheme();

  const affiliateMetrics = [
    { label: 'Total Earnings', value: '$12,450', change: '+25%' },
    { label: 'Active Campaigns', value: '8', change: '+2' },
    { label: 'Conversion Rate', value: '3.2%', change: '+0.5%' },
    { label: 'Total Clicks', value: '45.2K', change: '+18%' }
  ];

  const campaigns = [
    {
      name: 'Tech Gadgets Campaign',
      earnings: '$2,340',
      conversions: 156,
      clicks: 4890,
      ctr: '3.2%'
    },
    {
      name: 'Fashion & Lifestyle',
      earnings: '$1,890',
      conversions: 94,
      clicks: 3120,
      ctr: '3.0%'
    },
    {
      name: 'Home & Garden',
      earnings: '$1,650',
      conversions: 78,
      clicks: 2890,
      ctr: '2.7%'
    }
  ];

  const aiOptimizations = [
    {
      title: 'Peak Time Optimization',
      description: 'Your campaigns perform 40% better between 2-4 PM. Consider increasing bids during this window.',
      action: 'Apply Optimization'
    },
    {
      title: 'Audience Expansion',
      description: 'AI suggests targeting users aged 25-35 for 23% higher conversion rates.',
      action: 'Update Targeting'
    },
    {
      title: 'Content Enhancement',
      description: 'Adding video content to your campaigns could increase engagement by 35%.',
      action: 'Create Video Ads'
    }
  ];

  return (
    <PageContainer>
      <Container>
        <PageTitle>Affiliate Hub</PageTitle>
        
        <MetricsGrid>
          {affiliateMetrics.map((metric, index) => (
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
            <SectionTitle>Campaign Earnings</SectionTitle>
            {campaigns.map((campaign, index) => (
              <CampaignCard key={index}>
                <CampaignName>{campaign.name}</CampaignName>
                <div style={{ color: theme.colors.accent, fontSize: '1.2rem', fontWeight: '700' }}>
                  {campaign.earnings}
                </div>
                <CampaignStats>
                  <StatItem>
                    <StatValue>{campaign.conversions}</StatValue>
                    <StatLabel>Conversions</StatLabel>
                  </StatItem>
                  <StatItem>
                    <StatValue>{campaign.clicks}</StatValue>
                    <StatLabel>Clicks</StatLabel>
                  </StatItem>
                  <StatItem>
                    <StatValue>{campaign.ctr}</StatValue>
                    <StatLabel>CTR</StatLabel>
                  </StatItem>
                </CampaignStats>
              </CampaignCard>
            ))}
          </SectionCard>

          <SectionCard>
            <SectionTitle>Conversion Tracking</SectionTitle>
            <ChartPlaceholder>
              📊 Conversion Funnel Chart
              <br />
              <span style={{ fontSize: '0.9rem' }}>Visual representation of conversion metrics</span>
            </ChartPlaceholder>
            
            <div style={{ marginTop: '1.5rem' }}>
              <SectionTitle>AI Campaign Optimizer</SectionTitle>
              {aiOptimizations.map((optimization, index) => (
                <OptimizerCard key={index}>
                  <OptimizerTitle>{optimization.title}</OptimizerTitle>
                  <OptimizerDescription>{optimization.description}</OptimizerDescription>
                  <OptimizerButton>{optimization.action}</OptimizerButton>
                </OptimizerCard>
              ))}
            </div>
          </SectionCard>
        </SectionGrid>
      </Container>
    </PageContainer>
  );
};

export default AffiliateHubPage;
