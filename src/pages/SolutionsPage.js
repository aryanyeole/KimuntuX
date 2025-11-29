import React from 'react';
import styled from 'styled-components';
import { useTheme } from '../contexts/ThemeContext';
import pricingImage from '../assets/pricing.jpg';

const SolutionsContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 50%, #f8f9fa 100%);
  padding-top: 120px;
  position: relative;
  
  @media (max-width: 768px) {
    padding-top: 100px;
  }
`;

const Container = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 2rem;
`;

const HeroSection = styled.div`
  position: relative;
  margin-bottom: 5rem;
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
  background: #ffffff;
  
  @media (max-width: 768px) {
    border-radius: 16px;
    margin-bottom: 3rem;
  }
`;

const HeroImageWrapper = styled.div`
  position: relative;
  width: 100%;
  height: 500px;
  overflow: hidden;
  
  @media (max-width: 768px) {
    height: 300px;
  }
`;

const HeroImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  display: block;
`;

const HeroContent = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(180deg, transparent 0%, rgba(0, 0, 0, 0.7) 100%);
  padding: 4rem 3rem 3rem;
  z-index: 2;
  text-align: center;
  
  @media (max-width: 768px) {
    padding: 2rem 1.5rem;
  }
`;

const HeroTitle = styled.h1`
  font-size: 3.5rem;
  font-weight: 700;
  color: white;
  margin: 0 0 1rem 0;
  font-family: ${props => props.theme?.fonts?.title || 'Poppins, sans-serif'};
  text-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
  letter-spacing: -0.02em;
  animation: fadeInUp 0.8s ease-out;
  
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @media (max-width: 768px) {
    font-size: 2rem;
  }
`;

const HeroSubtitle = styled.p`
  font-size: 1.25rem;
  color: rgba(255, 255, 255, 0.95);
  margin: 0;
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
  line-height: 1.6;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
  animation: fadeInUp 0.8s ease-out 0.2s both;
  
  @media (max-width: 768px) {
    font-size: 1rem;
  }
`;

const SolutionsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(550px, 1fr));
  gap: 2rem;
  margin-bottom: 3rem;
  
  @media (max-width: 1200px) {
    grid-template-columns: repeat(auto-fit, minmax(450px, 1fr));
  }
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
`;

const SolutionCard = styled.div`
  background: white;
  border-radius: 12px;
  padding: 2.5rem;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  border: 1px solid #e9ecef;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  animation: fadeInUp 0.6s ease-out ${props => props.index * 0.1}s both;
  
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: #00C896;
    transform: scaleX(0);
    transform-origin: left;
    transition: transform 0.3s ease;
  }
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
    border-color: #00C896;
    
    &::before {
      transform: scaleX(1);
    }
  }
`;

const CardHeader = styled.div`
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 2px solid #f0f0f0;
`;

const SolutionTitle = styled.h3`
  font-size: 1.5rem;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0;
  font-family: ${props => props.theme?.fonts?.title || 'Poppins, sans-serif'};
  line-height: 1.3;
  transition: color 0.3s ease;
  
  ${SolutionCard}:hover & {
    color: #00C896;
  }
`;

const ProblemSection = styled.div`
  background: #f8f9fa;
  border-left: 3px solid #6c757d;
  border-radius: 6px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
`;

const ProblemTitle = styled.h4`
  color: #495057;
  font-weight: 600;
  margin: 0 0 0.75rem 0;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  font-family: ${props => props.theme?.fonts?.title || 'Poppins, sans-serif'};
`;

const ProblemText = styled.p`
  color: #495057;
  line-height: 1.7;
  margin: 0;
  font-size: 0.9375rem;
`;

const SolutionSection = styled.div`
  background: #f8f9fa;
  border-left: 3px solid #00C896;
  border-radius: 6px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
`;

const SolutionTitleText = styled.h4`
  color: #00C896;
  font-weight: 600;
  margin: 0 0 0.75rem 0;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  font-family: ${props => props.theme?.fonts?.title || 'Poppins, sans-serif'};
`;

const SolutionText = styled.p`
  color: #495057;
  line-height: 1.7;
  margin: 0 0 1.25rem 0;
  font-size: 0.9375rem;
`;

const FeatureList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 0.875rem;
`;

const FeatureItem = styled.li`
  color: #495057;
  line-height: 1.7;
  padding-left: 1.75rem;
  position: relative;
  font-size: 0.9375rem;
  transition: all 0.3s ease;
  
  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0.65rem;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #00C896;
    transition: transform 0.3s ease;
  }
  
  ${SolutionCard}:hover & {
    color: #1a1a1a;
    transform: translateX(2px);
    
    &::before {
      transform: scale(1.2);
    }
  }
`;

