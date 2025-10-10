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

const FunnelChart = styled.div`
  height: 300px;
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

const InsightCard = styled.div`
  background: linear-gradient(135deg, ${props => props.theme.colors.accent}10, ${props => props.theme.colors.primary}10);
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1rem;
`;

const InsightTitle = styled.div`
  font-weight: 600;
  color: ${props => props.theme.colors.primary};
  margin-bottom: 0.5rem;
`;

const InsightDescription = styled.div`
  color: ${props => props.theme.colors.text};
  opacity: 0.8;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
`;

const InsightConfidence = styled.div`
  font-size: 0.8rem;
  color: ${props => props.theme.colors.accent};
  font-weight: 500;
`;

const RecommendationCard = styled.div`
  background: linear-gradient(135deg, ${props => props.theme.colors.primary}15, ${props => props.theme.colors.accent}15);
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1rem;
`;

const RecommendationTitle = styled.div`
  font-weight: 600;
  color: ${props => props.theme.colors.primary};
  margin-bottom: 0.5rem;
`;

const RecommendationDescription = styled.div`
  color: ${props => props.theme.colors.text};
  opacity: 0.8;
  font-size: 0.9rem;
  margin-bottom: 1rem;
`;

const RecommendationImpact = styled.div`
  display: inline-block;
  background-color: ${props => props.theme.colors.primary}20;
  color: ${props => props.theme.colors.primary};
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;
`;

const AIDashboardPage = () => {
  const theme = useTheme();

  const aiMetrics = [
    { label: 'AI Models Active', value: '24', change: '+3' },
    { label: 'Predictions Today', value: '1,247', change: '+18%' },
    { label: 'Accuracy Rate', value: '94.2%', change: '+2.1%' },
    { label: 'Processing Speed', value: '2.3ms', change: '-0.5ms' }
  ];

  const predictiveInsights = [
    {
      title: 'Revenue Forecast',
      description: 'Based on current trends, Q1 revenue is projected to increase by 23% compared to last quarter.',
      confidence: '87% confidence'
    },
    {
      title: 'Customer Churn Risk',
      description: '12 customers show high churn probability. Recommended immediate retention campaign.',
      confidence: '92% confidence'
    },
    {
      title: 'Market Opportunity',
      description: 'Emerging market segment shows 45% growth potential with minimal competition.',
      confidence: '78% confidence'
    },
    {
      title: 'Optimal Pricing',
      description: 'Dynamic pricing model suggests 8% price increase could boost profits by 15%.',
      confidence: '84% confidence'
    }
  ];

  const aiRecommendations = [
    {
      title: 'Campaign Optimization',
      description: 'Adjust Facebook ad targeting to users aged 28-45 for 35% higher conversion rates.',
      impact: 'High Impact'
    },
    {
      title: 'Inventory Management',
      description: 'Increase stock for wireless earbuds by 40% - demand spike predicted next week.',
      impact: 'Medium Impact'
    },
    {
      title: 'Customer Segmentation',
      description: 'Create VIP program for top 15% customers to increase lifetime value by 25%.',
      impact: 'High Impact'
    }
  ];

  return (
    <PageContainer>
      <Container>
        <PageTitle>AI Dashboard</PageTitle>
        
        <MetricsGrid>
          {aiMetrics.map((metric, index) => (
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
            <SectionTitle>Conversion Funnel Visualization</SectionTitle>
            <FunnelChart>
              🔄 AI-Powered Conversion Funnel
              <br />
              <span style={{ fontSize: '0.9rem' }}>
                Visualizing customer journey from awareness to conversion
              </span>
            </FunnelChart>
            
            <div style={{ 
              background: 'linear-gradient(135deg, #00C89615, #DAA52015)', 
              border: `1px solid ${theme.colors.border}`, 
              borderRadius: '12px', 
              padding: '1.5rem',
              textAlign: 'center'
            }}>
              <h4 style={{ color: theme.colors.primary, marginBottom: '0.5rem' }}>
                🧠 Real-time AI Processing
              </h4>
              <p style={{ color: theme.colors.text, opacity: 0.8, fontSize: '0.9rem' }}>
                Advanced machine learning algorithms analyzing customer behavior patterns
              </p>
            </div>
          </SectionCard>

          <SectionCard>
            <SectionTitle>Predictive Insights</SectionTitle>
            {predictiveInsights.map((insight, index) => (
              <InsightCard key={index}>
                <InsightTitle>{insight.title}</InsightTitle>
                <InsightDescription>{insight.description}</InsightDescription>
                <InsightConfidence>{insight.confidence}</InsightConfidence>
              </InsightCard>
            ))}
          </SectionCard>
        </SectionGrid>

        <SectionCard>
          <SectionTitle>AI Recommendations</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
            {aiRecommendations.map((recommendation, index) => (
              <RecommendationCard key={index}>
                <RecommendationTitle>{recommendation.title}</RecommendationTitle>
                <RecommendationDescription>{recommendation.description}</RecommendationDescription>
                <RecommendationImpact>{recommendation.impact}</RecommendationImpact>
              </RecommendationCard>
            ))}
          </div>
        </SectionCard>
      </Container>
    </PageContainer>
  );
};

export default AIDashboardPage;
