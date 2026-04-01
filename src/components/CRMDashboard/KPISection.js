import React from 'react';
import styled from 'styled-components';

const KPIGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const KPICard = styled.div`
  background: ${props => props.theme.colors.cardBackground};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 12px;
  padding: 1.5rem;
  transition: all 0.3s ease;

  &:hover {
    border-color: ${props => props.theme.colors.primary};
    box-shadow: 0 4px 12px ${props => {
      return props.theme.isDarkMode
        ? 'rgba(0, 200, 150, 0.15)'
        : 'rgba(0, 200, 150, 0.1)';
    }};
  }
`;

const KPILabel = styled.p`
  font-size: 0.85rem;
  color: ${props => props.theme.colors.text};
  opacity: 0.7;
  margin: 0 0 0.75rem 0;
  font-weight: 500;
`;

const KPIValue = styled.div`
  font-size: 2.5rem;
  font-weight: 700;
  color: ${props => props.accentColor || props.theme.colors.primary};
  margin-bottom: 0.75rem;
`;

const KPIChange = styled.div`
  font-size: 0.8rem;
  color: ${props => (props.positive ? '#00c896' : '#ef4444')};
  display: flex;
  align-items: center;
  gap: 0.4rem;
`;

const KPILoadingPlaceholder = styled.div`
  height: 60px;
  background: linear-gradient(90deg, 
    ${props => props.theme.colors.border} 25%, 
    ${props => props.theme.colors.cardBackground} 50%, 
    ${props => props.theme.colors.border} 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
  border-radius: 8px;

  @keyframes loading {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
`;

export default function KPISection({ data, loading }) {
  const kpis = loading
    ? [
        { label: 'Total Leads', value: '—' },
        { label: 'Hot Leads', value: '—' },
        { label: 'Warm Leads', value: '—' },
        { label: 'Cold Leads', value: '—' },
        { label: 'Recent Activities', value: '—' }
      ]
    : [
        { label: 'Total Leads', value: data?.totalLeads || 0, color: '#00c896' },
        { label: 'Hot Leads', value: data?.hotLeads || 0, color: '#ef4444' },
        { label: 'Warm Leads', value: data?.warmLeads || 0, color: '#f59e0b' },
        { label: 'Cold Leads', value: data?.coldLeads || 0, color: '#6366f1' },
        { label: 'Recent Activities', value: data?.recentActivities || 0, color: '#8b5cf6' }
      ];

  return (
    <KPIGrid>
      {kpis.map((kpi, idx) => (
        <KPICard key={idx}>
          <KPILabel>{kpi.label}</KPILabel>
          {loading ? (
            <KPILoadingPlaceholder />
          ) : (
            <>
              <KPIValue accentColor={kpi.color}>{kpi.value}</KPIValue>
              <KPIChange positive={true}>
                ↗ Updated just now
              </KPIChange>
            </>
          )}
        </KPICard>
      ))}
    </KPIGrid>
  );
}
