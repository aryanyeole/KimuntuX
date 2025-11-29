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
  font-size: 1.125rem;
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
  font-size: 0.9375rem;
  
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
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: translateY(-2px);
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
      a: "KimuntuX was initiated by Kimuntu Power Inc., a global innovation company focused on intelligent digital ecosystems. The project was developed through the Arizona State University Capstone Program with the contribution of four talented ASU students: Revanth Kumar Alimela, Allan Binu, Aryan Yeole, and Julian Korn. Kimuntu Power Inc. continues to lead the project's growth as the strategic owner, investor, and technology accelerator."
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
        <HeroSection>
          <HeroImageWrapper>
            <HeroImage src={faqsImage} alt="FAQ" />
          </HeroImageWrapper>
          <HeroContent>
            <HeroTitle>Questions & Answers (FAQ)</HeroTitle>
            <HeroSubtitle>Everything you need to know about The Intelligent Digital Brokerage, Fintech & Marketing Universe.</HeroSubtitle>
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
              <ContactLink href="mailto:contact@kimuntux.com">contact@kimuntux.com</ContactLink>
              <ContactLink href="mailto:support@kimuntux.com">support@kimuntux.com</ContactLink>
            </ContactLinks>
          </ContactContent>
        </ContactSection>
      </Wrap>
    </Page>
  );
}
