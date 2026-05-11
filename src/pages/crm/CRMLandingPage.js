import React, { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import CRMImage1 from '../../assets/CRM_image1.png';
import CRMImage2 from '../../assets/CRM_image2.png';
import CRMImage3 from '../../assets/CRM_image3.png';
import CRMImage4 from '../../assets/CRM_image4.png';

const Main = styled.main`
  min-height: 100vh;
  padding: 120px 0 5rem;
  background:
    radial-gradient(circle at 15% 8%, rgba(0, 200, 150, 0.14), transparent 35%),
    radial-gradient(circle at 85% 18%, rgba(0, 139, 139, 0.16), transparent 30%),
    ${p => p.theme?.colors?.background || '#f7f9fb'};
  overflow: hidden;
`;

const Section = styled.section`
  max-width: 1220px;
  margin: 0 auto;
  padding: 0 1.25rem;
`;

const Hero = styled(Section)`
  position: relative;
  padding-top: 1.5rem;
`;

const HeroGrid = styled.div`
  display: grid;
  grid-template-columns: 1.1fr 1fr;
  gap: 2rem;
  align-items: center;

  @media (max-width: 980px) {
    grid-template-columns: 1fr;
  }
`;

const HeroTitle = styled.h1`
  margin: 0 0 1rem;
  font-size: clamp(2rem, 4.6vw, 3.85rem);
  line-height: 1.08;
  letter-spacing: -0.03em;
  color: ${p => p.theme?.colors?.text || '#0f172a'};
  font-family: ${p => p.theme?.fonts?.title || 'Poppins, sans-serif'};
`;

const HeroSubtitle = styled.p`
  margin: 0;
  max-width: 680px;
  color: ${p => p.theme?.colors?.text || '#1f2937'};
  opacity: 0.86;
  font-size: clamp(1.18rem, 1.45vw, 1.42rem);
  line-height: 1.76;
`;

const ActionRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.85rem;
  margin-top: 1.65rem;
`;

const Cta = styled.a`
  border-radius: 12px;
  padding: 0.88rem 1.35rem;
  text-decoration: none;
  font-weight: 700;
  font-size: clamp(1.02rem, 1.1vw, 1.15rem);
  transition: transform 0.25s ease, box-shadow 0.25s ease;
  border: 1px solid transparent;

  ${p => p.primary ? `
    background: linear-gradient(135deg, ${p.theme?.colors?.primary || '#00C896'}, ${p.theme?.colors?.accent || '#00B2AA'});
    color: #ffffff;
    box-shadow: 0 14px 34px rgba(0, 200, 150, 0.32);
  ` : `
    background: transparent;
    color: ${p.theme?.colors?.text || '#0f172a'};
    border-color: ${p.theme?.colors?.border || 'rgba(15,23,42,0.18)'};
  `}

  &:hover {
    transform: translateY(-2px);
    box-shadow: ${p => p.primary ? '0 18px 38px rgba(0, 200, 150, 0.38)' : '0 10px 20px rgba(15,23,42,0.12)'};
  }
`;

const TrustStripSection = styled(Section)`
  margin-top: 2.75rem;
  margin-bottom: 0.25rem;
`;

const TrustStrip = styled.div`
  max-width: 1000px;
  margin: 0 auto;
  padding: 1.45rem 1.65rem;
  text-align: center;
  border-radius: 18px;
  background: linear-gradient(
    165deg,
    ${p => p.theme?.colors?.cardBackground || '#ffffff'} 0%,
    rgba(236, 253, 249, 0.92) 45%,
    rgba(224, 247, 241, 0.88) 100%
  );
  border: 1px solid rgba(0, 139, 139, 0.2);
  border-left: 5px solid ${p => p.theme?.colors?.primary || '#00C896'};
  box-shadow:
    0 20px 50px rgba(0, 139, 139, 0.1),
    0 1px 0 rgba(255, 255, 255, 0.6) inset;
  font-size: clamp(1.18rem, 1.55vw, 1.45rem);
  line-height: 1.72;
  font-weight: 600;
  color: ${p => p.theme?.colors?.text || '#0f172a'};
  letter-spacing: -0.015em;
  position: relative;
  overflow: hidden;

  &::after {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    width: 40%;
    height: 100%;
    background: linear-gradient(105deg, transparent, rgba(0, 200, 150, 0.06));
    pointer-events: none;
  }
`;

const TrustHighlight = styled.span`
  color: ${p => p.theme?.colors?.primary || '#00C896'};
  font-weight: 800;
  white-space: nowrap;
`;

const TrustStripInner = styled.p`
  margin: 0;
  position: relative;
  z-index: 1;
`;

const floatY = `
  @keyframes floatY {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
  }
`;

const HeroVisual = styled.div`
  ${floatY}
  position: relative;
  border-radius: 20px;
  border: 1px solid ${p => p.theme?.colors?.border || 'rgba(15,23,42,0.14)'};
  background: ${p => p.theme?.colors?.cardBackground || '#ffffff'};
  padding: 1rem;
  min-height: 300px;
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.14);
  animation: floatY 4.2s ease-in-out infinite;
