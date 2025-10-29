import React, { useState } from 'react';
import styled from 'styled-components';
import { useTheme } from '../contexts/ThemeContext';

const FAQContainer = styled.div`
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
  max-width: 600px;
  margin: 0 auto;
  animation: slideInUp 1s ease-out 0.2s both;
`;

const BenefitsSection = styled.section`
  margin-bottom: 4rem;
`;

const SectionTitle = styled.h2`
  font-size: 2.5rem;
  font-weight: 600;
  background: linear-gradient(135deg, ${props => props.theme?.colors?.primary || '#00C896'}, ${props => props.theme?.colors?.accent || '#DAA520'});
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-align: center;
  margin-bottom: 3rem;
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

const SectorGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 2rem;
`;

const SectorCard = styled.div`
  background: linear-gradient(135deg, ${props => props.theme?.colors?.background || '#FFFFFF'}, ${props => props.theme?.colors?.cardBackground || '#f8f9fa'});
  border: 1px solid ${props => props.theme?.colors?.border || '#E5E5E5'};
  border-radius: 20px;
  padding: 2rem;
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
    width: 80px;
    height: 80px;
    background: linear-gradient(135deg, ${props => props.theme?.colors?.primary || '#00C896'}20, ${props => props.theme?.colors?.accent || '#DAA520'}20);
    border-radius: 50%;
    z-index: -1;
    transition: all 0.3s ease;
  }
  
  ${SectorCard}:hover & {
    transform: scale(1.1) rotate(5deg);
    
    &::before {
      transform: translate(-50%, -50%) scale(1.2);
      background: linear-gradient(135deg, ${props => props.theme?.colors?.primary || '#00C896'}30, ${props => props.theme?.colors?.accent || '#DAA520'}30);
    }
  }
`;

const SectorTitle = styled.h3`
  background: linear-gradient(135deg, ${props => props.theme?.colors?.primary || '#00C896'}, ${props => props.theme?.colors?.accent || '#DAA520'});
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 1rem;
  font-family: ${props => props.theme?.fonts?.title || 'Poppins, sans-serif'};
  font-size: 1.3rem;
  font-weight: 600;
  transition: all 0.3s ease;
  
  ${SectorCard}:hover & {
    transform: translateY(-2px);
  }
`;

const BenefitList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const BenefitItem = styled.li`
  color: ${props => props.theme?.colors?.text || '#111111'};
  opacity: 0.8;
  line-height: 1.6;
  margin-bottom: 0.75rem;
  padding-left: 1.5rem;
  position: relative;
  transition: all 0.3s ease;
  
  &::before {
    content: '✓';
    position: absolute;
    left: 0;
    color: ${props => props.theme?.colors?.primary || '#00C896'};
    font-weight: bold;
    font-size: 1.1rem;
  }
  
  ${SectorCard}:hover & {
    opacity: 1;
    transform: translateX(5px);
  }
`;

const UniversalBenefits = styled.div`
  background: linear-gradient(135deg, ${props => props.theme?.colors?.primary || '#00C896'}15, ${props => props.theme?.colors?.accent || '#DAA520'}15);
  border-radius: 20px;
  padding: 3rem;
  text-align: center;
  margin-top: 3rem;
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
    animation: rotate 10s linear infinite;
    opacity: 0.3;
  }

  @keyframes rotate {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const UniversalTitle = styled.h3`
  font-size: 2rem;
  font-weight: 700;
  background: linear-gradient(135deg, ${props => props.theme?.colors?.primary || '#00C896'}, ${props => props.theme?.colors?.accent || '#DAA520'});
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 1.5rem;
  font-family: ${props => props.theme?.fonts?.title || 'Poppins, sans-serif'};
  position: relative;
  z-index: 1;
`;

const UniversalList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  position: relative;
  z-index: 1;
`;

const UniversalItem = styled.div`
  background: ${props => props.theme?.colors?.background || '#FFFFFF'};
  border-radius: 12px;
  padding: 1.5rem;
  border: 1px solid ${props => props.theme?.colors?.border || '#E5E5E5'};
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  }
  
  h4 {
    color: ${props => props.theme?.colors?.primary || '#00C896'};
    margin-bottom: 0.5rem;
    font-weight: 600;
  }
  
  p {
    color: ${props => props.theme?.colors?.text || '#111111'};
    opacity: 0.8;
    line-height: 1.6;
    margin: 0;
  }
`;

