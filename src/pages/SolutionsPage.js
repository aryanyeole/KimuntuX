import React from 'react';
import styled from 'styled-components';
import pricingImage from '../assets/pricing.jpg';
import financialInclusionImage from '../assets/Financial Inclusion.jpg';
import websiteEcommerceBoutiqueImage from '../assets/Website_Ecommerce_boutique.jpeg';
import crmImage from '../assets/CRM.jpeg';
import fintechImage from '../assets/Fintech.jpeg';
import digitalMarketingImage from '../assets/Digital Marketing.jpeg';
import marketplaceApiImage from '../assets/Marketplace API.jpeg';
import funnelsLandingPageImage from '../assets/Funnels and landing page.jpeg';
import affiliateImage from '../assets/Affiliate.png';
import campaignImage from '../assets/Campaign.jpeg';
import brokerageImage from '../assets/Brokerage.jpeg';

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
  font-size: 1.75rem;
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
  grid-template-columns: repeat(2, 1fr);
  gap: 2rem;
  margin-bottom: 3rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
`;

const SolutionCard = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  border: 1px solid #e9ecef;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  animation: fadeInUp 0.6s ease-out ${props => props.index * 0.1}s both;
  display: flex;
  flex-direction: column;
  
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
    z-index: 2;
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

const CardImageWrapper = styled.div`
  width: 100%;
  height: 220px;
  overflow: hidden;
  position: relative;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 8px;
  margin-bottom: 1.5rem;
  
  @media (max-width: 768px) {
    height: 180px;
  }
`;

const CardImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  transition: transform 0.4s ease;
  
  ${SolutionCard}:hover & {
    transform: scale(1.05);
  }
`;

const CardContent = styled.div`
  padding: 2rem;
  flex: 1;
  display: flex;
  flex-direction: column;
`;

const CardHeader = styled.div`
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #f0f0f0;
  text-align: center;
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

const ContentSection = styled.div`
  margin-bottom: 1.5rem;
`;

const SectionLabel = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
`;

const LabelIcon = styled.span`
  width: 24px;
  height: 24px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 700;
  color: white;
  background: ${props => props.variant === 'problem' 
    ? 'linear-gradient(135deg, #6c757d, #495057)' 
    : 'linear-gradient(135deg, #00C896, #20B2AA)'};
  box-shadow: ${props => props.variant === 'problem'
    ? '0 2px 8px rgba(108, 117, 125, 0.3)'
    : '0 2px 8px rgba(0, 200, 150, 0.3)'};
`;

const LabelText = styled.span`
  font-size: 0.8125rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: ${props => props.variant === 'problem' ? '#495057' : '#00C896'};
  font-family: ${props => props.theme?.fonts?.title || 'Poppins, sans-serif'};
`;

const SectionText = styled.p`
  color: #1a1a1a;
  line-height: 1.8;
  margin: 0;
  font-size: 1.25rem;
  font-weight: 400;
  padding-left: 2rem;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    left: 0.6rem;
    top: 0;
    bottom: 0;
    width: 2px;
    background: ${props => props.variant === 'problem' 
      ? 'linear-gradient(180deg, #6c757d 0%, transparent 100%)' 
      : 'linear-gradient(180deg, #00C896 0%, transparent 100%)'};
    border-radius: 1px;
  }
`;

const SolutionContent = styled.div`
  padding-left: 2rem;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    left: 0.6rem;
    top: 0;
    bottom: 0;
    width: 2px;
    background: linear-gradient(180deg, #00C896 0%, rgba(0, 200, 150, 0.2) 100%);
    border-radius: 1px;
  }
`;

const SolutionText = styled.p`
  color: #1a1a1a;
  line-height: 1.8;
  margin: 0 0 1.25rem 0;
  font-size: 1.125rem;
  font-weight: 500;
`;

