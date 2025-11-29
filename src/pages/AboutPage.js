import React from 'react';
import styled from 'styled-components';
import aboutImage from '../assets/About.jpg';

const Page = styled.div`
  min-height: 100vh;
  background: radial-gradient(1200px 600px at -10% -10%, ${p => (p.theme?.colors?.primary || '#00C896')}0D, transparent 60%),
              radial-gradient(1000px 500px at 110% -20%, ${p => (p.theme?.colors?.accent || '#DAA520')}0F, transparent 55%),
              ${p => p.theme?.colors?.background || '#FFFFFF'};
  padding-top: 120px;
  
  @media (max-width: 768px) {
    padding-top: 100px;
  }
`;

const Wrap = styled.div`
  max-width: 1120px;
  margin: 0 auto;
  padding: 48px 20px 72px;
`;

const Hero = styled.header`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3rem;
  padding: 0;
  margin: 0 0 4px;
  background: transparent;
  border: none;
  border-radius: 0;
  box-shadow: none;
  
  @media (max-width: 900px) {
    grid-template-columns: 1fr;
    gap: 2rem;
  }
`;

const HeroContent = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 28px 24px;
  background: linear-gradient(135deg, ${p => (p.theme?.colors?.primary || '#00C896')}0F, ${p => (p.theme?.colors?.accent || '#DAA520')}0F);
  border: 1px solid ${p => p.theme?.colors?.border || '#E5E5E5'};
  border-radius: 16px;
  box-shadow: 0 8px 20px rgba(0,0,0,0.04);
`;

const HeroImageContainer = styled.div`
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 8px 20px rgba(0,0,0,0.04);
  border: 1px solid ${p => p.theme?.colors?.border || '#E5E5E5'};
  background: ${p => p.theme?.colors?.cardBackground || '#f8f9fa'};
  min-height: 280px;
  display: flex;
  align-items: stretch;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, ${p => (p.theme?.colors?.primary || '#00C896')}05, ${p => (p.theme?.colors?.accent || '#DAA520')}05);
    z-index: 1;
    pointer-events: none;
  }
  
  @media (max-width: 900px) {
    min-height: 300px;
    max-height: 400px;
  }
`;

const HeroImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  display: block;
  transition: transform 0.3s ease;
  position: relative;
  z-index: 0;
  
  ${HeroImageContainer}:hover & {
    transform: scale(1.02);
  }
`;

const H1 = styled.h1`
  margin: 0 0 8px;
  font-size: 40px;
  line-height: 1.15;
  font-weight: 700;
  color: ${p => p.theme?.colors?.text || '#111111'};
  font-family: ${p => p.theme?.fonts?.title || 'Poppins, sans-serif'};
  position: relative;
  animation: fadeUp .5s ease-out both;
  
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  &::after {
    content: '';
    position: absolute;
    left: 0;
    bottom: -10px;
    width: 72px;
    height: 4px;
    background: linear-gradient(90deg, ${p => p.theme?.colors?.primary || '#00C896'}, ${p => p.theme?.colors?.accent || '#DAA520'});
    border-radius: 2px;
  }
`;

const Lead = styled.p`
  margin: 0 0 24px;
  color: ${p => p.theme?.colors?.text || '#111111'};
  opacity: .8;
  font-size: 18px;
  max-width: 820px;
`;

const Section = styled.section`
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 24px;
  padding: 32px 0;
  border-bottom: 1px solid ${p => p.theme?.colors?.border || '#E5E5E5'};
  animation: sectionIn .35s ease-out both;
  
  @keyframes sectionIn {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const Title = styled.h2`
  margin: 0;
  font-size: 20px;
  line-height: 1.3;
  font-weight: 700;
  color: ${p => p.theme?.colors?.text || '#111111'};
`;

const Body = styled.div`
  display: grid;
  gap: 12px;
  color: ${p => p.theme?.colors?.text || '#111111'};
  opacity: .95;
  line-height: 1.75;
`;

const Grid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  justify-content: center;
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: center;
  }
`;

