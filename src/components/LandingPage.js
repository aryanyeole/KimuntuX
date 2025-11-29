import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { useTheme } from '../contexts/ThemeContext';
import { Link } from 'react-router-dom';
import kimuntuIntroVideo from '../assets/Kimuntu_intro.mp4';
import kimuntuAnimationVideo from '../assets/Kimuntu_animation.mp4';
import backgroundDesign from '../assets/background_design.jpg';

// Import partner logos
import awsLogo from '../assets/Company_logos/aws.jpg';
import amazonSellerLogo from '../assets/Company_logos/amazon_seller_central.jpg';
import amazonAssociatesLogo from '../assets/Company_logos/AmazonAssociates.jpg';
import walmartLogo from '../assets/Company_logos/walmart.jpg';
import marriottLogo from '../assets/Company_logos/Marriot.jpg';
import marriottBonvoyLogo from '../assets/Company_logos/Marriott_Bonvoy.jpg';
import marriottInternationalLogo from '../assets/Company_logos/marriott_International.jpg';
import maerskLogo from '../assets/Company_logos/maersk.jpg';
import lotNetworkLogo from '../assets/Company_logos/lotNetwork.jpg';
import dhlLogo from '../assets/Company_logos/DHL_express.jpg';
import clickBankLogo from '../assets/Company_logos/clickBank.jpg';
import cspaiementLogo from '../assets/Company_logos/clover.jpg';
import b2bBrokerLogo from '../assets/Company_logos/b2bBroker.jpg';
import dunBradstreetLogo from '../assets/Company_logos/dunAndBradstreet.jpg';
import zimLogo from '../assets/Company_logos/zim.jpg';
import canadaPostLogo from '../assets/Company_logos/canadaPost.jpg';

const LandingContainer = styled.div`
  min-height: 100vh;
  background-color: ${props => props.theme?.colors?.background || '#FFFFFF'};
  color: ${props => props.theme?.colors?.text || '#111111'};
  scroll-behavior: smooth;
`;

// Hero Section - Solid Black/Dark Background
const HeroSection = styled.section`
  min-height: 100vh;
  display: flex;
  align-items: center;
  position: relative;
  overflow: hidden;
  background: #000000;
  
  @media (max-width: 768px) {
    min-height: auto;
    padding: 100px 0 60px;
  }
`;

const HeroContainer = styled.div`
  width: 100%;
  min-height: 100vh;
  display: grid;
  grid-template-columns: 1fr 1fr;
  position: relative;
  z-index: 1;
  
  @media (max-width: 968px) {
    grid-template-columns: 1fr;
  }
`;

const HeroContent = styled.div`
  padding: 120px 60px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  text-align: left;
  position: relative;
  z-index: 2;
  
  @media (max-width: 968px) {
    text-align: center;
    padding: 80px 40px;
  }
  
  @media (max-width: 768px) {
    padding: 60px 24px;
  }
`;

const AnimationVideoContainer = styled.div`
  width: 100%;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #000000;
  opacity: 0;
  animation: fadeInBlend 1.5s ease-in-out 0.5s forwards;
  overflow: hidden;
  position: relative;
  
  @keyframes fadeInBlend {
    from {
      opacity: 0;
      transform: translateX(30px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
  
  @media (max-width: 968px) {
    height: 400px;
    order: -1;
  }
  
  @media (max-width: 768px) {
    height: 300px;
  }
`;

const AnimationVideo = styled.video`
  width: 100%;
  height: auto;
  max-height: 100vh;
  object-fit: contain;
  position: relative;
  z-index: 0;
  display: block;
`;

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 40px;
  position: relative;
  z-index: 1;
  width: 100%;
  
  @media (max-width: 768px) {
    padding: 0 24px;
  }
`;

// Increased font sizes
const HeroTitle = styled.h1`
  font-size: 4.5rem;
  font-weight: 700;
  color: white;
  margin-bottom: 2rem;
  font-family: ${props => props.theme?.fonts?.title || 'Poppins, sans-serif'};
  line-height: 1.1;
  letter-spacing: -0.02em;
  position: relative;
  z-index: 1;
  
  @media (max-width: 968px) {
    font-size: 3.5rem;
  }
  
  @media (max-width: 768px) {
    font-size: 2.5rem;
  }
