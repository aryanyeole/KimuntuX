import React, { useState } from 'react';
import styled from 'styled-components';
import { useTheme } from '../contexts/ThemeContext';

const PageContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 50%, #f8f9fa 100%);
  padding: 120px 0 2rem 0;
  
  @media (max-width: 768px) {
    padding-top: 100px;
  }
`;

const Container = styled.div`
  max-width: 900px;
  margin: 0 auto;
  padding: 0 20px;
`;

const HeroSection = styled.div`
  text-align: center;
  margin-bottom: 3rem;
`;

const Badge = styled.div`
  display: inline-block;
  background: ${props => props.theme?.colors?.primary || '#00C896'};
  color: white;
  padding: 0.5rem 1.5rem;
  border-radius: 25px;
  font-weight: 700;
  font-size: 0.9rem;
  margin-bottom: 1.5rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const Title = styled.h1`
  font-size: 2.5rem;
  font-weight: 800;
  color: ${props => props.theme?.colors?.text || '#111111'};
  margin-bottom: 1rem;
  line-height: 1.2;
  
  @media (max-width: 768px) {
    font-size: 2rem;
  }
`;

const Subtitle = styled.p`
  font-size: 1.1rem;
  color: ${props => props.theme?.colors?.text || '#111111'};
  opacity: 0.8;
  margin-bottom: 0.5rem;
`;

const Highlight = styled.p`
  font-size: 1rem;
  color: ${props => props.theme?.colors?.accent || '#DAA520'};
  font-weight: 600;
  margin-bottom: 1rem;
`;

const Description = styled.p`
  font-size: 1rem;
  color: ${props => props.theme?.colors?.text || '#111111'};
  opacity: 0.9;
  margin-bottom: 0.5rem;
`;

const FormCard = styled.div`
  background: ${props => props.theme?.colors?.cardBackground || '#ffffff'};
  border: 1px solid ${props => props.theme?.colors?.border || '#e5e5e5'};
  border-radius: 16px;
  padding: 2.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  margin-bottom: 2rem;
  
  @media (max-width: 768px) {
    padding: 1.5rem;
  }
`;

const FormTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 700;
  color: ${props => props.theme?.colors?.text || '#111111'};
  margin-bottom: 1.5rem;
  text-align: center;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const FormRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-weight: 600;
  color: ${props => props.theme?.colors?.text || '#111111'};
  font-size: 0.9rem;
`;

const Input = styled.input`
  padding: 0.875rem;
  border: 1px solid ${props => props.theme?.colors?.border || '#e5e5e5'};
  border-radius: 8px;
  font-size: 1rem;
  background: ${props => props.theme?.colors?.background || '#f8f9fa'};
  color: ${props => props.theme?.colors?.text || '#111111'};
  transition: all 0.3s ease;
  
  &:focus {
    outline: none;
    border-color: ${props => props.theme?.colors?.primary || '#00C896'};
    box-shadow: 0 0 0 3px ${props => `${props.theme?.colors?.primary || '#00C896'}20`};
  }
`;

const RadioGroup = styled.div`
  display: flex;
  gap: 2rem;
  margin-top: 0.5rem;
`;

const RadioLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.95rem;
  color: ${props => props.theme?.colors?.text || '#111111'};
  cursor: pointer;
  
  input[type="radio"] {
    width: 18px;
    height: 18px;
    cursor: pointer;
  }
`;

const SubmitButton = styled.button`
  background: ${props => props.theme?.colors?.primary || '#00C896'};
  color: white;
  padding: 1rem 2rem;
  border: none;
  border-radius: 10px;
  font-size: 1.1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 1rem;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px ${props => `${props.theme?.colors?.primary || '#00C896'}40`};
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const Warning = styled.p`
  text-align: center;
  color: ${props => props.theme?.colors?.accent || '#DAA520'};
  font-size: 0.9rem;
  font-weight: 600;
  margin-top: 1rem;
