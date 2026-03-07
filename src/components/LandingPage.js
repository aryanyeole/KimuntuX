import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { useTheme } from '../contexts/ThemeContext';
import { Link } from 'react-router-dom';
import kimuntuIntroVideo from '../assets/Kimuntu_intro.mp4';
import kimuntuAnimationVideo from '../assets/Homepage_title_video.mp4';
import backgroundDesign from '../assets/background_design.jpg';
import whyChooseUsBackground from '../assets/WHY Choose us backgound.png';
import onlineBoutiqueImage from '../assets/Online_Boutique.jpeg';
import crmImage from '../assets/CRM.jpeg';
import fintechImage from '../assets/Fintech.jpeg';
import digitalMarketingImage from '../assets/Digital Marketing.jpeg';
import marketplaceApiImage from '../assets/Marketplace API.jpeg';
import funnelsLandingPageImage from '../assets/Funnels and landing page.jpeg';
import affiliateImage from '../assets/Affiliate.png';
import campaignImage from '../assets/Campaign.jpeg';
import brokerageImage from '../assets/Brokerage.jpeg';
import blockchainImage from '../assets/Blockchain commerce plateform.jpeg';
import websiteEcommerceBoutiqueImage from '../assets/Website_Ecommerce_boutique.jpeg';
import financialInclusionImage from '../assets/Financial Inclusion.jpg';
import aiDrivenCryptoImage from '../assets/AI Driven Crypto.jpg';

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
  flex-direction: column;
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

const BlockchainText = styled.span`
  font-size: 0.7em;
  color: ${props => props.theme?.colors?.primary || '#00C896'};
  display: block;
`;

const HeroSubtitle = styled.p`
  font-size: 2rem;
  color: white;
  opacity: 0.9;
  margin-bottom: 3rem;
  font-family: ${props => props.theme?.fonts?.subtitle || 'Montserrat, sans-serif'};
  line-height: 1.7;
  font-weight: 400;
  position: relative;
  z-index: 1;
  
  @media (max-width: 968px) {
    font-size: 1.75rem;
  }
  
  @media (max-width: 768px) {
    font-size: 1.5rem;
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
  font-size: 4.5rem;
  font-weight: 700;
  color: ${props => props.theme?.colors?.text || '#111111'};
  margin-bottom: 1.5rem;
  font-family: ${props => props.theme?.fonts?.title || 'Poppins, sans-serif'};
  letter-spacing: -0.02em;
  line-height: 1.2;
  
  @media (max-width: 968px) {
    font-size: 3.5rem;
  }
  
  @media (max-width: 768px) {
    font-size: 4rem;
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

const IntroSection = styled.div`
  margin-top: 1.25rem;
  padding-top: 1rem;
  padding-bottom: 3rem;
  width: 100%;
`;

const IntroCard = styled.div`
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-left: 4px solid ${p => p.theme?.colors?.primary || '#00C896'};
  border-radius: 14px;
  padding: 2.5rem 2.75rem;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.25);
  position: relative;
  
  @media (max-width: 768px) {
    padding: 2rem 1.5rem;
  }
`;

const IntroHeadline = styled.h2`
  font-size: 2.9rem;
  font-weight: 700;
  color: #ffffff;
  text-align: left;
  margin: 0 0 1.5rem 0;
  font-family: ${props => props.theme?.fonts?.title || 'Poppins, sans-serif'};
  line-height: 1.2;
  
  span {
    color: ${props => props.theme?.colors?.primary || '#00C896'};
  }
  
  @media (max-width: 968px) {
    font-size: 2.5rem;
    text-align: center;
  }
  
  @media (max-width: 768px) {
    font-size: 2.1rem;
  }
`;

const IntroText = styled.p`
  font-size: 1.35rem;
  color: rgba(255, 255, 255, 0.85);
  opacity: 1;
  line-height: 1.8;
  max-width: 980px;
  margin: 0 0 1.5rem;
  text-align: left;
  
  @media (max-width: 768px) {
    font-size: 1.15rem;
    text-align: center;
  }
`;

const IntroHighlight = styled(IntroText)`
  margin: 0 0 1.75rem;
  
  strong {
    font-weight: 700;
    color: ${props => props.theme?.colors?.primary || '#00C896'};
  }
`;

const IntroSubheading = styled(IntroText)`
  margin: 0 0 1rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.7);
`;

const IntroBenefitsRow = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.75rem;
  max-width: 920px;
  margin: 0 0 1.25rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const IntroBenefit = styled.div`
  padding: 0.85rem 1.25rem;
  text-align: center;
  font-size: 1.05rem;
  font-weight: 600;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  border-radius: 999px;
  border: 1px solid rgba(0, 200, 150, 0.45);
  background: rgba(0, 200, 150, 0.08);
  transition: all 0.25s ease;
  cursor: default;
  
  &:hover {
    background: rgba(0, 200, 150, 0.18);
    border-color: rgba(0, 200, 150, 0.8);
    box-shadow: 0 10px 24px rgba(0, 200, 150, 0.2);
    transform: translateY(-2px);
  }
`;

const IntroFooter = styled(IntroText)`
  margin: 0;
`;

const PreviewSubtitle = styled.p`
  text-align: center;
  font-size: 2rem;
  color: ${props => props.theme?.colors?.text || '#111111'};
  opacity: 0.75;
  margin-bottom: 4rem;
  width: 100%;
  line-height: 1.8;
  font-weight: 400;
  
  @media (max-width: 968px) {
    font-size: 2.25rem;
  }
  
  @media (max-width: 768px) {
    font-size: 1.75rem;
  }
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
  padding-top: 40px;
  padding-bottom: 50px;
  
  @media (max-width: 768px) {
    padding-top: 30px;
    padding-bottom: 30px;
  }
`;

const FeaturesSubtitle = styled.p`
  text-align: center;
  font-size: 1.8rem;
  color: ${props => props.theme?.colors?.text || '#111111'};
  opacity: 0.75;
  margin-bottom: 4rem;
  width: 100%;
  line-height: 1.8;
  font-weight: 400;
  
  @media (max-width: 968px) {
    font-size: 1.75rem;
  }
  
  @media (max-width: 768px) {
    font-size: 1.5rem;
  }
