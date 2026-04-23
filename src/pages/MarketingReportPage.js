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
  max-width: 1200px;
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
  padding: 0.8rem 3.5rem;
  border-radius: 28px;
  font-weight: 700;
  font-size: 1.3rem;
  margin-bottom: 1.5rem;
  text-transform: uppercase;
  letter-spacing: 0.9px;
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
  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.08),
    0 0 0 1px ${props => `${props.theme?.colors?.primary || '#00C896'}1A`},
    0 0 24px ${props => `${props.theme?.colors?.primary || '#00C896'}26`};
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

const ReportLayout = styled.div`
  display: grid;
  grid-template-columns: 250px 1fr;
  gap: 1.5rem;

  @media (max-width: 1080px) {
    grid-template-columns: 1fr;
  }
`;

const Sidebar = styled.aside`
  position: sticky;
  top: 110px;
  align-self: start;
  z-index: 3;
  background: ${props => props.theme?.colors?.cardBackground || '#ffffff'};
  border: 1px solid ${props => props.theme?.colors?.border || '#e5e5e5'};
  border-radius: 14px;
  padding: 1rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);

  @media (max-width: 1080px) {
    position: static;
  }
`;

const SidebarTitle = styled.h3`
  margin: 0 0 0.9rem 0;
  font-size: 1rem;
  font-weight: 800;
  color: ${props => props.theme?.colors?.text || '#111111'};
`;

const SidebarList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
`;

const SidebarButton = styled.button`
  text-align: left;
  width: 100%;
  border: 1px solid ${props => props.active ? (props.theme?.colors?.primary || '#00C896') : (props.theme?.colors?.border || '#e5e5e5')};
  background: ${props => props.active ? `${props.theme?.colors?.primary || '#00C896'}14` : 'transparent'};
  color: ${props => props.theme?.colors?.text || '#111111'};
  border-radius: 10px;
  padding: 0.6rem 0.7rem;
  font-weight: 600;
  font-size: 0.88rem;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: ${props => props.theme?.colors?.primary || '#00C896'};
    background: ${props => `${props.theme?.colors?.primary || '#00C896'}10`};
  }
`;

const ReportMain = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-width: 0;
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

const ScorePanel = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-top: 1.2rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const MiniMetric = styled.div`
  border: 1px solid ${props => props.theme?.colors?.border || '#e5e5e5'};
  border-radius: 12px;
  padding: 1rem;
  text-align: left;
`;

const MiniMetricLabel = styled.p`
  margin: 0;
  font-size: 0.8rem;
  opacity: 0.7;
  color: ${props => props.theme?.colors?.text || '#111111'};
`;

const MiniMetricValue = styled.p`
  margin: 0.35rem 0 0 0;
  font-size: 1.2rem;
  font-weight: 800;
  color: ${props => props.theme?.colors?.text || '#111111'};
`;

const GaugeWrap = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 0.5rem;
`;

const Gauge = styled.div`
  width: 220px;
  height: 120px;
  border-radius: 220px 220px 0 0;
  position: relative;
  overflow: hidden;
  background: conic-gradient(
    from 180deg,
    #e74c3c 0deg,
    #e74c3c 45deg,
    #f4b942 95deg,
    #1dd1a1 180deg
  );
`;

const GaugeInner = styled.div`
  position: absolute;
  inset: 16px 16px 0 16px;
  background: ${props => props.theme?.colors?.cardBackground || '#ffffff'};
  border-radius: 190px 190px 0 0;
`;

const GaugeNeedle = styled.div`
  position: absolute;
  left: 50%;
  bottom: 0;
  width: 3px;
  height: 90px;
  background: ${props => props.theme?.colors?.text || '#111111'};
  transform-origin: bottom center;
  transform: translateX(-50%) rotate(${props => props.angle}deg);
  border-radius: 999px;
`;

const GaugeLabel = styled.div`
  position: absolute;
  left: 50%;
  bottom: 24px;
  transform: translateX(-50%);
  font-size: 1.6rem;
  font-weight: 800;
  color: ${props => props.color};
`;

const Section = styled.div`
  background: ${props => props.theme?.colors?.cardBackground || '#ffffff'};
  border: 1px solid ${props => props.theme?.colors?.border || '#e5e5e5'};
  border-radius: 14px;
  padding: 1.35rem;
  margin-top: 0.55rem;
  scroll-margin-top: 110px;
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
`;

const SectionHeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 0.8rem;
`;

const SectionActions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.6rem;
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

const WhyToggle = styled.button`
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  line-height: 1;
  border-radius: 999px;
  border: 1px solid ${props => props.theme?.colors?.primary || '#00C896'};
  background: ${props => props.active ? `${props.theme?.colors?.primary || '#00C896'}22` : 'transparent'};
  color: ${props => props.theme?.colors?.text || '#111111'};
  font-weight: 800;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => `${props.theme?.colors?.primary || '#00C896'}1A`};
  }
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

const VisualRow = styled.div`
  margin: 1rem 0;
`;

const BarsWrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
`;

const BarItem = styled.div`
  display: grid;
  grid-template-columns: 140px 1fr 48px;
  gap: 0.7rem;
  align-items: center;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
    gap: 0.35rem;
  }
`;

const BarLabel = styled.span`
  font-size: 0.86rem;
  font-weight: 600;
  color: ${props => props.theme?.colors?.text || '#111111'};
`;

const BarTrack = styled.div`
  width: 100%;
  height: 8px;
  background: ${props => props.theme?.colors?.background || '#f3f4f6'};
  border-radius: 999px;
  overflow: hidden;
`;

const BarFill = styled.div`
  height: 100%;
  width: ${props => props.value}%;
  background: ${props => props.color};
  border-radius: 999px;
