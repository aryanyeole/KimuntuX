import React, { useState } from 'react';
import styled from 'styled-components';
import { useTheme } from '../contexts/ThemeContext';
import { useUser } from '../contexts/UserContext';

const DashboardContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, ${props => props.theme?.colors?.background || '#FFFFFF'}, ${props => props.theme?.colors?.cardBackground || '#f8f9fa'});
  padding: 120px 2rem 2rem 2rem;
  
  @media (max-width: 768px) {
    padding-top: 100px;
  }
`;

const DashboardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding: 2rem;
  background: linear-gradient(135deg, ${props => props.theme?.colors?.primary || '#00C896'}10, ${props => props.theme?.colors?.accent || '#DAA520'}10);
  border-radius: 16px;
  border: 1px solid ${props => props.theme?.colors?.border || '#E5E5E5'};
`;

const HeaderLeft = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Branding = styled.div`
  h1 {
    font-size: 1.8rem;
    font-weight: 700;
    background: linear-gradient(135deg, ${props => props.theme?.colors?.primary || '#00C896'}, ${props => props.theme?.colors?.accent || '#DAA520'});
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin: 0;
    font-family: ${props => props.theme?.fonts?.title || 'Poppins, sans-serif'};
  }
  p {
    font-size: 1rem;
    color: ${props => props.theme?.colors?.text || '#111111'};
    opacity: 0.7;
    margin: 0;
    font-weight: 500;
  }
`;

const HeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 1.5rem;
  background: ${props => props.theme?.colors?.background || '#FFFFFF'};
  border: 1px solid ${props => props.theme?.colors?.border || '#E5E5E5'};
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  
  .welcome-text {
    font-size: 1.1rem;
    font-weight: 600;
    color: ${props => props.theme?.colors?.text || '#111111'};
  }
  
  .user-name {
    font-size: 1rem;
    font-weight: 500;
    background: linear-gradient(135deg, ${props => props.theme?.colors?.primary || '#00C896'}, ${props => props.theme?.colors?.accent || '#DAA520'});
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
`;

const DashboardContent = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  
  @media (max-width: 1200px) {
    grid-template-columns: 1fr;
  }
`;

const LeftPanel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const RightPanel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const Panel = styled.div`
  background: linear-gradient(135deg, ${props => props.theme?.colors?.background || '#FFFFFF'}, ${props => props.theme?.colors?.cardBackground || '#f8f9fa'});
  border: 1px solid ${props => props.theme?.colors?.border || '#E5E5E5'};
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.1);
  }
`;

const PanelTitle = styled.h3`
  font-size: 1.2rem;
  font-weight: 600;
  color: ${props => props.theme?.colors?.primary || '#00C896'};
  margin-bottom: 1rem;
  font-family: ${props => props.theme?.fonts?.title || 'Poppins, sans-serif'};
`;

const KPIGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
`;

const KPICard = styled.div`
  background: linear-gradient(135deg, ${props => props.theme?.colors?.primary || '#00C896'}10, ${props => props.theme?.colors?.accent || '#DAA520'}10);
  border-radius: 12px;
  padding: 1rem;
  text-align: center;
  
  .value {
    font-size: 1.5rem;
    font-weight: 700;
    color: ${props => props.theme?.colors?.primary || '#00C896'};
    margin-bottom: 0.25rem;
  }
  
  .label {
    font-size: 0.8rem;
    color: ${props => props.theme?.colors?.text || '#111111'};
    opacity: 0.7;
  }
`;

const AIInsight = styled.div`
  background: linear-gradient(135deg, ${props => props.theme?.colors?.accent || '#DAA520'}15, ${props => props.theme?.colors?.primary || '#00C896'}15);
  border-radius: 12px;
  padding: 1rem;
  margin-bottom: 1rem;
  
  .insight-title {
    font-weight: 600;
    color: ${props => props.theme?.colors?.accent || '#DAA520'};
    margin-bottom: 0.5rem;
  }
  
  .insight-text {
    font-size: 0.9rem;
    color: ${props => props.theme?.colors?.text || '#111111'};
    opacity: 0.8;
  }
`;

const FeatureGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
`;

const FeatureTile = styled.div`
  background: linear-gradient(135deg, ${props => props.theme?.colors?.background || '#FFFFFF'}, ${props => props.theme?.colors?.cardBackground || '#f8f9fa'});
  border: 1px solid ${props => props.theme?.colors?.border || '#E5E5E5'};
  border-radius: 12px;
  padding: 1.5rem;
  text-align: center;
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  cursor: pointer;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(135deg, ${props => props.theme?.colors?.primary || '#00C896'}, ${props => props.theme?.colors?.accent || '#DAA520'});
    transform: scaleX(0);
    transition: transform 0.3s ease;
  }
  
  &:hover {
    transform: translateY(-4px) scale(1.02);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
    border-color: ${props => props.theme?.colors?.primary || '#00C896'};
    
    &::before {
      transform: scaleX(1);
    }
  }
  
  .icon {
    font-size: 2rem;
    margin-bottom: 0.5rem;
  }
  
  .title {
    font-weight: 600;
    color: ${props => props.theme?.colors?.text || '#111111'};
    font-size: 0.9rem;
    margin-bottom: 0.25rem;
  }
  
  .status {
    font-size: 0.7rem;
    color: ${props => props.theme?.colors?.primary || '#00C896'};
    font-weight: 500;
  }
`;

const Footer = styled.div`
  margin-top: 3rem;
  padding: 2rem;
  background: linear-gradient(135deg, ${props => props.theme?.colors?.primary || '#00C896'}05, ${props => props.theme?.colors?.accent || '#DAA520'}05);
  border-radius: 16px;
  text-align: center;
  
  p {
    color: ${props => props.theme?.colors?.text || '#111111'};
    opacity: 0.7;
    font-size: 0.9rem;
  }
`;

const Dashboard = () => {
  const { user } = useUser();

  const features = [
    { icon: '🏪', title: 'AI Boutiques Builder', status: 'Active' },
    { icon: '🤖', title: 'AutoBuild AI', status: 'Active' },
    { icon: '📊', title: 'CRM Hub', status: 'Active' },
    { icon: '🌐', title: 'Digital Brokerage (B2B/B2C)', status: 'Active' },
    { icon: '🤝', title: 'Affiliate & Reseller Program', status: 'Active' },
    { icon: '📈', title: 'Funnel Builder', status: 'Active' },
    { icon: '📊', title: 'Campaign Analytics', status: 'Active' },
    { icon: '🎯', title: 'AI Campaign Optimization', status: 'Active' },
    { icon: '⛓️', title: 'Blockchain Commerce Layer', status: 'Active' },
    { icon: '💰', title: 'Fintech & Payment Layer', status: 'Active' },
    { icon: '🏦', title: 'Smart Fintech Hub', status: 'Active' },
    { icon: '📈', title: 'AI Stock Market Platform', status: 'Active' },
    { icon: '₿', title: 'AI Crypto Wallet', status: 'Active' },
    { icon: '🧠', title: 'Commerce Intelligence Engine', status: 'Active' },
    { icon: '🔧', title: 'Developer & Partner Ecosystem', status: 'Active' },
    { icon: '🔗', title: 'Blockchain Integration Model', status: 'Active' },
    { icon: '🤖', title: 'AI & Machine Learning Ecosystem', status: 'Active' },
    { icon: '🌍', title: 'Universal Smart Brokerage', status: 'Active' },
    { icon: '💎', title: 'Monetization Framework', status: 'Active' }
  ];

  const kpis = [
    { label: 'Revenue', value: '$45,230' },
    { label: 'ROI', value: '+23.5%' },
    { label: 'Campaigns', value: '12' },
    { label: 'Stock ROI', value: '+18.2%' },
    { label: 'Crypto Profits', value: '+31.7%' },
    { label: 'Active Users', value: '2,847' }
  ];

  const aiInsights = [
    { title: 'Buy Signal: BTC', text: 'Bitcoin showing strong upward momentum. Consider increasing position.' },
    { title: 'Top Broker Deal +12% ROI', text: 'New partnership opportunity with 12% projected ROI identified.' },
    { title: 'Market Alert', text: 'Ethereum showing bullish patterns. AI recommends monitoring.' }
  ];

  return (
    <DashboardContainer>
      <DashboardHeader>
        <HeaderLeft>
          <Branding>
            <h1>KimuntuX</h1>
            <p>The Intelligent Brokerage & Commerce Universe, B2B, B2C and Beyond</p>
          </Branding>
        </HeaderLeft>
        <HeaderRight>
          <UserInfo>
            <span className="welcome-text">Welcome back,</span>
            <span className="user-name">{user?.name || 'User'}</span>
          </UserInfo>
        </HeaderRight>
      </DashboardHeader>

      <DashboardContent>
        <LeftPanel>
          <Panel>
            <PanelTitle>KPI Summary</PanelTitle>
            <KPIGrid>
              {kpis.map((kpi, index) => (
                <KPICard key={index}>
                  <div className="value">{kpi.value}</div>
                  <div className="label">{kpi.label}</div>
                </KPICard>
              ))}
            </KPIGrid>
          </Panel>

          <Panel>
            <PanelTitle>AI Insights Widget</PanelTitle>
            {aiInsights.map((insight, index) => (
              <AIInsight key={index}>
                <div className="insight-title">{insight.title}</div>
                <div className="insight-text">{insight.text}</div>
              </AIInsight>
            ))}
          </Panel>

          <Panel>
            <PanelTitle>Live Performance Graph</PanelTitle>
            <div style={{ height: '200px', background: 'linear-gradient(135deg, #00C89620, #DAA52020)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>
              📊 Multi-layer Performance Chart<br />
              <small>eCommerce, Brokerage, Fintech</small>
            </div>
          </Panel>

          <Panel>
            <PanelTitle>Smart Notifications Feed</PanelTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ padding: '0.75rem', background: '#f0f9ff', borderRadius: '8px', fontSize: '0.9rem' }}>
                🔔 AI Alert: New high-value lead detected
              </div>
              <div style={{ padding: '0.75rem', background: '#f0fdf4', borderRadius: '8px', fontSize: '0.9rem' }}>
                💰 Fintech: Payment processed successfully
              </div>
              <div style={{ padding: '0.75rem', background: '#fefce8', borderRadius: '8px', fontSize: '0.9rem' }}>
                ⚡ System: Performance optimization completed
              </div>
            </div>
          </Panel>
        </LeftPanel>

        <RightPanel>
          <Panel>
            <PanelTitle>System Features</PanelTitle>
            <FeatureGrid>
              {features.map((feature, index) => (
                <FeatureTile key={index}>
                  <div className="icon">{feature.icon}</div>
                  <div className="title">{feature.title}</div>
                  <div className="status">{feature.status}</div>
                </FeatureTile>
              ))}
            </FeatureGrid>
          </Panel>
        </RightPanel>
      </DashboardContent>

      <Footer>
        <p>Company: Terms and Conditions</p>
      </Footer>
    </DashboardContainer>
  );
};

export default Dashboard;
