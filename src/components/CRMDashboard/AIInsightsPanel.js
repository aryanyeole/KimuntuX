import React from 'react';
import styled from 'styled-components';

const WidgetWrapper = styled.div`
  background: linear-gradient(135deg, 
    ${props => props.theme.colors.primary}12, 
    ${props => props.theme.colors.accent}12);
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
`;

const WidgetTitle = styled.h3`
  font-size: 1.1rem;
  font-weight: 600;
  color: ${props => props.theme.colors.primary};
  margin: 0 0 1rem 0;
`;

const InsightsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const InsightItem = styled.div`
  display: flex;
  gap: 0.75rem;
`;

const InsightIcon = styled.div`
  font-size: 1.5rem;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${props => props.theme.colors.background};
  border-radius: 8px;
  flex-shrink: 0;
`;

const InsightContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const InsightText = styled.p`
  font-size: 0.9rem;
  color: ${props => props.theme.colors.text};
  margin: 0;
  line-height: 1.5;
`;

const InsightAction = styled.button`
  background: transparent;
  border: none;
  color: ${props => props.theme.colors.primary};
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  padding: 0;
  text-align: left;
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.8;
  }
`;

export default function AIInsightsPanel() {
  const insights = [
    {
      icon: '🔥',
      title: 'Hot Leads Ready',
      description: 'You have 3 HOT leads waiting for follow-up. Prioritize these for highest conversion.',
      action: 'View Hot Leads'
    },
    {
      icon: '📧',
      title: 'Draft Emails',
      description: 'Generate AI-powered follow-up emails for ENGAGED leads in one click.',
      action: 'Draft Emails'
    },
    {
      icon: '📊',
      title: 'Conversion Insights',
      description: 'Your PROPOSAL_SENT stage has the highest conversion rate (45%) this week.',
      action: 'View Analytics'
    }
  ];

  return (
    <WidgetWrapper>
      <WidgetTitle>✨ AI Insights</WidgetTitle>
      <InsightsList>
        {insights.map((insight, idx) => (
          <InsightItem key={idx}>
            <InsightIcon>{insight.icon}</InsightIcon>
            <InsightContent>
              <InsightText>
                <strong>{insight.title}</strong> — {insight.description}
              </InsightText>
              <InsightAction>{insight.action} →</InsightAction>
            </InsightContent>
          </InsightItem>
        ))}
      </InsightsList>
    </WidgetWrapper>
  );
}
