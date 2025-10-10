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

const PricingCard = styled.div`
  background: linear-gradient(135deg, ${props => props.theme.colors.accent}10, ${props => props.theme.colors.primary}10);
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1rem;
  position: relative;
`;

const PricingTitle = styled.div`
  font-weight: 600;
  color: ${props => props.theme.colors.primary};
  margin-bottom: 0.5rem;
`;

const PricingPrice = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: ${props => props.theme.colors.accent};
  margin-bottom: 0.5rem;
`;

const PricingFeatures = styled.div`
  color: ${props => props.theme.colors.text};
  opacity: 0.8;
  font-size: 0.9rem;
  margin-bottom: 1rem;
`;

const PopularBadge = styled.div`
  position: absolute;
  top: -10px;
  right: 20px;
  background-color: ${props => props.theme.colors.primary};
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
`;

const CommissionCard = styled.div`
  background: linear-gradient(135deg, ${props => props.theme.colors.primary}15, ${props => props.theme.colors.accent}15);
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1rem;
`;

const CommissionTitle = styled.div`
  font-weight: 600;
  color: ${props => props.theme.colors.primary};
  margin-bottom: 0.5rem;
`;

const CommissionRate = styled.div`
  font-size: 1.2rem;
  font-weight: 700;
  color: ${props => props.theme.colors.accent};
  margin-bottom: 0.5rem;
`;

const CommissionDetails = styled.div`
  color: ${props => props.theme.colors.text};
  opacity: 0.8;
  font-size: 0.9rem;
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

const MonetizationPage = () => {
  const theme = useTheme();

  const monetizationMetrics = [
    { label: 'Total Revenue', value: '$2.4M', change: '+18%' },
    { label: 'Active Subscriptions', value: '1,247', change: '+12%' },
    { label: 'Avg. Revenue per User', value: '$156', change: '+8%' },
    { label: 'Churn Rate', value: '2.3%', change: '-0.5%' }
  ];

  const pricingPlans = [
    {
      name: 'Starter',
      price: '$29/month',
      features: 'Basic CRM, 1,000 contacts, Email support',
      popular: false
    },
    {
      name: 'Professional',
      price: '$79/month',
      features: 'Advanced CRM, 10,000 contacts, Priority support, AI insights',
      popular: true
    },
    {
      name: 'Enterprise',
      price: '$199/month',
      features: 'Unlimited contacts, Custom integrations, Dedicated manager, White-label',
      popular: false
    }
  ];

  const commissionStructure = [
    {
      type: 'Referral Commission',
      rate: '15%',
      description: 'Earn 15% commission on referred customer revenue for 12 months'
    },
    {
      type: 'Partner Commission',
      rate: '25%',
      description: 'White-label partners earn 25% commission on all transactions'
    },
    {
      type: 'API Usage',
      rate: '$0.02/call',
      description: 'Pay-per-use pricing for API integrations and data access'
    }
  ];

  return (
    <PageContainer>
      <Container>
        <PageTitle>Monetization Dashboard</PageTitle>
        
        <MetricsGrid>
          {monetizationMetrics.map((metric, index) => (
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
            <SectionTitle>Pricing Plans</SectionTitle>
            {pricingPlans.map((plan, index) => (
              <PricingCard key={index}>
                {plan.popular && <PopularBadge>Most Popular</PopularBadge>}
                <PricingTitle>{plan.name}</PricingTitle>
                <PricingPrice>{plan.price}</PricingPrice>
                <PricingFeatures>{plan.features}</PricingFeatures>
                <button className="btn-primary" style={{ width: '100%' }}>
                  {plan.popular ? 'Start Free Trial' : 'Get Started'}
                </button>
              </PricingCard>
            ))}
          </SectionCard>

          <SectionCard>
            <SectionTitle>Commission Management</SectionTitle>
            {commissionStructure.map((commission, index) => (
              <CommissionCard key={index}>
                <CommissionTitle>{commission.type}</CommissionTitle>
                <CommissionRate>{commission.rate}</CommissionRate>
                <CommissionDetails>{commission.description}</CommissionDetails>
              </CommissionCard>
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
                💰 Revenue Optimization
              </h4>
              <p style={{ color: theme.colors.text, opacity: 0.8, fontSize: '0.9rem', marginBottom: '1rem' }}>
                AI-powered pricing recommendations and revenue forecasting
              </p>
              <button className="btn-primary">View Recommendations</button>
            </div>
          </SectionCard>
        </SectionGrid>

        <SectionCard>
          <SectionTitle>Revenue Analytics</SectionTitle>
          <ChartPlaceholder>
            📈 Revenue Growth Chart
            <br />
            <span style={{ fontSize: '0.9rem' }}>
              Monthly recurring revenue, subscription growth, and revenue projections
            </span>
          </ChartPlaceholder>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '1rem',
            marginTop: '1.5rem'
          }}>
            <div style={{ 
              background: 'linear-gradient(135deg, #00C89615, #DAA52015)', 
              border: `1px solid ${theme.colors.border}`, 
              borderRadius: '12px', 
              padding: '1.5rem',
              textAlign: 'center'
            }}>
              <h4 style={{ color: theme.colors.primary, marginBottom: '0.5rem' }}>MRR Growth</h4>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: theme.colors.accent, marginBottom: '0.5rem' }}>
                +23%
              </div>
              <div style={{ fontSize: '0.9rem', color: theme.colors.text, opacity: 0.8 }}>
                Month over month
              </div>
            </div>
            
            <div style={{ 
              background: 'linear-gradient(135deg, #DAA52015, #00C89615)', 
              border: `1px solid ${theme.colors.border}`, 
              borderRadius: '12px', 
              padding: '1.5rem',
              textAlign: 'center'
            }}>
              <h4 style={{ color: theme.colors.primary, marginBottom: '0.5rem' }}>ARPU</h4>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: theme.colors.accent, marginBottom: '0.5rem' }}>
                $156
              </div>
              <div style={{ fontSize: '0.9rem', color: theme.colors.text, opacity: 0.8 }}>
                Average revenue per user
              </div>
            </div>
            
            <div style={{ 
              background: 'linear-gradient(135deg, #00C89615, #DAA52015)', 
              border: `1px solid ${theme.colors.border}`, 
              borderRadius: '12px', 
              padding: '1.5rem',
              textAlign: 'center'
            }}>
              <h4 style={{ color: theme.colors.primary, marginBottom: '0.5rem' }}>LTV</h4>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: theme.colors.accent, marginBottom: '0.5rem' }}>
                $2,340
              </div>
              <div style={{ fontSize: '0.9rem', color: theme.colors.text, opacity: 0.8 }}>
                Customer lifetime value
              </div>
            </div>
          </div>
        </SectionCard>
      </Container>
    </PageContainer>
  );
};

export default MonetizationPage;