`;

const ReportCard = styled.div`
  background: ${props => props.theme?.colors?.cardBackground || '#ffffff'};
  border: 1px solid ${props => props.theme?.colors?.border || '#e5e5e5'};
  border-radius: 16px;
  padding: 2.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  
  @media (max-width: 768px) {
    padding: 1.5rem;
  }
`;

const ReportHeader = styled.div`
  text-align: center;
  padding-bottom: 2rem;
  border-bottom: 2px solid ${props => props.theme?.colors?.border || '#e5e5e5'};
  margin-bottom: 2rem;
`;

const ReportTitle = styled.h2`
  font-size: 2rem;
  font-weight: 800;
  color: ${props => props.theme?.colors?.text || '#111111'};
  margin-bottom: 1rem;
`;

const BusinessName = styled.div`
  font-size: 1.3rem;
  font-weight: 600;
  color: ${props => props.theme?.colors?.primary || '#00C896'};
  margin-bottom: 1rem;
`;

const OverallScore = styled.div`
  display: inline-block;
  background: linear-gradient(135deg, ${props => props.theme?.colors?.primary || '#00C896'}, ${props => props.theme?.colors?.accent || '#DAA520'});
  color: white;
  padding: 1rem 2rem;
  border-radius: 12px;
  font-size: 2rem;
  font-weight: 800;
`;

const Section = styled.div`
  margin-bottom: 2.5rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid ${props => props.theme?.colors?.border || '#e5e5e5'};
  
  &:last-child {
    border-bottom: none;
  }
`;

const SectionGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-bottom: 2.5rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid ${props => props.theme?.colors?.border || '#e5e5e5'};
  
  @media (max-width: 968px) {
    grid-template-columns: 1fr;
  }
`;

const GridSection = styled.div`
  /* No bottom border or margin as parent handles it */
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
`;

const SectionTitle = styled.h3`
  font-size: 1.3rem;
  font-weight: 700;
  color: ${props => props.theme?.colors?.text || '#111111'};
  margin: 0;
`;

const SectionScore = styled.div`
  background: ${props => props.score >= 70 ? '#00C896' : props.score >= 40 ? '#DAA520' : '#ff6b6b'};
  color: white;
  padding: 0.35rem 0.75rem;
  border-radius: 20px;
  font-weight: 700;
  font-size: 0.9rem;
`;

const SectionSubtitle = styled.p`
  color: ${props => props.theme?.colors?.text || '#111111'};
  opacity: 0.7;
  font-size: 0.9rem;
  margin-bottom: 1.5rem;
`;

const FindingsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
`;

const Finding = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.95rem;
  color: ${props => props.theme?.colors?.text || '#111111'};
`;

const WhyMatters = styled.div`
  background: ${props => props.theme?.colors?.background || '#f8f9fa'};
  border-left: 4px solid ${props => props.theme?.colors?.primary || '#00C896'};
  padding: 1rem;
  border-radius: 6px;
  margin-top: 1rem;
`;

const WhyMattersTitle = styled.div`
  font-weight: 700;
  color: ${props => props.theme?.colors?.text || '#111111'};
  margin-bottom: 0.5rem;
`;

const WhyMattersText = styled.p`
  color: ${props => props.theme?.colors?.text || '#111111'};
  opacity: 0.8;
  font-size: 0.9rem;
  margin: 0;
`;

const SummaryCard = styled.div`
  background: linear-gradient(135deg, ${props => props.theme?.colors?.primary || '#00C896'}15, ${props => props.theme?.colors?.accent || '#DAA520'}15);
  border: 2px solid ${props => props.theme?.colors?.primary || '#00C896'};
  border-radius: 12px;
  padding: 2rem;
  text-align: center;
  margin-top: 2rem;
`;

const SummaryTitle = styled.h3`
  font-size: 1.5rem;
  font-weight: 700;
  color: ${props => props.theme?.colors?.text || '#111111'};
  margin-bottom: 1rem;
`;

const SummaryText = styled.p`
  font-size: 1rem;
  color: ${props => props.theme?.colors?.text || '#111111'};
  opacity: 0.9;
  margin-bottom: 1.5rem;
`;

