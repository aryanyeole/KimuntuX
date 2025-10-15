import React from 'react';
import styled from 'styled-components';
import { useTheme } from '../contexts/ThemeContext';

const LandingContainer = styled.div`
  min-height: 100vh;
  background-color: ${props => props.theme?.colors?.background || '#FFFFFF'};
  color: ${props => props.theme?.colors?.text || '#111111'};
`;

const HeroSection = styled.section`
  padding: 4rem 0;
  text-align: center;
  background: linear-gradient(135deg, ${props => props.theme?.colors?.primary || '#00C896'}10, ${props => props.theme?.colors?.accent || '#DAA520'}10);
`;

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
`;

const HeroTitle = styled.h1`
  font-size: 3.5rem;
  font-weight: 700;
  color: ${props => props.theme?.colors?.text || '#111111'};
  margin-bottom: 1.5rem;
  font-family: ${props => props.theme?.fonts?.title || 'Poppins, sans-serif'};

  @media (max-width: 768px) {
    font-size: 2.5rem;
  }
`;

const HeroSubtitle = styled.p`
  font-size: 1.25rem;
  color: ${props => props.theme?.colors?.text || '#111111'};
  opacity: 0.8;
  margin-bottom: 2rem;
  font-family: ${props => props.theme?.fonts?.subtitle || 'Montserrat, sans-serif'};
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
`;

const CTAButtons = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
`;

const CTAButton = styled.button`
  padding: 1rem 2rem;
  border-radius: 8px;
  font-weight: 600;
  font-size: 1.1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
  
  &.primary {
    background-color: ${props => props.theme?.colors?.primary || '#00C896'};
    color: white;
    
    &:hover {
      background-color: #00B085;
      transform: translateY(-2px);
    }
  }
  
  &.secondary {
    background-color: transparent;
    color: ${props => props.theme?.colors?.text || '#111111'};
    border: 2px solid ${props => props.theme?.colors?.primary || '#00C896'};
    
    &:hover {
      background-color: ${props => props.theme?.colors?.primary || '#00C896'};
      color: white;
    }
  }
`;

const FeaturesSection = styled.section`
  padding: 4rem 0;
  background-color: ${props => props.theme?.colors?.background || '#FFFFFF'};
`;

const SectionTitle = styled.h2`
  text-align: center;
  font-size: 2.5rem;
  font-weight: 600;
  color: ${props => props.theme?.colors?.primary || '#00C896'};
  margin-bottom: 3rem;
  font-family: ${props => props.theme?.fonts?.title || 'Poppins, sans-serif'};
`;

const FeaturesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
`;

const FeatureCard = styled.div`
  background-color: ${props => props.theme?.colors?.cardBackground || '#f8f9fa'};
  border: 1px solid ${props => props.theme?.colors?.border || '#E5E5E5'};
  border-radius: 12px;
  padding: 2rem;
  text-align: center;
  transition: transform 0.3s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  }
`;

const FeatureIcon = styled.div`
  font-size: 3rem;
  margin-bottom: 1rem;
`;

const FeatureTitle = styled.h3`
  color: ${props => props.theme?.colors?.primary || '#00C896'};
  margin-bottom: 1rem;
  font-family: ${props => props.theme?.fonts?.title || 'Poppins, sans-serif'};
`;

const FeatureDescription = styled.p`
  color: ${props => props.theme?.colors?.text || '#111111'};
  opacity: 0.8;
  line-height: 1.6;
`;

const DashboardPreview = styled.section`
  padding: 4rem 0;
  background: linear-gradient(135deg, ${props => props.theme?.colors?.accent || '#DAA520'}05, ${props => props.theme?.colors?.primary || '#00C896'}05);
`;

const PreviewPlaceholder = styled.div`
  height: 400px;
  background: linear-gradient(135deg, ${props => props.theme?.colors?.primary || '#00C896'}15, ${props => props.theme?.colors?.accent || '#DAA520'}15);
  border: 1px solid ${props => props.theme?.colors?.border || '#E5E5E5'};
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 2rem;
  gap: 1rem;
`;

const PreviewIcon = styled.div`
  font-size: 3rem;
  margin-bottom: 1rem;
`;

const PreviewTitle = styled.h3`
  font-size: 1.5rem;
  font-weight: 600;
  color: ${props => props.theme?.colors?.primary || '#00C896'};
  margin-bottom: 0.5rem;
  font-family: ${props => props.theme?.fonts?.title || 'Poppins, sans-serif'};
`;

const PreviewDescription = styled.p`
  font-size: 1rem;
  color: ${props => props.theme?.colors?.text || '#111111'};
  opacity: 0.8;
  line-height: 1.6;
  max-width: 500px;
  margin: 0;
`;

const LandingPage = () => {
  const theme = useTheme();

  const features = [
    {
      icon: '🤖',
      title: 'AI-Powered Insights',
      description: 'Advanced machine learning algorithms provide real-time insights and predictive analytics for better decision making.'
    },
    {
      icon: '📊',
      title: 'Real-Time Analytics',
      description: 'Comprehensive dashboards with live data visualization and customizable reporting across all business channels.'
    },
    {
      icon: '🔄',
      title: 'Automated Campaigns',
      description: 'Smart automation tools that optimize marketing campaigns and improve conversion rates automatically.'
    },
    {
      icon: '🔗',
      title: 'Multi-Channel Integration',
      description: 'Seamless integration with CRM, eCommerce, blockchain, and fintech platforms in one unified interface.'
    },
    {
      icon: '💼',
      title: 'B2B Brokerage',
      description: 'Advanced brokerage tools with smart contract generation and automated quote comparison systems.'
    },
    {
      icon: '🛒',
      title: 'B2C Marketplace',
      description: 'Consumer-focused marketplace with AI recommendations and personalized shopping experiences.'
    }
  ];

  return (
    <LandingContainer>
      <HeroSection>
        <Container>
          <HeroTitle>AI Digital Brokerage Platform</HeroTitle>
          <HeroSubtitle>
            The Intelligent Digital Brokerage & Commerce Universe for B2B, B2C, and Beyond.
          </HeroSubtitle>
          <CTAButtons>
            <CTAButton className="primary">Start Free Trial</CTAButton>
            <CTAButton className="secondary">Watch Demo</CTAButton>
          </CTAButtons>
        </Container>
      </HeroSection>

      <DashboardPreview>
        <Container>
          <SectionTitle>Platform Preview</SectionTitle>
          <PreviewPlaceholder>
            <PreviewIcon>📱</PreviewIcon>
            <PreviewTitle>Interactive Dashboard Preview</PreviewTitle>
            <PreviewDescription>
              Experience the power of unified AI-driven business management with real-time analytics, smart automation, and comprehensive insights across all your business channels.
            </PreviewDescription>
          </PreviewPlaceholder>
        </Container>
      </DashboardPreview>

      <FeaturesSection>
        <Container>
          <SectionTitle>Platform Features</SectionTitle>
          <FeaturesGrid>
            {features.map((feature, index) => (
              <FeatureCard key={index}>
                <FeatureIcon>{feature.icon}</FeatureIcon>
                <FeatureTitle>{feature.title}</FeatureTitle>
                <FeatureDescription>{feature.description}</FeatureDescription>
              </FeatureCard>
            ))}
          </FeaturesGrid>
        </Container>
      </FeaturesSection>
    </LandingContainer>
  );
};

export default LandingPage;