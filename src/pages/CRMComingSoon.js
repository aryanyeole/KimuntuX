import React from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import CRMSidebar from '../components/CRMDashboard/CRMSidebar';

const ComingSoonContainer = styled.div`
  min-height: 100vh;
  background: ${props => props.theme.colors.background};
  color: ${props => props.theme.colors.text};
  padding-top: 80px;
  display: flex;
`;

const SidebarSection = styled.div`
  @media (max-width: 768px) {
    display: none;
  }
`;

const MainContent = styled.main`
  flex: 1;
  padding: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;

  @media (max-width: 768px) {
    padding: 1.5rem;
  }
`;

const ContentBox = styled.div`
  max-width: 500px;
  text-align: center;
`;

const Icon = styled.div`
  font-size: 4rem;
  margin-bottom: 1.5rem;
`;

const Title = styled.h1`
  font-size: 2rem;
  font-weight: 700;
  margin: 0 0 1rem 0;
  color: ${props => props.theme.colors.text};
`;

const Description = styled.p`
  font-size: 1rem;
  color: ${props => props.theme.colors.text};
  opacity: 0.7;
  margin: 0 0 2rem 0;
  line-height: 1.6;
`;

const BackButton = styled(Link)`
  display: inline-block;
  padding: 12px 24px;
  background: linear-gradient(135deg, ${props => props.theme.colors.primary}, #00b380);
  color: white;
  text-decoration: none;
  border-radius: 8px;
  font-weight: 600;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 200, 150, 0.3);
  }
`;

export default function CRMComingSoon({ title, icon }) {
  useTheme();

  return (
    <ComingSoonContainer>
      <SidebarSection>
        <CRMSidebar />
      </SidebarSection>

      <MainContent>
        <ContentBox>
          <Icon>{icon}</Icon>
          <Title>{title}</Title>
          <Description>
            This feature is coming soon! We're working hard to bring you an amazing experience.
          </Description>
          <BackButton to="/crm">← Back to Dashboard</BackButton>
        </ContentBox>
      </MainContent>
    </ComingSoonContainer>
  );
}
