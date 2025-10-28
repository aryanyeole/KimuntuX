import React, { useState } from 'react';
import styled from 'styled-components';
import { useTheme } from '../contexts/ThemeContext';

const SolutionsContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, ${props => props.theme?.colors?.background || '#FFFFFF'}, ${props => props.theme?.colors?.cardBackground || '#f8f9fa'});
  padding: 4rem 2rem;
`;

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 4rem;
`;

const Title = styled.h1`
  font-size: 3rem;
  font-weight: 700;
  background: linear-gradient(135deg, ${props => props.theme?.colors?.primary || '#00C896'}, ${props => props.theme?.colors?.accent || '#DAA520'});
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 1rem;
  font-family: ${props => props.theme?.fonts?.title || 'Poppins, sans-serif'};
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
`;

const Subtitle = styled.p`
  font-size: 1.2rem;
  color: ${props => props.theme?.colors?.text || '#111111'};
  opacity: 0.8;
  max-width: 700px;
  margin: 0 auto;
  animation: slideInUp 1s ease-out 0.2s both;
`;

const SolutionsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
  gap: 2rem;
`;

const SolutionCard = styled.div`
  background: linear-gradient(135deg, ${props => props.theme?.colors?.background || '#FFFFFF'}, ${props => props.theme?.colors?.cardBackground || '#f8f9fa'});
  border: 1px solid ${props => props.theme?.colors?.border || '#E5E5E5'};
  border-radius: 20px;
  padding: 2.5rem;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  position: relative;
  overflow: hidden;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
  animation: fadeInUp 0.6s ease-out;

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

const SolutionNumber = styled.div`
  font-size: 2rem;
  font-weight: 700;
  background: linear-gradient(135deg, ${props => props.theme?.colors?.primary || '#00C896'}, ${props => props.theme?.colors?.accent || '#DAA520'});
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 1rem;
  font-family: ${props => props.theme?.fonts?.title || 'Poppins, sans-serif'};
`;

const SolutionTitle = styled.h3`
  background: linear-gradient(135deg, ${props => props.theme?.colors?.primary || '#00C896'}, ${props => props.theme?.colors?.accent || '#DAA520'});
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 1.5rem;
  font-family: ${props => props.theme?.fonts?.title || 'Poppins, sans-serif'};
  font-size: 1.4rem;
  font-weight: 600;
  transition: all 0.3s ease;
  
  ${SolutionCard}:hover & {
    transform: translateY(-2px);
  }
`;

const ProblemSection = styled.div`
  margin-bottom: 1.5rem;
`;

const ProblemTitle = styled.h4`
  color: #e74c3c;
  font-weight: 600;
  margin-bottom: 0.75rem;
  font-size: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  &::before {
    content: '⚠️';
    font-size: 1.2rem;
  }
`;

const ProblemText = styled.p`
  color: ${props => props.theme?.colors?.text || '#111111'};
  opacity: 0.8;
  line-height: 1.6;
  margin: 0;
  font-style: italic;
`;

const SolutionSection = styled.div`
  margin-bottom: 1.5rem;
`;

const SolutionTitleText = styled.h4`
  color: ${props => props.theme?.colors?.primary || '#00C896'};
  font-weight: 600;
  margin-bottom: 0.75rem;
  font-size: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  &::before {
    content: '✅';
    font-size: 1.2rem;
  }
`;

const SolutionText = styled.p`
  color: ${props => props.theme?.colors?.text || '#111111'};
  opacity: 0.8;
  line-height: 1.6;
  margin: 0;
  margin-bottom: 1rem;
`;