`;

const BarValue = styled.span`
  text-align: right;
  font-size: 0.82rem;
  font-weight: 700;
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
  const [businessSearchQuery, setBusinessSearchQuery] = useState('');
  const [showDownloadFormats, setShowDownloadFormats] = useState(false);
  const [activeSection, setActiveSection] = useState(0);
  const [openWhyCards, setOpenWhyCards] = useState({});
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

  const toggleWhyCard = (index) => {
    setOpenWhyCards(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const goToSection = (index) => {
    const sectionId = `report-section-${index + 1}`;
    const target = document.getElementById(sectionId);

    if (target) {
      setActiveSection(index);
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
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

  const performanceSpeed = 74;
  const gaugeAngle = -90 + (performanceSpeed / 100) * 180;
  const getPerformanceColor = (value) => {
    if (value < 30) return '#e74c3c';
    if (value < 70) return '#f4b942';
    return '#1dd1a1';
  };
  const speedColor = getPerformanceColor(performanceSpeed);
  const progressBarsBySection = {
    1: [
      { label: 'Tracking Coverage', value: 46 },
      { label: 'Pixel Completeness', value: 38 },
      { label: 'Campaign Readiness', value: 52 }
    ],
    3: [
      { label: 'Accurate Listings', value: 4 },
      { label: 'Partial Matches', value: 4 },
      { label: 'Missing Listings', value: 91 }
    ],
    4: [
      { label: 'Review Response Rate', value: 12 },
      { label: 'Sentiment Confidence', value: 61 },
      { label: 'Social Presence', value: 18 }
    ],
    6: [
      { label: 'Keyword Visibility', value: 19 },
      { label: 'Metadata Health', value: 28 },
      { label: 'Content Depth', value: 24 }
    ]
  };

  if (showReport) {
    return (
      <PageContainer>
        <Container>
          <ReportLayout>
            <Sidebar>
              <SidebarTitle>Report Sections</SidebarTitle>
              <SidebarList>
                {mockReportData.sections.map((section, index) => (
                  <SidebarButton
                    key={section.title}
                    active={activeSection === index}
                    onClick={() => goToSection(index)}
                  >
                    {index + 1}. {section.title}
                  </SidebarButton>
                ))}
              </SidebarList>
            </Sidebar>

            <ReportMain>
              <ReportCard>
                <ReportHeader>
                  <ReportTitle>Your Digital Marketing Report Is Ready</ReportTitle>
                  <BusinessName>{mockReportData.businessName}</BusinessName>
                  <OverallScore>{mockReportData.overallScore}%</OverallScore>

                  <ScorePanel>
                    <MiniMetric>
                      <MiniMetricLabel>Growth Readiness Index</MiniMetricLabel>
                      <MiniMetricValue>{performanceSpeed}%</MiniMetricValue>
                    </MiniMetric>
                    <MiniMetric>
                      <MiniMetricLabel>Lead Capture Confidence</MiniMetricLabel>
                      <MiniMetricValue>63%</MiniMetricValue>
                    </MiniMetric>
                  </ScorePanel>

                  <GaugeWrap>
                    <Gauge>
                      <GaugeInner />
                      <GaugeNeedle angle={gaugeAngle} />
                      <GaugeLabel color={speedColor}>{performanceSpeed}%</GaugeLabel>
                    </Gauge>
                  </GaugeWrap>
                </ReportHeader>

                {mockReportData.sections.map((section, index) => (
                  <Section key={section.title} id={`report-section-${index + 1}`}>
                    <SectionHeader>
                      <SectionHeaderLeft>
                        <SectionTitle>{index + 1}. {section.title}</SectionTitle>
                        <SectionScore score={section.score}>{section.score}%</SectionScore>
                      </SectionHeaderLeft>
                      <SectionActions>
                        <WhyToggle
                          type="button"
                          aria-label={`Toggle why it matters for ${section.title}`}
                          active={!!openWhyCards[index]}
                          onClick={() => toggleWhyCard(index)}
                        >
                          ?
                        </WhyToggle>
                      </SectionActions>
                    </SectionHeader>

                    <SectionSubtitle>{section.subtitle}</SectionSubtitle>

                    {progressBarsBySection[index] && (
                      <VisualRow>
                        <BarsWrap>
                          {progressBarsBySection[index].map((bar) => (
                            <BarItem key={bar.label}>
                              <BarLabel>{bar.label}</BarLabel>
                              <BarTrack>
                                <BarFill value={bar.value} color={getPerformanceColor(bar.value)} />
                              </BarTrack>
                              <BarValue>{bar.value}%</BarValue>
                            </BarItem>
                          ))}
                        </BarsWrap>
                      </VisualRow>
                    )}

                    <FindingsList>
                      {section.findings.map((finding, fIndex) => (
                        <Finding key={fIndex}>
                          <span>{finding.positive ? '✔' : 'X'}</span>
                          <span>{finding.text}</span>
                        </Finding>
                      ))}
                    </FindingsList>

                    {openWhyCards[index] && (
                      <WhyMatters>
                        <WhyMattersTitle>Why It Matters</WhyMattersTitle>
                        <WhyMattersText>{section.whyMatters}</WhyMattersText>
                      </WhyMatters>
                    )}
                  </Section>
                ))}

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
            </ReportMain>
          </ReportLayout>
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
                    onChange={(e) => {
                      setSearchMode(e.target.value);
                      setBusinessSearchQuery('');
                    }}
                  />
                  Manually Enter Business
                </RadioLabel>
              </RadioGroup>
              {searchMode === 'search' && (
                <Input
                  type="text"
                  value={businessSearchQuery}
                  onChange={(e) => setBusinessSearchQuery(e.target.value)}
                  placeholder="Search business name, phone, or address"
                />
              )}
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