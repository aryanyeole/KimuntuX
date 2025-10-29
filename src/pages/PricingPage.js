import React from 'react';
import styled from 'styled-components';

const Page = styled.div`
  min-height: 100vh;
  background: radial-gradient(900px 500px at -10% -10%, ${p => (p.theme?.colors?.primary || '#00C896')}0D, transparent 55%),
              radial-gradient(900px 500px at 110% -10%, ${p => (p.theme?.colors?.accent || '#DAA520')}0F, transparent 55%),
              ${p => p.theme?.colors?.background || '#FFFFFF'};
`;

const Wrap = styled.div`
  max-width: 1120px;
  margin: 0 auto;
  padding: 48px 20px 72px;
`;

const Hero = styled.header`
  text-align: center;
  margin-bottom: 28px;
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
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 22px;
  align-items: stretch;
`;

const Tier = styled.div`
  position: relative;
  display: grid;
  grid-template-rows: auto auto 1fr auto;
  background: ${p => p.theme?.colors?.background || '#FFFFFF'};
  border: 1px solid ${p => p.theme?.colors?.border || '#E5E5E5'};
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(0,0,0,0.04);
  transition: transform .25s ease, box-shadow .25s ease, border-color .25s ease;

  &:hover {
    transform: translateY(-6px);
    box-shadow: 0 18px 42px rgba(0,0,0,0.08);
    border-color: ${p => (p.theme?.colors?.primary || '#00C896')}30;
  }
`;

const TierHeader = styled.div`
  padding: 16px 16px 12px;
  background: linear-gradient(180deg, ${p => (p.theme?.colors?.cardBackground || '#f8f9fa')} 0%, transparent 100%);
  border-bottom: 1px solid ${p => p.theme?.colors?.border || '#E5E5E5'};
`;

const Badge = styled.span`
  display: inline-block;
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 600;
  border-radius: 999px;
  letter-spacing: .2px;
  color: ${p => p.theme?.colors?.primary || '#00C896'};
  background: ${p => (p.theme?.colors?.primary || '#00C896')}15;
  border: 1px solid ${p => (p.theme?.colors?.primary || '#00C896')}30;
`;

const PlanName = styled.h3`
  margin: 0 0 4px;
  font-size: 18px;
  font-weight: 700;
  color: ${p => p.theme?.colors?.text || '#111111'};
`;

const Tag = styled.span`
  display: inline-block;
  margin-bottom: 8px;
  padding: 4px 8px;
  font-size: 12px;
  border-radius: 999px;
  color: ${p => p.theme?.colors?.primary || '#00C896'};
  background: ${p => (p.theme?.colors?.primary || '#00C896')}15;
  border: 1px solid ${p => (p.theme?.colors?.primary || '#00C896')}30;
`;

const PriceWrap = styled.div`
  display: flex; align-items: baseline; gap: 6px;
  padding: 12px 16px 0;
`;

const Price = styled.span`
  font-size: 22px; font-weight: 700; color: ${p => p.theme?.colors?.text || '#111111'};
`;

const PriceNote = styled.span`
  font-size: 12px; opacity: .65; color: ${p => p.theme?.colors?.text || '#111111'};
`;

const List = styled.ul`
  list-style: none;
  margin: 10px 16px 14px;
  padding: 0;
  display: grid;
  gap: 8px;
`;

const Item = styled.li`
  position: relative;
  padding-left: 16px;
  color: ${p => p.theme?.colors?.text || '#111111'};
  opacity: .9;
  line-height: 1.6;
  
  &::before {
    content: '';
    position: absolute;
    left: 0; top: 10px;
    width: 8px; height: 8px; border-radius: 50%;
    background: linear-gradient(135deg, ${p => p.theme?.colors?.primary || '#00C896'}, ${p => p.theme?.colors?.accent || '#DAA520'});
    box-shadow: 0 0 0 2px ${p => p.theme?.colors?.background || '#FFFFFF'};
  }
`;

const CTA = styled.div`
  padding: 14px 16px 16px;
  border-top: 1px solid ${p => p.theme?.colors?.border || '#E5E5E5'};
`;

