import React from 'react';
import styled from 'styled-components';

const WidgetWrapper = styled.div`
  background: ${props => props.theme.colors.cardBackground};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
`;

const WidgetTitle = styled.h3`
  font-size: 1.1rem;
  font-weight: 600;
  color: ${props => props.theme.colors.text};
  margin: 0 0 1rem 0;
`;

const LeadsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const LeadItem = styled.div`
  padding: 1rem;
  background: ${props => props.theme.colors.background};
  border-radius: 8px;
  border: 1px solid ${props => props.theme.colors.border};
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.2s ease;
  cursor: pointer;

  &:hover {
    border-color: ${props => props.theme.colors.primary};
    box-shadow: 0 2px 8px ${props => {
      return props.theme.isDarkMode
        ? 'rgba(0, 200, 150, 0.1)'
        : 'rgba(0, 200, 150, 0.05)';
    }};
  }
`;

const LeadInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
`;

const LeadName = styled.div`
  font-weight: 600;
  color: ${props => props.theme.colors.text};
  font-size: 0.95rem;
`;

const LeadCompany = styled.div`
  font-size: 0.85rem;
  color: ${props => props.theme.colors.text};
  opacity: 0.7;
`;

const LeadMeta = styled.div`
  display: flex;
  gap: 0.75rem;
  align-items: center;
`;

const StageBadge = styled.span`
  font-size: 0.75rem;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 4px;
  background: ${props => {
    const stageColors = {
      'NEW': '#6366f1',
      'CONTACTED': '#f59e0b',
      'ENGAGED': '#8b5cf6',
      'PROPOSAL_SENT': '#00c896',
      'WON': '#10b981',
      'LOST': '#ef4444'
    };
    const color = stageColors[props.stage] || '#6366f1';
    return props.theme.isDarkMode ? `${color}25` : `${color}15`;
  }};
  color: ${props => {
    const stageColors = {
      'NEW': '#6366f1',
      'CONTACTED': '#f59e0b',
      'ENGAGED': '#8b5cf6',
      'PROPOSAL_SENT': '#00c896',
      'WON': '#10b981',
      'LOST': '#ef4444'
    };
    return stageColors[props.stage] || '#6366f1';
  }};
`;

const ScoreBadge = styled.span`
  font-size: 0.75rem;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 4px;
  background: ${props => {
    const scoreColors = {
      'HOT': '#ef4444',
      'WARM': '#f59e0b',
      'COLD': '#6366f1'
    };
    const color = scoreColors[props.score] || '#6366f1';
    return props.theme.isDarkMode ? `${color}25` : `${color}15`;
  }};
  color: ${props => {
    const scoreColors = {
      'HOT': '#ef4444',
      'WARM': '#f59e0b',
      'COLD': '#6366f1'
    };
    return scoreColors[props.score] || '#6366f1';
  }};
`;

const LoadingPlaceholder = styled.div`
  height: 60px;
  background: linear-gradient(90deg, 
    ${props => props.theme.colors.border} 25%, 
    ${props => props.theme.colors.background} 50%, 
    ${props => props.theme.colors.border} 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
  border-radius: 8px;
  margin-bottom: 0.75rem;

  @keyframes loading {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
`;

const EmptyState = styled.div`
  padding: 2rem 1rem;
  text-align: center;
  color: ${props => props.theme.colors.text};
  opacity: 0.5;
  font-size: 0.9rem;
`;

export default function LatestLeadsWidget({ leads, loading }) {
  if (loading) {
    return (
      <WidgetWrapper>
        <WidgetTitle>Latest Leads</WidgetTitle>
        <div>
          {[1, 2, 3, 4, 5].map(i => (
            <LoadingPlaceholder key={i} />
          ))}
        </div>
      </WidgetWrapper>
    );
  }

  if (!leads || leads.length === 0) {
    return (
      <WidgetWrapper>
        <WidgetTitle>Latest Leads</WidgetTitle>
        <EmptyState>No leads yet. Create your first lead to get started!</EmptyState>
      </WidgetWrapper>
    );
  }

  return (
    <WidgetWrapper>
      <WidgetTitle>Latest Leads ({leads.length})</WidgetTitle>
      <LeadsList>
        {leads.slice(0, 5).map(lead => (
          <LeadItem key={lead.id}>
            <LeadInfo>
              <LeadName>{lead.name}</LeadName>
              <LeadCompany>{lead.company || 'No company'}</LeadCompany>
            </LeadInfo>
            <LeadMeta>
              <StageBadge stage={lead.stage}>{lead.stage.replace(/_/g, ' ')}</StageBadge>
              <ScoreBadge score={lead.score}>{lead.score}</ScoreBadge>
            </LeadMeta>
          </LeadItem>
        ))}
      </LeadsList>
    </WidgetWrapper>
  );
}
