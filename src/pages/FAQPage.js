import React, { useState } from 'react';
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

const FAQList = styled.div`
  display: grid;
  gap: 16px;
`;

const FAQItem = styled.div`
  position: relative;
  background: linear-gradient(180deg, ${p => (p.theme?.colors?.cardBackground || '#f8f9fa')} 0%, ${p => (p.theme?.colors?.background || '#FFFFFF')} 100%);
  border: 1px solid ${p => p.theme?.colors?.border || '#E5E5E5'};
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 8px 20px rgba(0,0,0,0.04);
  transition: all .3s ease;
  
  &::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 4px;
    background: linear-gradient(90deg, ${p => p.theme?.colors?.primary || '#00C896'}, ${p => p.theme?.colors?.accent || '#DAA520'});
    border-top-left-radius: 16px;
    border-top-right-radius: 16px;
    opacity: ${p => p.isOpen ? '1' : '.5'};
    transition: opacity .3s ease;
  }
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 14px 32px rgba(0,0,0,0.08);
    border-color: ${p => p.theme?.colors?.primary || '#00C896'}33;
  }
`;

const Question = styled.button`
  width: 100%;
  padding: 24px;
  text-align: left;
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  font-size: 17px;
  font-weight: 600;
  color: ${p => p.theme?.colors?.text || '#111111'};
  transition: color .2s ease;
  line-height: 1.4;
  
  &:hover {
    color: ${p => p.theme?.colors?.primary || '#00C896'};
  }
`;

const Answer = styled.div`
  padding: 0 24px 24px;
  color: ${p => p.theme?.colors?.text || '#111111'};
  opacity: .9;
  line-height: 1.75;
  max-height: ${p => p.isOpen ? '1500px' : '0'};
  overflow: hidden;
  transition: all .4s cubic-bezier(0.4, 0, 0.2, 1);
  transform: translateY(${p => p.isOpen ? '0' : '-10px'});
`;

const Icon = styled.div`
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  border-radius: 50%;
  background: linear-gradient(135deg, ${p => p.theme?.colors?.primary || '#00C896'}, ${p => p.theme?.colors?.accent || '#DAA520'});
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 20px;
  font-weight: 300;
  transition: transform .3s cubic-bezier(0.4, 0, 0.2, 1);
  transform: ${p => p.isOpen ? 'rotate(45deg)' : 'rotate(0deg)'};
  box-shadow: 0 4px 12px ${p => (p.theme?.colors?.primary || '#00C896')}40;
  
  &:hover {
    transform: ${p => p.isOpen ? 'rotate(45deg) scale(1.1)' : 'rotate(0deg) scale(1.1)'};
  }
`;

const ContactSection = styled.div`
  margin-top: 40px;
  padding: 24px;
  background: linear-gradient(135deg, ${p => (p.theme?.colors?.primary || '#00C896')}0F, ${p => (p.theme?.colors?.accent || '#DAA520')}0F);
  border: 1px solid ${p => p.theme?.colors?.border || '#E5E5E5'};
  border-radius: 16px;
  text-align: center;
`;

const ContactTitle = styled.h3`
  margin: 0 0 12px;
  font-size: 20px;
  font-weight: 700;
  color: ${p => p.theme?.colors?.text || '#111111'};
`;

const ContactText = styled.p`
  margin: 0 0 8px;
  color: ${p => p.theme?.colors?.text || '#111111'};
  opacity: .9;
`;