`;

const HeroSubtitle = styled.p`
  font-size: 1.5rem;
  color: white;
  opacity: 0.9;
  margin-bottom: 3rem;
  font-family: ${props => props.theme?.fonts?.subtitle || 'Montserrat, sans-serif'};
  line-height: 1.7;
  font-weight: 400;
  position: relative;
  z-index: 1;
  
  @media (max-width: 768px) {
    font-size: 1.25rem;
  }
`;

const CTAButtons = styled.div`
  display: flex;
  gap: 1.5rem;
  justify-content: flex-start;
  flex-wrap: wrap;
  position: relative;
  z-index: 1;
  
  @media (max-width: 968px) {
    justify-content: center;
  }
`;

const CTAButton = styled(Link)`
  padding: 18px 48px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 1.125rem;
  cursor: pointer;
  transition: all 0.3s ease;
  text-decoration: none;
  display: inline-block;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  
  &.primary {
    background-color: ${props => props.theme?.colors?.primary || '#00C896'};
    color: white;
    border: 2px solid ${props => props.theme?.colors?.primary || '#00C896'};
    
    &:hover {
      background-color: #00B085;
      border-color: #00B085;
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(0, 200, 150, 0.3);
    }
  }
  
  &.secondary {
    background-color: transparent;
    color: white;
    border: 2px solid white;
    
    &:hover {
      background-color: white;
      color: #000000;
      transform: translateY(-2px);
    }
  }
  
  @media (max-width: 768px) {
    padding: 16px 36px;
    font-size: 1rem;
  }
`;

const Section = styled.section`
  padding: 100px 0;
  position: relative;
  
  @media (max-width: 768px) {
    padding: 60px 0;
  }
`;

const SectionTitle = styled.h2`
  text-align: center;
  font-size: 3.5rem;
  font-weight: 700;
  color: ${props => props.theme?.colors?.text || '#111111'};
  margin-bottom: 1.5rem;
  font-family: ${props => props.theme?.fonts?.title || 'Poppins, sans-serif'};
  letter-spacing: -0.02em;
  line-height: 1.2;
  
  @media (max-width: 768px) {
    font-size: 2.5rem;
  }
`;

const SectionSubtitle = styled.p`
  text-align: center;
  font-size: 1.25rem;
  color: ${props => props.theme?.colors?.text || '#111111'};
  opacity: 0.75;
  margin-bottom: 4rem;
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
  line-height: 1.8;
  font-weight: 400;
  
  @media (max-width: 768px) {
    font-size: 1.125rem;
  }
`;

const PreviewSection = styled(Section)`
  background-color: ${props => props.theme?.colors?.background || '#FFFFFF'};
`;

const PreviewVideoContainer = styled.div`
  width: 100%;
  margin: 0 auto;
  position: relative;
  overflow: hidden;
  background-color: #000;
  border-radius: 12px;
`;

const PreviewVideo = styled.video`
  width: 100%;
  height: auto;
  display: block;
  object-fit: contain;
`;

// Features Section with Sliding Animation
const FeaturesSection = styled(Section)`
  background: radial-gradient(1200px 600px at -10% -10%, ${p => (p.theme?.colors?.primary || '#00C896')}0D, transparent 60%),
              radial-gradient(1000px 500px at 110% -20%, ${p => (p.theme?.colors?.accent || '#DAA520')}0F, transparent 55%),
              ${p => p.theme?.colors?.background || '#FFFFFF'};
  overflow: hidden;
`;

const FeaturesSliderContainer = styled.div`
  overflow: hidden;
  position: relative;
  width: 100%;
  padding: 20px 0;
`;

const FeaturesSlider = styled.div`
  display: flex;
  gap: 2rem;
  animation: slideFeatures 60s linear infinite;
  width: fit-content;
  
  @keyframes slideFeatures {
    0% {
      transform: translateX(0);
    }
    100% {
      transform: translateX(-50%);
    }
  }
  
  &:hover {
    animation-play-state: paused;
  }
  
  @media (max-width: 968px) {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    animation: none;
    gap: 1.5rem;
  }
