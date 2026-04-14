import React from 'react';
import styled from 'styled-components';
import b2bHero from '../assets/b2b.jpg';

const Page = styled.div`
  min-height: 100vh;
  background: radial-gradient(1200px 600px at -10% -10%, ${(p) => (p.theme?.colors?.primary || '#00C896')}0D, transparent 60%),
    radial-gradient(1000px 500px at 110% -20%, ${(p) => (p.theme?.colors?.accent || '#DAA520')}0F, transparent 55%),
    ${(p) => p.theme?.colors?.background || '#FFFFFF'};
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

const Eyebrow = styled.p`
  margin: 0 0 0.75rem;
  font-size: 0.95rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.95);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.35);
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
`;

const H1 = styled.h1`
  margin: 0 0 1rem 0;
  font-size: 3.5rem;
  line-height: 1.15;
  font-weight: 700;
  color: white;
  font-family: ${(p) => p.theme?.fonts?.title || 'Poppins, sans-serif'};
  text-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
  letter-spacing: -0.02em;
  animation: fadeInUp 0.8s ease-out 0.05s both;

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
    font-size: 1rem;
  }
`;

const Section = styled.section`
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 24px;
  padding: 32px 0;
  border-bottom: 1px solid ${(p) => p.theme?.colors?.border || '#E5E5E5'};
  animation: sectionIn 0.35s ease-out both;

  @keyframes sectionIn {
    from {
      opacity: 0;
      transform: translateY(8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }

  &:first-of-type {
    padding-top: 8px;
  }
`;

const Title = styled.h2`
  margin: 0;
  font-size: 28px;
  line-height: 1.3;
  font-weight: 700;
  color: ${(p) => p.theme?.colors?.text || '#111111'};

  @media (max-width: 768px) {
    font-size: 24px;
  }
`;

const Body = styled.div`
  display: grid;
  gap: 12px;
  color: ${(p) => p.theme?.colors?.text || '#111111'};
  opacity: 0.95;
  line-height: 1.75;
  font-size: 18px;

  @media (max-width: 768px) {
    font-size: 16px;
  }

  p {
    margin: 0;
    font-size: 18px;

    @media (max-width: 768px) {
      font-size: 16px;
    }
  }
`;

const TagRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin: 0.5rem 0 1rem;
`;

const Tag = styled.span`
  padding: 0.4rem 0.9rem;
  border-radius: 999px;
  border: 1px solid #e9ecef;
  background: #f8f9fa;
  color: #1a1a1a;
  font-size: 0.9rem;
  font-weight: 500;
`;

const Pipeline = styled.p`
  margin: 0.75rem 0 0;
  padding: 1.15rem 1.4rem;
  background: linear-gradient(
    135deg,
    rgba(0, 200, 150, 0.09) 0%,
    #ffffff 42%,
    rgba(218, 165, 32, 0.07) 100%
  );
  border: 1px solid rgba(0, 200, 150, 0.22);
  border-radius: 14px;
  box-shadow:
    0 4px 24px rgba(0, 200, 150, 0.1),
    0 1px 3px rgba(0, 0, 0, 0.04);
  font-size: 17px;
  line-height: 1.65;
  color: #374151;
  font-weight: 400;

  @media (max-width: 768px) {
    font-size: 15px;
    padding: 1rem 1.1rem;
  }

  .lead {
    font-weight: 700;
    color: #047857;
    letter-spacing: -0.02em;
  }

  .sep {
    color: #9ca3af;
    padding: 0 0.45rem;
    font-weight: 300;
    user-select: none;
  }
`;

const PipelineCentered = styled(Pipeline)`
  margin-left: auto;
  margin-right: auto;
  margin-top: 0;
  text-align: center;
  max-width: 900px;
`;

const Subheading = styled.h3`
  margin: 1.25rem 0 0.5rem;
  font-size: 1rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: #6b7280;
  font-family: ${(p) => p.theme?.fonts?.body || 'Roboto, sans-serif'};

  @media (max-width: 768px) {
    font-size: 0.9375rem;
  }
`;

const ItemList = styled.ul`
  margin: 0;
  padding: 0 0 0 1.2rem;
  display: grid;
  gap: 0.45rem;
  list-style-type: disc;

  li {
    color: #374151;
    line-height: 1.58;
    font-size: 17px;
    padding-left: 0.2rem;

    @media (max-width: 768px) {
      font-size: 15px;
    }

    &::marker {
      color: #d1d5db;
      font-size: 0.72em;
    }
  }
`;

const Outcome = styled.p`
  margin: 1.35rem 0 0;
  padding: 1.05rem 1.2rem 1.05rem 1.15rem;
  background: linear-gradient(95deg, rgba(0, 200, 150, 0.11) 0%, #fafafa 38%, #ffffff 100%);
  border: 1px solid rgba(0, 200, 150, 0.14);
  border-left: 4px solid #00c896;
  border-radius: 0 12px 12px 0;
  box-shadow: 0 2px 16px rgba(0, 200, 150, 0.07);
  color: #374151;
  font-size: 16px;
  line-height: 1.58;

  @media (max-width: 768px) {
    font-size: 15px;
    padding: 0.95rem 1rem;
  }

  strong {
    color: #047857;
    font-weight: 700;
    letter-spacing: 0.02em;
  }
`;

const ClosingHighlights = styled.section`
  margin-top: 3rem;
  padding: 2.5rem 2rem 2.75rem;
  background: linear-gradient(165deg, #ffffff 0%, #f0fdf9 35%, #fffbeb 70%, #ffffff 100%);
  border: 1px solid rgba(0, 200, 150, 0.18);
  border-radius: 20px;
  box-shadow:
    0 12px 48px rgba(0, 200, 150, 0.12),
    0 4px 16px rgba(218, 165, 32, 0.06);

  @media (max-width: 768px) {
    padding: 1.75rem 1.25rem 2rem;
    margin-top: 2rem;
  }
`;

const ClosingTitle = styled.h2`
  margin: 0 0 0.35rem;
  font-size: clamp(1.35rem, 3vw, 1.85rem);
  font-weight: 700;
  text-align: center;
  color: #111827;
  font-family: ${(p) => p.theme?.fonts?.title || 'Poppins, sans-serif'};
`;

const ClosingSubtitle = styled.p`
  margin: 0 0 1.75rem;
  text-align: center;
  color: #6b7280;
  font-size: 1.05rem;
  line-height: 1.55;
  max-width: 560px;
  margin-left: auto;
  margin-right: auto;
`;

const OutcomesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(270px, 1fr));
  gap: 0.9rem;
  margin-top: 0.25rem;

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

const OutcomeCard = styled.div`
  padding: 0.95rem 1.05rem;
  background: linear-gradient(135deg, #ffffff 0%, #fafafa 100%);
  border: 1px solid rgba(0, 200, 150, 0.14);
  border-radius: 12px;
  border-left: 3px solid #00c896;
  font-size: 14px;
  line-height: 1.52;
  color: #374151;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 10px 28px rgba(0, 200, 150, 0.14);
  }
`;

const Muted = styled.p`
  margin: 0;
  opacity: 0.8;
  font-size: 17px;

  @media (max-width: 768px) {
    font-size: 15px;
  }
`;

const PIPELINE_STEPS = (
  <>
    <span className="lead">Content</span>
    <span className="sep">·</span>
    Traffic
    <span className="sep">·</span>
    Leads
    <span className="sep">·</span>
    Conversion
    <span className="sep">·</span>
    Sales
    <span className="sep">·</span>
    Optimization
  </>
);

const SECTIONS = [
  {
    title: 'AI Content Creation Suite',
    body: 'Create high-converting content at scale using AI.',
    blocks: [
      {
        sub: 'What you can create:',
        items: [
          'Text (Ads, blogs, emails, product descriptions)',
          'Images (Social media visuals, product creatives)',
          'Videos (Short ads, explainer videos, reels)',
          'Audio (Voiceovers, podcasts)',
          'AI Avatars (Spokespersons, multilingual presenters)'
        ]
      },
      {
        sub: 'Key Benefits:',
        items: ['Faster content production', 'Multi-platform publishing', 'Conversion-optimized messaging']
      }
    ]
  },
  {
    title: 'Funnel & Website Builder',
    body: 'Build complete sales systems optimized for conversion.',
    blocks: [
      {
        sub: 'Supported Pages:',
        items: [
          'Sales Funnels',
          'Landing Pages',
          'Product Pages',
          'Webinar Pages',
          'Affiliate Bridge Pages'
        ]
      },
      {
        sub: 'AI Optimization Includes:',
        items: [
          'Content placement',
          'CTA (Call-to-Action) optimization',
          'Image & video positioning',
          'SEO structure',
          'Tracking integration'
        ]
      }
    ],
    outcome: 'Turn visitors into leads and customers automatically.'
  },
  {
    title: 'Campaign Generator (AI-Driven Marketing)',
    body: 'Launch high-performing campaigns in minutes.',
    blocks: [
      {
        sub: 'Features:',
        items: [
          'Audience targeting (interests, behaviors, demographics)',
          'Geo-localization',
          'Budget planning (daily & total)',
          'Ad creatives (text, images, videos)',
          'A/B testing automation'
        ]
      },
      {
        sub: 'Supported Channels:',
        items: [
          'Social Media (Facebook, Instagram, TikTok, LinkedIn)',
          'Google Ads & YouTube',
          'Display networks'
        ]
      }
    ],
    outcome: 'Generate targeted traffic and maximize ROI.'
  },
  {
    title: 'Multi-Platform Integrations Hub',
    body: 'Connect all your tools and platforms in one place.',
    blocks: [
      {
        sub: 'Integrations Include:',
        items: [
          'Social media platforms',
          'Affiliate networks (ClickBank, Digistore24, MaxBounty)',
          'E-commerce (Shopify, WooCommerce)',
          'Email marketing tools',
          'CRM systems',
          'Analytics & tracking tools'
        ]
      }
    ],
    outcome: 'Centralized control and automation of your marketing ecosystem.'
  },
  {
    title: 'Lead Generation & Conversion Engine',
    body: 'Capture, qualify, and convert leads automatically.',
    blocks: [
      {
        sub: 'Capabilities:',
        items: [
          'Smart lead capture forms',
          'AI chat & automated follow-ups',
          'Email & SMS automation',
          'Lead scoring (AI-based)',
          'Appointment booking'
        ]
      }
    ],
    outcome: 'Turn traffic into high-quality leads and paying customers.'
  },
  {
    title: 'Analytics & Performance Dashboard',
    body: 'Track and optimize everything in real time.',
    blocks: [
      {
        sub: 'Key Metrics:',
        items: [
          'Total Leads',
          'Total Sales / Revenue',
          'CTR, CPL, CPA',
          'ROAS (Return on Ad Spend)',
          'Conversion Rate',
          'Traffic Sources (Organic, Paid, Social)',
          'Budget Spent vs Remaining',
          'Funnel Performance'
        ]
      },
      {
        sub: 'AI Insights:',
        items: [
          'Performance recommendations',
          'Campaign optimization',
          'Budget adjustments',
          'Scaling opportunities'
        ]
      }
    ]
  },
  {
    title: 'Affiliate Marketing System',
    body: 'Monetize traffic with high-converting affiliate offers.',
    blocks: [
      {
        sub: 'Features:',
        items: [
          'Affiliate platform integration',
          'Product discovery (AI-powered)',
          'Affiliate link tracking',
          'Funnel automation',
          'Commission tracking'
        ]
      }
    ],
    outcome: 'Generate passive income through optimized campaigns.'
  },
  {
    title: 'B2B Growth Solutions',
    body: 'Help businesses generate leads and scale revenue.',
    blocks: [
      {
        sub: 'Services:',
        items: [
          'Lead generation campaigns',
          'AI marketing automation',
          'Sales funnel optimization',
          'CRM & pipeline integration',
          'Customer acquisition strategies'
        ]
      }
    ],
    outcome: 'Increase qualified leads and close more deals.'
  },
  {
    title: 'B2C Sales Acceleration',
    body: 'Sell directly to consumers with high conversion rates.',
    blocks: [
      {
        sub: 'Capabilities:',
        items: [
          'Product promotion campaigns',
          'E-commerce funnel optimization',
          'Retargeting strategies',
          'Personalized marketing'
        ]
      }
    ],
    outcome: 'Increase online sales and customer lifetime value.'
  },
  {
    title: 'Blockchain & Web3 Monetization (Future-Ready)',
    body: 'Leverage blockchain for next-generation revenue models.',
    blocks: [
      {
        sub: 'Features:',
        items: [
          'Crypto payment integration',
          'Token-based marketing systems',
          'Smart contract automation',
          'NFT-based marketing campaigns',
          'Decentralized affiliate systems'
        ]
      }
    ],
    outcome: 'Unlock new digital revenue streams and global scalability.'
  }
];

const SECTION_OUTCOMES = SECTIONS.filter((s) => s.outcome).map((s) => s.outcome);

const ProductsPage = () => {
  return (
    <Page>
      <Wrap>
        <Hero>
          <HeroImageContainer>
            <HeroImage src={b2bHero} alt="KimuX B2B and digital commerce" />
            <HeroContent>
              <Eyebrow>KimuX — Products &amp; Services</Eyebrow>
              <H1>AI-Powered Growth Ecosystem to Generate Leads, Sales &amp; Revenue</H1>
              <Lead>
                KimuX is an all-in-one AI marketing platform for businesses, marketers, and entrepreneurs.
              </Lead>
            </HeroContent>
          </HeroImageContainer>
        </Hero>

        <Section>
          <Title>Overview</Title>
          <Body>
            <p>
              KimuX is an all-in-one AI marketing platform designed to help businesses, marketers, and entrepreneurs
              generate more revenue through:
            </p>
            <TagRow>
              <Tag>B2B (Business to Business)</Tag>
              <Tag>B2C (Business to Consumer)</Tag>
              <Tag>Affiliate Marketing</Tag>
              <Tag>Blockchain &amp; Web3 Systems</Tag>
            </TagRow>
            <p>
              Our platform integrates AI automation, marketing tools, and advanced analytics to manage the entire
              digital sales cycle:
            </p>
            <Pipeline>{PIPELINE_STEPS}</Pipeline>
          </Body>
        </Section>

        {SECTIONS.map((section, i) => (
          <Section key={section.title}>
            <Title>
              {i + 1}. {section.title}
            </Title>
            <Body>
              <p>{section.body}</p>
              {section.blocks.map((block) => (
                <div key={block.sub}>
                  <Subheading>{block.sub}</Subheading>
                  <ItemList>
                    {block.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ItemList>
                </div>
              ))}
              {section.outcome ? (
                <Outcome>
                  <strong>Outcome</strong> — {section.outcome}
                </Outcome>
              ) : null}
            </Body>
          </Section>
        ))}

        <Section>
          <Title>Why Choose KimuX?</Title>
          <Body>
            <p>KimuX is not just a tool — it is a complete AI-driven revenue engine. With KimuX, you can:</p>
            <ItemList>
              <li>Automate your marketing</li>
              <li>Generate consistent leads</li>
              <li>Increase conversion rates</li>
              <li>Scale campaigns efficiently</li>
              <li>Monetize across multiple business models</li>
            </ItemList>
            <Subheading style={{ marginTop: '0.5rem' }}>Core Value Proposition</Subheading>
            <Muted>KimuX helps marketers, businesses, and entrepreneurs:</Muted>
            <ItemList>
              <li>Turn ideas into profitable campaigns</li>
              <li>Turn traffic into leads</li>
              <li>Turn leads into sales</li>
              <li>Turn systems into scalable revenue</li>
            </ItemList>
          </Body>
        </Section>

        <ClosingHighlights>
          <ClosingTitle>From content to scalable revenue</ClosingTitle>
          <ClosingSubtitle>
            Your digital sales cycle and the outcomes KimuX is built to deliver—summarized in one place.
          </ClosingSubtitle>
          <PipelineCentered>{PIPELINE_STEPS}</PipelineCentered>
          <OutcomesGrid>
            {SECTION_OUTCOMES.map((text) => (
              <OutcomeCard key={text}>{text}</OutcomeCard>
            ))}
          </OutcomesGrid>
        </ClosingHighlights>
      </Wrap>
    </Page>
  );
};

export default ProductsPage;
