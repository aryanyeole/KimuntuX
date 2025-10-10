import React from 'react';
import styled from 'styled-components';
import { useTheme } from '../contexts/ThemeContext';

const FooterContainer = styled.footer`
  background-color: ${props => props.theme?.colors?.cardBackground || '#f8f9fa'};
  border-top: 1px solid ${props => props.theme?.colors?.border || '#E5E5E5'};
  padding: 2rem 0;
  margin-top: 4rem;
`;

const FooterContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
`;

const FooterSection = styled.div`
  h3 {
    color: ${props => props.theme?.colors?.primary || '#00C896'};
    margin-bottom: 1rem;
    font-size: 1.1rem;
  }

  ul {
    list-style: none;
    padding: 0;
  }

  li {
    margin-bottom: 0.5rem;
  }

  a {
    color: ${props => props.theme?.colors?.text || '#111111'};
    opacity: 0.8;
    transition: opacity 0.3s ease;

    &:hover {
      opacity: 1;
      color: ${props => props.theme?.colors?.primary || '#00C896'};
    }
  }
`;

const FooterBottom = styled.div`
  max-width: 1200px;
  margin: 2rem auto 0;
  padding: 1rem 20px 0;
  border-top: 1px solid ${props => props.theme?.colors?.border || '#E5E5E5'};
  text-align: center;
  color: ${props => props.theme?.colors?.text || '#111111'};
  opacity: 0.7;
`;

const Footer = () => {
  const theme = useTheme();

  return (
    <FooterContainer>
      <FooterContent>
        <FooterSection>
          <h3>Platform</h3>
          <ul>
            <li><a href="#features">Features</a></li>
            <li><a href="#pricing">Pricing</a></li>
            <li><a href="#api">API Documentation</a></li>
            <li><a href="#integrations">Integrations</a></li>
          </ul>
        </FooterSection>

        <FooterSection>
          <h3>Solutions</h3>
          <ul>
            <li><a href="#crm">CRM</a></li>
            <li><a href="#b2b">B2B Brokerage</a></li>
            <li><a href="#b2c">B2C Marketplace</a></li>
            <li><a href="#ai">AI Dashboard</a></li>
          </ul>
        </FooterSection>

        <FooterSection>
          <h3>Resources</h3>
          <ul>
            <li><a href="#docs">Documentation</a></li>
            <li><a href="#support">Support</a></li>
            <li><a href="#blog">Blog</a></li>
            <li><a href="#community">Community</a></li>
          </ul>
        </FooterSection>

        <FooterSection>
          <h3>Company</h3>
          <ul>
            <li><a href="#about">About</a></li>
            <li><a href="#careers">Careers</a></li>
            <li><a href="#contact">Contact</a></li>
            <li><a href="#privacy">Privacy Policy</a></li>
          </ul>
        </FooterSection>
      </FooterContent>

      <FooterBottom>
        <p>&copy; 2024 KimuntuX. All rights reserved. Built with AI-powered digital brokerage technology.</p>
      </FooterBottom>
    </FooterContainer>
  );
};

export default Footer;
