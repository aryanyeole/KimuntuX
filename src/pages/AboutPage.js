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

const HeroImageContainer = styled.div`
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

const H1 = styled.h1`
  margin: 0 0 1rem 0;
  font-size: 3.5rem;
  line-height: 1.15;
  font-weight: 700;
  color: white;
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

const Lead = styled.p`
  margin: 0;
  color: rgba(255, 255, 255, 0.95);
  font-size: 1.75rem;
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
  
  &:first-of-type {
    padding-top: 30px;
  }
`;

const Title = styled.h2`
  margin: 0;
  font-size: 28px;
  line-height: 1.3;
  font-weight: 700;
  color: ${p => p.theme?.colors?.text || '#111111'};
  
  @media (max-width: 768px) {
    font-size: 24px;
  }
`;

const Body = styled.div`
  display: grid;
  gap: 12px;
  color: ${p => p.theme?.colors?.text || '#111111'};
  opacity: .95;
  line-height: 1.75;
  font-size: 18px;
  
  @media (max-width: 768px) {
    font-size: 16px;
  }
  
  p {
    font-size: 18px;
    
    @media (max-width: 768px) {
      font-size: 16px;
    }
  }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 2rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
`;

const Card = styled.div`
  position: relative;
  border: 1px solid #e9ecef;
  border-radius: 12px;
  padding: 1.5rem;
  background: #ffffff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
    border-color: ${p => p.theme?.colors?.primary || '#00C896'};
  }
`;

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const IconBadge = styled.span`
  display: none;
`;

const Small = styled.h3`
  margin: 0;
  font-size: 1.125rem;
  font-weight: 700;
  color: #1a1a1a;
  font-family: ${p => p.theme?.fonts?.title || 'Poppins, sans-serif'};
  line-height: 1.3;
  transition: color 0.3s ease;
  
  ${Card}:hover & {
    color: ${p => p.theme?.colors?.primary || '#00C896'};
  }
`;

const CardBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const List = styled.ul`
  margin: 0; 
  padding: 0 0 0 18px;
  display: grid; 
  gap: 8px;
`;

// Refined bullets for feature lists inside "What We Offer"
const Bullets = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.75rem;
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
  display: grid; 
  gap: 8px;
`;

const Muted = styled.p`
  margin: 0; 
  opacity: .8;
`;

const FeatureText = styled.p`
  margin: 0;
  font-size: 0.9375rem;
  line-height: 1.6;
  color: #495057;
  font-weight: 400;
  position: relative;
  padding-left: 1.25rem;
  transition: all 0.3s ease;
  
  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0.5rem;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: ${p => p.theme?.colors?.primary || '#00C896'};
    transition: transform 0.3s ease;
  }
  
  ${Card}:hover & {
    color: #1a1a1a;
    
    &::before {
      transform: scale(1.3);
    }
  }
`;

const CardDescription = styled.p`
  margin: 0;
  font-size: 0.9375rem;
  line-height: 1.6;
  color: #495057;
  font-weight: 400;
  transition: color 0.3s ease;
  
  ${Card}:hover & {
    color: #1a1a1a;
  }