const ContactLink = styled.a`
  color: ${p => p.theme?.colors?.primary || '#00C896'};
  text-decoration: none;
  font-weight: 600;
  
  &:hover {
    text-decoration: underline;
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
      q: "What is KimuntuX?",
      a: "KimuntuX is an AI-powered Digital Brokerage, Fintech, and Marketing platform that unifies eCommerce, finance, and automation into one intelligent ecosystem. It allows businesses, professionals, and organizations to build, manage, and scale digital operations from online stores to marketing campaigns and financial management, all powered by AI and blockchain."
    },
    {
      q: "Who is behind KimuntuX?",
      a: "KimuntuX was initiated by Kimuntu Power Inc., a global innovation company focused on intelligent digital ecosystems. The project was developed through the Arizona State University Capstone Program with the contribution of five talented ASU students: Revanth Kumar Alimela, Allan Binu, Aryan Yeole, Julian Korn, and Sarjan Patel. Kimuntu Power Inc. continues to lead the project's growth as the strategic owner, investor, and technology accelerator."
    },
    {
      q: "What makes KimuntuX different from platforms like Shopify, Wix, or WooCommerce?",
      a: "Unlike traditional platforms, KimuntuX is not just a store builder, it's an autonomous digital brokerage and fintech ecosystem that: Builds eCommerce boutiques automatically using AI AutoBuild, Integrates multi-channel marketing and fintech orchestration, Provides AI-driven optimization for every user action, Enables secure blockchain contracts and global payments, Supports B2B, B2C, Affiliate, and Reseller models within one ecosystem."
    },
    {
      q: "What are the main features of KimuntuX?",
      a: "KimuntuX combines multiple intelligent systems into one unified platform, including: AI Boutique Builder, B2B/B2C Brokerage Hub, CRM & AI Lead Assistant, Smart Fintech Hub, AI Campaign & Funnel Builder, AI Digital Marketing Suite, Translation & Content AI Tool, Developer Ecosystem, Blockchain Commerce Layer, and Affiliate & Reseller Network."
    },
    {
      q: "Who can use KimuntuX?",
      a: "KimuntuX is designed for individuals, professionals, businesses, and institutions across multiple sectors, including: Governments, Financial Institutions, Real Estate, Logistics & Supply Chain, Digital Marketing Agencies, SMBs & Startups, Non-Profit Organizations, and Professional Services."
    },
    {
      q: "How does the Smart Fintech Hub work?",
      a: "The Smart Fintech Hub connects digital finance with AI intelligence. It allows users to: Manage multi-currency wallets (USD, EUR, Crypto, etc.), Execute cross-border payments with instant settlement, Participate in AI-driven investment tools including Stock Market Intelligence Platform and Crypto Wallet & Trading AI, and Enjoy AI-powered fraud detection and blockchain-secured transactions."
    },
    {
      q: "What is the AI AutoBuild Boutique feature?",
      a: "The AI AutoBuild engine instantly creates a full eCommerce boutique — from design and product catalog to SEO and marketing setup. It learns from the user's preferences, niche, and brand identity, generating a ready-to-launch digital storefront in minutes."
    },
    {
      q: "What is the role of AI in KimuntuX?",
      a: "AI is the core of the KimuntuX ecosystem. It powers: Predictive analytics and smart recommendations, Autonomous content creation (text, image, video, voice), Ad optimization and keyword targeting, Dynamic pricing and inventory suggestions, Real-time campaign insights, and Automated customer interactions via AI assistants."
    },
    {
      q: "Does KimuntuX support multiple languages?",
      a: "Yes! KimuntuX includes an AI Translation & Content Creator Tool that supports over 100 languages. It can translate, create, and rewrite both text and voice content while ensuring compliance with social media and advertising policies on platforms like Facebook, TikTok, and Instagram."
    },
    {
      q: "How does the Affiliate and Reseller Program work?",
      a: "Users can become affiliates or resellers through a dedicated dashboard that includes: Real-time tracking of clicks, conversions, and earnings, Campaign builder for social media promotions, AI recommendations for high-performing channels, and Automated commission payouts via the fintech layer."
    },
    {
      q: "How does KimuntuX ensure security and transparency?",
      a: "KimuntuX integrates blockchain and advanced encryption to secure all user data and transactions. Key security measures include: Smart contract validation, End-to-end data encryption, Role-based access control (RBAC), GDPR and PCI compliance, and Real-time blockchain audit trails."
    },
    {
      q: "What technologies power KimuntuX?",
      a: "KimuntuX uses a modern, scalable architecture, including: Frontend: React / Next.js, Backend: Node.js / NestJS microservices, Databases: PostgreSQL, Redis, S3, AI Layer: LLMs for automation, recommendations, and analytics, Infrastructure: Kubernetes, Terraform, CI/CD pipelines, and Security: HTTPS, encryption at rest, smart contract governance."
    },
    {
      q: "How does KimuntuX generate revenue?",
      a: "KimuntuX follows a Smart Monetization Framework combining: Subscription plans (Free, Standard, Pro, Enterprise), Transaction and commission fees, Marketplace revenue (apps, templates, extensions), Affiliate and reseller partnerships, and Fintech and brokerage revenue sharing."
    },
    {
      q: "What are the benefits of using KimuntuX?",
      a: "✅ One unified ecosystem for commerce, marketing, and finance, ✅ AI automation that saves time and increases profits, ✅ Secure blockchain transactions, ✅ Multi-channel digital marketing integration, ✅ Smart multilingual content creation, ✅ Affordable, scalable pricing for all business sizes, ✅ Designed for global markets, with strong focus on Africa and emerging economies"
    },
    {
      q: "How does KimuntuX contribute to social impact and sustainability?",
      a: "KimuntuX promotes Humanity in Commerce by: Supporting women-led startups and micro-entrepreneurs, Encouraging eco-friendly, fair-trade, and local businesses, Offering educational access through KimuntuX Academy, and Partnering with non-profits to promote inclusive digital growth."
    },
    {
      q: "How can I partner or invest in KimuntuX?",
      a: "KimuntuX actively seeks partnerships with fintechs, tech agencies, investors, and governments. For collaboration or investment opportunities, please contact: contact@kimuntux.com, support@kimuntux.com, or visit www.kimuntux.com"
    },
    {
      q: "What is the long-term vision for KimuntuX?",
      a: "KimuntuX aims to become the leading intelligent commerce infrastructure of the 21st century, connecting global economies through AI, fintech, and blockchain innovation, empowering the next billion digital entrepreneurs."
    }
  ];

  return (
    <Page>
      <Wrap>
        <Hero>
          <H1>Questions & Answers (FAQ)</H1>
          <Lead>"Everything you need to know about The Intelligent Digital Brokerage, Fintech & Marketing Universe."</Lead>
        </Hero>

        <FAQList>
          {faqs.map((faq, index) => (
            <FAQItem key={index} isOpen={openItems.has(index)}>
              <Question onClick={() => toggleItem(index)}>
                <span>{faq.q}</span>
                <Icon isOpen={openItems.has(index)}>+</Icon>
              </Question>
              <Answer isOpen={openItems.has(index)}>
                {faq.a}
              </Answer>
            </FAQItem>
          ))}
        </FAQList>

        <ContactSection>
          <ContactTitle>Still have questions?</ContactTitle>
          <ContactText>Get in touch with our team for personalized assistance</ContactText>
          <ContactText>
            <ContactLink href="mailto:contact@kimuntux.com">contact@kimuntux.com</ContactLink> | 
            <ContactLink href="mailto:support@kimuntux.com"> support@kimuntux.com</ContactLink>
          </ContactText>
        </ContactSection>
      </Wrap>
    </Page>
  );
}