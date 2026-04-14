import React from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

const FooterContainer = styled.footer`
  background: #000000;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding: 4rem 0 2rem;
  margin-top: 4rem;
  position: relative;
  color: white;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, ${p => p.theme?.colors?.primary || '#00C896'}, transparent);
  }
`;

const FooterContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 40px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 3rem;
  
  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 2rem;
    padding: 0 24px;
  }
  
  @media (max-width: 480px) {
    grid-template-columns: 1fr;
    gap: 2rem;
  }
`;

const FooterSection = styled.div`
  h3 {
    color: white;
    margin-bottom: 1.25rem;
    font-size: 1.75rem;
    font-weight: 600;
    font-family: ${props => props.theme?.fonts?.title || 'Poppins, sans-serif'};
    letter-spacing: 0.5px;
    text-transform: uppercase;
    position: relative;
    padding-bottom: 0.75rem;
    
    &::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      width: 40px;
      height: 2px;
      background: linear-gradient(90deg, ${p => p.theme?.colors?.primary || '#00C896'}, ${p => p.theme?.colors?.accent || '#DAA520'});
      border-radius: 1px;
    }
  }

  ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  li {
    margin-bottom: 0.75rem;
  }

  a {
    color: white;
    opacity: 0.75;
    text-decoration: none;
    font-size: 1.25rem;
    transition: all 0.2s ease;
    display: inline-block;
    position: relative;
    
    &::before {
      content: '';
      position: absolute;
      left: -12px;
      top: 50%;
      transform: translateY(-50%);
      width: 0;
      height: 2px;
      background: ${props => props.theme?.colors?.primary || '#00C896'};
      transition: width 0.2s ease;
    }

    &:hover {
      opacity: 1;
      color: ${props => props.theme?.colors?.primary || '#00C896'};
      transform: translateX(4px);
      
      &::before {
        width: 6px;
      }
    }
  }
`;

const FooterBottom = styled.div`
  max-width: 1200px;
  margin: 3rem auto 0;
  padding: 2rem 40px 0;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  text-align: center;
  color: white;
  opacity: 0.7;
  font-size: 1.1rem;
  line-height: 1.6;
  
  @media (max-width: 768px) {
    padding: 2rem 24px 0;
    font-size: 1rem;
  }
`;

const Footer = () => {
  const theme = useTheme();

  return (
    <FooterContainer>
      <FooterContent>
        <FooterSection>
          <h3>Platform</h3>
          <ul>
            <li><Link to="/solutions">Features</Link></li>
            <li><Link to="/pricing">Pricing</Link></li>
            <li><Link to="/developer">API Documentation</Link></li>
            <li><Link to="/solutions">Integrations</Link></li>
          </ul>
        </FooterSection>

        <FooterSection>
          <h3>Solutions</h3>
          <ul>
            <li><Link to="/crm">CRM</Link></li>
            <li><Link to="/b2b-brokerage">B2B Brokerage</Link></li>
            <li><Link to="/b2c-marketplace">B2C Marketplace</Link></li>
            <li><Link to="/ai-dashboard">AI Dashboard</Link></li>
          </ul>
        </FooterSection>

        <FooterSection>
          <h3>Resources</h3>
          <ul>
            <li><Link to="/developer">Documentation</Link></li>
            <li><a href="mailto:support@kimuntux.com">Support</a></li>
            <li><Link to="/blog">Blog</Link></li>
            <li><Link to="/faq">FAQ</Link></li>
          </ul>
        </FooterSection>

        <FooterSection>
          <h3>Company</h3>
          <ul>
            <li><Link to="/about">About</Link></li>
            <li><a href="mailto:contact@kimuntux.com">Contact</a></li>
            <li><Link to="/benefits">Benefits</Link></li>
            <li><Link to="/faq">Help Center</Link></li>
          </ul>
        </FooterSection>
      </FooterContent>

      <FooterBottom>
        <p>&copy; 2026 KimuX, powered by Kimuntu Power Inc. All rights reserved. Built with AI-powered digital brokerage technology.</p>
      </FooterBottom>
    </FooterContainer>
  );
};

export default Footer;
