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

const SearchBar = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
`;

const SearchInput = styled.input`
  flex: 1;
  padding: 12px 16px;
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 8px;
  background-color: ${props => props.theme.colors.cardBackground};
  color: ${props => props.theme.colors.text};
  font-size: 1rem;

  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary};
  }
`;

const SearchButton = styled.button`
  padding: 12px 24px;
  background-color: ${props => props.theme.colors.primary};
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
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
  grid-template-columns: 2fr 1fr;
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

const ProductGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
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
  height: 120px;
  background: linear-gradient(135deg, ${props => props.theme.colors.primary}20, ${props => props.theme.colors.accent}20);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  margin-bottom: 0.5rem;
`;

const ProductName = styled.div`
  font-weight: 600;
  color: ${props => props.theme.colors.text};
  margin-bottom: 0.25rem;
`;

const ProductPrice = styled.div`
  color: ${props => props.theme.colors.primary};
  font-weight: 700;
`;

const RecommendationCard = styled.div`
  background: linear-gradient(135deg, ${props => props.theme.colors.accent}10, ${props => props.theme.colors.primary}10);
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 12px;
  padding: 1rem;
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
`;

const B2CMarketplacePage = () => {
  const theme = useTheme();
  const [searchTerm, setSearchTerm] = useState('');

  const marketplaceMetrics = [
    { label: 'Active Products', value: '2,847', change: '+15%' },
    { label: 'Daily Orders', value: '1,234', change: '+22%' },
    { label: 'Avg. Rating', value: '4.7', change: '+0.2' },
    { label: 'Revenue', value: '$45.2K', change: '+18%' }
  ];

  const products = [
    { id: 1, name: 'Smart Home Hub', price: '$199', category: 'Electronics', emoji: '🏠' },
    { id: 2, name: 'Wireless Headphones', price: '$89', category: 'Audio', emoji: '🎧' },
    { id: 3, name: 'Fitness Tracker', price: '$129', category: 'Wearables', emoji: '⌚' },
    { id: 4, name: 'Coffee Maker Pro', price: '$159', category: 'Kitchen', emoji: '☕' },
    { id: 5, name: 'Gaming Keyboard', price: '$79', category: 'Gaming', emoji: '⌨️' },
    { id: 6, name: 'Bluetooth Speaker', price: '$59', category: 'Audio', emoji: '🔊' }
  ];

  const aiRecommendations = [
    {
      title: 'Trending Now',
      description: 'Smart Home devices are seeing 40% increase in searches this week'
    },
    {
      title: 'Personalized For You',
      description: 'Based on your browsing history, you might like the Wireless Headphones'
    },
    {
      title: 'Best Value',
      description: 'Coffee Maker Pro offers the best price-to-feature ratio in its category'
    },
    {
      title: 'Seasonal Pick',
      description: 'Fitness Trackers are popular this month - 25% off for new customers'
    }
  ];

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <PageContainer>
      <Container>
        <PageTitle>B2C Marketplace</PageTitle>
        
        <SearchBar>
          <SearchInput
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <SearchButton>Search</SearchButton>
        </SearchBar>
        
        <MetricsGrid>
          {marketplaceMetrics.map((metric, index) => (
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
            <SectionTitle>Product Catalog</SectionTitle>
            <ProductGrid>
              {filteredProducts.map(product => (
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
            <SectionTitle>AI Recommendation Engine</SectionTitle>
            {aiRecommendations.map((rec, index) => (
              <RecommendationCard key={index}>
                <RecommendationTitle>{rec.title}</RecommendationTitle>
                <RecommendationDescription>{rec.description}</RecommendationDescription>
              </RecommendationCard>
            ))}
          </SectionCard>
        </SectionGrid>
      </Container>
    </PageContainer>
  );
};

export default B2CMarketplacePage;