`;

const CTASection = styled(Section)`
  position: relative;
  padding: 50px 20px 100px;
  text-align: center;
  overflow: hidden;
  
  @media (max-width: 768px) {
    padding: 30px 20px 60px;
  }
`;

const CTAHeading = styled.h2`
  font-size: 3rem;
  font-weight: 700;
  color: ${props => props.theme?.colors?.text || '#111111'};
  margin-bottom: 1.5rem;
  font-family: ${props => props.theme?.fonts?.title || 'Poppins, sans-serif'};
  line-height: 1.2;
  
  @media (max-width: 768px) {
    font-size: 2rem;
  }
`;

const CTADescription = styled.p`
  font-size: 1.8rem;
  color: ${props => props.theme?.colors?.text || '#111111'};
  opacity: 0.8;
  margin-bottom: 2.5rem;
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
  line-height: 1.7;
  font-weight: 400;
  
  @media (max-width: 768px) {
    font-size: 1.25rem;
  }
`;

const StartTrialButton = styled(Link)`
  background-color: ${props => props.theme?.colors?.primary || '#00C896'};
  color: white;
  text-decoration: none;
  padding: 12px 24px;
  border-radius: 4px;
  font-size: 1.375rem;
  font-weight: 500;
  transition: all 0.2s ease;
  display: inline-block;
  
  &:hover {
    background-color: #00B085;
  }
`;

const FeaturesSliderContainer = styled.div`
  overflow: hidden;
  position: relative;
  width: 100vw;
  margin-left: calc(-50vw + 50%);
  padding: 20px 0;
  
  @media (max-width: 968px) {
    width: 100%;
    margin-left: 0;
  }