`;

const FeaturesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 2rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
`;

const FeatureCard = styled.div`
  position: relative;
  background: linear-gradient(180deg, ${p => (p.theme?.colors?.cardBackground || '#f8f9fa')} 0%, ${p => (p.theme?.colors?.background || '#FFFFFF')} 100%);
  border: 1px solid ${p => p.theme?.colors?.border || '#E5E5E5'};
  border-radius: 16px;
  padding: 1.5rem;
  transition: all 0.3s ease;
  text-align: left;
  box-shadow: 0 8px 20px rgba(0,0,0,0.04);
  min-width: 320px;
  max-width: 340px;
  flex-shrink: 0;
  
  &::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 4px;
    background: linear-gradient(90deg, ${p => p.theme?.colors?.primary || '#00C896'}, ${p => p.theme?.colors?.accent || '#DAA520'});
    border-top-left-radius: 16px;
    border-top-right-radius: 16px;
    opacity: 0;
    transition: opacity 0.3s ease;
  }
  
  &:hover {
    transform: translateY(-6px);
    box-shadow: 0 18px 42px rgba(0,0,0,0.08);
    border-color: ${p => p.theme?.colors?.primary || '#00C896'}33;
    
    &::before {
      opacity: 1;
    }
  }
  
  @media (max-width: 968px) {
    min-width: auto;
    max-width: 350px;
  }
`;

const FeatureIcon = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: linear-gradient(135deg, ${p => (p.theme?.colors?.primary || '#00C896')}15, ${p => (p.theme?.colors?.accent || '#DAA520')}15);
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 24px;
    height: 24px;
    border-radius: 6px;
    background: linear-gradient(135deg, ${p => p.theme?.colors?.primary || '#00C896'}, ${p => p.theme?.colors?.accent || '#DAA520'});
    opacity: 0.3;
  }
  
  &::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 36px;
    height: 36px;
    border-radius: 8px;
    background: linear-gradient(135deg, ${p => p.theme?.colors?.primary || '#00C896'}, ${p => p.theme?.colors?.accent || '#DAA520'});
    opacity: 0.1;
  }
`;

const FeatureTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  color: ${props => props.theme?.colors?.text || '#111111'};
  margin-bottom: 0.5rem;
  font-family: ${props => props.theme?.fonts?.title || 'Poppins, sans-serif'};
  line-height: 1.3;
`;

const FeatureDescription = styled.p`
  color: ${props => props.theme?.colors?.text || '#111111'};
  opacity: 0.75;
  line-height: 1.6;
  font-size: 0.9375rem;
  font-weight: 400;
`;

const SectorsSection = styled(Section)`
  position: relative;
  overflow: hidden;
  background-image: url(${backgroundDesign});
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-attachment: fixed;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(248, 249, 250, 0.7);
    z-index: 0;
  }
  
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(1200px 600px at -10% -10%, ${p => (p.theme?.colors?.primary || '#00C896')}0D, transparent 60%),
                radial-gradient(1000px 500px at 110% -20%, ${p => (p.theme?.colors?.accent || '#DAA520')}0F, transparent 55%),
                transparent;
    z-index: 1;
  }
  
  > * {
    position: relative;
    z-index: 2;
  }
`;

const SectorsGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  justify-content: center;
  
  @media (max-width: 968px) {
    justify-content: center;
  }
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: center;
  }