const SpecialSection = styled.div`
  background: linear-gradient(135deg, #00C896 0%, #20B2AA 100%);
  border-radius: 24px;
  padding: 3rem;
  margin-top: 4rem;
  margin-bottom: 4rem;
  box-shadow: 0 12px 40px rgba(0, 200, 150, 0.2);
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: conic-gradient(from 0deg, transparent, rgba(255, 255, 255, 0.1), transparent);
    animation: rotate 20s linear infinite;
    opacity: 0.3;
  }

  @keyframes rotate {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  @media (max-width: 768px) {
    padding: 2rem;
    border-radius: 16px;
  }
`;

const SpecialTitle = styled.h3`
  font-size: 2rem;
  font-weight: 700;
  color: white;
  margin: 0 0 2rem 0;
  font-family: ${props => props.theme?.fonts?.title || 'Poppins, sans-serif'};
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  position: relative;
  z-index: 1;
  
  @media (max-width: 768px) {
    font-size: 1.5rem;
  }
`;

const SpecialContent = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 2rem;
  position: relative;
  z-index: 1;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
`;

const SpecialCard = styled.div`
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  padding: 2rem;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  }
`;

const SpecialCardTitle = styled.h4`
  color: white;
  font-weight: 700;
  margin: 0 0 1rem 0;
  font-size: 1.25rem;
  font-family: ${props => props.theme?.fonts?.title || 'Poppins, sans-serif'};
`;

const SpecialText = styled.p`
  color: rgba(255, 255, 255, 0.95);
  line-height: 1.7;
  margin: 0.5rem 0;
  font-size: 0.9375rem;