`;

const Pulse = styled.div`
  position: absolute;
  width: 180px;
  height: 180px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(0, 200, 150, 0.35), transparent 70%);
  right: -45px;
  top: -45px;
  filter: blur(0.5px);
`;

const VisualHeading = styled.h3`
  margin: 0 0 0.9rem;
  color: ${p => p.theme?.colors?.text || '#0f172a'};
  font-size: clamp(1.12rem, 1.3vw, 1.25rem);
  font-weight: 700;
`;

const KpiGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.7rem;
`;

const Kpi = styled.div`
  border-radius: 10px;
  border: 1px solid ${p => p.theme?.colors?.border || 'rgba(15,23,42,0.12)'};
  background: linear-gradient(135deg, rgba(0,200,150,0.08), rgba(0,139,139,0.08));
  padding: 0.7rem;
`;

const KpiValue = styled.div`
  font-size: clamp(1.35rem, 1.9vw, 1.7rem);
  font-weight: 800;
  color: ${p => p.theme?.colors?.text || '#0f172a'};
`;

const KpiLabel = styled.div`
  margin-top: 0.2rem;
  font-size: clamp(0.95rem, 1vw, 1.05rem);
  color: ${p => p.theme?.colors?.text || '#1f2937'};
  opacity: 0.75;
`;

const HeaderBlock = styled.div`
  margin-top: 4.1rem;
  margin-bottom: 1.5rem;
  text-align: center;
`;

const SliderIntroHeader = styled(HeaderBlock)`
  margin-top: 0.75rem;
`;

const H2 = styled.h2`
  margin: 0 0 0.6rem;
  font-size: clamp(1.45rem, 2vw, 2.2rem);
  color: ${p => p.theme?.colors?.text || '#0f172a'};
  font-family: ${p => p.theme?.fonts?.title || 'Poppins, sans-serif'};
`;

const Sub = styled.p`
  margin: 0 auto;
  max-width: 740px;
  color: ${p => p.theme?.colors?.text || '#1f2937'};
  opacity: 0.8;
  line-height: 1.65;
  font-size: clamp(1.1rem, 1.2vw, 1.22rem);
`;

const SliderShell = styled.section`
  margin-top: 1.75rem;
  max-width: 1180px;
  margin-left: auto;
  margin-right: auto;
  padding: 0 1.25rem;
`;

const SliderCard = styled.div`
  width: 100%;
  border-radius: 20px;
  border: 1px solid ${p => p.theme?.colors?.border || 'rgba(15,23,42,0.14)'};
  background: ${p => p.theme?.colors?.cardBackground || '#ffffff'};
  padding: 1rem 1.35rem 1.35rem;
  box-shadow: 0 20px 50px rgba(15, 23, 42, 0.1);

  @media (max-width: 920px) {
    padding: 0.9rem 1rem 1.2rem;
    border-radius: 16px;
  }
`;

const SliderTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
`;

const NavDots = styled.div`
  display: flex;
  gap: 0.45rem;
`;

const Dot = styled.button`
  border: 0;
  width: 10px;
  height: 10px;
  border-radius: 99px;
  background: ${p => p.active ? (p.theme?.colors?.primary || '#00C896') : 'rgba(15,23,42,0.2)'};
  cursor: pointer;
`;

const SlideFrame = styled.div`
  display: grid;
  gap: 1rem;
`;

const MockScreen = styled.div`
  min-height: 46vh;
  max-height: 520px;
  border-radius: 14px;
  border: 1px solid ${p => p.theme?.colors?.border || 'rgba(15,23,42,0.14)'};
  background: #0c1118;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  max-width: 100%;

  @media (max-width: 920px) {
    min-height: 34vh;
    max-height: 380px;
  }