const Card = styled.div`
  position: relative;
  border: 1px solid ${p => p.theme?.colors?.border || '#E5E5E5'};
  border-radius: 12px;
  padding: 16px;
  background: linear-gradient(180deg, ${p => (p.theme?.colors?.cardBackground || '#f8f9fa')} 0%, ${p => (p.theme?.colors?.background || '#FFFFFF')} 100%);
  box-shadow: 0 6px 18px rgba(0,0,0,0.04);
  transition: transform .25s ease, box-shadow .25s ease, border-color .25s ease;
  flex: 0 0 calc(33.333% - 11px);
  min-width: 240px;
  max-width: 300px;
  
  @media (max-width: 968px) {
    flex: 0 0 calc(50% - 8px);
  }
  
  @media (max-width: 768px) {
    flex: 0 0 100%;
    max-width: 100%;
  }
  
  &::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 3px;
    background: linear-gradient(90deg, ${p => p.theme?.colors?.primary || '#00C896'}, ${p => p.theme?.colors?.accent || '#DAA520'});
    border-top-left-radius: 12px;
    border-top-right-radius: 12px;
    opacity: .85;
  }
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 14px 32px rgba(0,0,0,0.08);
    border-color: ${p => p.theme?.colors?.primary || '#00C896'}33;
  }
`;

const Small = styled.h3`
  margin: 0 0 6px;
  font-size: 14px;
  font-weight: 600;
  color: ${p => p.theme?.colors?.text || '#111111'};
  opacity: .95;
  letter-spacing: .3px;
  text-transform: uppercase;
`;

const List = styled.ul`
  margin: 0; padding: 0 0 0 18px;
  display: grid; gap: 8px;
`;

// Refined bullets for feature lists inside "What We Offer"
const Bullets = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 8px;
`;

const Bullet = styled.li`
  position: relative;
  padding-left: 16px;
  color: ${p => p.theme?.colors?.text || '#111111'};
  opacity: .9;
  line-height: 1.6;
  
  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 10px;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: linear-gradient(135deg, ${p => p.theme?.colors?.primary || '#00C896'}, ${p => p.theme?.colors?.accent || '#DAA520'});
    box-shadow: 0 0 0 2px ${p => (p.theme?.colors?.background || '#FFFFFF')};
  }
`;

const InlineList = styled.div`
  display: grid; gap: 8px;
`;

const Muted = styled.p`
  margin: 0; opacity: .8;
`;

const FeatureText = styled.p`
  margin: 8px 0 0 0;
  font-size: 14px;
  line-height: 1.6;
  opacity: 0.9;
  color: ${p => p.theme?.colors?.text || '#111111'};
  
  &:first-of-type {
    margin-top: 8px;
  }
  
  &:not(:first-of-type) {
    margin-top: 4px;
  }