`;

export default function AboutPage() {
  return (
    <Page>
      <Wrap>
        <Hero>
          <HeroImageContainer>
            <HeroImage src={aboutImage} alt="KimuX Team" />
            <HeroContent>
              <H1>About</H1>
              <Lead>The Intelligent Digital Marketing & Brokerage Platform Built on Blockchain</Lead>
            </HeroContent>
          </HeroImageContainer>
        </Hero>

        <Section>
          <Title>About KimuX</Title>
          <Body>
            <p>KimuX is a next-generation B2B SaaS and AI-powered digital marketing platform designed to accelerate growth, innovation, and operational efficiency for businesses and organizations across industries. Hosted securely on Amazon Web Services (AWS), powered by blockchain technology, and built with advanced API integrations, KimuX delivers scalable, reliable, and intelligent digital solutions that drive sustainable impact and measurable results.</p>
            <p>Our platform enables companies to automate processes, enhance customer engagement, improve data intelligence, and unlock new revenue streams—all while maintaining enterprise-grade security, transparency, and compliance. Through a cloud-based Software-as-a-Service model, KimuX provides continuous innovation, including:</p>
            <Bullets>
              <Bullet>Constant updates and improvements</Bullet>
              <Bullet>Zero installation requirements</Bullet>
              <Bullet>Lower IT infrastructure costs</Bullet>
              <Bullet>Global access from anywhere</Bullet>
              <Bullet>Secure and compliant environments</Bullet>
            </Bullets>
            <p>KimuX is more than a digital solution—it is a strategic growth enabler, empowering enterprises, startups, governments, and development organizations to scale with confidence.</p>
          </Body>
        </Section>

        <Section>
          <Title>Our Vision</Title>
          <Body>
            <p>We believe in empowering the next generation of digital entrepreneurs, marketers, and enterprises through artificial intelligence, blockchain, and automation. Our vision is to create a universal digital ecosystem that connects people, businesses, and opportunities across industries, transforming how the world trades, markets, and grows.</p>
          </Body>
        </Section>

        <Section>
          <Title>Who We Are</Title>
          <Body>
            <p>KimuX is an AI-powered digital brokerage, fintech, and marketing platform that unites technology, creativity, and commerce. We provide a single, intelligent environment for businesses, professionals, and creators to build, manage, and scale operations across finance, logistics, real estate, technology, digital marketing, and eCommerce.</p>
            <Muted>Born from an innovation initiative supported by Arizona State University’s Capstone Program, KimuX was developed with the collaboration of five talented ASU students: Revanth Kumar Alimela, Allan Binu, Aryan Yeole, Julian Korn, and Sarjan Patel.</Muted>
            <Muted>Together, they engineered the foundation of what has become one of the most advanced AI-driven digital brokerage platforms of the decade.</Muted>
          </Body>
        </Section>

        <Section>
          <Title>Our Mission</Title>
          <Body>
            <p>Our mission is to simplify digital transformation by integrating brokerage, fintech, and marketing into a single smart ecosystem. We empower businesses and individuals to launch, grow, and scale globally with the power of AI. KimuX makes digital entrepreneurship accessible to everyone—from startups to governments, from small agencies to multinational enterprises.</p>
          </Body>
        </Section>

        <Section>
          <Title>What KimuX Offers</Title>
          <Body>
            <Grid>
              <Card>
                <CardHeader><IconBadge>AI</IconBadge><Small>AI Brokerage Hub</Small></CardHeader>
                <CardBody>
                  <FeatureText>B2B/B2C brokerage with AI matchmaking</FeatureText>
                  <FeatureText>Blockchain-secured contracts</FeatureText>
                </CardBody>
              </Card>
              <Card>
                <CardHeader><IconBadge>CRM</IconBadge><Small>CRM & Lead Automation</Small></CardHeader>
                <CardBody>
                  <FeatureText>Smart client management with predictive insights</FeatureText>
                  <FeatureText>AI-powered follow-ups</FeatureText>
                </CardBody>
              </Card>
              <Card>
                <CardHeader><IconBadge>AB</IconBadge><Small>AI Boutique Builder</Small></CardHeader>
                <CardBody>
                  <FeatureText>Auto-generate and manage eCommerce stores</FeatureText>
                  <FeatureText>AI-built content and design</FeatureText>
                </CardBody>
              </Card>
              <Card>
                <CardHeader><IconBadge>FT</IconBadge><Small>Smart Fintech Hub</Small></CardHeader>
                <CardBody>
                  <FeatureText>Multi-currency wallets and cross-border payments</FeatureText>
                  <FeatureText>Stock and crypto AI investment features</FeatureText>
                </CardBody>
              </Card>
              <Card>
                <CardHeader><IconBadge>MK</IconBadge><Small>AI Marketing Suite</Small></CardHeader>
                <CardBody>
                  <FeatureText>Create, launch, and optimize campaigns</FeatureText>
                  <FeatureText>Compliant across Facebook, TikTok, Google, and Instagram</FeatureText>
                </CardBody>
              </Card>
              <Card>
                <CardHeader><IconBadge>AR</IconBadge><Small>Affiliate & Reseller</Small></CardHeader>
                <CardBody>
                  <FeatureText>Affiliate performance tracking</FeatureText>
                  <FeatureText>Commission tools for growth</FeatureText>
                </CardBody>
              </Card>
              <Card>
                <CardHeader><IconBadge>CF</IconBadge><Small>Campaign & Funnel Builder</Small></CardHeader>
                <CardBody>
                  <FeatureText>Visualize and automate the customer journey</FeatureText>
                  <FeatureText>Real-time AI optimization</FeatureText>
                </CardBody>
              </Card>
              <Card>
                <CardHeader><IconBadge>ML</IconBadge><Small>AI Multilingual Content</Small></CardHeader>
                <CardBody>
                  <FeatureText>Translate, create, and rewrite text and voice</FeatureText>
                  <FeatureText>100+ languages for global audiences</FeatureText>
                </CardBody>
              </Card>
              <Card>
                <CardHeader><IconBadge>BC</IconBadge><Small>Blockchain Commerce Layer</Small></CardHeader>
                <CardBody>
                  <FeatureText>Smart contracts and tokenized rewards</FeatureText>
                  <FeatureText>Full transaction transparency</FeatureText>
                </CardBody>
              </Card>
              <Card>
                <CardHeader><IconBadge>DV</IconBadge><Small>Developer Ecosystem</Small></CardHeader>
                <CardBody>
                  <FeatureText>Open API and SDK marketplace</FeatureText>
                  <FeatureText>Extensions, plugins, and integrations</FeatureText>
                </CardBody>
              </Card>
            </Grid>
          </Body>
        </Section>

        <Section>
          <Title>Who We Serve</Title>
          <Body>
            <Grid>
              <Card>
                <CardHeader><IconBadge>GV</IconBadge><Small>Governments</Small></CardHeader>
                <CardBody><CardDescription>Enable transparency, automation, and citizen-focused digital services.</CardDescription></CardBody>
              </Card>
              <Card>
                <CardHeader><IconBadge>FI</IconBadge><Small>Financial Institutions</Small></CardHeader>
                <CardBody><CardDescription>Streamline digital brokerage, payments, and compliance automation.</CardDescription></CardBody>
              </Card>
              <Card>
                <CardHeader><IconBadge>RE</IconBadge><Small>Real Estate</Small></CardHeader>
                <CardBody><CardDescription>Automate listings, client matching, and property contracts via blockchain.</CardDescription></CardBody>
              </Card>
              <Card>
                <CardHeader><IconBadge>LS</IconBadge><Small>Logistics & Supply Chain</Small></CardHeader>
                <CardBody><CardDescription>Optimize routing, supplier management, and delivery tracking with AI.</CardDescription></CardBody>
              </Card>
              <Card>
                <CardHeader><IconBadge>DM</IconBadge><Small>Digital Marketing Agencies</Small></CardHeader>
                <CardBody><CardDescription>Centralize ad creation, compliance, and performance analytics.</CardDescription></CardBody>
              </Card>
              <Card>
                <CardHeader><IconBadge>NP</IconBadge><Small>Non-Profit Organizations</Small></CardHeader>
                <CardBody><CardDescription>Enhance transparency and maximize fundraising impact.</CardDescription></CardBody>
              </Card>
              <Card>
                <CardHeader><IconBadge>SB</IconBadge><Small>SMBs & Startups</Small></CardHeader>
                <CardBody><CardDescription>Access affordable tools for CRM, marketing, and marketplace management.</CardDescription></CardBody>
              </Card>
              <Card>
                <CardHeader><IconBadge>PS</IconBadge><Small>Professional Services</Small></CardHeader>
                <CardBody><CardDescription>Automate client engagement, contracts, and digital communication.</CardDescription></CardBody>
              </Card>
            </Grid>
          </Body>
        </Section>

        <Section>
          <Title>Our Technology Core</Title>
          <Body>
            <Grid>
              <Card>
                <CardHeader><IconBadge>AI</IconBadge><Small>Artificial Intelligence</Small></CardHeader>
                <CardBody><CardDescription>Predictive analytics, campaign automation, and smart recommendations.</CardDescription></CardBody>
              </Card>
              <Card>
                <CardHeader><IconBadge>BC</IconBadge><Small>Blockchain</Small></CardHeader>
                <CardBody><CardDescription>Smart contracts, verifiable transactions, and security transparency.</CardDescription></CardBody>
              </Card>
              <Card>
                <CardHeader><IconBadge>FT</IconBadge><Small>Fintech Layer</Small></CardHeader>
                <CardBody><CardDescription>Multi-currency wallets, payments, brokerage, and digital asset management.</CardDescription></CardBody>
              </Card>
              <Card>
                <CardHeader><IconBadge>MK</IconBadge><Small>Marketing Automation</Small></CardHeader>
                <CardBody><CardDescription>Real-time AI campaign optimization for social and ad platforms.</CardDescription></CardBody>
              </Card>
              <Card>
                <CardHeader><IconBadge>CD</IconBadge><Small>Cloud Infrastructure</Small></CardHeader>
                <CardBody><CardDescription>Secure, globally distributed servers with encryption, scalability, and compliance.</CardDescription></CardBody>
              </Card>
            </Grid>
          </Body>
        </Section>

        <Section>
          <Title>Our Commitment</Title>
          <Body>
            <p>We are building more than a platform—we are building the future of intelligent digital commerce and marketing. Our goal is to ensure every entrepreneur, marketer, and business can thrive in a connected, data-driven economy while maintaining transparency, trust, and innovation.</p>
          </Body>
        </Section>

        <Section>
          <Title>Join the Future</Title>
          <Body>
            <p>Whether you are a creator, marketer, broker, or enterprise, KimuX is your partner in digital excellence, empowering you to connect, automate, and grow in a smart, borderless world.</p>
          </Body>
        </Section>

        <Section>
          <Title>Our Motto</Title>
          <Body>
            <InlineList>
              <p><strong>Motto:</strong> “Beyond eCommerce : Where AI Builds the Future of Business.”</p>
              <p><strong>Contact:</strong> contact@kimux.co</p>
              <p><strong>Help center:</strong> contact@kimux.co</p>
            </InlineList>
          </Body>
        </Section>
      </Wrap>
    </Page>
  );
}
