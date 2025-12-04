import React, { useState } from 'react';
import styled from 'styled-components';
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

const Page = styled.div`
  min-height: 100vh;
  background: #F9FAFB; /* bg-gray-50 */
  color: #111827; /* text-gray-900 */
  padding: 2rem 0;
`;

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
`;

const Header = styled.header`
  margin-bottom: 1rem;
`;

const Title = styled.h1`
  margin: 0 0 6px 0;
  font-size: 1.75rem;
`;

const Subtext = styled.p`
  margin: 0 0 18px 0;
  color: #6B7280;
`;

const KpiGrid = styled.div`
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(1, 1fr);
  margin-bottom: 16px;

  @media (min-width: 640px) { grid-template-columns: repeat(2, 1fr); }
  @media (min-width: 900px) { grid-template-columns: repeat(3, 1fr); }
  @media (min-width: 1200px) { grid-template-columns: repeat(6, 1fr); }
`;

const Row = styled.div`
  display: grid;
  gap: 12px;
  grid-template-columns: 1fr;
  margin-bottom: 16px;
  @media (min-width: 900px) { grid-template-columns: 2fr 1fr; }
`;

const PipelineArea = styled.div``;
const SideArea = styled.div``;

const TabsBar = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
`;

const Tab = styled.button`
  background: transparent;
  border: none;
  padding: 8px 12px;
  border-radius: 8px;
  color: ${props => props.active ? '#ffffff' : '#111827'};
  background: ${props => props.active ? '#059669' : 'transparent'};
`;

const TabPanel = styled.div`
  background: #FFFFFF;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  padding: 12px;
`;

export default function CRMMain() {
  const kpis = [
    { label: 'Leads Today', value: '128', delta: '+8%' },
    { label: 'MTD Leads', value: '3,420', delta: '+12%' },
    { label: 'Conversion Rate', value: '4.2%', delta: '+0.4%' },
    { label: 'CPL', value: '$6.30', delta: '-0.2%' },
    { label: 'ROI', value: '2.1x', delta: '+0.1x' },
    { label: 'Payouts Pending', value: '$2,480', delta: '' }
  ];

  const [activeTab, setActiveTab] = useState('Leads');

  return (
    <Page>
      <Container>
        <Header>
          <Title>AI-Powered CRM</Title>
          <Subtext>Automate, personalize, and predict customer success with smart AI-driven CRM tools</Subtext>
        </Header>

        <KpiGrid>
          {kpis.map(k => <KpiCard key={k.label} label={k.label} value={k.value} delta={k.delta} />)}
        </KpiGrid>

        <Row>
          <PipelineArea>
            <PipelineKanban />
          </PipelineArea>
          <SideArea>
            <TasksList />
            <div style={{ height: 12 }} />
            <AIInsights />
          </SideArea>
        </Row>

        <div>
          <TabsBar role="tablist" aria-label="CRM Tabs">
            {['Leads','Campaigns','Communication','Payouts','Reports','Settings'].map(t => (
              <Tab key={t} active={activeTab===t} onClick={() => setActiveTab(t)} aria-selected={activeTab===t} role="tab">{t}</Tab>
            ))}
          </TabsBar>

          <TabPanel>
            {activeTab === 'Leads' && <LeadsTable />}
            {activeTab === 'Campaigns' && <div><CampaignsSnapshot /></div>}
            {activeTab === 'Communication' && <CommunicationPlaceholder />}
            {activeTab === 'Payouts' && <PayoutsPanel />}
            {activeTab === 'Reports' && <ReportsGrid />}
            {activeTab === 'Settings' && <SettingsIntegrations />}
          </TabPanel>
        </div>
      </Container>
    </Page>
  );
}