`;

export default function AboutPage() {
  return (
    <Page>
      <Wrap>
        <Hero>
          <HeroContent>
            <H1>About KimuntuX</H1>
            <Lead>The Intelligent Digital Brokerage & Marketing Universe.</Lead>
          </HeroContent>
          <HeroImageContainer>
            <HeroImage src={aboutImage} alt="KimuntuX Team" />
          </HeroImageContainer>
        </Hero>

        <Section>
          <Title>Our Vision</Title>
          <Body>
            <p>We believe in empowering the next generation of digital entrepreneurs, marketers, and enterprises through artificial intelligence, blockchain, and automation. Our vision is a universal digital ecosystem that connects people, businesses, and opportunities across industries—transforming how the world trades, markets, and grows.</p>
          </Body>
        </Section>

        <Section>
          <Title>Who We Are</Title>
          <Body>
            <p>KimuntuX is an AI‑powered Digital Brokerage, Fintech, and Marketing platform that unites technology, creativity, and commerce. It provides a single, intelligent environment for businesses, professionals, and creators to build, manage, and scale operations across finance, logistics, real estate, technology, digital marketing, and eCommerce.</p>
            <Muted>Born from the innovation initiative supported by Arizona State University’s Capstone Program and powered by Kimuntu Power Inc., KimuntuX was developed with the collaboration of four talented ASU students: Revanth Kumar Alimela, Allan Binu, Aryan Yeole, and Julian Korn.</Muted>
            <Muted>Together, they helped engineer the foundation of what would become one of the most advanced AI‑driven digital brokerage platforms of the decade.</Muted>
          </Body>
        </Section>

        <Section>
          <Title>Our Mission</Title>
          <Body>
            <p>To simplify digital transformation by integrating brokerage, fintech, and marketing into one smart ecosystem—enabling businesses and individuals to launch, grow, and scale globally with the power of AI. We aim to make digital entrepreneurship accessible to everyone, from startups to governments, from small agencies to multinational enterprises.</p>
          </Body>
        </Section>

        <Section>
          <Title>What We Offer</Title>
          <Body>
            <Grid>
              <Card>
                <Small>AI Brokerage Hub</Small>
                <FeatureText>AI matchmaking for B2B/B2C</FeatureText>
                <FeatureText>Blockchain‑secured contracts</FeatureText>
              </Card>
              <Card>
                <Small>CRM & Lead Automation</Small>
                <FeatureText>Predictive insights</FeatureText>
                <FeatureText>AI‑powered follow‑ups</FeatureText>
              </Card>
              <Card>
                <Small>AI Boutique Builder</Small>
                <FeatureText>Auto‑generated storefronts</FeatureText>
                <FeatureText>Content & design by AI</FeatureText>
              </Card>
              <Card>
                <Small>Smart Fintech Hub</Small>
                <FeatureText>Multi‑currency wallets & cross‑border payments</FeatureText>
                <FeatureText>AI stock & crypto insights</FeatureText>
              </Card>
              <Card>
                <Small>AI Marketing Suite</Small>
                <FeatureText>Create, launch & optimize campaigns</FeatureText>
                <FeatureText>Policy‑compliant across channels</FeatureText>
              </Card>
              <Card>
                <Small>Affiliate & Reseller</Small>
                <FeatureText>Performance tracking</FeatureText>
                <FeatureText>Commission tools</FeatureText>
              </Card>
              <Card>
                <Small>Campaign & Funnel Builder</Small>
                <FeatureText>Visual journeys</FeatureText>
                <FeatureText>Real‑time optimization</FeatureText>
              </Card>
              <Card>
                <Small>Multilingual Content</Small>
                <FeatureText>100+ languages</FeatureText>
                <FeatureText>Text & voice</FeatureText>
              </Card>
              <Card>
                <Small>Blockchain Layer</Small>
                <FeatureText>Smart contracts</FeatureText>
                <FeatureText>Tokenized rewards & transparency</FeatureText>
              </Card>
              <Card>
                <Small>Developer Ecosystem</Small>
                <FeatureText>Open API & SDK marketplace</FeatureText>
                <FeatureText>Extensions & integrations</FeatureText>
              </Card>
            </Grid>
          </Body>
        </Section>

        <Section>
          <Title>Who We Serve</Title>
          <Body>
            <Grid>
              <Card><Small>Governments</Small><p>Transparency, automation, and citizen‑focused services.</p></Card>
              <Card><Small>Financial Institutions</Small><p>Digital brokerage, payment orchestration, compliance.</p></Card>
              <Card><Small>Real Estate</Small><p>Listings automation, client matching, blockchain contracts.</p></Card>
              <Card><Small>Logistics & Supply Chain</Small><p>Routing optimization, supplier management, delivery tracking.</p></Card>
              <Card><Small>Agencies</Small><p>Centralized ad creation and performance analytics.</p></Card>
              <Card><Small>Non‑Profits</Small><p>Transparent funds and maximized impact.</p></Card>
              <Card><Small>SMBs & Startups</Small><p>Affordable CRM, marketing, and marketplace tools.</p></Card>
              <Card><Small>Professional Services</Small><p>Automated engagement, contracts, and communication.</p></Card>
            </Grid>
          </Body>
        </Section>

        <Section>
          <Title>Technology Core</Title>
          <Body>
            <Grid>
              <Card><Small>AI & ML</Small><p>Predictive analytics, automation, recommendations.</p></Card>
              <Card><Small>Blockchain</Small><p>Smart contracts, verifiable transactions, transparency.</p></Card>
              <Card><Small>Fintech Layer</Small><p>Wallets, payments, brokerage, digital assets.</p></Card>
              <Card><Small>Marketing Engine</Small><p>Real‑time campaign optimization.</p></Card>
              <Card><Small>Cloud Infrastructure</Small><p>Secure, scalable, compliant global footprint.</p></Card>
            </Grid>
          </Body>
        </Section>

        <Section>
          <Title>Our Commitment</Title>
          <Body>
            <p>We are building the future of intelligent digital commerce and marketing, enabling every entrepreneur and enterprise to thrive in a transparent, trusted, and innovative economy.</p>
          </Body>
        </Section>

        <Section>
          <Title>Motto & Contact</Title>
          <Body>
            <InlineList>
              <p><strong>Motto:</strong> “Beyond eCommerce : Where AI Builds the Future of Business.”</p>
              <p><strong>Contact:</strong> contact@kimuntux.com</p>
              <p><strong>Help center:</strong> support@kimuntux.com</p>
            </InlineList>
          </Body>
        </Section>
      </Wrap>
    </Page>
  );
}
