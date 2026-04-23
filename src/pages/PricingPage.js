import React from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';

const Page = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #008B8B 0%, #00C896 50%, #20B2AA 100%);
  padding-top: 120px;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: 
      radial-gradient(circle at 20% 30%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
      radial-gradient(circle at 80% 70%, rgba(255, 255, 255, 0.05) 0%, transparent 50%);
    pointer-events: none;
  }
  
  @media (max-width: 768px) {
    padding-top: 100px;
  }
`;

const Wrap = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 60px 20px 72px;
  position: relative;
  z-index: 1;
`;

const Hero = styled.header`
  text-align: center;
  margin-bottom: 4rem;
  color: white;
`;

const H1 = styled.h1`
  margin: 0 0 12px;
  font-size: 3.5rem;
  font-weight: 700;
  color: white;
  font-family: ${p => p.theme?.fonts?.title || 'Poppins, sans-serif'};
  letter-spacing: -0.02em;
  
  @media (max-width: 768px) {
    font-size: 2.5rem;
  }
`;

const Lead = styled.p`
  margin: 0 auto;
  color: rgba(255, 255, 255, 0.95);
  font-size: 1.25rem;
  max-width: 700px;
  line-height: 1.6;
  
  @media (max-width: 768px) {
    font-size: 1.125rem;
  }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 2rem;
  align-items: stretch;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
`;

const Tier = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  background: #000000;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 24px;
  padding: 2.5rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
  height: 100%;
  ${p => p.isPopular && `
    border: 2px solid rgba(255, 255, 255, 0.4);
    box-shadow: 0 12px 48px rgba(0, 0, 0, 0.4);
  `}
  
  &:hover {
    transform: translateY(-8px);
    box-shadow: 0 16px 64px rgba(0, 0, 0, 0.5);
    border-color: rgba(255, 255, 255, 0.3);
  }
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, ${p => p.theme?.colors?.primary || '#00C896'}, ${p => p.theme?.colors?.accent || '#DAA520'});
    border-top-left-radius: 24px;
    border-top-right-radius: 24px;
    opacity: ${p => p.isPopular ? '1' : '0.5'};
  }
`;

const PopularBadge = styled.div`
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(135deg, #FFD700, #FFA500);
  color: #000;
  padding: 6px 20px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  box-shadow: 0 4px 12px rgba(255, 215, 0, 0.4);
  z-index: 2;
`;

const Badge = styled.span`
  display: block;
  padding: 6px 16px;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 20px;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  margin: 0 auto 1rem auto;
  text-align: center;
  width: fit-content;
`;

const PlanName = styled.h3`
  margin: 0 0 8px;
  font-size: 1.75rem;
  font-weight: 700;
  color: white;
  font-family: ${p => p.theme?.fonts?.title || 'Poppins, sans-serif'};
  line-height: 1.2;
  text-align: center;
`;

const Tag = styled.p`
  margin: 0 0 1.5rem;
  color: rgba(255, 255, 255, 0.85);
  font-size: 0.9375rem;
  line-height: 1.5;
  text-align: center;
`;

const PriceWrap = styled.div`
  display: flex;
  flex-direction: column;
  margin-bottom: 2rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  align-items: center;
`;

const PriceRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: center;
  text-align: center;
`;

const Price = styled.span`
  font-size: 2.5rem;
  font-weight: 700;
  color: white;
  font-family: ${p => p.theme?.fonts?.title || 'Poppins, sans-serif'};
  line-height: 1.2;
  text-align: center;
  
  @media (max-width: 768px) {
    font-size: 2rem;
  }
`;

const PriceNote = styled.span`
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 400;
  line-height: 1.4;
  text-align: center;
`;

const PriceSubNote = styled.span`
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.65);
  font-weight: 400;
  line-height: 1.4;
  margin-top: 2px;
  text-align: center;
`;

const List = styled.ul`
  list-style: none;
  margin: 0 0 2rem 0;
  padding: 0;
  display: grid;
  gap: 12px;
  flex: 1;
  min-height: 0;
`;

const Item = styled.li`
  position: relative;
  padding-left: 28px;
  color: rgba(255, 255, 255, 0.95);
  font-size: 0.9375rem;
  line-height: 1.6;
  
  &::before {
    content: '✓';
    position: absolute;
    left: 0;
    top: 0;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 50%;
    color: white;
    font-size: 0.75rem;
    font-weight: 700;
    border: 1px solid rgba(255, 255, 255, 0.3);
  }
`;

const Button = styled(Link)`
  width: 100%;
  background: white;
  color: #008B8B;
  border: none;
  border-radius: 12px;
  padding: 16px 24px;
  font-weight: 700;
  font-size: 1.25rem;
  cursor: pointer;
  transition: all 0.3s ease;
  text-decoration: none;
  text-align: center;
  display: block;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
    background: rgba(255, 255, 255, 0.95);
  }
`;

const PopularButton = styled(Link)`
  width: 100%;
  background: linear-gradient(135deg, #FFD700, #FFA500);
  color: #000;
  border: none;
  border-radius: 12px;
  padding: 16px 24px;
  font-weight: 700;
  font-size: 1.25rem;
  cursor: pointer;
  transition: all 0.3s ease;
  text-decoration: none;
  text-align: center;
  display: block;
  box-shadow: 0 4px 12px rgba(255, 215, 0, 0.4);
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(255, 215, 0, 0.6);
    background: linear-gradient(135deg, #FFED4E, #FFB347);
  }
`;

const Footer = styled.section`
  margin-top: 4rem;
  padding-top: 2rem;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
`;

const FooterTitle = styled.h4`
  margin: 0 0 1.5rem;
  font-size: 1.25rem;
  font-weight: 700;
  color: white;
  text-align: center;
  font-family: ${p => p.theme?.fonts?.title || 'Poppins, sans-serif'};
`;

const Addons = styled.div`
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const Addon = styled.div`
  background: #000000;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 1rem 1.25rem;
  color: white;
  font-size: 0.9375rem;
  text-align: center;
  transition: all 0.3s ease;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
    border-color: rgba(255, 255, 255, 0.3);
  }