`;

const SlideImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: center;
  display: block;
  filter: saturate(1.02) contrast(1.02);
  opacity: 0;
  animation: imageFadeIn 0.8s ease forwards;

  @keyframes imageFadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;

const SlideOverlay = styled.div`
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    linear-gradient(165deg, rgba(0, 0, 0, 0.04) 0%, transparent 30%),
    linear-gradient(to top, rgba(12, 17, 24, 0.12), transparent 42%);
`;

const ProgressRail = styled.div`
  margin-top: 0.75rem;
  width: 100%;
  height: 6px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.12);
  overflow: hidden;
`;

const ProgressFill = styled.div`
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, ${p => p.theme?.colors?.primary || '#00C896'}, ${p => p.theme?.colors?.accent || '#00B2AA'});
  width: 100%;
  transform-origin: left center;
  animation: progressFlow 8s linear forwards;

  @keyframes progressFlow {
    from { transform: scaleX(0); }
    to { transform: scaleX(1); }
  }
`;

const SlideCopy = styled.div`
  padding: 0.85rem 0.25rem 0.25rem;
  max-width: 980px;

  h3 {
    margin: 0 0 0.5rem;
    color: ${p => p.theme?.colors?.text || '#0f172a'};
    font-size: clamp(1.7rem, 2.3vw, 2.45rem);
    line-height: 1.2;
  }

  p {
    margin: 0 0 0.85rem;
    color: ${p => p.theme?.colors?.text || '#1f2937'};
    opacity: 0.85;
    line-height: 1.62;
    font-size: clamp(1.08rem, 1.2vw, 1.28rem);
  }
`;

const SlideCopyWrap = styled.div`
  display: flex;
  justify-content: center;
`;

const BulletList = styled.ul`
  margin: 0;
  padding-left: 1.3rem;
  display: grid;
  gap: 0.7rem;
  color: ${p => p.theme?.colors?.text || '#0f172a'};

  li {
    line-height: 1.5;
    font-size: clamp(1.02rem, 1.08vw, 1.16rem);
  }
`;

const DeepSection = styled(Section)`
  margin-top: 4.25rem;
`;

const DeepShell = styled.div`
  border-radius: 28px;
  padding: 1.35rem;
  background:
    radial-gradient(circle at 15% 18%, rgba(0, 200, 150, 0.16), transparent 42%),
    radial-gradient(circle at 85% 10%, rgba(0, 139, 139, 0.12), transparent 38%),
    ${p => p.theme?.colors?.cardBackground || '#ffffff'};
  border: 1px solid ${p => p.theme?.colors?.border || 'rgba(15,23,42,0.14)'};
  box-shadow: 0 22px 54px rgba(15, 23, 42, 0.1);

  @media (max-width: 768px) {
    padding: 0.9rem;
  }
`;

const DeepGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;

  @media (max-width: 980px) {
    grid-template-columns: 1fr;
  }
`;

const DeepCard = styled.article`
  @keyframes cardReveal {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  position: relative;
  border-radius: 18px;
  border: 1px solid rgba(0, 139, 139, 0.16);
  background:
    linear-gradient(145deg, rgba(255, 255, 255, 0.98), rgba(241, 250, 248, 0.9));
  padding: 1.25rem 1.2rem 1.2rem;
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.08);
  overflow: hidden;
  transition: transform 0.28s ease, box-shadow 0.28s ease, border-color 0.28s ease;
  animation: cardReveal 0.5s ease both;

  &:nth-child(2) { animation-delay: 0.08s; }
  &:nth-child(3) { animation-delay: 0.16s; }
  &:nth-child(4) { animation-delay: 0.24s; }

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    padding: 1px;
    background: linear-gradient(135deg, rgba(0, 200, 150, 0.38), rgba(0, 139, 139, 0.08), rgba(0, 200, 150, 0.28));
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    pointer-events: none;
  }

  &:hover {
    transform: translateY(-6px);
    box-shadow: 0 20px 44px rgba(15, 23, 42, 0.14);
    border-color: rgba(0, 200, 150, 0.35);
  }
`;

const DeepCardTop = styled.div`
  display: flex;
  align-items: center;
  gap: 0.7rem;
  margin-bottom: 0.6rem;
`;

const DeepIndex = styled.span`
  width: 34px;
  height: 34px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  font-weight: 800;
  color: #ffffff;
  background: linear-gradient(135deg, ${p => p.theme?.colors?.primary || '#00C896'}, ${p => p.theme?.colors?.accent || '#00B2AA'});
  box-shadow: 0 8px 16px rgba(0, 200, 150, 0.28);
  flex-shrink: 0;
`;

