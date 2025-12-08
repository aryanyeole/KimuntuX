import React from 'react';
import styled from 'styled-components';
import multiChannelImage from '../assets/multiChannel_integration.jpg';

const Page = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 50%, #f8f9fa 100%);
  padding-top: 120px;
  
  @media (max-width: 768px) {
    padding-top: 100px;
  }
`;

const Wrap = styled.div`
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
  font-family: ${p => p.theme?.fonts?.title || 'Poppins, sans-serif'};
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

const Grid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  justify-content: center;
  margin-bottom: 4rem;
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: center;
  }
`;

const Sector = styled.div`
  position: relative;
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  border: 1px solid #e9ecef;
  transition: all 0.3s ease;
  flex: 0 0 calc(33.333% - 11px);
  min-width: 320px;
  max-width: 400px;
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
  
  @media (max-width: 1100px) {
    flex: 0 0 calc(50% - 8px);
  }
  
  @media (max-width: 768px) {
    flex: 0 0 100%;
    max-width: 100%;
  }
`;

const SectorHeader = styled.div`
  margin-bottom: 1.25rem;
  padding-bottom: 1.25rem;
  border-bottom: 2px solid #f0f0f0;
`;

const SectorTitle = styled.h3`
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
  color: #1a1a1a;
  font-family: ${p => p.theme?.fonts?.title || 'Poppins, sans-serif'};
  line-height: 1.3;
  transition: color 0.3s ease;
  
  ${Sector}:hover & {
    color: #00C896;
  }
`;

const SectorDesc = styled.p`
  margin: 0;
  color: #495057;
  line-height: 1.7;
  font-size: 0.9375rem;
`;

export default function BenefitsBySectorPage() {
  const sectors = [
    {
      title: 'Government & Public Sector',
      description: 'Empower digital governance with AI insights and blockchain transparency. Streamline procurement, contracts, and citizen services with blockchain transparency. Use AI to predict economic trends and improve decision-making. Facilitate inter-agency financial flows and compliance tracking.'
    },
    {
      title: 'Financial Services & Fintech',
      description: 'Predict markets, secure payments, and automate brokerage operations. AI-driven insights for market trends, portfolio management, and fraud detection in real time. Enable instant, secure, cross-border transactions. Connect banks, brokers, and investors seamlessly in one ecosystem.'
    },
    {
      title: 'Real Estate & Property Management',
      description: 'Smart contracts and AI valuations for faster, trusted transactions. Automate rental, purchase, and mortgage agreements. Predict property value trends using data intelligence. Connect buyers, sellers, and agents across regions.'
    },
    {
      title: 'Logistics & Supply Chain',
      description: 'Optimize delivery, tracking, and supplier connections through AI. Reduce delivery costs and time through predictive logistics. Blockchain-secured tracking for goods and shipments. Connect suppliers, freight companies, and clients efficiently.'
    },
    {
      title: 'Non-Profit & Social Organizations',
      description: 'Ensure donation transparency and maximize social impact. Blockchain ensures donation transparency. Evaluate project efficiency and optimize resource allocation. Enable fundraising campaigns and digital outreach.'
    },
    {
      title: 'Small & Medium Businesses (SMBs)',
      description: 'All-in-one CRM, marketplace, and fintech tools to grow faster. CRM, marketplace, and payment tools integrated. Smart insights for sales, marketing, and customer retention. Access enterprise-level solutions at SMB-friendly costs.'
    },
    {
      title: 'Professional & Consulting Services',
      description: 'AI-powered automation for clients, projects, and digital visibility. Automate leads, meetings, and invoicing. Generate proposals, contracts, and marketing content instantly. Expand professional networks through the KimuntuX brokerage hub.'
    },
    {
      title: 'Universal Benefits',
      description: 'One intelligent ecosystem — secure, scalable, and globally connected. Manage commerce, finance, and clients from a single dashboard. Achieve smarter, safer, and faster operations. Operate locally or globally: B2B, B2C, or through affiliates.'
    }
  ];

  return (
    <Page>
      <Wrap>
        <HeroSection>
          <HeroImageWrapper>
            <HeroImage src={multiChannelImage} alt="Benefits by Sector" />
          </HeroImageWrapper>
          <HeroContent>
            <HeroTitle>Benefits by Sector</HeroTitle>
            <HeroSubtitle>How KimuntuX empowers organizations across every industry</HeroSubtitle>
          </HeroContent>
        </HeroSection>

        <Grid>
          {sectors.map((sector, index) => (
            <Sector key={index} index={index}>
              <SectorHeader>
                <SectorTitle>{sector.title}</SectorTitle>
              </SectorHeader>
              <SectorDesc>{sector.description}</SectorDesc>
            </Sector>
          ))}
        </Grid>
      </Wrap>
    </Page>
  );
}
