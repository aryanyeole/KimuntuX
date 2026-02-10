import React, { useState } from 'react';
import styled from 'styled-components';
import { useTheme } from '../contexts/ThemeContext';
import KpiCard from '../components/KpiCard';
import PipelineKanban from '../components/PipelineKanban';
import TasksList from '../components/TasksList';
import AIInsights from '../components/AIInsights';
import LeadsTable from '../components/LeadsTable';
import CampaignsSnapshot from '../components/CampaignsSnapshot';
import CommunicationPlaceholder from '../components/CommunicationPlaceholder';
import PayoutsPanel from '../components/PayoutsPanel';
import ReportsGrid from '../components/ReportsGrid';
import SettingsIntegrations from '../components/SettingsIntegrations';

// Main page wrapper with gradient background
const Page = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 50%, #f0fdfa 100%);
  color: #111827;
  display: flex;
  padding-top: 0;
  margin-top: 0;
  
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

// Left sidebar navigation
const Sidebar = styled.aside`
  width: ${props => props.collapsed ? '70px' : '240px'};
  background: #ffffff;
  border-right: 1px solid #e5e7eb;
  height: 100vh;
  position: sticky;
  top: 0;
  transition: width 0.3s ease;
  display: flex;
  flex-direction: column;
  box-shadow: 2px 0 8px rgba(0,0,0,0.04);
  
  @media (max-width: 768px) {
    width: 100%;
    height: auto;
    position: relative;
    top: 0;
    border-right: none;
    border-bottom: 1px solid #e5e7eb;
  }
`;

const SidebarHeader = styled.div`
  padding: 1.25rem;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const SidebarTitle = styled.h2`
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
  display: ${props => props.collapsed ? 'none' : 'block'};
`;

const CollapseButton = styled.button`
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  color: #6b7280;
  transition: all 0.2s ease;
  
  &:hover {
    background: #f3f4f6;
    color: #111827;
  }
  
  @media (max-width: 768px) {
    display: none;
  }
`;

const NavList = styled.nav`
  padding: 1rem 0;
  flex: 1;
  overflow-y: auto;
`;

const NavItem = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1.25rem;
  background: ${props => props.active ? '#00C89610' : 'transparent'};
  border: none;
  border-left: 3px solid ${props => props.active ? '#00C896' : 'transparent'};
  color: ${props => props.active ? '#00C896' : '#6b7280'};
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
  
  &:hover {
    background: #f9fafb;
    color: #111827;
  }
  
  span {
    display: ${props => props.collapsed ? 'none' : 'inline'};
  }
`;

const NavIcon = styled.span`
  font-size: 1.25rem;
  min-width: 24px;
`;

// Main content area
const MainContent = styled.div`
  flex: 1;
  overflow-y: auto;
  height: 100vh;
  
  @media (max-width: 768px) {
    height: auto;
  }
`;

// Top header bar inside CRM
const TopBar = styled.header`
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid #e5e7eb;
  padding: 1rem 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  
  @media (max-width: 768px) {
    flex-wrap: wrap;
    padding: 1rem;
  }
`;

const TopBarLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 2rem;
  flex: 1;
  
  @media (max-width: 768px) {
    width: 100%;
    flex-wrap: wrap;
  }
`;

const PageTitle = styled.h1`
  font-size: 1.5rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
`;

const TopBarTabs = styled.div`
  display: flex;
  gap: 0.5rem;
  
  @media (max-width: 768px) {
    overflow-x: auto;
    width: 100%;
  }
`;

const TopBarTab = styled.button`
  background: ${props => props.active ? '#00C896' : 'transparent'};
  color: ${props => props.active ? '#ffffff' : '#6b7280'};
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  
  &:hover {
    background: ${props => props.active ? '#00B085' : '#f3f4f6'};
    color: ${props => props.active ? '#ffffff' : '#111827'};
  }
`;

const TopBarRight = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const SearchBox = styled.div`
  display: flex;
  align-items: center;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 0.5rem 1rem;
  gap: 0.5rem;
  min-width: 200px;
  
  input {
    border: none;
    background: transparent;
    outline: none;
    font-size: 0.9rem;
    flex: 1;
    color: #111827;
    
    &::placeholder {
      color: #9ca3af;
    }
  }
  
  @media (max-width: 768px) {
    min-width: 150px;
  }
`;

const IconButton = styled.button`
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 0.5rem;
  cursor: pointer;
  color: #6b7280;
  font-size: 1.25rem;
  transition: all 0.2s ease;
  
  &:hover {
    background: #f3f4f6;
    color: #111827;
  }
`;

// Workspace content
const Workspace = styled.div`
  padding: 1.5rem 2rem;
  
  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const KpiGrid = styled.div`
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  margin-bottom: 1.5rem;
`;

