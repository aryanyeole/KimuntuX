import React, { useState } from 'react';
import styled from 'styled-components';
import { useTheme } from '../contexts/ThemeContext';

const LandingContainer = styled.div`
  min-height: 100vh;
  background-color: ${props => props.theme?.colors?.background || '#FFFFFF'};
  color: ${props => props.theme?.colors?.text || '#111111'};
`;

const HeroSection = styled.section`
  padding: 6rem 0;
  text-align: center;
  background: linear-gradient(135deg, ${props => props.theme?.colors?.primary || '#00C896'}15, ${props => props.theme?.colors?.accent || '#DAA520'}15, ${props => props.theme?.colors?.primary || '#00C896'}25);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(circle at 20% 80%, ${props => props.theme?.colors?.primary || '#00C896'}20 0%, transparent 50%),
                radial-gradient(circle at 80% 20%, ${props => props.theme?.colors?.accent || '#DAA520'}20 0%, transparent 50%);
    animation: float 6s ease-in-out infinite;
  }

  @keyframes float {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    50% { transform: translateY(-20px) rotate(1deg); }
  }
`;

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
`;

const HeroTitle = styled.h1`
  font-size: 3.5rem;
  font-weight: 700;
  background: linear-gradient(135deg, ${props => props.theme?.colors?.primary || '#00C896'}, ${props => props.theme?.colors?.accent || '#DAA520'});
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 1.5rem;
  font-family: ${props => props.theme?.fonts?.title || 'Poppins, sans-serif'};
  position: relative;
  z-index: 1;
  animation: slideInUp 1s ease-out;
  
  @keyframes slideInUp {
    from {
      opacity: 0;
      transform: translateY(50px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
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
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
  line-height: 1.6;
  position: relative;
  z-index: 1;
  animation: slideInUp 1s ease-out 0.2s both;
`;

const CTAButtons = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
`;

const CTAButton = styled.button`
  padding: 1rem 2rem;
  border-radius: 12px;
  font-weight: 600;
  font-size: 1.1rem;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  border: none;
  position: relative;
  z-index: 1;
  animation: slideInUp 1s ease-out 0.4s both;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
    transition: left 0.5s;
  }
  
  &:hover::before {
    left: 100%;
  }
  
  &.primary {
    background: linear-gradient(135deg, ${props => props.theme?.colors?.primary || '#00C896'}, #00B085);
    color: white;
    box-shadow: 0 8px 25px ${props => props.theme?.colors?.primary || '#00C896'}40;
    
    &:hover {
      transform: translateY(-3px) scale(1.05);
      box-shadow: 0 12px 35px ${props => props.theme?.colors?.primary || '#00C896'}60;
    }
  }
  
  &.secondary {
    background-color: transparent;
    color: ${props => props.theme?.colors?.text || '#111111'};
    border: 2px solid ${props => props.theme?.colors?.primary || '#00C896'};
    position: relative;
    
    &:hover {
      background: linear-gradient(135deg, ${props => props.theme?.colors?.primary || '#00C896'}, #00B085);
      color: white;
      transform: translateY(-3px) scale(1.05);
      box-shadow: 0 12px 35px ${props => props.theme?.colors?.primary || '#00C896'}40;
    }
  }
`;

const DashboardPreview = styled.section`
  padding: 4rem 0;
  background: linear-gradient(135deg, ${props => props.theme?.colors?.accent || '#DAA520'}05, ${props => props.theme?.colors?.primary || '#00C896'}05);
`;

const PreviewPlaceholder = styled.div`
  height: 400px;
  background: linear-gradient(135deg, ${props => props.theme?.colors?.primary || '#00C896'}15, ${props => props.theme?.colors?.accent || '#DAA520'}15);
  border: 1px solid ${props => props.theme?.colors?.border || '#E5E5E5'};
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 2rem;
  gap: 1rem;
  position: relative;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
  transition: all 0.4s ease;

  &::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: conic-gradient(from 0deg, transparent, ${props => props.theme?.colors?.primary || '#00C896'}20, transparent);
    animation: rotate 10s linear infinite;
    opacity: 0.3;
  }

  @keyframes rotate {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  &:hover {
    transform: translateY(-10px);
    box-shadow: 0 30px 80px rgba(0, 0, 0, 0.15);
  }
`;

const PreviewIcon = styled.div`
  font-size: 4rem;
  margin-bottom: 1rem;
  position: relative;
  z-index: 1;
  animation: bounce 2s ease-in-out infinite;
  
  @keyframes bounce {
    0%, 20%, 50%, 80%, 100% {
      transform: translateY(0);
    }
    40% {
      transform: translateY(-10px);
    }
    60% {
      transform: translateY(-5px);
    }
  }
`;

const PreviewTitle = styled.h3`
  font-size: 1.5rem;
  font-weight: 600;
  background: linear-gradient(135deg, ${props => props.theme?.colors?.primary || '#00C896'}, ${props => props.theme?.colors?.accent || '#DAA520'});
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 0.5rem;
  font-family: ${props => props.theme?.fonts?.title || 'Poppins, sans-serif'};
  position: relative;
  z-index: 1;
`;

const PreviewDescription = styled.p`
  font-size: 1rem;
  color: ${props => props.theme?.colors?.text || '#111111'};
  opacity: 0.8;
  line-height: 1.6;
  max-width: 500px;
  margin: 0;
  position: relative;
  z-index: 1;
`;

const FeaturesSection = styled.section`
  padding: 4rem 0;
  background-color: ${props => props.theme?.colors?.background || '#FFFFFF'};
`;

const SectionTitle = styled.h2`
  text-align: center;
  font-size: 2.5rem;
  font-weight: 600;
  background: linear-gradient(135deg, ${props => props.theme?.colors?.primary || '#00C896'}, ${props => props.theme?.colors?.accent || '#DAA520'});
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 1rem;
  font-family: ${props => props.theme?.fonts?.title || 'Poppins, sans-serif'};
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    bottom: -10px;
    left: 50%;
    transform: translateX(-50%);
    width: 60px;
    height: 4px;
    background: linear-gradient(135deg, ${props => props.theme?.colors?.primary || '#00C896'}, ${props => props.theme?.colors?.accent || '#DAA520'});
    border-radius: 2px;
  }
`;

const SectionSubtitle = styled.p`
  text-align: center;
  font-size: 1.1rem;
  color: ${props => props.theme?.colors?.text || '#111111'};
  opacity: 0.8;
  margin-bottom: 3rem;
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
  line-height: 1.6;
`;

const FeaturesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 2rem;
`;

const FeatureCard = styled.div`
  background: linear-gradient(135deg, ${props => props.theme?.colors?.cardBackground || '#f8f9fa'}, ${props => props.theme?.colors?.background || '#FFFFFF'});
  border: 1px solid ${props => props.theme?.colors?.border || '#E5E5E5'};
  border-radius: 20px;
  padding: 2.5rem;
  text-align: center;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  position: relative;
  overflow: hidden;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(135deg, ${props => props.theme?.colors?.primary || '#00C896'}, ${props => props.theme?.colors?.accent || '#DAA520'});
    transform: scaleX(0);
    transition: transform 0.3s ease;
  }

  &:hover {
    transform: translateY(-8px) scale(1.02);
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
    border-color: ${props => props.theme?.colors?.primary || '#00C896'};
    
    &::before {
      transform: scaleX(1);
    }
  }
`;

const FeatureIcon = styled.div`
  font-size: 4rem;
  margin-bottom: 1.5rem;
  position: relative;
  display: inline-block;
  transition: all 0.3s ease;
  
  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 80px;
    height: 80px;
    background: linear-gradient(135deg, ${props => props.theme?.colors?.primary || '#00C896'}20, ${props => props.theme?.colors?.accent || '#DAA520'}20);
    border-radius: 50%;
    z-index: -1;
    transition: all 0.3s ease;
  }
  
  ${FeatureCard}:hover & {
    transform: scale(1.1) rotate(5deg);
    
    &::before {
      transform: translate(-50%, -50%) scale(1.2);
      background: linear-gradient(135deg, ${props => props.theme?.colors?.primary || '#00C896'}30, ${props => props.theme?.colors?.accent || '#DAA520'}30);
    }
  }
`;

const FeatureTitle = styled.h3`
  background: linear-gradient(135deg, ${props => props.theme?.colors?.primary || '#00C896'}, ${props => props.theme?.colors?.accent || '#DAA520'});
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 1rem;
  font-family: ${props => props.theme?.fonts?.title || 'Poppins, sans-serif'};
  font-size: 1.3rem;
  font-weight: 600;
  transition: all 0.3s ease;
  
  ${FeatureCard}:hover & {
    transform: translateY(-2px);
  }
`;

const FeatureDescription = styled.p`
  color: ${props => props.theme?.colors?.text || '#111111'};
  opacity: 0.8;
  line-height: 1.6;
  font-size: 0.95rem;
`;

const SectorsSection = styled.section`
  padding: 6rem 0;
  background: linear-gradient(135deg, ${props => props.theme?.colors?.primary || '#00C896'}08, ${props => props.theme?.colors?.accent || '#DAA520'}08);
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(circle at 30% 70%, ${props => props.theme?.colors?.primary || '#00C896'}10 0%, transparent 50%),
                radial-gradient(circle at 70% 30%, ${props => props.theme?.colors?.accent || '#DAA520'}10 0%, transparent 50%);
  }