const DeepTitle = styled.h3`
  margin: 0;
  color: ${p => p.theme?.colors?.text || '#0f172a'};
  font-size: clamp(1.32rem, 1.62vw, 1.6rem);
  line-height: 1.25;
`;

const DeepCopy = styled.p`
  margin: 0 0 0.8rem;
  line-height: 1.7;
  color: ${p => p.theme?.colors?.text || '#172133'};
  opacity: 0.92;
  font-size: clamp(1.06rem, 1.14vw, 1.2rem);
`;

const DeepBulletList = styled.ul`
  margin: 0;
  padding-left: 1.25rem;
  display: grid;
  gap: 0.65rem;
  color: ${p => p.theme?.colors?.text || '#0f172a'};

  li {
    line-height: 1.6;
    font-size: clamp(1.02rem, 1.08vw, 1.14rem);
  }
`;

const Proof = styled(Section)`
  margin-top: 4.25rem;
`;

const StatGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.8rem;
  margin-top: 1rem;

  @media (max-width: 920px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

const StatCard = styled.div`
  border-radius: 14px;
  border: 1px solid ${p => p.theme?.colors?.border || 'rgba(15,23,42,0.14)'};
  background: ${p => p.theme?.colors?.cardBackground || '#ffffff'};
  padding: 1rem;
  text-align: center;
`;

const StatValue = styled.div`
  font-size: clamp(2rem, 2.6vw, 2.45rem);
  font-weight: 800;
  color: ${p => p.theme?.colors?.primary || '#00C896'};
`;

const StatText = styled.div`
  margin-top: 0.35rem;
  font-size: clamp(1.02rem, 1.12vw, 1.18rem);
  line-height: 1.5;
  color: ${p => p.theme?.colors?.text || '#1f2937'};
  opacity: 0.82;
`;

const QuoteGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.8rem;
  margin-top: 1rem;

  @media (max-width: 920px) {
    grid-template-columns: 1fr;
  }
`;

const Quote = styled.blockquote`
  margin: 0;
  border-radius: 14px;
  border: 1px solid ${p => p.theme?.colors?.border || 'rgba(15,23,42,0.14)'};
  background: ${p => p.theme?.colors?.cardBackground || '#ffffff'};
  padding: 1rem;
  font-size: clamp(1.05rem, 1.15vw, 1.18rem);
  line-height: 1.65;
  color: ${p => p.theme?.colors?.text || '#111827'};

  footer {
    margin-top: 0.65rem;
    font-size: clamp(0.98rem, 1.02vw, 1.06rem);
    font-weight: 600;
    opacity: 0.72;
  }
`;

const FaqSection = styled(Section)`
  margin-top: 4.5rem;
  padding-bottom: 0.5rem;
`;

const FaqHeaderBlock = styled(HeaderBlock)`
  margin-top: 0;
`;

const FaqList = styled.div`
  max-width: 880px;
  margin: 1.25rem auto 0;
  display: grid;
  gap: 0.75rem;
`;

const FaqItem = styled.div`
  border-radius: 16px;
  border: 1px solid ${p => p.theme?.colors?.border || 'rgba(15,23,42,0.12)'};
  background: ${p => p.theme?.colors?.cardBackground || '#ffffff'};
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
  overflow: hidden;
  transition: box-shadow 0.25s ease, border-color 0.25s ease;

  &[data-open='true'] {
    border-color: rgba(0, 200, 150, 0.28);
    box-shadow: 0 12px 32px rgba(0, 139, 139, 0.1);
  }
`;

const FaqQuestion = styled.button`
  width: 100%;
  text-align: left;
  padding: 1.1rem 1.25rem;
  border: 0;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  font-size: clamp(1.05rem, 1.12vw, 1.18rem);
  font-weight: 700;
  color: ${p => p.theme?.colors?.text || '#0f172a'};
  font-family: ${p => p.theme?.fonts?.title || 'Poppins, sans-serif'};

  span:last-child {
    flex-shrink: 0;
    width: 28px;
    height: 28px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 200, 150, 0.12);
    color: ${p => p.theme?.colors?.primary || '#00C896'};
    font-size: 1.25rem;
    line-height: 1;
    transition: transform 0.25s ease;
  }

  &[aria-expanded='true'] span:last-child {
    transform: rotate(45deg);
  }