const WorkspaceGrid = styled.div`
  display: grid;
  gap: 1.5rem;
  grid-template-columns: 1fr;
  margin-bottom: 1.5rem;
  
  @media (min-width: 1024px) {
    grid-template-columns: 2.5fr 1fr;
  }
`;

const KanbanSection = styled.div`
  background: #ffffff;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  border: 1px solid #e5e7eb;
`;

const SideWidgets = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const WidgetCard = styled.div`
  background: #ffffff;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  border: 1px solid #e5e7eb;
`;

const TabContent = styled.div`
  background: #ffffff;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  border: 1px solid #e5e7eb;
  margin-top: 1.5rem;
`;

export default function CRMMain() {
  const theme = useTheme();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeSection, setActiveSection] = useState('crm');
  const [activeTopTab, setActiveTopTab] = useState('Pipeline');
  const [activeContentTab, setActiveContentTab] = useState('Leads');

  const kpis = [
    { label: 'Leads Today', value: '128', delta: '+8%' },
    { label: 'MTD Leads', value: '3,420', delta: '+12%' },
    { label: 'Conversion Rate', value: '4.2%', delta: '+0.4%' },
    { label: 'CPL', value: '$6.30', delta: '-0.2%' },
    { label: 'ROI', value: '2.1x', delta: '+0.1x' },
    { label: 'Payouts Pending', value: '$2,480', delta: '' }
  ];

  const sidebarItems = [
    { id: 'crm', label: 'CRM', icon: '👥' },
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'campaigns', label: 'Campaigns', icon: '📢' },
    { id: 'analytics', label: 'Analytics', icon: '📈' },
    { id: 'settings', label: 'Settings', icon: '⚙️' }
  ];

  return (
    <Page>
      {/* Left Sidebar */}
      <Sidebar collapsed={sidebarCollapsed}>
        <SidebarHeader>
          <SidebarTitle collapsed={sidebarCollapsed}>Navigation</SidebarTitle>
          <CollapseButton onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>
            {sidebarCollapsed ? '→' : '←'}
          </CollapseButton>
        </SidebarHeader>
        <NavList>
          {sidebarItems.map(item => (
            <NavItem
              key={item.id}
              active={activeSection === item.id}
              collapsed={sidebarCollapsed}
              onClick={() => setActiveSection(item.id)}
            >
              <NavIcon>{item.icon}</NavIcon>
              <span>{item.label}</span>
            </NavItem>
          ))}
        </NavList>
      </Sidebar>

      {/* Main Content */}
      <MainContent>
        {/* Top Bar */}
        <TopBar>
          <TopBarLeft>
            <PageTitle>Deals Pipeline</PageTitle>
            <TopBarTabs>
              {['Pipeline', 'Contacts', 'Campaigns', 'Reports'].map(tab => (
                <TopBarTab
                  key={tab}
                  active={activeTopTab === tab}
                  onClick={() => setActiveTopTab(tab)}
                >
                  {tab}
                </TopBarTab>
              ))}
            </TopBarTabs>
          </TopBarLeft>
          <TopBarRight>
            <SearchBox>
              <span>🔍</span>
              <input type="text" placeholder="Search deals, contacts..." />
            </SearchBox>
            <IconButton title="Filter">⚡</IconButton>
            <IconButton title="Settings">⚙️</IconButton>
          </TopBarRight>
        </TopBar>

        {/* Workspace */}
        <Workspace>
          {/* KPI Cards */}
          <KpiGrid>
            {kpis.map(k => (
              <KpiCard key={k.label} label={k.label} value={k.value} delta={k.delta} />
            ))}
          </KpiGrid>

          {/* Main Kanban + Side Widgets */}
          <WorkspaceGrid>
            <KanbanSection>
              <PipelineKanban />
            </KanbanSection>
            <SideWidgets>
              <WidgetCard>
                <TasksList />
              </WidgetCard>
              <WidgetCard>
                <AIInsights />
              </WidgetCard>
            </SideWidgets>
          </WorkspaceGrid>

          {/* Tab Content Area */}
          <TabContent>
            <TopBarTabs style={{ marginBottom: '1rem' }}>
              {['Leads', 'Campaigns', 'Communication', 'Payouts', 'Reports', 'Settings'].map(tab => (
                <TopBarTab
                  key={tab}
                  active={activeContentTab === tab}
                  onClick={() => setActiveContentTab(tab)}
                >
                  {tab}
                </TopBarTab>
              ))}
            </TopBarTabs>
            {activeContentTab === 'Leads' && <LeadsTable />}
            {activeContentTab === 'Campaigns' && <CampaignsSnapshot />}
            {activeContentTab === 'Communication' && <CommunicationPlaceholder />}
            {activeContentTab === 'Payouts' && <PayoutsPanel />}
            {activeContentTab === 'Reports' && <ReportsGrid />}
            {activeContentTab === 'Settings' && <SettingsIntegrations />}
          </TabContent>
        </Workspace>
      </MainContent>
    </Page>
  );
}