const Button = styled.button`
  width: 100%;
  border: 1px solid ${p => p.theme?.colors?.primary || '#00C896'};
  background: linear-gradient(90deg, ${p => (p.theme?.colors?.primary || '#00C896')} 0%, ${p => (p.theme?.colors?.accent || '#DAA520')} 100%);
  color: white;
  border-radius: 10px;
  padding: 10px 14px;
  font-weight: 600;
  cursor: pointer;
  transition: transform .2s ease, box-shadow .2s ease;

  &:hover { transform: translateY(-2px); box-shadow: 0 10px 22px rgba(0,0,0,.12); }
`;

const Footer = styled.section`
  margin-top: 28px;
  padding-top: 20px;
  border-top: 1px solid ${p => p.theme?.colors?.border || '#E5E5E5'};
`;

const FooterTitle = styled.h4`
  margin: 0 0 10px; font-size: 16px; font-weight: 700;
  color: ${p => p.theme?.colors?.text || '#111111'};
`;

const Addons = styled.div`
  display: grid; gap: 10px; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
`;

const Addon = styled.div`
  border: 1px solid ${p => p.theme?.colors?.border || '#E5E5E5'};
  border-radius: 12px; padding: 12px 14px; background: ${p => p.theme?.colors?.background || '#FFFFFF'};
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
            <TierHeader>
              <Badge>Starter</Badge>
              <PlanName>Free Plan</PlanName>
              <Tag>For beginners exploring digital entrepreneurship</Tag>
            </TierHeader>
            <PriceWrap>
              <Price>💲 $19–$29</Price><PriceNote>/month (region-adjusted)</PriceNote>
            </PriceWrap>
            <List>
              <Item>1 AI-generated boutique/store</Item>
              <Item>Basic CRM & lead tracking</Item>
              <Item>Limited AI content generator (text only)</Item>
              <Item>Single-channel social ad integration (Facebook or Instagram)</Item>
              <Item>Basic analytics dashboard</Item>
              <Item>Community support</Item>
            </List>
            <CTA>
              <Button>Get Started</Button>
            </CTA>
          </Tier>

          <Tier>
            <TierHeader>
              <Badge>Most Popular</Badge>
              <PlanName>Pro Plan · “Growth”</PlanName>
              <Tag>For small & medium businesses scaling operations</Tag>
            </TierHeader>
            <PriceWrap>
              <Price>💲 $49–$99</Price><PriceNote>/month (region-adjusted)</PriceNote>
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
            <CTA>
              <Button>Start Growth</Button>
            </CTA>
          </Tier>

          <Tier>
            <TierHeader>
              <Badge>Advanced</Badge>
              <PlanName>Business Plan · “ScaleX”</PlanName>
              <Tag>For agencies, resellers, and digital entrepreneurs</Tag>
            </TierHeader>
            <PriceWrap>
              <Price>💲 $199–$299</Price><PriceNote>/month</PriceNote>
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
            <CTA>
              <Button>Choose ScaleX</Button>
            </CTA>
          </Tier>

          <Tier>
            <TierHeader>
              <Badge>Enterprise</Badge>
              <PlanName>Enterprise Plan · “KimuntuX Global”</PlanName>
              <Tag>For governments, corporations, and large-scale brokers</Tag>
            </TierHeader>
            <PriceWrap>
              <Price>💲 Custom</Price><PriceNote>Enterprise Quote / Annual Contract</PriceNote>
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
            <CTA>
              <Button>Contact Sales</Button>
            </CTA>
          </Tier>
        </Grid>

        <Footer>
          <FooterTitle>Add-Ons (Optional Upgrades)</FooterTitle>
          <Addons>
            <Addon>AI Copywriter Pro (ad scripts, long-form content)</Addon>
            <Addon>Auto Funnel Builder (drag-and-drop AI funnels)</Addon>
            <Addon>KimuntuX Academy (training & certification portal)</Addon>
            <Addon>Affiliate Program Management Suite</Addon>
            <Addon>Blockchain Loyalty & Token Rewards</Addon>
          </Addons>
        </Footer>
      </Wrap>
    </Page>
  );
}