`;

const FeaturesSlider = styled.div`
  display: flex;
  gap: 2rem;
  animation: slideFeatures 120s linear infinite;
  width: fit-content;
  
  @keyframes slideFeatures {
    0% {
      transform: translateX(0);
    }
    100% {
      transform: translateX(-33.333%);
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
    transform: none !important;
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
  padding: 2rem;
  transition: all 0.3s ease;
  text-align: center;
  box-shadow: 0 8px 20px rgba(0,0,0,0.04);
  min-width: 420px;
  max-width: 600px;
  flex-shrink: 0;
  overflow: hidden;
  
  &:hover {
    transform: translateY(-6px);
    box-shadow: 0 18px 42px rgba(0,0,0,0.08);
    border-color: ${p => p.theme?.colors?.primary || '#00C896'}33;
  }
  
  @media (max-width: 968px) {
    min-width: auto;
    max-width: 600px;
  }
`;

const FeatureCardContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  align-items: center;
  width: 100%;
  height: 100%;
  justify-content: space-between;
`;

const FeatureTextSection = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  flex-shrink: 0;
`;

const FeatureImage = styled.img`
  width: 100%;
  height: auto;
  object-fit: contain;
  border-radius: 12px;
  max-height: 450px;
  margin-top: auto;
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
  font-size: 1.7rem;
  font-weight: 600;
  color: ${props => props.theme?.colors?.text || '#111111'};
  margin-bottom: 0.75rem;
  font-family: ${props => props.theme?.fonts?.title || 'Poppins, sans-serif'};
  line-height: 1.3;
  text-align: center;
  width: 100%;
`;

const FeatureDescription = styled.p`
  color: ${props => props.theme?.colors?.text || '#111111'};
  opacity: 0.75;
  line-height: 1.6;
  font-size: 1.3rem;
  font-weight: 400;
  text-align: center;
  width: 100%;
`;

const SectorsSection = styled(Section)`
  position: relative;
  overflow: hidden;
  background-image: url(${whyChooseUsBackground});
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-attachment: fixed;
  
  padding-bottom: 50px;
  
  @media (max-width: 768px) {
    padding-bottom: 30px;
  }
`;

const SectorsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.5rem;
  justify-items: center;
  
  @media (max-width: 1200px) {
    grid-template-columns: repeat(2, 1fr);
  }
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const SectorTitle = styled.h4`
  font-size: 1.35rem;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 0.5rem;
  font-family: ${props => props.theme?.fonts?.title || 'Poppins, sans-serif'};
  transition: font-size 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
`;

const SectorDescription = styled.p`
  color: #ffffff;
  opacity: 0.9;
  line-height: 1.6;
  font-size: 1.1rem;
  transition: font-size 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.4s ease;
`;

const SectorCard = styled.div`
  position: relative;
  background: ${p => p.theme?.colors?.primary || '#00C896'};
  border: 1px solid ${p => p.theme?.colors?.primary || '#00C896'};
  border-radius: 16px;
  padding: 2rem;
  text-align: center;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  box-shadow: 0 8px 20px rgba(0,0,0,0.12);
  width: 100%;
  max-width: 100%;
  cursor: pointer;
  
  &:hover {
    transform: translateY(-12px) scale(1.05);
    box-shadow: 0 24px 60px rgba(0,0,0,0.15);
    border-color: #f2c94c;
    z-index: 10;
    
    ${SectorTitle} {
      font-size: 1.5rem;
    }
    
    ${SectorDescription} {
      font-size: 1.2rem;
      opacity: 0.9;
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

const SectorsSubtitle = styled.p`
  text-align: center;
  font-size: 2rem;
  color: #111111;
  font-weight: 700;
  margin-top: 1.5rem;
  opacity: 0.75;
  margin-bottom: 4rem;
  line-height: 1.8;
  
  @media (max-width: 768px) {
    font-size: 1.5rem;
  }
`;

const WhyChooseUsDescription = styled.p`
  text-align: center;
  font-size: 1.8rem;
  color: ${props => props.theme?.colors?.text || '#111111'};
  opacity: 0.85;
  margin: 0 auto 1.5rem;
  max-width: 900px;
  line-height: 1.7;
  font-weight: 400;
  
  @media (max-width: 768px) {
    font-size: 1.25rem;
  }
`;

const WhyChooseUsButton = styled(StartTrialButton)`
  background-color: #f2c94c;
  color: #111111;
  
  &:hover {
    background-color: #e6bc3f;
  }
`;

const WhyChooseUsButtonRow = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 2.5rem;
`;

const GrowthTeamSection = styled(Section)`
  background: radial-gradient(900px 480px at 0% -10%, ${p => (p.theme?.colors?.primary || '#00C896')}12, transparent 55%),
              radial-gradient(900px 480px at 100% 0%, ${p => (p.theme?.colors?.accent || '#DAA520')}10, transparent 55%),
              ${p => p.theme?.colors?.background || '#FFFFFF'};
`;

const GrowthTeamTitle = styled.h2`
  text-align: center;
  font-size: 3.2rem;
  font-weight: 700;
  color: ${p => p.theme?.colors?.text || '#111111'};
  margin-bottom: 0.75rem;
  font-family: ${p => p.theme?.fonts?.title || 'Poppins, sans-serif'};
  letter-spacing: -0.02em;
  line-height: 1.2;
  
  @media (max-width: 968px) {
    font-size: 2.6rem;
  }
  
  @media (max-width: 768px) {
    font-size: 2.2rem;
  }
`;

const GrowthTeamSubtitle = styled.p`
  text-align: center;
  font-size: 2rem;
  color: ${p => p.theme?.colors?.text || '#111111'};
  opacity: 0.75;
  margin-bottom: 1.5rem;
  font-weight: 700;
  
  @media (max-width: 768px) {
    font-size: 1.5rem;
  }
`;

const GrowthTeamDescription = styled.p`
  max-width: 900px;
  margin: 0 auto 1.5rem;
  text-align: center;
  font-size: 1.8rem;
  line-height: 1.7;
  color: ${p => p.theme?.colors?.text || '#111111'};
  opacity: 0.85;
  
  @media (max-width: 768px) {
    font-size: 1.25rem;
  }
`;

const GrowthTeamDescriptionSpaced = styled(GrowthTeamDescription)`
  margin-top: 120px;
`;

const GrowthTeamSliderContainer = styled.div`
  overflow: hidden;
  width: 100vw;
  margin-left: calc(-50vw + 50%);
  margin-right: calc(-50vw + 50%);
  margin-top: 2.75rem;
  
  @media (max-width: 1200px) {
    width: 100%;
    margin-left: 0;
    margin-right: 0;
  }
`;

const GrowthTeamSlider = styled.div`
  display: flex;
  gap: 1.75rem;
  width: fit-content;
  animation: slideGrowthTeam 45s linear infinite;
  
  @keyframes slideGrowthTeam {
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
  
  @media (max-width: 900px) {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1.5rem;
    animation: none;
    width: 100%;
  }
`;

const GrowthTeamCard = styled.div`
  background: #ffffff;
  border: 1px solid ${p => p.theme?.colors?.border || '#E5E5E5'};
  border-radius: 14px;
  padding: 1.75rem;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.06);
  transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
  width: 100%;
  min-width: 320px;
  max-width: 360px;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 18px 36px rgba(0, 0, 0, 0.1);
    border-color: ${p => (p.theme?.colors?.primary || '#00C896')}55;
  }
`;

const GrowthTeamCardCentered = styled(GrowthTeamCard)`
  @media (min-width: 1201px) {
    grid-column: 2 / span 1;
  }
`;

const GrowthTeamCardCenteredRight = styled(GrowthTeamCard)`
  @media (min-width: 1201px) {
    grid-column: 3 / span 1;
  }
`;

const GrowthTeamCardTitle = styled.h3`
  margin: 0 0 0.75rem 0;
  font-size: 1.55rem;
  font-weight: 700;
  color: ${p => p.theme?.colors?.text || '#111111'};
  font-family: ${p => p.theme?.fonts?.title || 'Poppins, sans-serif'};
`;

const GrowthTeamCardText = styled.p`
  margin: 0;
  font-size: 1.25rem;
  line-height: 1.6;
  color: ${p => p.theme?.colors?.text || '#111111'};
  opacity: 0.8;
`;

const GrowthTeamFooterTitle = styled.h3`
  margin: 2.5rem 0 0.75rem;
  text-align: center;
  font-size: 2rem;
  font-weight: 700;
  color: ${p => p.theme?.colors?.text || '#111111'};
  font-family: ${p => p.theme?.fonts?.title || 'Poppins, sans-serif'};
  
  @media (max-width: 768px) {
    font-size: 1.6rem;
  }
`;

const GrowthTeamFooterText = styled.p`
  margin: 0 auto;
  text-align: center;
  font-size: 1.8rem;
  line-height: 1.7;
  color: ${p => p.theme?.colors?.text || '#111111'};
  opacity: 0.85;
  max-width: 900px;
  
  @media (max-width: 768px) {
    font-size: 1.25rem;
  }
`;

const FAQPreviewSection = styled(Section)`
  background-color: ${p => p.theme?.colors?.background || '#FFFFFF'};
`;

const FAQPreviewTitle = styled.h2`
  text-align: center;
  font-size: 3rem;
  font-weight: 700;
  color: ${p => p.theme?.colors?.text || '#111111'};
  margin-bottom: 2rem;
  font-family: ${p => p.theme?.fonts?.title || 'Poppins, sans-serif'};
  
  @media (max-width: 768px) {
    font-size: 2rem;
  }
`;

const FAQPreviewList = styled.div`
  display: grid;
  gap: 1rem;
  margin-bottom: 2rem;
`;

const FAQPreviewItem = styled.div`
  position: relative;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  border: 1px solid #e9ecef;
  overflow: hidden;
`;

const FAQPreviewQuestion = styled.button`
  width: 100%;
  padding: 1.5rem 2rem;
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
    padding: 1.25rem 1.5rem;
    font-size: 1.1rem;
  }
`;

const FAQPreviewQuestionText = styled.span`
  flex: 1;
  text-align: left;
`;

const FAQPreviewIcon = styled.div`
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  border-radius: 8px;
  background: ${p => (p.isOpen ? '#00C896' : '#f0f0f0')};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${p => (p.isOpen ? 'white' : '#6c757d')};
  font-size: 20px;
  font-weight: 300;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  transform: ${p => (p.isOpen ? 'rotate(45deg)' : 'rotate(0deg)')};
  
  ${FAQPreviewQuestion}:hover & {
    background: ${p => (p.isOpen ? '#00C896' : '#e9ecef')};
    color: ${p => (p.isOpen ? 'white' : '#00C896')};
  }
`;

const FAQPreviewAnswer = styled.div`
  padding: 0 2rem 1.5rem;
  color: #495057;
  line-height: 1.75;
  max-height: ${p => (p.isOpen ? '2000px' : '0')};
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  opacity: ${p => (p.isOpen ? '1' : '0')};
  font-size: 1.125rem;
  
  p {
    margin: 0 0 0.75rem;
  }
  
  p:last-child {
    margin-bottom: 0;
  }
  
  @media (max-width: 768px) {
    padding: 0 1.5rem 1.25rem;
  }
`;

const FAQPreviewButtonRow = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 1.5rem;
`;

const FAQPreviewButton = styled(Link)`
  background-color: ${p => p.theme?.colors?.primary || '#00C896'};
  color: white;
  text-decoration: none;
  padding: 12px 24px;
  border-radius: 6px;
  font-size: 1.125rem;
  font-weight: 600;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: #00B085;
    transform: translateY(-2px);
  }
`;

const StartGrowingSection = styled(Section)`
  background: #000000;
  color: white;
`;

const StartGrowingCard = styled.div`
  background: #0b0b0b;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px;
  padding: 3rem;
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: 2.5rem;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.35);
  
  @media (max-width: 968px) {
    grid-template-columns: 1fr;
    padding: 2.25rem;
  }
`;

const StartGrowingTitle = styled.h2`
  margin: 0 0 0.75rem;
  font-size: 3rem;
  font-weight: 700;
  font-family: ${p => p.theme?.fonts?.title || 'Poppins, sans-serif'};
  line-height: 1.2;
  
  @media (max-width: 768px) {
    font-size: 2.25rem;
  }
`;

const StartGrowingSubtitle = styled.p`
  margin: 0 0 1.5rem;
  font-size: 1.35rem;
  opacity: 0.85;
  
  @media (max-width: 768px) {
    font-size: 1.1rem;
  }
`;

const StartGrowingDescription = styled.p`
  margin: 0;
  font-size: 1.15rem;
  line-height: 1.8;
  opacity: 0.8;
`;

const StartGrowingCTA = styled.div`
  background: #101010;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 2rem;
  display: grid;
  gap: 1.25rem;
`;

const StartGrowingCTATitle = styled.h3`
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const StartGrowingCTAText = styled.p`
  margin: 0;
  font-size: 1.05rem;
  line-height: 1.7;
  opacity: 0.8;
`;

const StartGrowingList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.75rem;
`;

const StartGrowingListItem = styled.li`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.05rem;
  opacity: 0.9;
  
  &::before {
    content: '✓';
    width: 22px;
    height: 22px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 6px;
    background: rgba(0, 200, 150, 0.18);
    color: ${p => p.theme?.colors?.primary || '#00C896'};
    font-weight: 700;
    font-size: 0.85rem;
  }
`;

const StartGrowingButton = styled(Link)`
  background-color: ${p => p.theme?.colors?.primary || '#00C896'};
  color: white;
  text-decoration: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 1.125rem;
  font-weight: 600;
  width: fit-content;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: #00B085;
    transform: translateY(-2px);
  }
`;

const StartGrowingMicrocopy = styled.p`
  margin: 0;
  font-size: 0.95rem;
  opacity: 0.75;
`;

const DarkSectionDivider = styled.div`
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #000000;

  &::before {
    content: '';
    width: 80%;
    max-width: 900px;
    height: 1px;
    border-radius: 999px;
    background: linear-gradient(
      90deg,
      transparent,
      ${p => p.theme?.colors?.primary || '#00C896'},
      transparent
    );
    box-shadow: 0 0 18px rgba(0, 200, 150, 0.4);
  }
`;

const ContactSection = styled(Section)`
  background: #000000;
  color: white;
`;

const ContactInner = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 40px;
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(0, 0.95fr);
  gap: 2.5rem;
  align-items: center;

  @media (max-width: 968px) {
    grid-template-columns: 1fr;
    padding: 0 24px;
  }
`;

const ContactImageWrapper = styled.div`
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 32px 80px rgba(15, 23, 42, 0.9);
`;

const ContactImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
`;

const ContactFormCard = styled.form`
  background: #050505;
  border-radius: 24px;
  padding: 2.5rem 2.75rem;
  box-shadow: 0 28px 72px rgba(0, 200, 150, 0.35);
  border: 1px solid rgba(148, 163, 184, 0.4);
  display: grid;
  gap: 1.5rem;

  @media (max-width: 768px) {
    padding: 2rem 1.75rem;
  }
`;

const ContactTitle = styled.h2`
  margin: 0;
  font-size: 2.1rem;
  font-weight: 700;
  font-family: ${p => p.theme?.fonts?.title || 'Poppins, sans-serif'};
`;

const ContactSubtitle = styled.p`
  margin: 0;
  font-size: 0.98rem;
  line-height: 1.8;
  opacity: 0.85;
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1.25rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const FormField = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
`;

const FieldLabel = styled.label`
  font-size: 0.9rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  color: rgba(226, 232, 240, 0.95);
`;

const RequiredMark = styled.span`
  color: #f97316;
`;

const TextInput = styled.input`
  border-radius: 10px;
  border: 1px solid rgba(148, 163, 184, 0.7);
  background: rgba(15, 23, 42, 0.9);
  color: white;
  padding: 0.7rem 0.85rem;
  font-size: 0.95rem;
  outline: none;

  &:focus {
    border-color: ${p => p.theme?.colors?.primary || '#00C896'};
    box-shadow: 0 0 0 1px ${p => p.theme?.colors?.primary || '#00C896'};
  }
`;

const SelectInput = styled.select`
  border-radius: 10px;
  border: 1px solid rgba(148, 163, 184, 0.7);
  background: rgba(15, 23, 42, 0.9);
  color: white;
  padding: 0.7rem 0.85rem;
  font-size: 0.95rem;
  outline: none;

  &:focus {
    border-color: ${p => p.theme?.colors?.primary || '#00C896'};
    box-shadow: 0 0 0 1px ${p => p.theme?.colors?.primary || '#00C896'};
  }
`;

const RadioRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const RadioPill = styled.label`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.45rem 0.75rem;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.7);
  font-size: 0.85rem;
  cursor: pointer;
  background: rgba(15, 23, 42, 0.9);
  color: rgba(226, 232, 240, 0.9);

  input {
    accent-color: ${p => p.theme?.colors?.primary || '#00C896'};
  }
`;

const TextArea = styled.textarea`
  border-radius: 10px;
  border: 1px solid rgba(148, 163, 184, 0.7);
  background: rgba(15, 23, 42, 0.9);
  color: white;
  padding: 0.8rem 0.85rem;
  font-size: 0.95rem;
  min-height: 96px;
  resize: vertical;
  outline: none;

  &:focus {
    border-color: ${p => p.theme?.colors?.primary || '#00C896'};
    box-shadow: 0 0 0 1px ${p => p.theme?.colors?.primary || '#00C896'};
  }
`;

const ContactButtonRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 0.5rem;
`;

const ContactSubmitButton = styled.button`
  border: none;
  outline: none;
  border-radius: 999px;
  padding: 0.9rem 1.4rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  background-color: ${p => p.theme?.colors?.primary || '#00C896'};
  color: white;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-1px);
    background-color: #00B085;
    box-shadow: 0 12px 30px rgba(0, 200, 150, 0.45);
  }
