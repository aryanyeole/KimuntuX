import React from 'react';
import styled from 'styled-components';

const Page = styled.div`
  min-height: 100vh;
  background: radial-gradient(1200px 600px at -10% -10%, ${p => (p.theme?.colors?.primary || '#00C896')}0D, transparent 60%),
              radial-gradient(1000px 500px at 110% -20%, ${p => (p.theme?.colors?.accent || '#DAA520')}0F, transparent 55%),
              ${p => p.theme?.colors?.background || '#FFFFFF'};
`;

const Wrap = styled.div`
  max-width: 1120px;
  margin: 0 auto;
  padding: 48px 20px 72px;
`;

const Hero = styled.header`
  text-align: center;
  margin-bottom: 32px;
`;

const H1 = styled.h1`
  margin: 0 0 8px;
  font-size: 40px;
  font-weight: 700;
  color: ${p => p.theme?.colors?.text || '#111111'};
  font-family: ${p => p.theme?.fonts?.title || 'Poppins, sans-serif'};
`;

const Lead = styled.p`
  margin: 0 auto 8px;
  color: ${p => p.theme?.colors?.text || '#111111'};
  opacity: .85;
  font-size: 18px;
  max-width: 780px;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
`;

const Sector = styled.div`
  position: relative;
  background: linear-gradient(180deg, ${p => (p.theme?.colors?.cardBackground || '#f8f9fa')} 0%, ${p => (p.theme?.colors?.background || '#FFFFFF')} 100%);
  border: 1px solid ${p => p.theme?.colors?.border || '#E5E5E5'};
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 8px 20px rgba(0,0,0,0.04);
  transition: transform .25s ease, box-shadow .25s ease, border-color .25s ease;
  
  &::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 4px;
    background: linear-gradient(90deg, ${p => p.theme?.colors?.primary || '#00C896'}, ${p => p.theme?.colors?.accent || '#DAA520'});
    border-top-left-radius: 16px;
    border-top-right-radius: 16px;
  }
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 14px 32px rgba(0,0,0,0.08);
    border-color: ${p => p.theme?.colors?.primary || '#00C896'}33;
  }
`;

const SectorTitle = styled.h3`
  margin: 0 0 8px;
  font-size: 18px;
  font-weight: 700;
  color: ${p => p.theme?.colors?.text || '#111111'};
`;

const SectorDesc = styled.p`
  margin: 0;
  color: ${p => p.theme?.colors?.text || '#111111'};
  opacity: .9;
  line-height: 1.6;
`;

export default function BenefitsBySectorPage() {
  return (
    <Page>
      <Wrap>
        <Hero>
          <H1>Benefits by Sector</H1>
          <Lead>How KimuntuX empowers organizations across every industry</Lead>
        </Hero>

        <Grid>
          <Sector>
            <SectorTitle>🏛 Government & Public Sector</SectorTitle>
            <SectorDesc>Empower digital governance with AI insights and blockchain transparency. Streamline procurement, contracts, and citizen services with blockchain transparency. Use AI to predict economic trends and improve decision-making. Facilitate inter-agency financial flows and compliance tracking.</SectorDesc>
          </Sector>

          <Sector>
            <SectorTitle>💰 Financial Services & Fintech</SectorTitle>
            <SectorDesc>Predict markets, secure payments, and automate brokerage operations. AI-driven insights for market trends, portfolio management, and fraud detection in real time. Enable instant, secure, cross-border transactions. Connect banks, brokers, and investors seamlessly in one ecosystem.</SectorDesc>
          </Sector>

          <Sector>
            <SectorTitle>🏠 Real Estate & Property Management</SectorTitle>
            <SectorDesc>Smart contracts and AI valuations for faster, trusted transactions. Automate rental, purchase, and mortgage agreements. Predict property value trends using data intelligence. Connect buyers, sellers, and agents across regions.</SectorDesc>
          </Sector>

          <Sector>
            <SectorTitle>🚛 Logistics & Supply Chain</SectorTitle>
            <SectorDesc>Optimize delivery, tracking, and supplier connections through AI. Reduce delivery costs and time through predictive logistics. Blockchain-secured tracking for goods and shipments. Connect suppliers, freight companies, and clients efficiently.</SectorDesc>
          </Sector>

          <Sector>
            <SectorTitle>🌍 Non-Profit & Social Organizations</SectorTitle>
            <SectorDesc>Ensure donation transparency and maximize social impact. Blockchain ensures donation transparency. Evaluate project efficiency and optimize resource allocation. Enable fundraising campaigns and digital outreach.</SectorDesc>
          </Sector>

          <Sector>
            <SectorTitle>🏢 Small & Medium Businesses (SMBs)</SectorTitle>
            <SectorDesc>All-in-one CRM, marketplace, and fintech tools to grow faster. CRM, marketplace, and payment tools integrated. Smart insights for sales, marketing, and customer retention. Access enterprise-level solutions at SMB-friendly costs.</SectorDesc>
          </Sector>

          <Sector>
            <SectorTitle>👨‍💼 Professional & Consulting Services</SectorTitle>
            <SectorDesc>AI-powered automation for clients, projects, and digital visibility. Automate leads, meetings, and invoicing. Generate proposals, contracts, and marketing content instantly. Expand professional networks through the KimuntuX brokerage hub.</SectorDesc>
          </Sector>

          <Sector>
            <SectorTitle>💡 Universal Benefits</SectorTitle>
            <SectorDesc>One intelligent ecosystem — secure, scalable, and globally connected. Manage commerce, finance, and clients from a single dashboard. Achieve smarter, safer, and faster operations. Operate locally or globally: B2B, B2C, or through affiliates.</SectorDesc>
          </Sector>
        </Grid>
      </Wrap>
    </Page>
  );
}