`;

const SectorCard = styled.div`
  position: relative;
  background: linear-gradient(180deg, ${p => (p.theme?.colors?.background || '#FFFFFF')} 0%, ${p => (p.theme?.colors?.cardBackground || '#f8f9fa')} 100%);
  border: 1px solid ${p => p.theme?.colors?.border || '#E5E5E5'};
  border-radius: 16px;
  padding: 2rem;
  text-align: center;
  transition: all 0.3s ease;
  box-shadow: 0 8px 20px rgba(0,0,0,0.04);
  flex: 0 0 calc(33.333% - 1rem);
  min-width: 280px;
  max-width: 350px;
  
  @media (max-width: 968px) {
    flex: 0 0 calc(50% - 0.75rem);
  }
  
  @media (max-width: 768px) {
    flex: 0 0 100%;
    max-width: 400px;
  }
  
  &::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 4px;
    background: linear-gradient(90deg, ${p => p.theme?.colors?.primary || '#00C896'}, ${p => p.theme?.colors?.accent || '#DAA520'});
    border-top-left-radius: 16px;
    border-top-right-radius: 16px;
    opacity: 0;
    transition: opacity 0.3s ease;
  }
  
  &:hover {
    transform: translateY(-6px);
    box-shadow: 0 18px 42px rgba(0,0,0,0.08);
    border-color: ${p => p.theme?.colors?.primary || '#00C896'}33;
    
    &::before {
      opacity: 1;
    }
  }
`;

const SectorIcon = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: linear-gradient(135deg, ${p => (p.theme?.colors?.primary || '#00C896')}15, ${p => (p.theme?.colors?.accent || '#DAA520')}15);
  margin: 0 auto 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: linear-gradient(135deg, ${p => p.theme?.colors?.primary || '#00C896'}, ${p => p.theme?.colors?.accent || '#DAA520'});
    opacity: 0.1;
  }
`;

const SectorTitle = styled.h4`
  font-size: 1.25rem;
  font-weight: 600;
  color: ${props => props.theme?.colors?.text || '#111111'};
  margin-bottom: 0.5rem;
  font-family: ${props => props.theme?.fonts?.title || 'Poppins, sans-serif'};
`;

const SectorDescription = styled.p`
  color: ${props => props.theme?.colors?.text || '#111111'};
  opacity: 0.75;
  line-height: 1.6;
  font-size: 1rem;
`;

// Partners Section - Larger Logos
const PartnersSection = styled(Section)`
  background-color: ${props => props.theme?.colors?.background || '#FFFFFF'};
  padding: 80px 0;
  overflow: hidden;
  position: relative;
  
  &::before,
  &::after {
    content: '';
    position: absolute;
    top: 0;
    bottom: 0;
    width: 150px;
    z-index: 2;
    pointer-events: none;
  }
  
  &::before {
    left: 0;
    background: linear-gradient(to right, ${p => p.theme?.colors?.background || '#FFFFFF'}, transparent);
  }
  
  &::after {
    right: 0;
    background: linear-gradient(to left, ${p => p.theme?.colors?.background || '#FFFFFF'}, transparent);
  }
`;

const PartnersTitle = styled.h2`
  text-align: center;
  font-size: 3rem;
  font-weight: 700;
  color: ${props => props.theme?.colors?.text || '#111111'};
  margin-bottom: 3rem;
  font-family: ${props => props.theme?.fonts?.title || 'Poppins, sans-serif'};
  letter-spacing: -0.02em;
  line-height: 1.2;
  
  @media (max-width: 768px) {
    font-size: 2rem;
    margin-bottom: 2rem;
  }
`;

const LogoSlider = styled.div`
  display: flex;
  gap: 4rem;
  animation: slide 40s linear infinite;
  width: fit-content;
  
  @keyframes slide {
    0% {
      transform: translateX(0);
    }
    100% {
      transform: translateX(-50%);
    }
  }
  
  &:hover {
    animation-play-state: paused;
  }
`;

const LogoWrapper = styled.div`
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 240px;
  height: 140px;
  padding: 1.5rem;
  background-color: ${props => props.theme?.colors?.background || '#FFFFFF'};
  border: 1px solid ${props => props.theme?.colors?.border || '#E5E5E5'};
  border-radius: 12px;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
    border-color: ${props => props.theme?.colors?.primary || '#00C896'}33;
  }
`;

const LogoImage = styled.img`
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  opacity: 0.8;
  transition: all 0.3s ease;
  
  ${LogoWrapper}:hover & {
    opacity: 1;
    transform: scale(1.05);
  }
`;