`;

const ContactMicrocopy = styled.p`
  margin: 0;
  font-size: 0.85rem;
  opacity: 0.8;
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

const CryptoWealthSection = styled(Section)`
  background-color: #000000;
  color: white;
  padding: 100px 0;
  position: relative;
  
  @media (max-width: 768px) {
    padding: 60px 0;
  }
`;

const CryptoWealthContainer = styled.div`
  display: grid;
  grid-template-columns: 0.8fr 1.2fr;
  gap: 4rem;
  align-items: center;
  
  @media (max-width: 968px) {
    grid-template-columns: 1fr;
    gap: 3rem;
  }
`;

const CryptoWealthImageWrapper = styled.div`
  width: 100%;
  height: 100%;
  min-height: 400px;
  overflow: hidden;
  border-radius: 16px;
  
  @media (max-width: 968px) {
    min-height: 400px;
    order: -1;
  }
  
  @media (max-width: 768px) {
    min-height: 300px;
  }
`;

const CryptoWealthImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
`;

const CryptoWealthContent = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 2rem 0;
`;

const CryptoWealthTitle = styled.h2`
  font-size: 3.5rem;
  font-weight: 700;
  color: white;
  margin: 0 0 1.5rem 0;
  font-family: ${props => props.theme?.fonts?.title || 'Poppins, sans-serif'};
  line-height: 1.2;
  letter-spacing: -0.02em;
  
  @media (max-width: 768px) {
    font-size: 2.5rem;
  }
`;

