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

const BoutiqueBuilder = styled.div`
  background: linear-gradient(135deg, ${props => props.theme.colors.accent}10, ${props => props.theme.colors.primary}10);
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 12px;
  padding: 2rem;
  text-align: center;
  margin-bottom: 1.5rem;
`;

const BuilderIcon = styled.div`
  font-size: 3rem;
  margin-bottom: 1rem;
  color: ${props => props.theme.colors.primary};
`;

const BuilderTitle = styled.h4`
  color: ${props => props.theme.colors.primary};
  margin-bottom: 1rem;
`;

const BuilderDescription = styled.p`
  color: ${props => props.theme.colors.text};
  opacity: 0.8;
  margin-bottom: 1.5rem;
`;

const ProductGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 1rem;
`;

const ProductCard = styled.div`
  background-color: ${props => props.theme.colors.background};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 8px;
  padding: 1rem;
  text-align: center;
  transition: transform 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
`;

const ProductImage = styled.div`
  width: 100%;
  height: 100px;
  background: linear-gradient(135deg, ${props => props.theme.colors.primary}20, ${props => props.theme.colors.accent}20);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
`;

const ProductName = styled.div`
  font-weight: 600;
  color: ${props => props.theme.colors.text};
  margin-bottom: 0.25rem;
  font-size: 0.9rem;
`;

const ProductPrice = styled.div`
  color: ${props => props.theme.colors.primary};
  font-weight: 700;
  font-size: 0.9rem;
`;

const FulfillmentCard = styled.div`
  background: linear-gradient(135deg, ${props => props.theme.colors.primary}15, ${props => props.theme.colors.accent}15);
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1rem;
`;

const FulfillmentTitle = styled.div`
  font-weight: 600;
  color: ${props => props.theme.colors.primary};
  margin-bottom: 0.5rem;
`;

const FulfillmentStats = styled.div`
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

const ECommercePage = () => {
  const theme = useTheme();

  const ecommerceMetrics = [
    { label: 'Total Products', value: '1,247', change: '+12%' },
    { label: 'Orders Today', value: '89', change: '+15%' },
    { label: 'Revenue', value: '$12.4K', change: '+22%' },
    { label: 'Conversion Rate', value: '4.2%', change: '+0.8%' }
  ];

  const products = [
    { id: 1, name: 'Wireless Earbuds', price: '$79', category: 'Electronics', emoji: '🎧' },
    { id: 2, name: 'Smart Watch', price: '$199', category: 'Wearables', emoji: '⌚' },
    { id: 3, name: 'Bluetooth Speaker', price: '$59', category: 'Audio', emoji: '🔊' },
    { id: 4, name: 'Phone Case', price: '$25', category: 'Accessories', emoji: '📱' },
    { id: 5, name: 'Laptop Stand', price: '$45', category: 'Office', emoji: '💻' },
    { id: 6, name: 'Desk Lamp', price: '$35', category: 'Office', emoji: '💡' }
  ];

  const fulfillmentData = [
    {
      title: 'Pending Orders',
      stats: { pending: 23, processing: 15 }
    },
    {
      title: 'Shipped Today',
      stats: { shipped: 67, delivered: 45 }
    },
    {
      title: 'Inventory Alert',
      stats: { low: 8, out: 2 }
    }
  ];

  return (
    <PageContainer>
      <Container>
        <PageTitle>eCommerce Hub</PageTitle>
        
        <MetricsGrid>
          {ecommerceMetrics.map((metric, index) => (
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
            <SectionTitle>AI Boutique Builder</SectionTitle>
            <BoutiqueBuilder>
              <BuilderIcon>🏪</BuilderIcon>
              <BuilderTitle>Build Your AI-Powered Store</BuilderTitle>
              <BuilderDescription>
                Create a personalized boutique with AI recommendations, automated inventory management, and smart pricing optimization.
              </BuilderDescription>
              <button className="btn-primary">Start Building</button>
            </BoutiqueBuilder>
            
            <SectionTitle>Product Catalog</SectionTitle>
            <ProductGrid>
              {products.map(product => (
                <ProductCard key={product.id}>
                  <ProductImage>{product.emoji}</ProductImage>
                  <ProductName>{product.name}</ProductName>
                  <ProductPrice>{product.price}</ProductPrice>
                  <div style={{ fontSize: '0.8rem', color: theme.colors.text, opacity: 0.6, marginTop: '0.25rem' }}>
                    {product.category}
                  </div>
                </ProductCard>
              ))}
            </ProductGrid>
          </SectionCard>

          <SectionCard>
            <SectionTitle>Fulfillment Dashboard</SectionTitle>
            {fulfillmentData.map((item, index) => (
              <FulfillmentCard key={index}>
                <FulfillmentTitle>{item.title}</FulfillmentTitle>
                <FulfillmentStats>
                  {Object.entries(item.stats).map(([key, value]) => (
                    <StatItem key={key}>
                      <StatValue>{value}</StatValue>
                      <StatLabel>{key}</StatLabel>
                    </StatItem>
                  ))}
                </FulfillmentStats>
              </FulfillmentCard>
            ))}
            
            <div style={{ 
              background: 'linear-gradient(135deg, #00C89615, #DAA52015)', 
              border: `1px solid ${theme.colors.border}`, 
              borderRadius: '12px', 
              padding: '1.5rem', 
              marginTop: '1rem',
              textAlign: 'center'
            }}>
              <h4 style={{ color: theme.colors.primary, marginBottom: '0.5rem' }}>
                📦 Smart Inventory Management
              </h4>
              <p style={{ color: theme.colors.text, opacity: 0.8, fontSize: '0.9rem' }}>
                AI-powered inventory optimization with predictive restocking and demand forecasting
              </p>
            </div>
          </SectionCard>
        </SectionGrid>
      </Container>
    </PageContainer>
  );
};

export default ECommercePage;