`;

const FaqAnswer = styled.div`
  padding: 0 1.25rem 1.15rem;
  border-top: 1px solid ${p => p.theme?.colors?.border || 'rgba(15,23,42,0.08)'};
  margin-top: 0;
  color: ${p => p.theme?.colors?.text || '#1f2937'};
  font-size: clamp(1rem, 1.06vw, 1.12rem);
  line-height: 1.68;
  opacity: 0.92;
`;

const FinalCtaSection = styled.section`
  margin-top: 4rem;
  margin-bottom: 0;
  padding: 3.25rem 1.25rem;
  background: linear-gradient(
    135deg,
    #0a1210 0%,
    #0d1f1c 40%,
    #0a1614 100%
  );
  border-top: 1px solid rgba(0, 200, 150, 0.2);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: -40%;
    right: -10%;
    width: 55%;
    height: 140%;
    background: radial-gradient(circle, rgba(0, 200, 150, 0.18), transparent 65%);
    pointer-events: none;
  }
`;

const FinalCtaInner = styled.div`
  max-width: 760px;
  margin: 0 auto;
  text-align: center;
  position: relative;
  z-index: 1;
`;

const FinalEyebrow = styled.p`
  margin: 0 0 0.5rem;
  font-size: clamp(1.05rem, 1.2vw, 1.2rem);
  font-weight: 600;
  color: rgba(255, 255, 255, 0.88);
  letter-spacing: 0.02em;
`;

const FinalTitle = styled.h2`
  margin: 0 0 0.65rem;
  font-size: clamp(1.65rem, 2.4vw, 2.35rem);
  font-weight: 800;
  color: #ffffff;
  font-family: ${p => p.theme?.fonts?.title || 'Poppins, sans-serif'};
  line-height: 1.2;
`;

const FinalLead = styled.p`
  margin: 0 0 0.5rem;
  font-size: clamp(1.2rem, 1.5vw, 1.45rem);
  font-weight: 700;
  color: ${p => p.theme?.colors?.primary || '#00C896'};
`;

const FinalSub = styled.p`
  margin: 0 0 1.75rem;
  font-size: clamp(1rem, 1.1vw, 1.12rem);
  line-height: 1.65;
  color: rgba(255, 255, 255, 0.78);
`;

const FinalCtaRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.85rem;
  justify-content: center;
  align-items: center;
`;

const FinalCtaPrimary = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  padding: 0.9rem 1.5rem;
  font-weight: 700;
  font-size: clamp(0.98rem, 1.05vw, 1.08rem);
  text-decoration: none;
  color: #0a1210;
  background: linear-gradient(135deg, ${p => p.theme?.colors?.primary || '#00C896'}, ${p => p.theme?.colors?.accent || '#00B2AA'});
  box-shadow: 0 12px 28px rgba(0, 200, 150, 0.35);
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 16px 36px rgba(0, 200, 150, 0.45);
  }
`;

const FinalCtaSecondary = styled.a`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  padding: 0.9rem 1.5rem;
  font-weight: 700;
  font-size: clamp(0.98rem, 1.05vw, 1.08rem);
  text-decoration: none;
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.35);
  background: rgba(255, 255, 255, 0.06);
  transition: background 0.2s ease, border-color 0.2s ease, transform 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.12);
    border-color: rgba(255, 255, 255, 0.5);
    transform: translateY(-2px);
  }
`;

const FinalFootnote = styled.p`
  margin: 1.5rem 0 0;
  font-size: clamp(0.95rem, 1vw, 1.05rem);
  color: rgba(255, 255, 255, 0.62);
  line-height: 1.55;
`;

const FinalInlineLink = styled(Link)`
  color: rgba(0, 200, 150, 0.95);
  text-decoration: none;
  font-weight: 600;

  &:hover {
    text-decoration: underline;
  }
`;

const FinalMailLink = styled.a`
  color: rgba(0, 200, 150, 0.95);
  text-decoration: none;
  font-weight: 600;

  &:hover {
    text-decoration: underline;
  }
