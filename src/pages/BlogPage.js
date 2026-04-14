import React from 'react';
import styled from 'styled-components';
import blogImage from '../assets/Blog.jpg';

const Page = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 50%, #f8f9fa 100%);
  padding-top: 120px;
  
  @media (max-width: 768px) {
    padding-top: 100px;
  }
`;

const Wrap = styled.div`
  max-width: 1400px;
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

const ContentSection = styled.div`
  text-align: center;
  padding: 3rem 0;
  color: #495057;
  font-size: 1.125rem;
  line-height: 1.8;
`;

export default function BlogPage() {
  return (
    <Page>
      <Wrap>
        <HeroSection>
          <HeroImageWrapper>
            <HeroImage src={blogImage} alt="Blog" />
          </HeroImageWrapper>
          <HeroContent>
            <HeroTitle>Blog</HeroTitle>
            <HeroSubtitle>Stay updated with the latest insights, news, and updates from KimuX</HeroSubtitle>
          </HeroContent>
        </HeroSection>

        <ContentSection>
          <p>Blog content coming soon...</p>
        </ContentSection>
      </Wrap>
    </Page>
  );
}