const CTAButton = styled.button`
  background: ${props => props.theme?.colors?.primary || '#00C896'};
  color: white;
  padding: 1rem 2.5rem;
  border: none;
  border-radius: 10px;
  font-size: 1.1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px ${props => `${props.theme?.colors?.primary || '#00C896'}40`};
  }
`;

const DownloadSection = styled.div`
  margin-top: 1.5rem;
  padding-top: 2rem;
  border-top: 1px solid ${props => props.theme?.colors?.border || '#e5e5e5'};
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.9rem;
`;

const DownloadButton = styled.button`
  background: ${props => props.theme?.colors?.primary || '#00C896'};
  color: white;
  border: none;
  border-radius: 10px;
  padding: 0.85rem 1.5rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    opacity: 0.92;
    transform: translateY(-1px);
  }
`;

const DownloadFormats = styled.div`
  display: flex;
  gap: 0.6rem;
  flex-wrap: wrap;
  justify-content: center;
`;

const FormatChip = styled.span`
  background: ${props => props.theme?.colors?.background || '#f8f9fa'};
  color: ${props => props.theme?.colors?.text || '#111111'};
  border: 1px solid ${props => props.theme?.colors?.border || '#e5e5e5'};
  border-radius: 999px;
  padding: 0.45rem 0.9rem;
  font-size: 0.85rem;
  font-weight: 600;
`;