`;

const SectorsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
`;

const SectorCard = styled.div`
  background: linear-gradient(135deg, ${props => props.theme?.colors?.cardBackground || '#f8f9fa'}, ${props => props.theme?.colors?.background || '#FFFFFF'});
  border: 1px solid ${props => props.theme?.colors?.border || '#E5E5E5'};
  border-radius: 16px;
  padding: 2rem;
  text-align: center;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  position: relative;
  overflow: hidden;
  box-shadow: 0 6px 25px rgba(0, 0, 0, 0.06);

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(135deg, ${props => props.theme?.colors?.primary || '#00C896'}, ${props => props.theme?.colors?.accent || '#DAA520'});
    transform: scaleX(0);
    transition: transform 0.3s ease;
  }

  &:hover {
    transform: translateY(-6px) scale(1.03);
    box-shadow: 0 15px 45px rgba(0, 0, 0, 0.12);
    border-color: ${props => props.theme?.colors?.primary || '#00C896'};
    
    &::before {
      transform: scaleX(1);
    }
  }
`;

const SectorIcon = styled.div`
  font-size: 3rem;
  margin-bottom: 1rem;
  position: relative;
  display: inline-block;
  transition: all 0.3s ease;
  
  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 60px;
    height: 60px;
    background: linear-gradient(135deg, ${props => props.theme?.colors?.primary || '#00C896'}15, ${props => props.theme?.colors?.accent || '#DAA520'}15);
    border-radius: 50%;
    z-index: -1;
    transition: all 0.3s ease;
  }
  
  ${SectorCard}:hover & {
    transform: scale(1.1) rotate(-5deg);
    
    &::before {
      transform: translate(-50%, -50%) scale(1.3);
      background: linear-gradient(135deg, ${props => props.theme?.colors?.primary || '#00C896'}25, ${props => props.theme?.colors?.accent || '#DAA520'}25);
    }
  }
`;

