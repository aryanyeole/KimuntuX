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
  max-width: 1320px;
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
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1.25rem;
  align-items: stretch;

  @media (max-width: 1024px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 1.5rem;
  }

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
  border-radius: 20px;
  padding: 1.65rem 1.35rem 1.75rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
  height: 100%;
  min-width: 0;
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
    border-top-left-radius: 20px;
    border-top-right-radius: 20px;
    opacity: ${p => p.isPopular ? '1' : '0.5'};
  }
`;

const PopularBadge = styled.div`
  position: absolute;
  top: -10px;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(135deg, #FFD700, #FFA500);
  color: #000;
  padding: 5px 14px;
  border-radius: 20px;
  font-size: 0.6875rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  box-shadow: 0 4px 12px rgba(255, 215, 0, 0.4);
  z-index: 2;
  white-space: nowrap;
`;

const Badge = styled.span`
  display: block;
  padding: 5px 12px;
  font-size: 0.8125rem;
  font-weight: 600;
  border-radius: 20px;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  margin: 0 auto 0.75rem auto;
  text-align: center;
  width: fit-content;
`;

const PlanName = styled.h3`
  margin: 0 0 6px;
  font-size: clamp(1.05rem, 1.1vw + 0.85rem, 1.35rem);
  font-weight: 700;
  color: white;
  font-family: ${p => p.theme?.fonts?.title || 'Poppins, sans-serif'};
  line-height: 1.25;
  text-align: center;
`;

const Tag = styled.p`
  margin: 0 0 1.1rem;
  color: rgba(255, 255, 255, 0.85);
  font-size: 0.8125rem;
  line-height: 1.45;
  text-align: center;
`;

const PriceWrap = styled.div`
  display: flex;
  flex-direction: column;
  margin-bottom: 1.35rem;
  padding-bottom: 1.35rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  align-items: center;
`;

const PriceRow = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 0.35rem;
  align-items: baseline;
  justify-content: center;
  text-align: center;
`;

const Price = styled.span`
  font-size: clamp(1.65rem, 2vw + 1rem, 2.1rem);
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
  font-size: clamp(0.95rem, 1.1vw, 1.05rem);
  color: rgba(255, 255, 255, 0.82);
  font-weight: 500;
  line-height: 1.2;
  text-align: center;
  white-space: nowrap;
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
  margin: 0 0 1.35rem 0;
  padding: 0;
  display: grid;
  gap: 1rem;
  flex: 1;
  min-height: 0;
`;

const Item = styled.li`
  position: relative;
  padding: 0.15rem 0 0.15rem 2rem;
  color: rgba(255, 255, 255, 0.95);
  font-size: 0.9375rem;
  line-height: 1.65;

  &::before {
    content: '✓';
    position: absolute;
    left: 0;
    top: 0.2em;
    width: 22px;
    height: 22px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 50%;
    color: white;
    font-size: 0.8125rem;
    font-weight: 700;
    border: 1px solid rgba(255, 255, 255, 0.3);
    flex-shrink: 0;
  }
`;

const Button = styled(Link)`
  width: 100%;
  background: white;
  color: #008B8B;
  border: none;
  border-radius: 12px;
  padding: 12px 16px;
  font-weight: 700;
  font-size: 1rem;
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
  padding: 12px 16px;
  font-weight: 700;
  font-size: 1rem;
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
          <H1>Start Free. No Risk. Cancel Anytime.</H1>
          <Lead>
            Every plan includes a 14-day free trial with full access. No credit card required to start.
            Upgrade, downgrade, or cancel from your dashboard in one click.
          </Lead>
        </Hero>

        <Grid>
          <Tier>
            <Badge>Starter</Badge>
            <PlanName>Starter</PlanName>
            <Tag>For early-stage teams and solo founders</Tag>
            <PriceWrap>
              <PriceRow>
                <Price>$199</Price>
                <PriceNote>/month</PriceNote>
              </PriceRow>
            </PriceWrap>
            <List>
              <Item>Up to 500 leads / month</Item>
              <Item>Live pipeline board</Item>
              <Item>5 integrations</Item>
              <Item>Basic AI lead scoring</Item>
              <Item>7-day email support</Item>
            </List>
            <Button to="/signup">Start Free →</Button>
          </Tier>

          <Tier isPopular={true}>
            <PopularBadge>Most Popular</PopularBadge>
            <Badge>Pro</Badge>
            <PlanName>Pro</PlanName>
            <Tag>For growing businesses with active sales teams</Tag>
            <PriceWrap>
              <PriceRow>
                <Price>$799</Price>
                <PriceNote>/month</PriceNote>
              </PriceRow>
            </PriceWrap>
            <List>
              <Item>Unlimited leads</Item>
              <Item>Full Kanban pipeline board</Item>
              <Item>All 15+ integrations</Item>
              <Item>Advanced AI lead scoring</Item>
              <Item>AI Strategy Engine + Coach</Item>
              <Item>Custom reports & exports</Item>
              <Item>Priority support (4-hr SLA)</Item>
              <Item>Team seats (up to 5 users)</Item>
            </List>
            <PopularButton to="/signup">Start Pro Trial — Free 14 Days →</PopularButton>
          </Tier>

          <Tier>
            <Badge>Enterprise</Badge>
            <PlanName>Enterprise</PlanName>
            <Tag>For organizations needing scale and dedicated support</Tag>
            <PriceWrap>
              <PriceRow>
                <Price>$2,999</Price>
                <PriceNote>/month</PriceNote>
              </PriceRow>
            </PriceWrap>
            <List>
              <Item>Everything in Pro</Item>
              <Item>Unlimited team seats</Item>
              <Item>Dedicated AI agent</Item>
              <Item>White-label options</Item>
              <Item>Custom integrations</Item>
              <Item>Dedicated account manager</Item>
              <Item>99.9% uptime SLA</Item>
            </List>
            <Button to="/signup">Talk to Sales →</Button>
          </Tier>
        </Grid>

        <Footer>
          <FooterTitle>Included in Every Plan</FooterTitle>
          <Addons>
            <Addon>14-day free trial on all plans</Addon>
            <Addon>No credit card required</Addon>
            <Addon>Cancel from your dashboard in one click</Addon>
          </Addons>
        </Footer>
      </Wrap>
    </Page>
  );
}
