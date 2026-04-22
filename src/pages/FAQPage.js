import React, { useState } from 'react';
import styled from 'styled-components';
import faqsImage from '../assets/faqs.jpg';

const Page = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 50%, #f8f9fa 100%);
  padding-top: 120px;
  
  @media (max-width: 768px) {
    padding-top: 100px;
  }
`;

const Wrap = styled.div`
  max-width: 1200px;
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

const FAQList = styled.div`
  display: grid;
  gap: 1rem;
  margin-bottom: 4rem;
`;

const FAQItem = styled.div`
  position: relative;
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  border: 1px solid #e9ecef;
  transition: all 0.3s ease;
  animation: fadeInUp 0.6s ease-out ${props => props.index * 0.05}s both;
  
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
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
    transform: scaleX(${p => p.isOpen ? '1' : '0'});
    transform-origin: left;
    transition: transform 0.3s ease;
  }
  
  &:hover {
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    border-color: #00C896;
  }
`;

const Question = styled.button`
  width: 100%;
  padding: 1.75rem 2rem;
  text-align: left;
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1.5rem;
  font-size: 1.5rem;
  font-weight: 600;
  color: #1a1a1a;
  transition: color 0.3s ease;
  line-height: 1.5;
  font-family: ${p => p.theme?.fonts?.title || 'Poppins, sans-serif'};
  
  &:hover {
    color: #00C896;
  }
  
  @media (max-width: 768px) {
    padding: 1.5rem;
    font-size: 1rem;
  }
`;

const QuestionText = styled.span`
  flex: 1;
  text-align: left;
`;

const Icon = styled.div`
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  border-radius: 8px;
  background: ${p => p.isOpen ? '#00C896' : '#f0f0f0'};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${p => p.isOpen ? 'white' : '#6c757d'};
  font-size: 20px;
  font-weight: 300;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  transform: ${p => p.isOpen ? 'rotate(45deg)' : 'rotate(0deg)'};
  
  ${Question}:hover & {
    background: ${p => p.isOpen ? '#00C896' : '#e9ecef'};
    color: ${p => p.isOpen ? 'white' : '#00C896'};
  }
`;

const Answer = styled.div`
  padding: 0 2rem 1.75rem;
  color: #495057;
  line-height: 1.75;
  max-height: ${p => p.isOpen ? '2000px' : '0'};
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  opacity: ${p => p.isOpen ? '1' : '0'};
  font-size: 1.25rem;
  
  p {
    margin: 0 0 0.85rem;
  }
  
  p:last-child {
    margin-bottom: 0;
  }
  
  ul {
    margin: 0 0 0.85rem 1.25rem;
    padding: 0;
  }
  
  li {
    margin-bottom: 0.5rem;
  }
  
  li:last-child {
    margin-bottom: 0;
  }
  
  @media (max-width: 768px) {
    padding: 0 1.5rem 1.5rem;
  }
`;

const ContactSection = styled.div`
  margin-top: 4rem;
  padding: 3rem 2rem;
  background: linear-gradient(135deg, #00C896 0%, #20B2AA 100%);
  border-radius: 20px;
  text-align: center;
  box-shadow: 0 12px 40px rgba(0, 200, 150, 0.2);
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: conic-gradient(from 0deg, transparent, rgba(255, 255, 255, 0.1), transparent);
    animation: rotate 20s linear infinite;
    opacity: 0.3;
  }

  @keyframes rotate {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  @media (max-width: 768px) {
    padding: 2rem 1.5rem;
    border-radius: 16px;
  }
`;

const ContactContent = styled.div`
  position: relative;
  z-index: 1;
`;

const ContactTitle = styled.h3`
  margin: 0 0 1rem;
  font-size: 1.75rem;
  font-weight: 700;
  color: white;
  font-family: ${p => p.theme?.fonts?.title || 'Poppins, sans-serif'};
  
  @media (max-width: 768px) {
    font-size: 1.5rem;
  }
`;

const ContactText = styled.p`
  margin: 0 0 0.75rem;
  color: rgba(255, 255, 255, 0.95);
  font-size: 1rem;
  line-height: 1.6;
`;

const ContactLinks = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
  margin-top: 1rem;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 0.5rem;
  }