const SectorTitle = styled.h4`
  background: linear-gradient(135deg, ${props => props.theme?.colors?.primary || '#00C896'}, ${props => props.theme?.colors?.accent || '#DAA520'});
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 0.5rem;
  font-family: ${props => props.theme?.fonts?.title || 'Poppins, sans-serif'};
  font-size: 1.2rem;
  font-weight: 600;
  transition: all 0.3s ease;
  
  ${SectorCard}:hover & {
    transform: translateY(-2px);
  }
`;

const SectorDescription = styled.p`
  color: ${props => props.theme?.colors?.text || '#111111'};
  opacity: 0.8;
  line-height: 1.5;
  font-size: 0.9rem;
`;

const LandingPage = () => {
  const theme = useTheme();

  const keySolutions = [
    {
      icon: '🌐',
      title: 'Universal Digital Brokerage',
      description: 'Connect with verified partners, suppliers, and clients globally through AI-powered brokerage and blockchain-secured transactions.'
    },
    {
      icon: '🏪',
      title: 'AI Boutique Builder',
      description: 'Launch your complete online store in minutes, automatically designed, optimized, and ready to sell.'
    },
    {
      icon: '🤖',
      title: 'Intelligent CRM',
      description: 'Manage leads, clients, and conversations effortlessly with smart automation and AI follow-ups.'
    },
    {
      icon: '💰',
      title: 'Smart Fintech Hub',
      description: 'Multi-currency wallets, instant payouts, AI fraud detection, and smart crypto wallet with predictive investment engine.'
    },
    {
      icon: '🛒',
      title: 'Multi-Channel Commerce',
      description: 'Sync your Shopify, WooCommerce, Amazon, and TikTok stores into one smart dashboard.'
    },
    {
      icon: '📈',
      title: 'AI Marketing & Campaigns',
      description: 'Create, launch, and optimize ads automatically across Facebook, Instagram, YouTube, and more.'
    },
    {
      icon: '🔧',
      title: 'Developer & Partner Ecosystem',
      description: 'Build, extend, and innovate with KimuntuX APIs, SDKs, and partner marketplace.'
    },
    {
      icon: '📊',
      title: 'Data & Intelligence',
      description: 'Get real-time analytics, forecasts, and personalized AI recommendations to grow faster.'
    },
    {
      icon: '🌍',
      title: 'Financial Inclusion',
      description: 'Empowering entrepreneurs and small businesses with affordable digital tools and fintech access.'
    },
    {
      icon: '🤝',
      title: 'Affiliate & Reseller Network',
      description: 'Join the global affiliate community: earn, promote, and grow with transparent blockchain rewards.'
    }
  ];

  const sectors = [
    {
      icon: '🏛️',
      title: 'Government & Public Sector',
      description: 'Empower digital governance with AI insights and blockchain transparency.'
    },
    {
      icon: '💰',
      title: 'Financial Services',
      description: 'Predict markets, secure payments, and automate brokerage operations.'
    },
    {
      icon: '🏠',
      title: 'Real Estate',
      description: 'Smart contracts and AI valuations for faster, trusted transactions.'
    },
    {
      icon: '🚛',
      title: 'Logistics & Supply Chain',
      description: 'Optimize delivery, tracking, and supplier connections through AI.'
    },
    {
      icon: '❤️',
      title: 'Non-Profit Organizations',
      description: 'Ensure donation transparency and maximize social impact.'
    },
    {
      icon: '🏢',
      title: 'SMBs & Entrepreneurs',
      description: 'All-in-one CRM, marketplace, and fintech tools to grow faster.'
    },
    {
      icon: '👨‍💼',
      title: 'Professional Services',
      description: 'AI-powered automation for clients, projects, and digital visibility.'
    },
    {
      icon: '🌐',
      title: 'All Sectors',
      description: 'One intelligent ecosystem — secure, scalable, and globally connected.'
    }
  ];

  return (
    <LandingContainer>
      <HeroSection>
        <Container>
          <HeroTitle>KimuntuX: AI-Powered Digital Brokerage Platform Built on Blockchain</HeroTitle>
          <HeroSubtitle>
            "Empowering individuals and enterprises to build, connect, and grow through intelligent, inclusive, and borderless digital commerce."
          </HeroSubtitle>
          <CTAButtons>
            <CTAButton className="primary">Start Your Journey</CTAButton>
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
          <SectionTitle>Key Solutions — What KimuntuX Solves for You</SectionTitle>
          <SectionSubtitle>
            KimuntuX solves the real-world pain points that individuals, entrepreneurs, and enterprises face in the modern digital economy. It merges AI, Blockchain, and Fintech into a single intelligent platform that simplifies, secures, and scales business growth.
          </SectionSubtitle>
          <FeaturesGrid>
            {keySolutions.map((solution, index) => (
              <FeatureCard key={index}>
                <FeatureIcon>{solution.icon}</FeatureIcon>
                <FeatureTitle>{solution.title}</FeatureTitle>
                <FeatureDescription>{solution.description}</FeatureDescription>
              </FeatureCard>
            ))}
          </FeaturesGrid>
        </Container>
      </FeaturesSection>

      <SectorsSection>
        <Container>
          <SectionTitle>Why Choose KimuntuX</SectionTitle>
          <SectionSubtitle>
            Benefits Across All Sectors
          </SectionSubtitle>
          <SectorsGrid>
            {sectors.map((sector, index) => (
              <SectorCard key={index}>
                <SectorIcon>{sector.icon}</SectorIcon>
                <SectorTitle>{sector.title}</SectorTitle>
                <SectorDescription>{sector.description}</SectorDescription>
              </SectorCard>
            ))}
          </SectorsGrid>
        </Container>
      </SectorsSection>
    </LandingContainer>
  );
};

export default LandingPage;