const CryptoWealthSubtitle = styled.h3`
  font-size: 2rem;
  font-weight: 600;
  color: white;
  margin: 0 0 2rem 0;
  font-family: ${props => props.theme?.fonts?.title || 'Poppins, sans-serif'};
  line-height: 1.3;
  
  @media (max-width: 768px) {
    font-size: 1.5rem;
  }
`;

const CryptoWealthDescription = styled.p`
  font-size: 1.5rem;
  color: rgba(255, 255, 255, 0.9);
  margin: 0 0 2.5rem 0;
  line-height: 1.7;
  font-weight: 400;
  
  @media (max-width: 768px) {
    font-size: 1.125rem;
    margin-bottom: 2rem;
  }
`;

const TalkToTeamButton = styled(Link)`
  background-color: ${props => props.theme?.colors?.primary || '#00C896'};
  color: white;
  text-decoration: none;
  padding: 16px 20px;
  border-radius: 8px;
  font-size: 1.25rem;
  font-weight: 600;
  transition: all 0.3s ease;
  display: inline-block;
  width: fit-content;
  
  &:hover {
    background-color: #00B085;
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 200, 150, 0.3);
  }
  
  @media (max-width: 768px) {
    padding: 14px 16px;
    font-size: 1.125rem;
  }
`;

const LogoSlider = styled.div`
  display: flex;
  gap: 4rem;
  animation: slideLeftToRight 50s linear infinite;
  width: fit-content;
  
  @keyframes slideLeftToRight {
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
  width: 320px;
  height: 180px;
  padding: 2rem;
  background-color: ${props => props.theme?.colors?.background || '#FFFFFF'};
  border: 1px solid ${props => props.theme?.colors?.border || '#E5E5E5'};
  border-radius: 12px;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
    border-color: ${props => props.theme?.colors?.primary || '#00C896'}33;
  }
  
  @media (max-width: 768px) {
    width: 260px;
    height: 150px;
    padding: 1.5rem;
  }
`;

const LogoImage = styled.img`
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  opacity: 0.8;
  transition: all 0.3s ease;
  width: auto;
  height: auto;
  
  ${LogoWrapper}:hover & {
    opacity: 1;
    transform: scale(1.05);
  }
`;

const SliderContainer = styled.div`
  overflow: hidden;
  position: relative;
  width: 100vw;
  margin-left: calc(-50vw + 50%);
  margin-right: calc(-50vw + 50%);
  
  @media (max-width: 1200px) {
    width: 100%;
    margin-left: 0;
    margin-right: 0;
  }
`;