`;

const ContactLink = styled.a`
  color: white;
  text-decoration: none;
  font-weight: 600;
  font-size: 1rem;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  background: #000000;
  transition: all 0.3s ease;
  
  &:hover {
    background: #1a1a1a;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }
`;

export default function FAQPage() {
  const [openItems, setOpenItems] = useState(new Set());

  const toggleItem = (index) => {
    const newOpenItems = new Set(openItems);
    if (newOpenItems.has(index)) {
      newOpenItems.delete(index);
    } else {
      newOpenItems.add(index);
    }
    setOpenItems(newOpenItems);
  };

  const faqs = [
    {
      q: "What is KimuX?",
      a: (
        <>
          <p>KimuX is an AI-powered Digital Marketing, Fintech, and Brokerage platform that unifies eCommerce, finance, and automation into one intelligent ecosystem.</p>
          <p>It allows businesses, professionals, and organizations to build, manage, and scale digital operations—from online stores to marketing campaigns and financial management—all powered by AI and blockchain.</p>
          <p>KimuX also operates as a B2B SaaS platform, providing AI-powered tools, backend fulfillment, and growth automation designed to help businesses generate revenue and scale efficiently.</p>
        </>
      )
    },
    {
      q: "Who is behind KimuX?",
      a: (
        <>
          <p>KimuX was initiated as a global innovation platform focused on intelligent digital ecosystems.</p>
          <p>The project was developed through the Arizona State University Capstone Program with the contribution of five talented ASU students: Revanth Kumar Alimela, Allan Binu, Aryan Yeole, Julian Korn, and Sarjan Patel.</p>
          <p>KimuX continues to grow as a strategic AI-powered SaaS and digital infrastructure platform for digital brokerage, fintech, and intelligent operations.</p>
        </>
      )
    },
    {
      q: "What makes KimuX different from platforms like Shopify, Wix, or WooCommerce?",
      a: (
        <>
          <p>Unlike traditional platforms, KimuX is not just a store builder. It’s an autonomous digital brokerage and fintech ecosystem that:</p>
          <ul>
            <li>Builds eCommerce boutiques automatically using AI AutoBuild</li>
            <li>Integrates multi-channel marketing and fintech orchestration</li>
            <li>Provides AI-driven optimization for every user action</li>
            <li>Enables secure blockchain contracts and global payments</li>
            <li>Supports B2B, B2C, Affiliate, and Reseller models within one ecosystem</li>
            <li>Includes built-in AI tools and backend fulfillment systems that replace multiple third-party tools and external teams</li>
          </ul>
        </>
      )
    },
    {
      q: "What are the main features of KimuX?",
      a: (
        <>
          <p>KimuX combines multiple intelligent systems into one unified platform, including:</p>
          <ul>
            <li>AI Boutique Builder: Instantly create online stores with products, content, and design auto-generated by AI.</li>
            <li>B2B/B2C Brokerage Hub: Connect buyers, suppliers, and brokers through AI matchmaking and blockchain-secured contracts.</li>
            <li>CRM & AI Lead Assistant: Manage clients, automate follow-ups, and track business pipelines.</li>
            <li>Smart Fintech Hub: Multi-currency wallets, AI-driven investment tools, crypto wallets, and stock market integration.</li>
            <li>AI Campaign & Funnel Builder: Create and optimize digital marketing funnels in real time.</li>
            <li>AI Digital Marketing Suite: Automate compliant campaigns across Facebook, Instagram, TikTok, and Google.</li>
            <li>Translation & Content AI Tool: Generate and rewrite multilingual text and voice content adapted to platform policies.</li>
            <li>Developer Ecosystem: APIs, SDKs, and extensions marketplace for global developers.</li>
            <li>Blockchain Commerce Layer: Smart contracts, escrow, and secure transactions.</li>
            <li>Affiliate & Reseller Network: Manage commissions, referrals, and revenue streams with AI analytics.</li>
            <li>AI-powered backend fulfillment tools that run marketing, content, outreach, and operations from one platform.</li>
          </ul>
        </>
      )
    },
    {
      q: "Who can use KimuX?",
      a: (
        <>
          <p>KimuX is designed for individuals, professionals, businesses, and institutions across multiple sectors, including:</p>
          <ul>
            <li>Governments: Digital services, smart contracts, and transparent operations.</li>
            <li>Financial Institutions: Brokerage, digital payments, and fintech orchestration.</li>
            <li>Real Estate: AI-driven property brokerage and blockchain-based agreements.</li>
            <li>Logistics & Supply Chain: Automated tracking, partner management, and smart delivery solutions.</li>
            <li>Digital Marketing Agencies: Multi-channel automation, analytics, and AI content creation.</li>
            <li>SMBs & Startups: Build, market, and manage businesses with minimal effort.</li>
            <li>Non-Profit Organizations: Enhance transparency, fundraising, and community engagement.</li>
            <li>Professional Services: Automate client relations, contracts, and invoicing.</li>
          </ul>
          <p>KimuX is also ideal for SaaS founders, consultants, and agencies looking to offer AI-powered tools and services under their own brand.</p>
        </>
      )
    },
    {
      q: "How does the Smart Fintech Hub work?",
      a: (
        <>
          <p>The Smart Fintech Hub connects digital finance with AI intelligence. It allows users to:</p>
          <ul>
            <li>Manage multi-currency wallets (USD, EUR, Crypto, etc.)</li>
            <li>Execute cross-border payments with instant settlement</li>
            <li>Participate in AI-driven investment tools such as:</li>
          </ul>
          <ul>
            <li>Stock Market Intelligence Platform — predict market trends, automate trades, and manage portfolios.</li>
            <li>Crypto Wallet & Trading AI — trade, stake, and analyze crypto markets with predictive insights.</li>
          </ul>
          <p>Enjoy AI-powered fraud detection and blockchain-secured transactions.</p>
        </>
      )
    },
    {
      q: "What is the AI AutoBuild Boutique feature?",
      a: (
        <p>The AI AutoBuild engine instantly creates a full eCommerce boutique—from design and product catalog to SEO and marketing setup. It learns from the user’s preferences, niche, and brand identity, generating a ready-to-launch digital storefront in minutes, fully integrated with KimuX marketing, fintech, and AI growth tools.</p>
      )
    },
    {
      q: "What is the role of AI in KimuX?",
      a: (
        <>
          <p>AI is the core of the KimuX ecosystem. It powers:</p>
          <ul>
            <li>Predictive analytics and smart recommendations</li>
            <li>Autonomous content creation (text, image, video, voice)</li>
            <li>Ad optimization and keyword targeting</li>
            <li>Dynamic pricing and inventory suggestions</li>
            <li>Real-time campaign insights</li>
            <li>Automated customer interactions via AI assistants</li>
            <li>Revenue optimization and growth automation across the platform</li>
          </ul>
        </>
      )
    },
    {
      q: "Does KimuX support multiple languages?",
      a: (
        <>
          <p>Yes!</p>
          <p>KimuX includes an AI Translation & Content Creator Tool that supports over 100 languages. It can translate, create, and rewrite both text and voice content while ensuring compliance with social media and advertising policies on platforms like Facebook, TikTok, and Instagram.</p>
        </>
      )
    },
    {
      q: "How does the Affiliate and Reseller Program work?",
      a: (
        <>
          <p>Users can become affiliates or resellers through a dedicated dashboard that includes:</p>
          <ul>
            <li>Real-time tracking of clicks, conversions, and earnings</li>
            <li>Campaign builder for social media promotions</li>
            <li>AI recommendations for high-performing channels</li>
            <li>Automated commission payouts via the fintech layer</li>
          </ul>
        </>
      )
    },
    {
      q: "How does KimuX ensure security and transparency?",
      a: (
        <>
          <p>KimuX integrates blockchain and advanced encryption to secure all user data and transactions. Key security measures include:</p>
          <ul>
            <li>Smart contract validation</li>
            <li>End-to-end data encryption</li>
            <li>Role-based access control (RBAC)</li>
            <li>GDPR and PCI compliance</li>
            <li>Real-time blockchain audit trails</li>
            <li>Enterprise-grade cloud security hosted on AWS</li>
          </ul>
        </>
      )
    },
    {
      q: "What technologies power KimuX?",
      a: (
        <>
          <p>KimuX uses a modern, scalable architecture, including:</p>
          <ul>
            <li>Frontend: React / Next.js</li>
            <li>Backend: Node.js / NestJS microservices</li>
            <li>Databases: PostgreSQL, Redis, S3</li>
            <li>AI Layer: LLMs for automation, recommendations, and analytics</li>
            <li>Infrastructure: Kubernetes, Terraform, CI/CD pipelines</li>
            <li>Security: HTTPS, encryption at rest, smart contract governance</li>
          </ul>
        </>
      )
    },
    {
      q: "How does KimuX generate revenue?",
      a: (
        <>
          <p>KimuX follows a Smart Monetization Framework combining:</p>
          <ul>
            <li>Subscription plans (Free, Standard, Pro, Enterprise)</li>
            <li>Transaction and commission fees</li>
            <li>Marketplace revenue (apps, templates, extensions)</li>
            <li>Affiliate and reseller partnerships</li>
            <li>Fintech and brokerage revenue sharing</li>
          </ul>
        </>
      )
    },
    {
      q: "What are the benefits of using KimuX?",
      a: (
        <>
          <ul>
            <li>One unified ecosystem for commerce, marketing, and finance</li>
            <li>AI automation that saves time and increases profits</li>
            <li>Secure blockchain transactions</li>
            <li>Multi-channel digital marketing integration</li>
            <li>Smart multilingual content creation</li>
            <li>Affordable, scalable pricing for all business sizes</li>
            <li>Designed for global markets, with strong focus on Africa and emerging economies</li>
            <li>AI-powered tools and backend fulfillment that help businesses grow and make money</li>
          </ul>
        </>
      )
    },
    {
      q: "How does KimuX contribute to social impact and sustainability?",
      a: (
        <>
          <p>KimuX promotes Humanity in Commerce by:</p>
          <ul>
            <li>Supporting women-led startups and micro-entrepreneurs</li>
            <li>Encouraging eco-friendly, fair-trade, and local businesses</li>
            <li>Offering educational access through KimuX Academy</li>
            <li>Partnering with non-profits to promote inclusive digital growth</li>
          </ul>
        </>
      )
    },
    {
      q: "What is the long-term vision for KimuX?",
      a: (
        <p>KimuX aims to become the leading intelligent commerce infrastructure of the 21st century, connecting global economies through AI, fintech, and blockchain innovation, empowering the next billion digital entrepreneurs.</p>
      )
    },
    {
      q: "Is KimuX a SaaS Platform?",
      a: (
        <p>Yes. KimuX operates as a Software-as-a-Service (SaaS) platform hosted in the cloud. Users can securely access the platform anytime, anywhere without complex installations. All updates, maintenance, and innovations are applied automatically, ensuring continuous improvement, high availability, and a seamless user experience across devices and regions.</p>
      )
    },
    {
      q: "What makes KimuX different from traditional platforms?",
      a: (
        <>
          <p>KimuX combines multiple advanced technologies into one unified ecosystem, including:</p>
          <ul>
            <li>Cloud computing (AWS) for reliability, scalability, and global access</li>
            <li>Blockchain technology for trust, transparency, and secure transactions</li>
            <li>Artificial Intelligence for automation, optimization, and smart decision-making</li>
            <li>Advanced API integrations to seamlessly connect with external platforms, tools, and systems</li>
          </ul>
          <p>This combination makes KimuX significantly more powerful, flexible, and future-ready than traditional software platforms.</p>
        </>
      )
    },
    {
      q: "Who is KimuX designed for?",
      a: (
        <>
          <p>KimuX is built primarily for:</p>
          <ul>
            <li>B2B companies</li>
            <li>Startups and scale-ups</li>
            <li>Development and impact-driven organizations</li>
            <li>Financial and digital service platforms</li>
            <li>Governments and institutional programs</li>
          </ul>
          <p>Any organization seeking digital transformation, operational efficiency, innovation, and accelerated growth can benefit from the KimuX ecosystem.</p>
        </>
      )
    },
    {
      q: "How does KimuX support business growth?",
      a: (
        <>
          <p>KimuX acts as a Growth Accelerator, enabling organizations to:</p>
          <ul>
            <li>Automate critical workflows and operations</li>
            <li>Improve digital service delivery and scalability</li>
            <li>Enhance customer and user engagement</li>
            <li>Reduce operational and infrastructure costs</li>
            <li>Unlock actionable insights through AI-driven analytics</li>
            <li>Enable new monetization strategies and revenue models</li>
          </ul>
          <p>Like global B2B SaaS and AI-driven companies leveraging digital accelerators, organizations using platforms such as KimuX have the potential to build 6–7 figure growth pathways, expand into new markets, and increase both economic and social impact.</p>
        </>
      )
    },
    {
      q: "How can I partner or invest in KimuX?",
      a: (
        <>
          <p>KimuX actively seeks partnerships with fintechs, tech agencies, investors, and governments. For collaboration or investment opportunities, please contact:</p>
          <ul>
            <li>Contact: contact@kimux.io</li>
            <li>Help Center: support@kimux.io</li>
            <li>www.kimux.io</li>
          </ul>
        </>
      )
    }
  ];

  return (
    <Page>
      <Wrap>
        <HeroSection>
          <HeroImageWrapper>
            <HeroImage src={faqsImage} alt="FAQ" />
          </HeroImageWrapper>
          <HeroContent>
            <HeroTitle>Questions & Answers (FAQ)</HeroTitle>
            <HeroSubtitle>Everything you need to know about The Intelligent Digital Brokerage, Fintech & Digital Marketing Platform.</HeroSubtitle>
          </HeroContent>
        </HeroSection>

        <FAQList>
          {faqs.map((faq, index) => (
            <FAQItem key={index} isOpen={openItems.has(index)} index={index}>
              <Question onClick={() => toggleItem(index)}>
                <QuestionText>{faq.q}</QuestionText>
                <Icon isOpen={openItems.has(index)}>+</Icon>
              </Question>
              <Answer isOpen={openItems.has(index)}>
                {faq.a}
              </Answer>
            </FAQItem>
          ))}
        </FAQList>

        <ContactSection>
          <ContactContent>
            <ContactTitle>Still have questions?</ContactTitle>
            <ContactText>Get in touch with our team for personalized assistance</ContactText>
            <ContactLinks>
              <ContactLink href="mailto:contact@kimux.io">contact@kimux.io</ContactLink>
              <ContactLink href="mailto:support@kimux.io">support@kimux.io</ContactLink>
            </ContactLinks>
          </ContactContent>
        </ContactSection>
      </Wrap>
    </Page>
  );
}
