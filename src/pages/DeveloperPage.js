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

const SectionGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin-bottom: 2rem;
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

const CodeBlock = styled.div`
  background-color: ${props => props.theme.colors.background};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 8px;
  padding: 1rem;
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
  color: ${props => props.theme.colors.text};
  margin-bottom: 1rem;
  overflow-x: auto;
`;

const ApiEndpoint = styled.div`
  background: linear-gradient(135deg, ${props => props.theme.colors.accent}10, ${props => props.theme.colors.primary}10);
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1rem;
`;

const EndpointMethod = styled.span`
  background-color: ${props => props.method === 'GET' ? '#00C896' : props.method === 'POST' ? '#DAA520' : '#ff6b6b'};
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 600;
  margin-right: 1rem;
`;

const EndpointUrl = styled.div`
  font-family: 'Courier New', monospace;
  color: ${props => props.theme.colors.text};
  margin-top: 0.5rem;
`;

const SdkCard = styled.div`
  background: linear-gradient(135deg, ${props => props.theme.colors.primary}15, ${props => props.theme.colors.accent}15);
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1rem;
  text-align: center;
`;

const SdkIcon = styled.div`
  font-size: 2.5rem;
  margin-bottom: 1rem;
  color: ${props => props.theme.colors.primary};
`;

const SdkTitle = styled.div`
  font-weight: 600;
  color: ${props => props.theme.colors.primary};
  margin-bottom: 0.5rem;
`;

const SdkDescription = styled.div`
  color: ${props => props.theme.colors.text};
  opacity: 0.8;
  font-size: 0.9rem;
  margin-bottom: 1rem;
`;

const PartnerCard = styled.div`
  background: linear-gradient(135deg, ${props => props.theme.colors.accent}10, ${props => props.theme.colors.primary}10);
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1rem;
`;

const PartnerName = styled.div`
  font-weight: 600;
  color: ${props => props.theme.colors.primary};
  margin-bottom: 0.5rem;
`;

const PartnerStats = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-top: 1rem;
`;

const StatItem = styled.div`
  text-align: center;
`;

const StatValue = styled.div`
  font-size: 1.2rem;
  font-weight: 700;
  color: ${props => props.theme.colors.accent};
`;

const StatLabel = styled.div`
  font-size: 0.8rem;
  color: ${props => props.theme.colors.text};
  opacity: 0.8;