`;

export default function PricingPage() {
  return (
    <Page>
      <Wrap>
        <Hero>
          <H1>Pricing Plans</H1>
          <Lead>Smart, Scalable, and Designed for Every Visionary Entrepreneur</Lead>
        </Hero>

        <Grid>
          <Tier>
            <Badge>Starter</Badge>
            <PlanName>Starting Plan · "Starter"</PlanName>
            <Tag>For beginners exploring digital entrepreneurship</Tag>
            <PriceWrap>
              <PriceRow>
                <Price>$19–$29</Price>
                <PriceNote>per month</PriceNote>
                <PriceSubNote>region-adjusted pricing</PriceSubNote>
              </PriceRow>
            </PriceWrap>
            <List>
              <Item>1 AI-generated boutique/store</Item>
              <Item>Basic CRM & lead tracking</Item>
              <Item>Limited AI content generator (text only)</Item>
              <Item>Single-channel social ad integration (Facebook or Instagram)</Item>
              <Item>Basic analytics dashboard</Item>
              <Item>Community support</Item>
            </List>
            <Button to="/signup">Get Started</Button>
          </Tier>

          <Tier isPopular={true}>
            <PopularBadge>Most Popular</PopularBadge>
            <Badge>Professional</Badge>
            <PlanName>Pro Plan · "Growth"</PlanName>
            <Tag>For small & medium businesses scaling operations</Tag>
            <PriceWrap>
              <PriceRow>
                <Price>$49–$99</Price>
                <PriceNote>per month</PriceNote>
                <PriceSubNote>region-adjusted pricing</PriceSubNote>
              </PriceRow>
            </PriceWrap>
            <List>
              <Item>Everything in Starter</Item>
              <Item>Up to 5 boutiques or service funnels</Item>
              <Item>Full AI Content Creator (Text + Image + Voice Multilanguage)</Item>
              <Item>Smart CRM with automation workflows</Item>
              <Item>B2C Marketplace Integration (eCommerce + Payments)</Item>
              <Item>AI Campaign Optimization (Facebook, Instagram, TikTok, Google)</Item>
              <Item>Fintech Hub access (Digital Wallet, Payments, Escrow, BNPL)</Item>
              <Item>AI Translation + Rewrite compliance tool</Item>
              <Item>Priority chat & email support</Item>
            </List>
            <PopularButton to="/signup">Start Growth</PopularButton>
          </Tier>

          <Tier>
            <Badge>Advanced</Badge>
            <PlanName>Business Plan · "ScaleX"</PlanName>
            <Tag>For agencies, resellers, and digital entrepreneurs</Tag>
            <PriceWrap>
              <PriceRow>
                <Price>$199–$299</Price>
                <PriceNote>per month</PriceNote>
              </PriceRow>
            </PriceWrap>
            <List>
              <Item>Everything in Growth</Item>
              <Item>Unlimited stores or campaigns</Item>
              <Item>B2B + Affiliate Program Hub</Item>
              <Item>Smart Fintech Hub (Crypto + Stock Market Trading + AI Prediction)</Item>
              <Item>Blockchain Smart Contract Builder</Item>
              <Item>AI-powered Sales Forecasting & ROI Intelligence</Item>
              <Item>Multi-Platform Integration (Shopify, WooCommerce, Amazon, TikTok Shop)</Item>
              <Item>Team collaboration dashboard</Item>
              <Item>API & SDK access for custom development</Item>
              <Item>24/7 Premium AI Assistant</Item>
            </List>
            <Button to="/signup">Choose ScaleX</Button>
          </Tier>

          <Tier>
            <Badge>Enterprise</Badge>
            <PlanName>Enterprise Plan · "X Global"</PlanName>
            <Tag>For governments, corporations, and large-scale brokers</Tag>
            <PriceWrap>
              <PriceRow>
                <Price>Custom</Price>
                <PriceNote>Enterprise Quote</PriceNote>
                <PriceSubNote>Annual Contract</PriceSubNote>
              </PriceRow>
            </PriceWrap>
            <List>
              <Item>Everything in ScaleX</Item>
              <Item>Custom AI & Blockchain modules</Item>
              <Item>Enterprise-grade Smart CRM (multi-region, multi-brand)</Item>
              <Item>White-label branding & sub-accounts</Item>
              <Item>Dedicated cloud infrastructure (AWS/Azure/GCP)</Item>
              <Item>AI Fintech Orchestration with cross-border compliance</Item>
              <Item>Partner revenue sharing dashboard</Item>
              <Item>Advanced analytics, fraud detection, and audit tools</Item>
              <Item>Dedicated success manager + enterprise SLA</Item>
            </List>
            <Button as="a" href="mailto:contact@KimuX.com">Contact Sales</Button>
          </Tier>
        </Grid>

        <Footer>
          <FooterTitle>Add-Ons (Optional Upgrades)</FooterTitle>
          <Addons>
            <Addon>AI Copywriter Pro (ad scripts, long-form content)</Addon>
            <Addon>Auto Funnel Builder (drag-and-drop AI funnels)</Addon>
            <Addon>KimuX Academy (training & certification portal)</Addon>
            <Addon>Affiliate Program Management Suite</Addon>
          </Addons>
        </Footer>
      </Wrap>
    </Page>
  );
}
