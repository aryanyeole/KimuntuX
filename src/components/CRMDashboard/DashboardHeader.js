import React from 'react';
import styled from 'styled-components';

const HeaderWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
  }
`;

const TitleSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const PageTitle = styled.h1`
  font-size: 2rem;
  font-weight: 700;
  margin: 0;
  color: ${props => props.theme.colors.text};
`;

const Subtitle = styled.p`
  font-size: 0.9rem;
  color: ${props => props.theme.colors.text};
  opacity: 0.7;
  margin: 0;
`;

const ActionsBar = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
  
  @media (max-width: 768px) {
    width: 100%;
    
    input {
      flex: 1;
    }
  }
`;

const SearchInput = styled.input`
  padding: 10px 16px;
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 8px;
  background: ${props => props.theme.colors.cardBackground};
  color: ${props => props.theme.colors.text};
  font-size: 0.9rem;
  outline: none;
  transition: border-color 0.2s;
  min-width: 250px;

  &::placeholder {
    color: ${props => props.theme.colors.text};
    opacity: 0.5;
  }

  &:focus {
    border-color: ${props => props.theme.colors.primary};
  }
`;

const PrimaryButton = styled.button`
  background: linear-gradient(135deg, ${props => props.theme.colors.primary}, #00b380);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 200, 150, 0.3);
  }

  &:active {
    transform: translateY(0);
  }
`;

export default function DashboardHeader({ onNewLead }) {
  return (
    <HeaderWrapper>
      <TitleSection>
        <PageTitle>CRM Dashboard</PageTitle>
        <Subtitle>Real-time insights and lead management</Subtitle>
      </TitleSection>
      <ActionsBar>
        <SearchInput placeholder="Search leads, companies..." />
        <PrimaryButton onClick={onNewLead}>+ New Lead</PrimaryButton>
      </ActionsBar>
    </HeaderWrapper>
  );
}