`;

const SolutionsPage = () => {
  const solutions = [
    {
      title: 'Universal Digital Brokerage',
      problem: 'Businesses struggle to connect with reliable partners, suppliers, and clients across borders due to fragmentation and lack of trust.',
      solution: 'A Universal Smart Brokerage Hub (USBH) powered by AI and blockchain that seamlessly connects B2B, B2C, and affiliate ecosystems.',
      features: [
        'Intelligent matchmaking between buyers, sellers, and service providers.',
        'Blockchain-powered escrow and smart contracts for transparent transactions.',
        'Real-time brokerage analytics to measure ROI and partner performance.'
      ]
    },
    {
      title: 'Autonomous eCommerce & Store Creation',
      problem: 'Launching and managing an online business is complex, time-consuming, and costly for non-technical users.',
      solution: 'The AI AutoBuild Boutique Engine creates a complete eCommerce store — including design, catalog, copy, and SEO — in minutes.',
      features: [
        'AI builds and customizes your digital boutique automatically.',
        'Integrated payment and logistics solutions out-of-the-box.',
        'Dynamic storefront optimization based on real-time performance insights.'
      ]
    },
    {
      title: 'Intelligent CRM & Relationship Management',
      problem: 'Businesses lose leads and clients due to poor follow-up and disconnected communication tools.',
      solution: 'A unified AI-Driven CRM System that automates client nurturing and communication.',
      features: [
        'Predictive lead scoring and engagement tracking.',
        'AI chatbot assistant for real-time follow-ups.',
        'Multi-channel integration (Email, WhatsApp, Social Media, etc.).'
      ]
    },
    {
      title: 'Smart Fintech Hub',
      problem: 'Fragmented payment gateways and limited access to financial tools slow business transactions, especially in emerging markets.',
      solution: 'A fully integrated Fintech Layer for global, cross-border commerce.',
      features: [
        'Multi-currency wallets (USD, CAD, Crypto, Mobile Money).',
        'Instant payouts and split-commission payments for brokers and affiliates.',
        'AI fraud detection and compliance monitoring.',
        'Embedded BNPL (Buy Now, Pay Later) and escrow tools for trust and accessibility.'
      ]
    },
    {
      title: 'Cross-Platform Integration & Multi-Channel Commerce',
      problem: 'Businesses manage multiple sales channels separately — losing data, time, and sales potential.',
      solution: 'A Unified Commerce Dashboard that connects and manages multiple ecosystems.',
      features: [
        'Synchronize WooCommerce, Shopify, Amazon, TikTok Shop, and more.',
        'Centralized analytics for performance, inventory, and marketing.',
        'Seamless automation of orders, payments, and deliveries.'
      ]
    },
    {
      title: 'AI-Powered Campaigns & Marketing Intelligence',
      problem: 'Running marketing campaigns across multiple platforms is costly and inefficient without automation.',
      solution: 'An AI Campaign Optimization Engine that automates ad creation, budget allocation, and ROI tracking.',
      features: [
        'Generates copy, visuals, and videos for ads automatically.',
        'Predictive analytics for audience targeting and bidding optimization.',
        'Real-time ad performance heatmaps across Facebook, Instagram, YouTube, TikTok, and Google Ads.'
      ]
    },
    {
      title: 'Developer & Partner Ecosystem',
      problem: 'Limited access to tools and APIs prevents developers and partners from contributing to platform growth.',
      solution: 'An open Developer Marketplace and API Ecosystem for innovation and collaboration.',
      features: [
        'SDKs and API documentation for third-party integration.',
        'Marketplace for extensions, themes, and automation tools.',
        'Revenue-sharing model for partners and developers.'
      ]
    },
    {
      title: 'Data Intelligence & Predictive Insights',
      problem: 'Businesses often operate blindly without real-time data or forecasting.',
      solution: 'A Commerce Intelligence Dashboard that turns data into actionable insights.',
      features: [
        'Predictive analytics for sales, pricing, and customer retention.',
        'Real-time performance visualization with AI recommendations.',
        'Unified KPIs across CRM, brokerage, and eCommerce.'
      ]
    },
    {
      title: 'Financial Inclusion & Empowerment',
      problem: 'Millions of small entrepreneurs lack access to digital and financial infrastructure.',
      solution: 'KimuntuX bridges this gap through inclusive, low-cost, and localized digital tools.',
      features: [
        'Affordable digital stores for SMEs, startups, and individual sellers.',
        'Integration with regional fintechs (M-Pesa, Paystack, Flutterwave).',
        'Access to digital credit and micro-lending through blockchain transparency.'
      ]
    },
    {
      title: 'Global Affiliate & Reseller Network',
      problem: 'Traditional affiliate programs are limited in scope and transparency.',
      solution: 'A global Affiliate & Reseller Hub powered by AI and blockchain transparency.',
      features: [
        'Personalized affiliate dashboards for tracking clicks, conversions, and commissions.',
        'Smart campaign generator for social media.',
        'Tokenized reward and loyalty system via blockchain.'
      ]
    }
  ];

  const specialSolutions = [
    {
      title: 'AI-Powered Stock Market Integration',
      problem: 'Complex platforms and lack of financial literacy limit retail investor access to stock markets.',
      solution: 'Intuitive AI-driven stock market dashboard with real-time insights, risk profiling, and auto-portfolio suggestions.'
    },
    {
      title: 'AI Crypto Wallet & Predictive Investment Engine',
      problem: 'Volatile markets and manual tracking make crypto investing risky and time-consuming.',
      solution: 'Smart crypto wallet with AI-based trend forecasting, portfolio optimization, and automated alerts for buy/sell signals.'
    }
  ];

  return (
    <SolutionsContainer>
      <Container>
        <HeroSection>
          <HeroImageWrapper>
            <HeroImage src={pricingImage} alt="Solutions" />
          </HeroImageWrapper>
          <HeroContent>
            <HeroTitle>Key Solutions for the Digital Economy</HeroTitle>
            <HeroSubtitle>
              Discover how KimuntuX solves real-world business challenges with AI-driven solutions that simplify, secure, and scale your operations.
            </HeroSubtitle>
          </HeroContent>
        </HeroSection>

        <SolutionsGrid>
          {solutions.map((solution, index) => (
            <SolutionCard key={index} index={index}>
              <CardHeader>
                <SolutionTitle>{solution.title}</SolutionTitle>
              </CardHeader>
              
              <ProblemSection>
                <ProblemTitle>Problem</ProblemTitle>
                <ProblemText>{solution.problem}</ProblemText>
              </ProblemSection>
              
              <SolutionSection>
                <SolutionTitleText>Solution</SolutionTitleText>
                <SolutionText>{solution.solution}</SolutionText>
                <FeatureList>
                  {solution.features.map((feature, featureIndex) => (
                    <FeatureItem key={featureIndex}>{feature}</FeatureItem>
                  ))}
                </FeatureList>
              </SolutionSection>
            </SolutionCard>
          ))}
        </SolutionsGrid>

        <SpecialSection>
          <SpecialTitle>Specialized Financial Solutions</SpecialTitle>
          <SpecialContent>
            {specialSolutions.map((special, index) => (
              <SpecialCard key={index}>
                <SpecialCardTitle>{special.title}</SpecialCardTitle>
                <div>
                  <SpecialText>
                    <strong style={{ color: 'rgba(255, 255, 255, 0.9)' }}>Problem:</strong> {special.problem}
                  </SpecialText>
                  <SpecialText>
                    <strong style={{ color: 'rgba(255, 255, 255, 0.9)' }}>Solution:</strong> {special.solution}
                  </SpecialText>
                </div>
              </SpecialCard>
            ))}
          </SpecialContent>
        </SpecialSection>
      </Container>
    </SolutionsContainer>
  );
};

export default SolutionsPage;