export default function DigitalMarketingReportPage() {
  const theme = useTheme();
  const [showReport, setShowReport] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [searchMode, setSearchMode] = useState('search');
  const [showDownloadFormats, setShowDownloadFormats] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    businessName: '',
    address: '',
    phone: '',
    email: '',
    website: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsGenerating(true);
    
    // Simulate report generation delay
    setTimeout(() => {
      setIsGenerating(false);
      setShowReport(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 3000);
  };

  const mockReportData = {
    businessName: formData.businessName || 'Your Business',
    overallScore: 42,
    sections: [
      {
        title: 'Business Details',
        score: 0,
        subtitle: 'Evaluate completeness & accuracy of your business identity online.',
        findings: [
          { text: 'Chat Widget Not Found', positive: false },
          { text: 'Text-Enabled Business Number', positive: true },
          { text: 'Reliable Website Hosting', positive: true },
          { text: 'No Review Replies Detected', positive: false }
        ],
        whyMatters: 'Customers trust businesses with accurate, complete information. Missing details = lost revenue.'
      },
      {
        title: 'Tech Stack Analysis',
        score: 20,
        subtitle: 'Your digital marketing infrastructure score.',
        findings: [
          { text: 'Google Tag Manager – Not Installed', positive: false },
          { text: 'Google Analytics – Detected', positive: true },
          { text: 'Facebook Pixel – Not Found', positive: false },
          { text: 'Google Ads Pixel – Found', positive: true },
          { text: 'No Active Google Ads Campaigns', positive: false }
        ],
        whyMatters: 'Without proper pixels and tracking, ads become expensive, inaccurate, and hard to scale.'
      },
      {
        title: 'Google Business Profile',
        score: 80,
        subtitle: 'Your listing is verified and mostly complete.',
        findings: [
          { text: 'Address', positive: true },
          { text: 'Website', positive: true },
          { text: 'Photos', positive: true },
          { text: 'Phone', positive: true },
          { text: 'Hours Not Verified', positive: false }
        ],
        whyMatters: 'Over 60% of local buying decisions start on Google Maps.'
      },
      {
        title: 'Directory Listings',
        score: 0,
        subtitle: 'Your business is inconsistent across major directories.',
        findings: [
          { text: 'Accurate: 1/23', positive: false },
          { text: 'Partial Matches: 1/23', positive: false },
          { text: 'No Matches: 21/23', positive: false }
        ],
        whyMatters: 'Inconsistent information confuses Google — and sends customers to competitors.'
      },
      {
        title: 'Online Reputation',
        score: 50,
        subtitle: '⭐ Google Rating: 5.0 (1 review)',
        findings: [
          { text: 'No review replies', positive: false },
          { text: 'No Facebook business page detected', positive: false }
        ],
        whyMatters: 'Customers trust businesses with consistent, high-volume reviews.'
      },
      {
        title: 'Website Performance',
        score: 100,
        subtitle: 'Strong performance overall.',
        findings: [
          { text: 'Mobile Speed: 4.4s', positive: false },
          { text: 'Desktop Speed: 1.2s', positive: true },
          { text: 'Core Web Vitals: 94%', positive: true }
        ],
        whyMatters: 'Fast websites convert more and rank higher on Google.'
      },
      {
        title: 'SEO Analysis',
        score: 10,
        subtitle: 'No meaningful SEO detected.',
        findings: [
          { text: 'Competitors appear above you for industry keywords.', positive: false }
        ],
        whyMatters: 'Without SEO, you\'re invisible to potential customers searching for your services.'
      }
    ]
  };

  if (showReport) {
    return (
      <PageContainer>
        <Container>
          <ReportCard>
            <ReportHeader>
              <ReportTitle>Your Digital Marketing Report Is Ready</ReportTitle>
              <BusinessName>{mockReportData.businessName}</BusinessName>
              <OverallScore>{mockReportData.overallScore}%</OverallScore>
            </ReportHeader>

            {/* Business Details - Full Width */}
            <Section>
              <SectionHeader>
                <SectionTitle>1. {mockReportData.sections[0].title}</SectionTitle>
                <SectionScore score={mockReportData.sections[0].score}>{mockReportData.sections[0].score}%</SectionScore>
              </SectionHeader>
              <SectionSubtitle>{mockReportData.sections[0].subtitle}</SectionSubtitle>
              <FindingsList>
                {mockReportData.sections[0].findings.map((finding, fIndex) => (
                  <Finding key={fIndex}>
                    <span>{finding.positive ? '✔' : '❌'}</span>
                    <span>{finding.text}</span>
                  </Finding>
                ))}
              </FindingsList>
              <WhyMatters>
                <WhyMattersTitle>Why It Matters</WhyMattersTitle>
                <WhyMattersText>{mockReportData.sections[0].whyMatters}</WhyMattersText>
              </WhyMatters>
            </Section>

            {/* Tech Stack Analysis - Full Width */}
            <Section>
              <SectionHeader>
                <SectionTitle>2. {mockReportData.sections[1].title}</SectionTitle>
                <SectionScore score={mockReportData.sections[1].score}>{mockReportData.sections[1].score}%</SectionScore>
              </SectionHeader>
              <SectionSubtitle>{mockReportData.sections[1].subtitle}</SectionSubtitle>
              <FindingsList>
                {mockReportData.sections[1].findings.map((finding, fIndex) => (
                  <Finding key={fIndex}>
                    <span>{finding.positive ? '✔' : '❌'}</span>
                    <span>{finding.text}</span>
                  </Finding>
                ))}
              </FindingsList>
              <WhyMatters>
                <WhyMattersTitle>Why It Matters</WhyMattersTitle>
                <WhyMattersText>{mockReportData.sections[1].whyMatters}</WhyMattersText>
              </WhyMatters>
            </Section>

            {/* Google Business Profile & Directory Listings - Side by Side */}
            <SectionGrid>
              <GridSection>
                <SectionHeader>
                  <SectionTitle>3. {mockReportData.sections[2].title}</SectionTitle>
                  <SectionScore score={mockReportData.sections[2].score}>{mockReportData.sections[2].score}%</SectionScore>
                </SectionHeader>
                <SectionSubtitle>{mockReportData.sections[2].subtitle}</SectionSubtitle>
                <FindingsList>
                  {mockReportData.sections[2].findings.map((finding, fIndex) => (
                    <Finding key={fIndex}>
                      <span>{finding.positive ? '✔' : '❌'}</span>
                      <span>{finding.text}</span>
                    </Finding>
                  ))}
                </FindingsList>
                <WhyMatters>
                  <WhyMattersTitle>Why It Matters</WhyMattersTitle>
                  <WhyMattersText>{mockReportData.sections[2].whyMatters}</WhyMattersText>
                </WhyMatters>
              </GridSection>

              <GridSection>
                <SectionHeader>
                  <SectionTitle>4. {mockReportData.sections[3].title}</SectionTitle>
                  <SectionScore score={mockReportData.sections[3].score}>{mockReportData.sections[3].score}%</SectionScore>
                </SectionHeader>
                <SectionSubtitle>{mockReportData.sections[3].subtitle}</SectionSubtitle>
                <FindingsList>
                  {mockReportData.sections[3].findings.map((finding, fIndex) => (
                    <Finding key={fIndex}>
                      <span>{finding.positive ? '✔' : '❌'}</span>
                      <span>{finding.text}</span>
                    </Finding>
                  ))}
                </FindingsList>
                <WhyMatters>
                  <WhyMattersTitle>Why It Matters</WhyMattersTitle>
                  <WhyMattersText>{mockReportData.sections[3].whyMatters}</WhyMattersText>
                </WhyMatters>
              </GridSection>
            </SectionGrid>

            {/* Online Reputation & Website Performance - Side by Side */}
            <SectionGrid>
              <GridSection>
                <SectionHeader>
                  <SectionTitle>5. {mockReportData.sections[4].title}</SectionTitle>
                  <SectionScore score={mockReportData.sections[4].score}>{mockReportData.sections[4].score}%</SectionScore>
                </SectionHeader>
                <SectionSubtitle>{mockReportData.sections[4].subtitle}</SectionSubtitle>
                <FindingsList>
                  {mockReportData.sections[4].findings.map((finding, fIndex) => (
                    <Finding key={fIndex}>
                      <span>{finding.positive ? '✔' : '❌'}</span>
                      <span>{finding.text}</span>
                    </Finding>
                  ))}
                </FindingsList>
                <WhyMatters>
                  <WhyMattersTitle>Why It Matters</WhyMattersTitle>
                  <WhyMattersText>{mockReportData.sections[4].whyMatters}</WhyMattersText>
                </WhyMatters>
              </GridSection>

              <GridSection>
                <SectionHeader>
                  <SectionTitle>6. {mockReportData.sections[5].title}</SectionTitle>
                  <SectionScore score={mockReportData.sections[5].score}>{mockReportData.sections[5].score}%</SectionScore>
                </SectionHeader>
                <SectionSubtitle>{mockReportData.sections[5].subtitle}</SectionSubtitle>
                <FindingsList>
                  {mockReportData.sections[5].findings.map((finding, fIndex) => (
                    <Finding key={fIndex}>
                      <span>{finding.positive ? '✔' : '❌'}</span>
                      <span>{finding.text}</span>
                    </Finding>
                  ))}
                </FindingsList>
                <WhyMatters>
                  <WhyMattersTitle>Why It Matters</WhyMattersTitle>
                  <WhyMattersText>{mockReportData.sections[5].whyMatters}</WhyMattersText>
                </WhyMatters>
              </GridSection>
            </SectionGrid>

            {/* SEO Analysis - Full Width */}
            <Section>
              <SectionHeader>
                <SectionTitle>7. {mockReportData.sections[6].title}</SectionTitle>
                <SectionScore score={mockReportData.sections[6].score}>{mockReportData.sections[6].score}%</SectionScore>
              </SectionHeader>
              <SectionSubtitle>{mockReportData.sections[6].subtitle}</SectionSubtitle>
              <FindingsList>
                {mockReportData.sections[6].findings.map((finding, fIndex) => (
                  <Finding key={fIndex}>
                    <span>{finding.positive ? '✔' : '❌'}</span>
                    <span>{finding.text}</span>
                  </Finding>
                ))}
              </FindingsList>
              <WhyMatters>
                <WhyMattersTitle>Why It Matters</WhyMattersTitle>
                <WhyMattersText>{mockReportData.sections[6].whyMatters}</WhyMattersText>
              </WhyMatters>
            </Section>

            <DownloadSection>
              <DownloadButton onClick={() => setShowDownloadFormats(prev => !prev)}>
                Download Report
              </DownloadButton>
              {showDownloadFormats && (
                <DownloadFormats>
                  <FormatChip>PDF</FormatChip>
                  <FormatChip>DOCX</FormatChip>
                  <FormatChip>CSV</FormatChip>
                </DownloadFormats>
              )}
            </DownloadSection>
          </ReportCard>

          <ReportCard>
            <SummaryCard>
              <SummaryTitle>Summary</SummaryTitle>
              <SummaryText>
                Your score shows strong foundation but major gaps in SEO, listings, tech setup, and social presence; all of which are critical for online growth.
              </SummaryText>
              <SummaryText style={{ fontWeight: 700, marginBottom: '2rem' }}>
                {mockReportData.businessName} can fix everything automatically with KimuX.
              </SummaryText>
              <CTAButton onClick={() => window.location.href = '/signup'}>
                Get Started with KimuX
              </CTAButton>
            </SummaryCard>
          </ReportCard>
        </Container>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Container>
        <HeroSection>
          <Badge>FREE DIGITAL MARKETING REPORT</Badge>
          <Title>Identify Your Business' Growth Opportunities Online</Title>
          <Subtitle>
            79% of customers research a business online before making a purchase.
          </Subtitle>
          <Highlight>
            Incomplete or missing information leads to confusion, lower trust, and lost revenue.
          </Highlight>
          <Description>
            Get a complete, AI-powered analysis of your online presence in seconds.
          </Description>
          <Description>
            Find out what's working, what's missing, and what to fix to grow faster.
          </Description>
          <Description style={{ fontWeight: 600, marginTop: '1rem' }}>
            Complete the form below and your report will be generated automatically.
          </Description>
        </HeroSection>

        <FormCard>
          <FormTitle>Free Digital Marketing Report</FormTitle>
          <Form onSubmit={handleSubmit}>
            <FormRow>
              <FormGroup>
                <Label>First Name *</Label>
                <Input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  placeholder="John"
                />
              </FormGroup>
              <FormGroup>
                <Label>Last Name *</Label>
                <Input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  placeholder="Doe"
                />
              </FormGroup>
            </FormRow>

            <FormGroup>
              <Label>Search or Enter Business Information</Label>
              <RadioGroup>
                <RadioLabel>
                  <input
                    type="radio"
                    name="searchMode"
                    value="search"
                    checked={searchMode === 'search'}
                    onChange={(e) => setSearchMode(e.target.value)}
                  />
                  Search Business
                </RadioLabel>
                <RadioLabel>
                  <input
                    type="radio"
                    name="searchMode"
                    value="manual"
                    checked={searchMode === 'manual'}
                    onChange={(e) => setSearchMode(e.target.value)}
                  />
                  Manually Enter Business
                </RadioLabel>
              </RadioGroup>
            </FormGroup>

            <FormGroup>
              <Label>Business Name *</Label>
              <Input
                type="text"
                name="businessName"
                value={formData.businessName}
                onChange={handleChange}
                required
                placeholder="Acme Corp"
              />
            </FormGroup>

            <FormGroup>
              <Label>Business Address</Label>
              <Input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="123 Main St, City, State, ZIP"
              />
            </FormGroup>

            <FormRow>
              <FormGroup>
                <Label>Phone Number *</Label>
                <Input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  placeholder="(555) 123-4567"
                />
              </FormGroup>
              <FormGroup>
                <Label>Email *</Label>
                <Input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="john@example.com"
                />
              </FormGroup>
            </FormRow>

            <FormGroup>
              <Label>Website URL</Label>
              <Input
                type="url"
                name="website"
                value={formData.website}
                onChange={handleChange}
                placeholder="https://www.example.com"
              />
            </FormGroup>

            <SubmitButton type="submit" disabled={isGenerating}>
              {isGenerating ? '⏳ Generating Report...' : 'Generate My Report'}
            </SubmitButton>

            {isGenerating && (
              <Warning>
                Be patient. Your report may take a few minutes to generate. Do not close this page.
              </Warning>
            )}
          </Form>
        </FormCard>
      </Container>
    </PageContainer>
  );
}