`;

const FAQ_ITEMS = [
  {
    q: 'How long does setup take?',
    a: 'Most users are fully set up in under 10 minutes. Connect your integrations, import or start entering leads, and your dashboard is live. The AI Strategy Engine generates your first strategy in under 60 seconds.'
  },
  {
    q: 'Do I need technical skills to use Kimux?',
    a: 'None. Kimux is built for marketers and sellers, not developers. Every integration connects with a single click. The pipeline board works like drag-and-drop. The AI Coach gives plain-language answers.'
  },
  {
    q: 'Which affiliate networks does Kimux connect to?',
    a: 'ClickBank, MaxBounty, Digistore24, BuyGoods, and MaxWeb are all supported with one-click integration. Commission data syncs automatically into your pipeline and dashboard.'
  },
  {
    q: 'Can I use Kimux as an agency managing multiple clients?',
    a: 'Yes. The Enterprise plan supports unlimited team seats and white-label options. Agency owners can manage multiple client workspaces from a single Kimux account.'
  },
  {
    q: 'How is Kimux different from HubSpot or Salesforce?',
    a: 'HubSpot and Salesforce are built for enterprise sales teams. Kimux is purpose-built for digital marketers, affiliate sellers, and performance-driven businesses. It includes an AI Strategy Engine, affiliate network integrations, and Claude AI coaching — none of which exist in traditional CRMs.'
  },
  {
    q: 'What happens after my free trial?',
    a: 'You choose your plan and enter payment details. If you don\'t upgrade, your account moves to read-only mode — your data is never deleted. You can upgrade any time and resume exactly where you left off.'
  },
  {
    q: 'Is my data secure?',
    a: 'Yes. Kimux uses AES-256 encryption at rest and TLS 1.3 in transit. We do not sell or share your data. SOC 2 compliance documentation is available upon request for Enterprise customers.'
  }
];

export default function CRMLandingPage() {
  const slides = useMemo(() => ([
    {
      image: CRMImage1,
      title: 'See Every Lead, Every Number, Every Opportunity - Right Now.',
      body: 'Your entire sales operation at a glance. KPIs, AI scores, lead sources, and pipeline stages are live by default.',
      points: [
        '5 live KPI cards with real business metrics',
        'AI insights appear automatically when integrations are connected',
        'Lead source and pipeline stage breakdown in one view',
        'Open any lead, deal, or integration in one click'
      ]
    },
    {
      image: CRMImage2,
      title: 'Your Pipeline Has Never Looked This Clear.',
      body: 'A live Kanban board with stage-level visibility, deal values, and instant drag-and-drop updates.',
      points: [
        '6 stage pipeline from New to Won',
        'Each card shows lead, company, temperature, and value',
        'Column totals update instantly as leads move',
        'Hot leads are auto-flagged for quick follow-up'
      ]
    },
    {
      image: CRMImage3,
      title: 'Connect Every Platform. Kill Every Data Silo.',
      body: 'Link your full stack once and watch every data stream sync into one command center.',
      points: [
        'Affiliate, ad, payment, and commerce integrations in one place',
        'One-click setup for major performance marketing platforms',
        'No spreadsheet imports or manual copy-paste work',
        'Automatic sync keeps CRM records current'
      ]
    },
    {
      image: CRMImage4,
      title: 'A Seasoned CMO in Your Pocket. Available 24/7.',
      body: 'Claude AI builds your go-to-market strategy, ranks channels, and gives live coaching for execution.',
      points: [
        'Full strategy generated in under 60 seconds',
        'Channel scores ranked by expected impact',
        '4-phase roadmap from awareness to optimization',
        'Live AI strategy coach for instant campaign guidance'
      ]
    }
  ]), []);
  const [activeSlide, setActiveSlide] = useState(0);
  const [openFaq, setOpenFaq] = useState(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide(prev => (prev + 1) % slides.length);
    }, 8000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const currentSlide = slides[activeSlide];

  return (
    <Main>
      <Hero>
        <HeroGrid>
          <div>
            <HeroTitle>Stop Losing Leads. Start Closing Sales.</HeroTitle>
            <HeroSubtitle>
              Kimux is the AI-powered CRM built for digital marketers, affiliate sellers, and
              brokerage professionals. Track every lead, automate follow-ups, and use AI strategy
              guidance while your team focuses on execution.
            </HeroSubtitle>
            <ActionRow>
              <Cta href="/signup" primary>Start Free Trial</Cta>
              <Cta href="#see-kimux-working">Watch a 2-Min Demo</Cta>
            </ActionRow>
          </div>

          <HeroVisual>
            <Pulse />
            <VisualHeading>Live CRM Snapshot</VisualHeading>
            <KpiGrid>
              <Kpi>
                <KpiValue>48</KpiValue>
                <KpiLabel>Total Leads</KpiLabel>
              </Kpi>
              <Kpi>
                <KpiValue>11</KpiValue>
                <KpiLabel>Hot Leads</KpiLabel>
              </Kpi>
              <Kpi>
                <KpiValue>$15,752</KpiValue>
                <KpiLabel>Pipeline Revenue</KpiLabel>
              </Kpi>
              <Kpi>
                <KpiValue>8.33%</KpiValue>
                <KpiLabel>Conversion Rate</KpiLabel>
              </Kpi>
            </KpiGrid>
          </HeroVisual>
        </HeroGrid>
      </Hero>

      <TrustStripSection>
        <TrustStrip>
          <TrustStripInner>
            Trusted by <TrustHighlight>2,400+</TrustHighlight> marketers across{' '}
            <TrustHighlight>40</TrustHighlight> countries. <TrustHighlight>$4.2M+</TrustHighlight> revenue tracked.{' '}
            <TrustHighlight>15+</TrustHighlight> integrations. Setup in under <TrustHighlight>10 minutes</TrustHighlight>.
          </TrustStripInner>
        </TrustStrip>
      </TrustStripSection>

      <SliderShell id="see-kimux-working">
        <SliderIntroHeader>
          <H2>Everything You Need to Sell More. Nothing You Don&apos;t.</H2>
          <Sub>
            Kimux replaces disconnected tools with one AI-powered command center. Built for speed,
            clarity, and daily execution.
          </Sub>
        </SliderIntroHeader>
        <SliderCard>
          <SliderTop>
            <strong>See Kimux Working</strong>
            <NavDots>
              {slides.map((_, idx) => (
                <Dot
                  key={idx}
                  type="button"
                  active={idx === activeSlide}
                  onClick={() => setActiveSlide(idx)}
                  aria-label={`View slide ${idx + 1}`}
                />
              ))}
            </NavDots>
          </SliderTop>

          <SlideFrame>
            <MockScreen>
              <SlideImage
                key={`slide-image-${activeSlide}`}
                src={currentSlide.image}
                alt={currentSlide.title}
                loading={activeSlide === 0 ? 'eager' : 'lazy'}
              />
              <SlideOverlay />
            </MockScreen>
            <SlideCopyWrap>
              <SlideCopy>
                <h3>{currentSlide.title}</h3>
                <p>{currentSlide.body}</p>
                <BulletList>
                  {currentSlide.points.map(point => <li key={point}>{point}</li>)}
                </BulletList>
                <ProgressRail aria-hidden="true">
                  <ProgressFill key={`progress-${activeSlide}`} />
                </ProgressRail>
              </SlideCopy>
            </SlideCopyWrap>
          </SlideFrame>
        </SliderCard>
      </SliderShell>

      <DeepSection>
        <HeaderBlock>
          <H2>Feature Deep Dives</H2>
          <Sub>
            Purpose-built modules for dashboard intelligence, pipeline execution, integrations,
            and AI strategy.
          </Sub>
        </HeaderBlock>

        <DeepShell>
          <DeepGrid>
            <DeepCard>
              <DeepCardTop>
                <DeepIndex>01</DeepIndex>
                <DeepTitle>You Can&apos;t Fix What You Can&apos;t See. Now You Can See Everything.</DeepTitle>
              </DeepCardTop>
              <DeepCopy>
                The dashboard surfaces top-value leads, at-risk revenue, source quality, and the
                highest-impact action to take next.
              </DeepCopy>
              <DeepBulletList>
                <li>Live KPI layer with temperature distribution and conversion performance</li>
                <li>Source and stage visibility so teams spot bottlenecks instantly</li>
                <li>AI insight module recommends next-best action without manual reporting</li>
              </DeepBulletList>
            </DeepCard>

            <DeepCard>
              <DeepCardTop>
                <DeepIndex>02</DeepIndex>
                <DeepTitle>Every Deal Has a Stage. Every Stage Has a Number.</DeepTitle>
              </DeepCardTop>
              <DeepCopy>
                The pipeline board turns your funnel into a live operating system with drag-and-drop
                execution and value tracking at every stage.
              </DeepCopy>
              <DeepBulletList>
                <li>Stage-level totals update instantly when leads move</li>
                <li>Search and filtering across all columns for fast triage</li>
                <li>Hot leads are highlighted automatically so nothing slips</li>
              </DeepBulletList>
            </DeepCard>

            <DeepCard>
              <DeepCardTop>
                <DeepIndex>03</DeepIndex>
                <DeepTitle>Your Entire Stack. One Dashboard. Zero Manual Entry.</DeepTitle>
              </DeepCardTop>
              <DeepCopy>
                Connect affiliate networks, ad platforms, payment processors, and commerce tools to
                unify your data without spreadsheet workflows.
              </DeepCopy>
              <DeepBulletList>
                <li>15+ integrations across media spend, revenue, and customer data</li>
                <li>Simple status states for connected, pending, disconnected, and error</li>
                <li>Automatic sync keeps pipeline and analytics always up to date</li>
              </DeepBulletList>
            </DeepCard>

            <DeepCard>
              <DeepCardTop>
                <DeepIndex>04</DeepIndex>
                <DeepTitle>Claude AI Writes the Strategy. Your Team Executes Faster.</DeepTitle>
              </DeepCardTop>
              <DeepCopy>
                Strategy Engine produces audience, channels, and phased GTM roadmaps in seconds, then
                supports execution with a live AI coach.
              </DeepCopy>
              <DeepBulletList>
                <li>Channel scoring by expected impact for your exact business context</li>
                <li>4-phase roadmap from awareness through scale and optimization</li>
                <li>Real-time coaching for copy, campaigns, funnel, and outreach decisions</li>
              </DeepBulletList>
            </DeepCard>
          </DeepGrid>
        </DeepShell>
      </DeepSection>

      <Proof>
        <HeaderBlock>
          <H2>Real Marketers. Real Numbers. Real Results.</H2>
          <Sub>Outcomes from users running Kimux across growth, agency, and affiliate teams.</Sub>
        </HeaderBlock>

        <StatGrid>
          <StatCard>
            <StatValue>2,400+</StatValue>
            <StatText>Active users across 40 countries</StatText>
          </StatCard>
          <StatCard>
            <StatValue>$4.2M+</StatValue>
            <StatText>Revenue tracked in the last 12 months</StatText>
          </StatCard>
          <StatCard>
            <StatValue>15+</StatValue>
            <StatText>One-click integrations available</StatText>
          </StatCard>
          <StatCard>
            <StatValue>38%</StatValue>
            <StatText>More deals closed in first 90 days</StatText>
          </StatCard>
        </StatGrid>

        <QuoteGrid>
          <Quote>
            Kimux replaced my CRM, analytics tool, and strategy consultant. The value is in a
            different league compared to what we used before.
            <footer>Daniel M. - Affiliate Marketer</footer>
          </Quote>
          <Quote>
            I connected multiple platforms in one afternoon. Ad spend, commissions, and sales now
            sync in one place, so ROI is clear daily.
            <footer>Kevin O. - Performance Marketer</footer>
          </Quote>
        </QuoteGrid>
      </Proof>

      <FaqSection>
        <FaqHeaderBlock>
          <H2>Frequently Asked Questions</H2>
          <Sub>Quick answers about setup, security, trials, and how Kimux fits your stack.</Sub>
        </FaqHeaderBlock>
        <FaqList>
          {FAQ_ITEMS.map((item, idx) => {
            const isOpen = openFaq === idx;
            return (
              <FaqItem key={item.q} data-open={isOpen}>
                <FaqQuestion
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                >
                  <span>{item.q}</span>
                  <span aria-hidden="true">{isOpen ? '−' : '+'}</span>
                </FaqQuestion>
                {isOpen && <FaqAnswer>{item.a}</FaqAnswer>}
              </FaqItem>
            );
          })}
        </FaqList>
      </FaqSection>

      <FinalCtaSection>
        <FinalCtaInner>
          <FinalEyebrow>Your leads are waiting. Your strategy is ready.</FinalEyebrow>
          <FinalTitle>Start Free. See Results in 10 Minutes.</FinalTitle>
          <FinalLead>14-day free trial. No credit card. No setup fees. Full access from minute one.</FinalLead>
          <FinalSub>
            Join marketers who run pipeline, integrations, and AI strategy from one place.
          </FinalSub>
          <FinalCtaRow>
            <FinalCtaPrimary to="/signup">Start your free trial</FinalCtaPrimary>
            <FinalCtaSecondary href="mailto:contact@kimux.co?subject=Schedule%20a%20live%20demo">
              Schedule a live demo
            </FinalCtaSecondary>
          </FinalCtaRow>
          <FinalFootnote>
            Questions? Chat with our team or email{' '}
            <FinalMailLink href="mailto:contact@kimux.co">contact@kimux.co</FinalMailLink>
            {' · '}
            <FinalInlineLink to="/faq">Help center</FinalInlineLink>
          </FinalFootnote>
        </FinalCtaInner>
      </FinalCtaSection>
    </Main>
  );
}