const LandingPage = () => {
  const theme = useTheme();
  const [showVideo, setShowVideo] = useState(false);
  const [openFaqPreview, setOpenFaqPreview] = useState(new Set());
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
    { title: 'Universal Digital Brokerage', description: 'Connect with verified partners, suppliers, and clients globally through AI-powered brokerage and blockchain-secured transactions.' },
    { title: 'Financial Inclusion', description: 'Empowering entrepreneurs and small businesses with affordable digital tools and fintech access.' },
    { title: 'API Integrations', description: 'Build, extend, and innovate with KimuntuX APIs, SDKs, and partner marketplace for seamless third-party connections.' },
    { title: 'AI eCommerce & Store Creation', description: 'Launch your complete online store in minutes, automatically designed, optimized, and ready to sell with AI-generated content.' },
    { title: 'Intelligent CRM', description: 'Manage leads, clients, and conversations effortlessly with smart automation and AI-powered follow-ups and insights.' },
    { title: 'Smart Fintech Hub', description: 'Multi-currency wallets, instant payouts, AI fraud detection, and smart crypto wallet with predictive investment engine.' },
    { title: 'Multi-Channel Commerce', description: 'Sync your Shopify, WooCommerce, Amazon, and TikTok stores into one smart dashboard for unified management.' },
    { title: 'Funnel Landing Page', description: 'Create high-converting funnels and landing pages powered by AI. Drag-and-drop design, smart optimization, and automated tracking to capture leads and boost sales effortlessly.' },
    { title: 'Global Affiliate & Reseller Network', description: 'Join the global affiliate community: earn, promote, and grow with transparent blockchain rewards and tracking.' }
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
  const duplicatedSolutions = [...keySolutions, ...keySolutions, ...keySolutions];
  const growthTeamItems = [
    {
      title: 'AI SEO Engine',
      description: 'Automated on-page optimization, keyword clustering, backlinks, and AI content to boost rankings and organic traffic.'
    },
    {
      title: 'AI-Optimized Google Ads',
      description: 'Smart PPC campaigns with predictive targeting, automated setup, and real-time bid optimization for maximum ROI.'
    },
    {
      title: 'Meta & TikTok Ads Automation',
      description: 'AI-generated creatives, intelligent audience targeting, and continuous ROAS optimization across social platforms.'
    },
    {
      title: 'GBP Ranker (Local AI Boost)',
      description: 'Local SEO automation to dominate Google Business Profile rankings and increase local visibility.'
    },
    {
      title: 'AI Social Posting',
      description: 'Daily automated posts with AI-generated visuals, captions, and scheduling across all major platforms.'
    },
    {
      title: 'AI Content Writing',
      description: 'High-quality blogs, landing pages, ads, emails, and scripts — created in your brand voice at scale.'
    },
    {
      title: 'AI Marketing Assistant (Smart Growth Engine)',
      description: 'Your 24/7 marketing brain for lead generation, CRM nurturing, campaign automation, and performance analytics.'
    },
    {
      title: 'AI Tech Setup Assistant',
      description: 'Instantly automates ad accounts, pixels, APIs, business managers, and campaign infrastructure.'
    },
    {
      title: 'Smart Funnels & Landing Pages',
      description: 'AI-generated funnels and landing pages designed to convert leads, customers, and investors.'
    },
    {
      title: 'AI B2B Outreach Agent',
      description: 'Fully automated prospecting, outreach, follow-ups, and meeting booking — completely hands-free.'
    }
  ];
  const duplicatedGrowthTeamItems = [...growthTeamItems, ...growthTeamItems];
  const faqPreviewItems = [
    {
      q: 'What is KimuX?',
      a: 'KimuX is an AI-powered Digital Brokerage, Fintech, and Marketing platform that unifies eCommerce, finance, and automation into one intelligent ecosystem. It allows businesses, professionals, and organizations to build, manage, and scale digital operations—from online stores to marketing campaigns and financial management—all powered by AI and blockchain.'
    },
    {
      q: 'What makes KimuX different from platforms like Shopify, Wix, or WooCommerce?',
      a: "Unlike traditional platforms, KimuX is not just a store builder, it’s an autonomous digital brokerage and fintech ecosystem that builds eCommerce boutiques automatically using AI AutoBuild, integrates multi-channel marketing and fintech orchestration, and supports B2B, B2C, Affiliate, and Reseller models within one ecosystem."
    },
    {
      q: 'Who can use KimuX?',
      a: 'KimuX is designed for individuals, professionals, businesses, and institutions across multiple sectors, including governments, financial institutions, real estate, logistics, digital marketing agencies, SMBs, startups, non-profit organizations, and professional services.'
    },
    {
      q: 'How does KimuX ensure security and transparency?',
      a: 'KimuX integrates blockchain and advanced encryption to secure all user data and transactions, including smart contract validation, end-to-end data encryption, GDPR and PCI compliance, and real-time blockchain audit trails.'
    }
  ];
  const startGrowingBenefits = [
    'No installation',
    'Secure cloud-based SaaS',
    'Continuous updates',
    'Built for revenue growth'
  ];
  const toggleFaqPreview = (index) => {
    setOpenFaqPreview((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  return (
    <LandingContainer>
      <HeroSection>
        <HeroContainer>
          <HeroContent>
            <HeroTitle>
              AI-Powered<br />
              Digital Marketing<br />
              & Brokerage Platform<br />
              <BlockchainText>Built on Blockchain.</BlockchainText>
            </HeroTitle>
            <HeroSubtitle>
              "Empowering B2B and B2C to build, connect, and grow through intelligent, inclusive, and borderless digital commerce."
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
        <IntroSection>
          <Container>
            <IntroCard>
              <IntroHeadline>
                Empowering Businesses with Secure, Intelligent, and Scalable <span>B2B SaaS</span> Solutions
              </IntroHeadline>
              <IntroText>
                KimuX is a powerful AI-driven SaaS platform built on AWS Cloud and Blockchain technology, enabling
                organizations to optimize operations, scale faster, and drive measurable growth. Through automation,
                intelligence, and seamless integrations, KimuX helps businesses unlock efficiency, innovation, and
                new revenue opportunities.
              </IntroText>
              <IntroHighlight>
                Over the world, leading B2B SaaS & AI startups have accelerated their growth, added <strong>6–7 figures</strong> in new revenue
                streams, and transformed their operations using growth-driven SaaS platforms and digital accelerators like KimuX.
              </IntroHighlight>
              <IntroSubheading>KimuX positions your organization to:</IntroSubheading>
              <IntroBenefitsRow>
                <IntroBenefit>scale smarter</IntroBenefit>
                <IntroBenefit>grow faster</IntroBenefit>
                <IntroBenefit>perform better</IntroBenefit>
              </IntroBenefitsRow>
              <IntroFooter>All with security, trust, intelligence, and performance at the core.</IntroFooter>
            </IntroCard>
          </Container>
        </IntroSection>
      </HeroSection>

      <PreviewSection>
        <Container>
          <SectionTitle>Platform Preview</SectionTitle>
          <PreviewSubtitle>
            Experience the power of unified AI-driven business management with real-time analytics, smart automation, and comprehensive insights.
          </PreviewSubtitle>
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
          <FeaturesSubtitle>
            KimuntuX solves the real-world pain points that individuals, entrepreneurs, and enterprises face in the modern digital economy. It merges AI, Blockchain, and Fintech into a single intelligent platform that simplifies, secures, and scales business growth.
          </FeaturesSubtitle>
          <FeaturesSliderContainer>
            <FeaturesSlider>
              {duplicatedSolutions.map((solution, index) => {
                const hasImage = solution.title === 'AI eCommerce & Store Creation' || 
                                 solution.title === 'Intelligent CRM' ||
                                 solution.title === 'Smart Fintech Hub' ||
                                 solution.title === 'Multi-Channel Commerce' ||
                                 solution.title === 'API Integrations' ||
                                 solution.title === 'Funnel Landing Page' ||
                                 solution.title === 'Global Affiliate & Reseller Network' ||
                                 solution.title === 'AI Marketing Engine' ||
                                 solution.title === 'Universal Digital Brokerage' ||
                                 solution.title === 'Blockchain Security Layer' ||
                                 solution.title === 'Financial Inclusion';
                const getImage = () => {
                  if (solution.title === 'AI eCommerce & Store Creation') return websiteEcommerceBoutiqueImage;
                  if (solution.title === 'Intelligent CRM') return crmImage;
                  if (solution.title === 'Smart Fintech Hub') return fintechImage;
                  if (solution.title === 'Multi-Channel Commerce') return digitalMarketingImage;
                  if (solution.title === 'API Integrations') return marketplaceApiImage;
                  if (solution.title === 'Funnel Landing Page') return funnelsLandingPageImage;
                  if (solution.title === 'Global Affiliate & Reseller Network') return affiliateImage;
                  if (solution.title === 'AI Marketing Engine') return campaignImage;
                  if (solution.title === 'Universal Digital Brokerage') return brokerageImage;
                  if (solution.title === 'Blockchain Security Layer') return blockchainImage;
                  if (solution.title === 'Financial Inclusion') return financialInclusionImage;
                  return null;
                };
                const imageSrc = getImage();

  return (
                  <FeatureCard key={index} hasImage={hasImage}>
                    <FeatureCardContent>
                      <FeatureTextSection>
                        <FeatureTitle>{solution.title}</FeatureTitle>
                        <FeatureDescription>{solution.description}</FeatureDescription>
                      </FeatureTextSection>
                      {hasImage && imageSrc && (
                        <FeatureImage src={imageSrc} alt={solution.title} />
                      )}
                    </FeatureCardContent>
                  </FeatureCard>
                );
              })}
            </FeaturesSlider>
          </FeaturesSliderContainer>
        </Container>
      </FeaturesSection>

      <CTASection>
        <Container>
          <CTAHeading>Launch Smarter. Grow Faster. Earn More.</CTAHeading>
          <CTADescription>
            Turn your business into an automated revenue engine — powered by AI, blockchain, and smart marketing tools working 24/7 to bring you customers, leads, and sales.
          </CTADescription>
          <StartTrialButton to="/pricing">Start Free Trial</StartTrialButton>
        </Container>
      </CTASection>

      <SectorsSection>
        <Container>
          <SectionTitle>Why Choose Us</SectionTitle>
          <WhyChooseUsDescription>
            Because your success deserves intelligent growth with a platform designed to build, automate, and scale every part of your business.
          </WhyChooseUsDescription>
          <SectorsSubtitle>
            Benefits Across All Sectors
          </SectorsSubtitle>
          <SectorsGrid>
            {sectors.map((sector, index) => (
              <SectorCard key={index}>
                <SectorTitle>{sector.title}</SectorTitle>
                <SectorDescription>{sector.description}</SectorDescription>
              </SectorCard>
            ))}
          </SectorsGrid>
          <WhyChooseUsButtonRow>
            <WhyChooseUsButton to="/pricing">Start Free Trial</WhyChooseUsButton>
          </WhyChooseUsButtonRow>
        </Container>
      </SectorsSection>

      <GrowthTeamSection>
        <Container>
          <GrowthTeamTitle>Your All-In-One Digital Growth Team</GrowthTeamTitle>
          <GrowthTeamSubtitle>Powered by AI, Automation & Blockchain</GrowthTeamSubtitle>
          <GrowthTeamDescription>
            KimuX is a fully integrated, AI-powered growth platform that replaces fragmented tools, agencies, and teams with one intelligent system.
            White-labeled under your brand, KimuX runs every service and automation seamlessly in one place — helping you grow faster,
            generate more revenue, and scale globally without increasing headcount or operational costs.
          </GrowthTeamDescription>
          <GrowthTeamDescriptionSpaced>
            From marketing and advertising to content, outreach, and analytics, KimuX works 24/7 as your digital team — so you can focus on
            strategy while the platform drives results.
          </GrowthTeamDescriptionSpaced>
          <GrowthTeamSliderContainer>
            <GrowthTeamSlider>
              {duplicatedGrowthTeamItems.map((item, index) => (
                <GrowthTeamCard key={index}>
                  <GrowthTeamCardTitle>{item.title}</GrowthTeamCardTitle>
                  <GrowthTeamCardText>{item.description}</GrowthTeamCardText>
                </GrowthTeamCard>
              ))}
            </GrowthTeamSlider>
          </GrowthTeamSliderContainer>
          <GrowthTeamFooterTitle>One Platform. One Brand. Unlimited Growth.</GrowthTeamFooterTitle>
          <GrowthTeamFooterText>
            KimuX isn't just software — it's your revenue engine, your digital workforce, and your competitive advantage, all in one powerful ecosystem.
          </GrowthTeamFooterText>
        </Container>
      </GrowthTeamSection>

      <CryptoWealthSection>
        <Container>
          <CryptoWealthContainer>
            <CryptoWealthImageWrapper>
              <CryptoWealthImage src={aiDrivenCryptoImage} alt="AI-Driven Crypto & Fintech Wealth Engine" />
            </CryptoWealthImageWrapper>
            <CryptoWealthContent>
              <CryptoWealthTitle>AI-Driven Crypto & Fintech Wealth Engine</CryptoWealthTitle>
              <CryptoWealthSubtitle>Trade smarter. Grow faster. Earn more.</CryptoWealthSubtitle>
              <CryptoWealthDescription>
                Unlock the future of digital investing with KimuntuX's intelligent trading platform — where AI, fintech, and blockchain work together to help you grow your wealth with confidence.
              </CryptoWealthDescription>
              <TalkToTeamButton to="/contact">Talk to the Team</TalkToTeamButton>
            </CryptoWealthContent>
          </CryptoWealthContainer>
        </Container>
      </CryptoWealthSection>

      <FAQPreviewSection>
        <Container>
          <FAQPreviewTitle>Frequently Asked Questions</FAQPreviewTitle>
          <FAQPreviewList>
            {faqPreviewItems.map((item, index) => (
              <FAQPreviewItem key={index}>
                <FAQPreviewQuestion onClick={() => toggleFaqPreview(index)}>
                  <FAQPreviewQuestionText>{item.q}</FAQPreviewQuestionText>
                  <FAQPreviewIcon isOpen={openFaqPreview.has(index)}>+</FAQPreviewIcon>
                </FAQPreviewQuestion>
                <FAQPreviewAnswer isOpen={openFaqPreview.has(index)}>
                  <p>{item.a}</p>
                </FAQPreviewAnswer>
              </FAQPreviewItem>
            ))}
          </FAQPreviewList>
          <FAQPreviewButtonRow>
            <FAQPreviewButton to="/faq">View Full FAQ</FAQPreviewButton>
          </FAQPreviewButtonRow>
        </Container>
      </FAQPreviewSection>

      <StartGrowingSection>
        <Container>
          <StartGrowingCard>
            <div>
              <StartGrowingTitle>Start Growing with KimuX</StartGrowingTitle>
              <StartGrowingSubtitle>One Platform. One Subscription. Unlimited Growth Potential.</StartGrowingSubtitle>
              <StartGrowingDescription>
                KimuX helps businesses, institutions, and innovators automate operations, increase revenue, and scale globally using AI, automation,
                and blockchain—without complexity.
              </StartGrowingDescription>
            </div>
            <StartGrowingCTA>
              <StartGrowingCTATitle>🚀 Get Started with KimuX</StartGrowingCTATitle>
              <StartGrowingCTAText>Access AI-powered tools, backend fulfillment, and growth automation in minutes.</StartGrowingCTAText>
              <StartGrowingList>
                {startGrowingBenefits.map((item) => (
                  <StartGrowingListItem key={item}>{item}</StartGrowingListItem>
                ))}
              </StartGrowingList>
              <StartGrowingButton to="/pricing">Start Free Trial</StartGrowingButton>
              <StartGrowingMicrocopy>No credit card required • Cancel anytime</StartGrowingMicrocopy>
            </StartGrowingCTA>
          </StartGrowingCard>
        </Container>
      </StartGrowingSection>

      <DarkSectionDivider />

      <ContactSection>
        <ContactInner>
          <ContactFormCard
            onSubmit={(e) => {
              e.preventDefault();
            }}
          >
            <div>
              <ContactTitle>Talk to Our Team</ContactTitle>
              <ContactSubtitle>
                Not sure where to start? Need a custom solution, enterprise setup, or partnership discussion? Our team will
                help you design the right KimuX configuration for your goals.
              </ContactSubtitle>
            </div>

            <FormGrid>
              <FormField>
                <FieldLabel htmlFor="fullName">
                  Full Name <RequiredMark>*</RequiredMark>
                </FieldLabel>
                <TextInput id="fullName" name="fullName" placeholder="Full Name" />
              </FormField>
              <FormField>
                <FieldLabel htmlFor="email">
                  Email Address <RequiredMark>*</RequiredMark>
                </FieldLabel>
                <TextInput id="email" name="email" type="email" placeholder="Email Address" />
              </FormField>
            </FormGrid>

            <FormGrid>
              <FormField>
                <FieldLabel htmlFor="company">
                  Company / Organization Name
                </FieldLabel>
                <TextInput id="company" name="company" placeholder="Company / Organization Name" />
              </FormField>
              <FormField>
                <FieldLabel htmlFor="country">Country / Region</FieldLabel>
                <SelectInput id="country" name="country" defaultValue="">
                  <option value="" disabled>
                    Select Country / Region
                  </option>
                  <option value="north-america">North America</option>
                  <option value="europe">Europe</option>
                  <option value="africa">Africa</option>
                  <option value="asia-pacific">Asia-Pacific</option>
                  <option value="latin-america">Latin America</option>
                  <option value="middle-east">Middle East</option>
                </SelectInput>
              </FormField>
            </FormGrid>

            <FormField>
              <FieldLabel>
                Company Size
              </FieldLabel>
              <RadioRow>
                {['Solo / Freelancer', '2–10', '11–50', '51–200', '200+'].map((size) => (
                  <RadioPill key={size}>
                    <input type="radio" name="companySize" value={size} />
                    <span>{size}</span>
                  </RadioPill>
                ))}
              </RadioRow>
            </FormField>

            <FormGrid>
              <FormField>
                <FieldLabel htmlFor="interest">
                  Primary Interest
                </FieldLabel>
                <SelectInput id="interest" name="interest" defaultValue="">
                  <option value="" disabled>
                    Select an option
                  </option>
                  <option value="ai-marketing">AI Marketing &amp; Growth</option>
                  <option value="b2b-saas">B2B SaaS Tools</option>
                  <option value="fintech-brokerage">Fintech &amp; Brokerage</option>
                  <option value="government-institution">Government / Institution</option>
                  <option value="partnerships">Partnerships / Investment</option>
                </SelectInput>
              </FormField>
              <FormField>
                <FieldLabel htmlFor="message">
                  Message / Use Case
                </FieldLabel>
                <TextArea
                  id="message"
                  name="message"
                  placeholder="Tell us about your needs..."
                />
              </FormField>
            </FormGrid>

            <ContactButtonRow>
              <ContactSubmitButton type="submit">
                Request Demo / Contact Sales
              </ContactSubmitButton>
              <ContactMicrocopy>We usually respond within 24 hours.</ContactMicrocopy>
            </ContactButtonRow>
          </ContactFormCard>
          <ContactImageWrapper>
            <ContactImage src={financialInclusionImage} alt="Talk to our team" />
          </ContactImageWrapper>
        </ContactInner>
      </ContactSection>

      <PartnersSection>
        <Container>
          <PartnersTitle>Our Trusted Partners</PartnersTitle>
        </Container>
        <SliderContainer>
          <LogoSlider>
            {duplicatedPartners.map((partner, index) => (
              <LogoWrapper key={index}>
                <LogoImage src={partner.logo} alt={partner.name} />
              </LogoWrapper>
            ))}
          </LogoSlider>
        </SliderContainer>
      </PartnersSection>
    </LandingContainer>
  );
};

export default LandingPage;