const FeatureList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const FeatureItem = styled.li`
  color: ${props => props.theme?.colors?.text || '#111111'};
  opacity: 0.8;
  line-height: 1.6;
  margin-bottom: 0.5rem;
  padding-left: 1.5rem;
  position: relative;
  transition: all 0.3s ease;
  
  &::before {
    content: '→';
    position: absolute;
    left: 0;
    color: ${props => props.theme?.colors?.primary || '#00C896'};
    font-weight: bold;
    font-size: 1.1rem;
  }
  
  ${SolutionCard}:hover & {
    opacity: 1;
    transform: translateX(5px);
  }
`;

const SpecialSection = styled.div`
  background: linear-gradient(135deg, ${props => props.theme?.colors?.primary || '#00C896'}15, ${props => props.theme?.colors?.accent || '#DAA520'}15);
  border-radius: 20px;
  padding: 2rem;
  margin-top: 2rem;
  border: 1px solid ${props => props.theme?.colors?.border || '#E5E5E5'};
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: conic-gradient(from 0deg, transparent, ${props => props.theme?.colors?.primary || '#00C896'}20, transparent);
    animation: rotate 15s linear infinite;
    opacity: 0.3;
  }

  @keyframes rotate {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const SpecialTitle = styled.h3`
  font-size: 1.5rem;
  font-weight: 700;
  background: linear-gradient(135deg, ${props => props.theme?.colors?.primary || '#00C896'}, ${props => props.theme?.colors?.accent || '#DAA520'});
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 1rem;
  font-family: ${props => props.theme?.fonts?.title || 'Poppins, sans-serif'};
  position: relative;
  z-index: 1;
`;

const SpecialContent = styled.div`
  position: relative;
  z-index: 1;
`;

const SolutionsPage = () => {
  const solutions = [
    {
      number: '1️⃣',
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
      number: '2️⃣',
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
      number: '3️⃣',
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
      number: '4️⃣',
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
      number: '5️⃣',
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
      number: '6️⃣',
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
      number: '7️⃣',
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
      number: '8️⃣',
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
      number: '9️⃣',
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
      number: '🔟',
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
        <Header>
          <Title>Key Solutions for the Digital Economy</Title>
          <Subtitle>
            Discover how KimuntuX solves real-world business challenges with AI-driven solutions that simplify, secure, and scale your operations.
          </Subtitle>
        </Header>

        <SolutionsGrid>
          {solutions.map((solution, index) => (
            <SolutionCard key={index} style={{ animationDelay: `${index * 0.1}s` }}>
              <SolutionNumber>{solution.number}</SolutionNumber>
              <SolutionTitle>{solution.title}</SolutionTitle>
              
              <ProblemSection>
                <ProblemTitle>Problem:</ProblemTitle>
                <ProblemText>{solution.problem}</ProblemText>
              </ProblemSection>
              
              <SolutionSection>
                <SolutionTitleText>KimuntuX Solution:</SolutionTitleText>
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
          <SpecialTitle>🚀 Specialized Financial Solutions</SpecialTitle>
          <SpecialContent>
            {specialSolutions.map((special, index) => (
              <div key={index} style={{ marginBottom: '2rem' }}>
                <h4 style={{ 
                  color: '#00C896', 
                  fontWeight: '600', 
                  marginBottom: '0.75rem',
                  fontSize: '1.1rem'
                }}>
                  {special.title}
                </h4>
                <div style={{ marginBottom: '1rem' }}>
                  <strong style={{ color: '#e74c3c' }}>Problem:</strong>
                  <p style={{ 
                    color: '#666', 
                    fontStyle: 'italic', 
                    margin: '0.5rem 0',
                    lineHeight: '1.6'
                  }}>
                    {special.problem}
                  </p>
                </div>
                <div>
                  <strong style={{ color: '#00C896' }}>Solution:</strong>
                  <p style={{ 
                    color: '#333', 
                    margin: '0.5rem 0',
                    lineHeight: '1.6'
                  }}>
                    {special.solution}
                  </p>
                </div>
              </div>
            ))}
          </SpecialContent>
        </SpecialSection>
      </Container>
    </SolutionsContainer>
  );
};

export default SolutionsPage;