const FAQPage = () => {
  const sectors = [
    {
      icon: '🏛️',
      title: 'Government & Public Sector',
      benefits: [
        'Digital Governance Hub: Streamline procurement, contracts, and citizen services with blockchain transparency.',
        'Smart Policy Analytics: Use AI to predict economic trends and improve decision-making.',
        'Secure Transactions: Facilitate inter-agency financial flows and compliance tracking.'
      ]
    },
    {
      icon: '💰',
      title: 'Financial Services & Fintech',
      benefits: [
        'AI-Driven Insights: Predict market trends, manage portfolios, and detect fraud in real time.',
        'Blockchain Settlement: Enable instant, secure, cross-border transactions.',
        'Integrated Brokerage Suite: Connect banks, brokers, and investors seamlessly in one ecosystem.'
      ]
    },
    {
      icon: '🏠',
      title: 'Real Estate & Property Management',
      benefits: [
        'Smart Contracts: Automate rental, purchase, and mortgage agreements.',
        'AI Valuation Engine: Predict property value trends using data intelligence.',
        'Digital Brokerage: Connect buyers, sellers, and agents across regions.'
      ]
    },
    {
      icon: '🚛',
      title: 'Logistics & Supply Chain',
      benefits: [
        'AI Route Optimization: Reduce delivery costs and time through predictive logistics.',
        'Real-Time Tracking: Blockchain-secured tracking for goods and shipments.',
        'Unified Marketplace: Connect suppliers, freight companies, and clients efficiently.'
      ]
    },
    {
      icon: '🌍',
      title: 'Non-Profit & Social Organizations',
      benefits: [
        'Transparent Fund Tracking: Blockchain ensures donation transparency.',
        'AI Impact Reports: Evaluate project efficiency and optimize resource allocation.',
        'Community Commerce Tools: Enable fundraising campaigns and digital outreach.'
      ]
    },
    {
      icon: '🏢',
      title: 'Small & Medium Businesses (SMBs)',
      benefits: [
        'All-in-One Digital Office: CRM, marketplace, and payment tools integrated.',
        'AI Business Advisor: Smart insights for sales, marketing, and customer retention.',
        'Affordable Growth Tools: Access enterprise-level solutions at SMB-friendly costs.'
      ]
    },
    {
      icon: '👨‍💼',
      title: 'Professional & Consulting Services',
      benefits: [
        'Client Relationship Management (CRM): Automate leads, meetings, and invoicing.',
        'AI Project Assistant: Generate proposals, contracts, and marketing content instantly.',
        'Cross-Sector Visibility: Expand professional networks through the KimuntuX brokerage hub.'
      ]
    }
  ];

  const universalBenefits = [
    {
      title: 'One Unified Platform',
      description: 'Manage commerce, finance, and clients from a single dashboard.'
    },
    {
      title: 'AI + Blockchain Synergy',
      description: 'Achieve smarter, safer, and faster operations.'
    },
    {
      title: 'Global Connectivity',
      description: 'Operate locally or globally: B2B, B2C, or through affiliates.'
    }
  ];

  return (
    <FAQContainer>
      <Container>
        <Header>
          <Title>Frequently Asked Questions</Title>
          <Subtitle>
            Discover how KimuntuX benefits organizations across all sectors with intelligent, inclusive, and borderless digital commerce solutions.
          </Subtitle>
        </Header>

        <BenefitsSection>
          <SectionTitle>Benefits of Using KimuntuX Across All Sectors</SectionTitle>
          <SectorGrid>
            {sectors.map((sector, index) => (
              <SectorCard key={index} style={{ animationDelay: `${index * 0.1}s` }}>
                <SectorIcon>{sector.icon}</SectorIcon>
                <SectorTitle>{sector.title}</SectorTitle>
                <BenefitList>
                  {sector.benefits.map((benefit, benefitIndex) => (
                    <BenefitItem key={benefitIndex}>{benefit}</BenefitItem>
                  ))}
                </BenefitList>
              </SectorCard>
            ))}
          </SectorGrid>

          <UniversalBenefits>
            <UniversalTitle>💡 Universal Benefits</UniversalTitle>
            <UniversalList>
              {universalBenefits.map((benefit, index) => (
                <UniversalItem key={index}>
                  <h4>{benefit.title}</h4>
                  <p>{benefit.description}</p>
                </UniversalItem>
              ))}
            </UniversalList>
          </UniversalBenefits>
        </BenefitsSection>
      </Container>
    </FAQContainer>
  );
};

export default FAQPage;