const SliderContainer = styled.div`
  overflow: hidden;
  position: relative;
  width: 100%;
`;

const LandingPage = () => {
  const theme = useTheme();
  const [showVideo, setShowVideo] = useState(false);
  const videoRef = useRef(null);
  const animationVideoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            video.play().catch((err) => {
              console.log('Video autoplay prevented:', err);
            });
          } else {
            video.pause();
          }
        });
      },
      {
        threshold: 0.5,
      }
    );

    observer.observe(video);

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    const animationVideo = animationVideoRef.current;
    if (!animationVideo) return;

    animationVideo.play().catch((err) => {
      console.log('Animation video autoplay prevented:', err);
    });
  }, []);

  const keySolutions = [
    { title: 'AI Marketing Engine', description: 'Create, launch, and optimize ads automatically across Facebook, Instagram, YouTube, and more with AI-powered campaign management.' },
    { title: 'Smart Brokerage Tools', description: 'Connect with verified partners, suppliers, and clients globally through AI-powered brokerage and blockchain-secured transactions.' },
    { title: 'Blockchain Security Layer', description: 'Secure transactions with smart contracts, escrow services, and transparent blockchain verification for trust and compliance.' },
    { title: 'API Integrations', description: 'Build, extend, and innovate with KimuntuX APIs, SDKs, and partner marketplace for seamless third-party connections.' },
    { title: 'AI Boutique Builder', description: 'Launch your complete online store in minutes, automatically designed, optimized, and ready to sell with AI-generated content.' },
    { title: 'Intelligent CRM', description: 'Manage leads, clients, and conversations effortlessly with smart automation and AI-powered follow-ups and insights.' },
    { title: 'Smart Fintech Hub', description: 'Multi-currency wallets, instant payouts, AI fraud detection, and smart crypto wallet with predictive investment engine.' },
    { title: 'Multi-Channel Commerce', description: 'Sync your Shopify, WooCommerce, Amazon, and TikTok stores into one smart dashboard for unified management.' },
    { title: 'Data & Intelligence', description: 'Get real-time analytics, forecasts, and personalized AI recommendations to grow faster with data-driven insights.' },
    { title: 'Affiliate & Reseller Network', description: 'Join the global affiliate community: earn, promote, and grow with transparent blockchain rewards and tracking.' }
  ];

  const sectors = [
    {
      title: 'Government & Public Sector',
      description: 'Empower digital governance with AI insights and blockchain transparency.'
    },
    {
      title: 'Financial Services',
      description: 'Predict markets, secure payments, and automate brokerage operations.'
    },
    {
      title: 'Real Estate',
      description: 'Smart contracts and AI valuations for faster, trusted transactions.'
    },
    {
      title: 'Logistics & Supply Chain',
      description: 'Optimize delivery, tracking, and supplier connections through AI.'
    },
    {
      title: 'Non-Profit Organizations',
      description: 'Ensure donation transparency and maximize social impact.'
    },
    {
      title: 'SMBs & Entrepreneurs',
      description: 'All-in-one CRM, marketplace, and fintech tools to grow faster.'
    },
    {
      title: 'Professional Services',
      description: 'AI-powered automation for clients, projects, and digital visibility.'
    },
    {
      title: 'All Sectors',
      description: 'One intelligent ecosystem — secure, scalable, and globally connected.'
    }
  ];

  const partners = [
    { logo: awsLogo, name: 'AWS Partner Network' },
    { logo: amazonSellerLogo, name: 'Amazon Seller Central' },
    { logo: amazonAssociatesLogo, name: 'Amazon Associates' },
    { logo: walmartLogo, name: 'Walmart' },
    { logo: marriottLogo, name: 'Marriott' },
    { logo: marriottBonvoyLogo, name: 'Marriott Bonvoy' },
    { logo: marriottInternationalLogo, name: 'Marriott International' },
    { logo: maerskLogo, name: 'Maersk' },
    { logo: lotNetworkLogo, name: 'LOT Network' },
    { logo: dhlLogo, name: 'DHL Express' },
    { logo: clickBankLogo, name: 'ClickBank' },
    { logo: cspaiementLogo, name: 'CSPaiement' },
    { logo: b2bBrokerLogo, name: 'B2B Broker' },
    { logo: dunBradstreetLogo, name: 'Dun & Bradstreet' },
    { logo: zimLogo, name: 'ZIM' },
    { logo: canadaPostLogo, name: 'Canada Post' }
  ];

  const duplicatedPartners = [...partners, ...partners];
  const duplicatedSolutions = [...keySolutions, ...keySolutions];

  return (
    <LandingContainer>
      <HeroSection>
        <HeroContainer>
          <HeroContent>
            <HeroTitle>
              AI-Powered Digital Brokerage & Marketing Platform Built on Blockchain.
            </HeroTitle>
            <HeroSubtitle>
              "Empowering individuals and enterprises to build, connect, and grow through intelligent, inclusive, and borderless digital commerce."
            </HeroSubtitle>
            <CTAButtons>
              <CTAButton to="/signup" className="primary">Start Your Journey</CTAButton>
              <CTAButton to="/solutions" className="secondary">Explore Solutions</CTAButton>
            </CTAButtons>
          </HeroContent>
          <AnimationVideoContainer>
            <AnimationVideo
              ref={animationVideoRef}
              autoPlay
              loop
              muted
              playsInline
            >
              <source src={kimuntuAnimationVideo} type="video/mp4" />
              Your browser does not support the video tag.
            </AnimationVideo>
          </AnimationVideoContainer>
        </HeroContainer>
      </HeroSection>

      <PreviewSection>
        <Container>
          <SectionTitle>Platform Preview</SectionTitle>
          <SectionSubtitle>
            Experience the power of unified AI-driven business management with real-time analytics, smart automation, and comprehensive insights.
          </SectionSubtitle>
          <PreviewVideoContainer>
            <PreviewVideo
              ref={videoRef}
              loop
              muted
              playsInline
            >
              <source src={kimuntuIntroVideo} type="video/mp4" />
              Your browser does not support the video tag.
            </PreviewVideo>
          </PreviewVideoContainer>
        </Container>
      </PreviewSection>

      <FeaturesSection>
        <Container>
          <SectionTitle>Key Solutions</SectionTitle>
          <SectionSubtitle>
            KimuntuX solves the real-world pain points that individuals, entrepreneurs, and enterprises face in the modern digital economy. It merges AI, Blockchain, and Fintech into a single intelligent platform that simplifies, secures, and scales business growth.
          </SectionSubtitle>
          <FeaturesSliderContainer>
            <FeaturesSlider>
              {duplicatedSolutions.map((solution, index) => (
                <FeatureCard key={index}>
                  <FeatureIcon />
                  <FeatureTitle>{solution.title}</FeatureTitle>
                  <FeatureDescription>{solution.description}</FeatureDescription>
                </FeatureCard>
              ))}
            </FeaturesSlider>
          </FeaturesSliderContainer>
        </Container>
      </FeaturesSection>

      <SectorsSection>
        <Container>
          <SectionTitle>Why Choose Us</SectionTitle>
          <SectionSubtitle>
            Benefits Across All Sectors
          </SectionSubtitle>
          <SectorsGrid>
            {sectors.map((sector, index) => (
              <SectorCard key={index}>
                <SectorIcon />
                <SectorTitle>{sector.title}</SectorTitle>
                <SectorDescription>{sector.description}</SectorDescription>
              </SectorCard>
            ))}
          </SectorsGrid>
        </Container>
      </SectorsSection>

      <PartnersSection>
        <Container>
          <PartnersTitle>Our Trusted Partners</PartnersTitle>
          <SliderContainer>
            <LogoSlider>
              {duplicatedPartners.map((partner, index) => (
                <LogoWrapper key={index}>
                  <LogoImage src={partner.logo} alt={partner.name} />
                </LogoWrapper>
              ))}
            </LogoSlider>
          </SliderContainer>
        </Container>
      </PartnersSection>
    </LandingContainer>
  );
};

export default LandingPage;