const FeatureList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 0.75rem;
`;

const FeatureItem = styled.li`
  color: #495057;
  line-height: 1.7;
  padding-left: 1.5rem;
  position: relative;
  font-size: 1.125rem;
  transition: all 0.3s ease;
  
  &::before {
    content: '✓';
    position: absolute;
    left: 0;
    top: 0;
    width: 18px;
    height: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 200, 150, 0.1);
    color: #00C896;
    border-radius: 4px;
    font-size: 0.6875rem;
    font-weight: 700;
    transition: all 0.3s ease;
  }
  
  ${SolutionCard}:hover & {
    color: #1a1a1a;
    
    &::before {
      background: #00C896;
      color: white;
      transform: scale(1.1);
    }
  }
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
      title: 'AI eCommerce & Store Creation',
      problem: 'Launching and managing an online business is complex, time-consuming, and costly for non-technical users.',
      solution: 'The AI AutoBuild Boutique Engine creates a complete eCommerce store — including design, catalog, copy, and SEO — in minutes.',
      features: [
        'AI builds and customizes your digital boutique automatically.',
        'Integrated payment and logistics solutions out-of-the-box.',
        'Dynamic storefront optimization based on real-time performance insights.'
      ]
    },
    {
      title: 'Intelligent CRM',
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
      title: 'Multi-Channel Commerce',
      problem: 'Businesses manage multiple sales channels separately — losing data, time, and sales potential.',
      solution: 'A Unified Commerce Dashboard that connects and manages multiple ecosystems.',
      features: [
        'Synchronize WooCommerce, Shopify, Amazon, TikTok Shop, and more.',
        'Centralized analytics for performance, inventory, and marketing.',
        'Seamless automation of orders, payments, and deliveries.'
      ]
    },
    {
      title: 'AI Marketing Engine',
      problem: 'Running marketing campaigns across multiple platforms is costly and inefficient without automation.',
      solution: 'An AI Campaign Optimization Engine that automates ad creation, budget allocation, and ROI tracking.',
      features: [
        'Generates copy, visuals, and videos for ads automatically.',
        'Predictive analytics for audience targeting and bidding optimization.',
        'Real-time ad performance heatmaps across Facebook, Instagram, YouTube, TikTok, and Google Ads.'
      ]
    },
    {
      title: 'API Integrations',
      problem: 'Limited access to tools and APIs prevents developers and partners from contributing to platform growth.',
      solution: 'An open Developer Marketplace and API Ecosystem for innovation and collaboration.',
      features: [
        'SDKs and API documentation for third-party integration.',
        'Marketplace for extensions, themes, and automation tools.',
        'Revenue-sharing model for partners and developers.'
      ]
    },
    {
      title: 'Funnel Landing Page',
      problem: 'Businesses struggle to create high-converting funnels and pages that attract leads and sales.',
      solution: 'AI builds clean, ready-to-use funnels in minutes to help businesses launch campaigns fast.',
      features: [
        'Smart AI improves copy, layout, and targeting to boost conversions automatically.',
        'Automated funnels connect to CRM, ads, and analytics to grow leads and sales at scale.'
      ]
    },
    {
      title: 'Financial Inclusion',
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
          {solutions.map((solution, index) => {
            const getImage = () => {
              switch (solution.title) {
                case 'Universal Digital Brokerage': return brokerageImage;
                case 'AI eCommerce & Store Creation': return websiteEcommerceBoutiqueImage;
                case 'Intelligent CRM': return crmImage;
                case 'Smart Fintech Hub': return fintechImage;
                case 'Multi-Channel Commerce': return digitalMarketingImage;
                case 'AI Marketing Engine': return campaignImage;
                case 'API Integrations': return marketplaceApiImage;
                case 'Funnel Landing Page': return funnelsLandingPageImage;
                case 'Financial Inclusion': return financialInclusionImage;
                case 'Global Affiliate & Reseller Network': return affiliateImage;
                default: return null;
              }
            };
            const imageSrc = getImage();

            return (
              <SolutionCard key={index} index={index}>
                <CardContent>
                  <CardHeader>
                    <SolutionTitle>{solution.title}</SolutionTitle>
                  </CardHeader>
                  
                  {imageSrc && (
                    <CardImageWrapper>
                      <CardImage src={imageSrc} alt={solution.title} />
                    </CardImageWrapper>
                  )}
                  
                  <ContentSection>
                    <SectionLabel>
                      <LabelIcon variant="problem">!</LabelIcon>
                      <LabelText variant="problem">Challenge</LabelText>
                    </SectionLabel>
                    <SectionText variant="problem">{solution.problem}</SectionText>
                  </ContentSection>
                  
                  <ContentSection>
                    <SectionLabel>
                      <LabelIcon variant="solution">✓</LabelIcon>
                      <LabelText variant="solution">Solution</LabelText>
                    </SectionLabel>
                    <SolutionContent>
                      <SolutionText>{solution.solution}</SolutionText>
                      <FeatureList>
                        {solution.features.map((feature, featureIndex) => (
                          <FeatureItem key={featureIndex}>{feature}</FeatureItem>
                        ))}
                      </FeatureList>
                    </SolutionContent>
                  </ContentSection>
                </CardContent>
              </SolutionCard>
            );
          })}
        </SolutionsGrid>
      </Container>
    </SolutionsContainer>
  );
};

export default SolutionsPage;
