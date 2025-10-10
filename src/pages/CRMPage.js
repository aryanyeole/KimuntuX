import React, { useState } from 'react';
import styled from 'styled-components';
import { useTheme } from '../contexts/ThemeContext';

const PageContainer = styled.div`
  min-height: 100vh;
  background-color: ${props => props.theme.colors.background};
  padding: 2rem 0;
`;

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
`;

const PageTitle = styled.h1`
  color: ${props => props.theme.colors.text};
  margin-bottom: 2rem;
  text-align: center;
`;

const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const MetricCard = styled.div`
  background: linear-gradient(135deg, ${props => props.theme.colors.primary}15, ${props => props.theme.colors.accent}15);
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 12px;
  padding: 1.5rem;
  text-align: center;
  transition: transform 0.3s ease;

  &:hover {
    transform: translateY(-4px);
  }
`;

const MetricValue = styled.div`
  font-size: 2rem;
  font-weight: 700;
  color: ${props => props.theme.colors.primary};
  margin-bottom: 0.5rem;
`;

const MetricLabel = styled.div`
  color: ${props => props.theme.colors.text};
  opacity: 0.8;
  font-size: 0.9rem;
`;

const SectionGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  margin-bottom: 2rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const SectionCard = styled.div`
  background-color: ${props => props.theme.colors.cardBackground};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 12px;
  padding: 1.5rem;
`;

const SectionTitle = styled.h3`
  color: ${props => props.theme.colors.primary};
  margin-bottom: 1rem;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
`;

const TableHeader = styled.th`
  background-color: ${props => props.theme.colors.primary}20;
  color: ${props => props.theme.colors.text};
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid ${props => props.theme.colors.border};
`;

const TableCell = styled.td`
  padding: 0.75rem;
  border-bottom: 1px solid ${props => props.theme.colors.border};
  color: ${props => props.theme.colors.text};
`;

const StatusBadge = styled.span`
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;
  background-color: ${props => props.status === 'active' ? '#00C89620' : props.status === 'pending' ? '#DAA52020' : '#ff6b6b20'};
  color: ${props => props.status === 'active' ? '#00C896' : props.status === 'pending' ? '#DAA520' : '#ff6b6b'};
`;

const InsightCard = styled.div`
  background: linear-gradient(135deg, ${props => props.theme.colors.accent}10, ${props => props.theme.colors.primary}10);
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1rem;
`;

const CRMPage = () => {
  const theme = useTheme();

  const metrics = [
    { label: 'Total Clients', value: '1,247', change: '+12%' },
    { label: 'Active Leads', value: '89', change: '+5%' },
    { label: 'Conversion Rate', value: '23.4%', change: '+2.1%' },
    { label: 'Revenue', value: '$2.4M', change: '+18%' }
  ];

  const clients = [
    { id: 1, name: 'Acme Corp', email: 'contact@acme.com', status: 'active', lastContact: '2024-01-15' },
    { id: 2, name: 'TechStart Inc', email: 'hello@techstart.com', status: 'pending', lastContact: '2024-01-12' },
    { id: 3, name: 'Global Solutions', email: 'info@global.com', status: 'active', lastContact: '2024-01-14' },
    { id: 4, name: 'Innovate Labs', email: 'team@innovate.com', status: 'inactive', lastContact: '2024-01-08' }
  ];

  const aiInsights = [
    {
      title: 'High-Value Lead Alert',
      description: 'TechStart Inc shows 85% likelihood to convert based on engagement patterns',
      priority: 'high'
    },
    {
      title: 'Follow-up Recommended',
      description: 'Acme Corp hasn\'t been contacted in 5 days - optimal window closing',
      priority: 'medium'
    },
    {
      title: 'Cross-sell Opportunity',
      description: 'Global Solutions may benefit from premium package based on usage data',
      priority: 'low'
    }
  ];

  return (
    <PageContainer>
      <Container>
        <PageTitle>CRM Dashboard</PageTitle>
        
        <MetricsGrid>
          {metrics.map((metric, index) => (
            <MetricCard key={index}>
              <MetricValue>{metric.value}</MetricValue>
              <MetricLabel>{metric.label}</MetricLabel>
              <div style={{ color: theme.colors.accent, fontSize: '0.8rem', marginTop: '0.5rem' }}>
                {metric.change}
              </div>
            </MetricCard>
          ))}
        </MetricsGrid>

        <SectionGrid>
          <SectionCard>
            <SectionTitle>Client Management</SectionTitle>
            <Table>
              <thead>
                <tr>
                  <TableHeader>Name</TableHeader>
                  <TableHeader>Status</TableHeader>
                  <TableHeader>Last Contact</TableHeader>
                </tr>
              </thead>
              <tbody>
                {clients.map(client => (
                  <tr key={client.id}>
                    <TableCell>{client.name}</TableCell>
                    <TableCell>
                      <StatusBadge status={client.status}>{client.status}</StatusBadge>
                    </TableCell>
                    <TableCell>{client.lastContact}</TableCell>
                  </tr>
                ))}
              </tbody>
            </Table>
          </SectionCard>

          <SectionCard>
            <SectionTitle>AI-Driven Insights</SectionTitle>
            {aiInsights.map((insight, index) => (
              <InsightCard key={index}>
                <h4 style={{ color: theme.colors.primary, marginBottom: '0.5rem' }}>
                  {insight.title}
                </h4>
                <p style={{ color: theme.colors.text, opacity: 0.8 }}>
                  {insight.description}
                </p>
                <StatusBadge status={insight.priority === 'high' ? 'active' : insight.priority === 'medium' ? 'pending' : 'inactive'}>
                  {insight.priority} priority
                </StatusBadge>
              </InsightCard>
            ))}
          </SectionCard>
        </SectionGrid>
      </Container>
    </PageContainer>
  );
};

export default CRMPage;