`;

const DeveloperPage = () => {
  const theme = useTheme();

  const apiEndpoints = [
    {
      method: 'GET',
      url: '/api/v1/clients',
      description: 'Retrieve all clients'
    },
    {
      method: 'POST',
      url: '/api/v1/clients',
      description: 'Create a new client'
    },
    {
      method: 'GET',
      url: '/api/v1/analytics/metrics',
      description: 'Get analytics metrics'
    },
    {
      method: 'PUT',
      url: '/api/v1/campaigns/{id}',
      description: 'Update campaign settings'
    }
  ];

  const sdks = [
    {
      language: 'JavaScript',
      icon: '📦',
      description: 'Node.js and browser SDK for web applications',
      version: 'v2.1.0'
    },
    {
      language: 'Python',
      icon: '🐍',
      description: 'Python SDK for data analysis and automation',
      version: 'v1.8.2'
    },
    {
      language: 'PHP',
      icon: '🐘',
      description: 'PHP SDK for server-side integrations',
      version: 'v1.5.1'
    },
    {
      language: 'Go',
      icon: '🐹',
      description: 'Go SDK for high-performance applications',
      version: 'v1.2.0'
    }
  ];

  const partners = [
    {
      name: 'TechCorp Solutions',
      apiCalls: '1.2M',
      revenue: '$45K',
      status: 'Active'
    },
    {
      name: 'Digital Innovations',
      apiCalls: '890K',
      revenue: '$32K',
      status: 'Active'
    },
    {
      name: 'StartupXYZ',
      apiCalls: '456K',
      revenue: '$18K',
      status: 'Growing'
    }
  ];

  return (
    <PageContainer>
      <Container>
        <PageTitle>Developer Hub</PageTitle>
        
        <SectionGrid>
          <SectionCard>
            <SectionTitle>API Documentation</SectionTitle>
            <p style={{ color: theme.colors.text, opacity: 0.8, marginBottom: '1.5rem' }}>
              RESTful API endpoints for integrating with KimuntuX platform
            </p>
            
            {apiEndpoints.map((endpoint, index) => (
              <ApiEndpoint key={index}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <EndpointMethod method={endpoint.method}>{endpoint.method}</EndpointMethod>
                  <span style={{ color: theme.colors.text, fontWeight: '500' }}>{endpoint.description}</span>
                </div>
                <EndpointUrl>{endpoint.url}</EndpointUrl>
              </ApiEndpoint>
            ))}

            <div style={{ marginTop: '1.5rem' }}>
              <h4 style={{ color: theme.colors.primary, marginBottom: '1rem' }}>Example Usage</h4>
              <CodeBlock>
{`// Fetch all clients
const response = await fetch('/api/v1/clients', {
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  }
});
const clients = await response.json();`}
              </CodeBlock>
            </div>
          </SectionCard>

          <SectionCard>
            <SectionTitle>SDKs & Libraries</SectionTitle>
            <p style={{ color: theme.colors.text, opacity: 0.8, marginBottom: '1.5rem' }}>
              Official SDKs for popular programming languages
            </p>
            
            {sdks.map((sdk, index) => (
              <SdkCard key={index}>
                <SdkIcon>{sdk.icon}</SdkIcon>
                <SdkTitle>{sdk.language}</SdkTitle>
                <SdkDescription>{sdk.description}</SdkDescription>
                <div style={{ 
                  display: 'inline-block',
                  backgroundColor: theme.colors.primary + '20',
                  color: theme.colors.primary,
                  padding: '0.25rem 0.75rem',
                  borderRadius: '20px',
                  fontSize: '0.8rem',
                  fontWeight: '500',
                  marginBottom: '1rem'
                }}>
                  {sdk.version}
                </div>
                <button className="btn-primary">Download</button>
              </SdkCard>
            ))}
          </SectionCard>

          <SectionCard>
            <SectionTitle>Partner Analytics</SectionTitle>
            <p style={{ color: theme.colors.text, opacity: 0.8, marginBottom: '1.5rem' }}>
              Track API usage and performance metrics for your partners
            </p>
            
            {partners.map((partner, index) => (
              <PartnerCard key={index}>
                <PartnerName>{partner.name}</PartnerName>
                <div style={{ 
                  display: 'inline-block',
                  backgroundColor: partner.status === 'Active' ? '#00C89620' : '#DAA52020',
                  color: partner.status === 'Active' ? '#00C896' : '#DAA520',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '20px',
                  fontSize: '0.8rem',
                  fontWeight: '500',
                  marginBottom: '1rem'
                }}>
                  {partner.status}
                </div>
                <PartnerStats>
                  <StatItem>
                    <StatValue>{partner.apiCalls}</StatValue>
                    <StatLabel>API Calls</StatLabel>
                  </StatItem>
                  <StatItem>
                    <StatValue>{partner.revenue}</StatValue>
                    <StatLabel>Revenue</StatLabel>
                  </StatItem>
                </PartnerStats>
              </PartnerCard>
            ))}

            <div style={{ 
              background: 'linear-gradient(135deg, #00C89615, #DAA52015)', 
              border: `1px solid ${theme.colors.border}`, 
              borderRadius: '12px', 
              padding: '1.5rem',
              textAlign: 'center',
              marginTop: '1rem'
            }}>
              <h4 style={{ color: theme.colors.primary, marginBottom: '0.5rem' }}>
                🔗 Partner Portal
              </h4>
              <p style={{ color: theme.colors.text, opacity: 0.8, fontSize: '0.9rem', marginBottom: '1rem' }}>
                Access detailed analytics, API documentation, and support resources
              </p>
              <button className="btn-primary">Access Portal</button>
            </div>
          </SectionCard>
        </SectionGrid>
      </Container>
    </PageContainer>
  );
};

export default DeveloperPage;
