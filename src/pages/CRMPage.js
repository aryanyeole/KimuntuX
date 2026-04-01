import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

// ============================================================================
// CSS Variables
// ============================================================================

const CRMStyles = `
  :root {
    --crm-dark-bg: #0F172A;
    --crm-dark-panel: #1E293B;
    --crm-dark-text: #F1F5F9;
    --crm-dark-muted: #94A3B8;
    --crm-dark-border: #334155;
    --crm-light-bg: #F8FAFC;
    --crm-light-panel: #FFFFFF;
    --crm-light-text: #0F172A;
    --crm-light-muted: #64748B;
    --crm-light-border: #E2E8F0;
    --crm-accent: #00C896;
    --crm-indigo: #6366F1;
    --crm-red: #EF4444;
  }
`;

// ============================================================================
// Layout
// ============================================================================

const CRMContainer = styled.div`
  display: flex;
  min-height: calc(100vh - 80px);
  background: var(--crm-dark-bg);
  margin-top: -80px;
  padding-top: 80px;
  
  &.light-mode {
    background: var(--crm-light-bg);
  }
`;

// ============================================================================
// Sidebar
// ============================================================================

const Sidebar = styled.aside`
  width: ${props => props.collapsed ? '80px' : '240px'};
  background: rgba(30, 41, 59, 0.5);
  backdrop-filter: blur(20px);
  border-right: 1px solid rgba(51, 65, 85, 0.4);
  padding: 1.5rem 0;
  transition: width 0.3s ease;
  overflow-y: auto;
  flex-shrink: 0;
  
  &.light-mode {
    background: rgba(255, 255, 255, 0.5);
    border-right-color: rgba(226, 232, 240, 0.4);
  }

  @media (max-width: 768px) {
    display: none;
  }
`;

const SidebarItem = styled.button`
  width: 100%;
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: var(--crm-dark-muted);
  font-size: 13px;
  user-select: none;
  border: none;
  background: transparent;
  border-radius: 8px;
  margin: 0 0.5rem;

  &:hover {
    background: rgba(0, 200, 150, 0.1);
    color: var(--crm-accent);
  }

  ${props => props.active && `
    background: rgba(0, 200, 150, 0.15);
    color: var(--crm-accent);
    border-left: 3px solid var(--crm-accent);
    padding-left: calc(1rem - 3px);
  `}

  &.light-mode {
    color: var(--crm-light-muted);
  }
`;

const SidebarIcon = styled.span`
  font-size: 18px;
  flex-shrink: 0;
`;

const SidebarLabel = styled.span`
  ${props => props.collapsed && 'display: none;'}
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const SidebarSection = styled.div`
  padding: 0.5rem 0 1rem 0;
  border-top: 1px solid rgba(51, 65, 85, 0.2);
  margin-top: 1rem;
  
  &.light-mode {
    border-top-color: rgba(226, 232, 240, 0.2);
  }
`;

const SidebarSectionLabel = styled.div`
  padding: 0 1rem 0.75rem 1rem;
  color: var(--crm-dark-muted);
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  
  &.light-mode {
    color: var(--crm-light-muted);
  }

  ${props => props.collapsed && 'display: none;'}
`;

// ============================================================================
// Main Content
// ============================================================================

const MainContent = styled.main`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const TopBar = styled.div`
  height: 64px;
  background: rgba(30, 41, 59, 0.8);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(51, 65, 85, 0.4);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 2rem;
  z-index: 20;
  flex-shrink: 0;
  
  &.light-mode {
    background: rgba(255, 255, 255, 0.8);
    border-bottom-color: rgba(226, 232, 240, 0.4);
  }

  @media (max-width: 768px) {
    padding: 0 1rem;
  }
`;

const SearchBar = styled.div`
  flex: 1;
  max-width: 400px;
  position: relative;

  input {
    width: 100%;
    padding: 0.5rem 1rem 0.5rem 2.5rem;
    background: rgba(15, 23, 42, 0.4);
    border: 1px solid var(--crm-dark-border);
    border-radius: 8px;
    color: var(--crm-dark-text);
    font-size: 13px;
    
    &::placeholder {
      color: var(--crm-dark-muted);
    }
    
    &:focus {
      outline: none;
      border-color: var(--crm-accent);
      background: rgba(15, 23, 42, 0.6);
    }
  }

  &.light-mode input {
    background: rgba(248, 250, 252, 0.7);
    border-color: var(--crm-light-border);
    color: var(--crm-light-text);
    
    &::placeholder {
      color: var(--crm-light-muted);
    }
  }
`;

const SearchIcon = styled.span`
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--crm-dark-muted);
  font-size: 14px;
`;

const TopBarRight = styled.div`
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-left: 2rem;
`;

const IconButton = styled.button`
  background: none;
  border: none;
  color: var(--crm-dark-text);
  cursor: pointer;
  font-size: 18px;
  position: relative;
  transition: color 0.2s;
  padding: 0;

  &:hover {
    color: var(--crm-accent);
  }

  &.light-mode {
    color: var(--crm-light-text);
  }
`;

const BadgeIcon = styled.div`
  position: relative;

  .badge {
    position: absolute;
    top: -4px;
    right: -4px;
    width: 8px;
    height: 8px;
    background: var(--crm-red);
    border-radius: 50%;
    border: 2px solid rgba(30, 41, 59, 0.8);
  }
`;

const ThemeToggle = styled.button`
  background: none;
  border: none;
  color: var(--crm-dark-text);
  cursor: pointer;
  font-size: 18px;
  transition: color 0.2s;
  padding: 0;

  &:hover {
    color: var(--crm-accent);
  }

  &.light-mode {
    color: var(--crm-light-text);
  }
`;

const Avatar = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--crm-accent), var(--crm-indigo));
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
  position: relative;
  border: 2px solid rgba(51, 65, 85, 0.4);

  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    right: 0;
    width: 10px;
    height: 10px;
    background: #22C55E;
    border: 2px solid rgba(30, 41, 59, 0.8);
    border-radius: 50%;
  }
`;

const ContentArea = styled.div`
  flex: 1;
  padding: 2rem;
  overflow-y: auto;
  background: var(--crm-dark-bg);

  &.light-mode {
    background: var(--crm-light-bg);
  }

  @media (max-width: 768px) {
    padding: 1.5rem;
  }
`;

// ============================================================================
// Dashboard Components
// ============================================================================

const DashboardTitle = styled.h1`
  font-size: 28px;
  font-weight: 700;
  margin: 0 0 0.5rem 0;
  color: var(--crm-dark-text);
  
  &.light-mode {
    color: var(--crm-light-text);
  }
`;

const DashboardSubtitle = styled.p`
  color: var(--crm-dark-muted);
  margin: 0 0 2rem 0;
  font-size: 14px;
  
  &.light-mode {
    color: var(--crm-light-muted);
  }
`;

const KPIGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const KPICard = styled.div`
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(0, 200, 150, 0.05));
  border: 1px solid rgba(51, 65, 85, 0.4);
  border-radius: 14px;
  padding: 1.5rem;
  backdrop-filter: blur(8px);
  
  &.light-mode {
    background: linear-gradient(135deg, rgba(99, 102, 241, 0.05), rgba(0, 200, 150, 0.02));
    border-color: rgba(226, 232, 240, 0.5);
  }
`;

const KPILabel = styled.div`
  color: var(--crm-dark-muted);
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  margin-bottom: 0.5rem;
  letter-spacing: 0.5px;
  
  &.light-mode {
    color: var(--crm-light-muted);
  }
`;

const KPIValue = styled.div`
  font-size: 32px;
  font-weight: 700;
  color: var(--crm-accent);
  margin-bottom: 0.75rem;
`;

const KPIDelta = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 12px;
  color: ${props => props.positive ? '#22C55E' : 'var(--crm-red)'};
  margin-bottom: 0.75rem;
`;

const Sparkline = styled.svg`
  width: 100%;
  height: 30px;
`;

const ChartsGrid = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 1.5rem;
  margin-bottom: 2rem;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

const ChartCard = styled.div`
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.5), rgba(30, 41, 59, 0.3));
  border: 1px solid rgba(51, 65, 85, 0.4);
  border-radius: 14px;
  padding: 1.5rem;
  backdrop-filter: blur(8px);

  h3 {
    font-size: 14px;
    font-weight: 600;
    margin: 0 0 1.5rem 0;
    color: var(--crm-dark-text);
  }

  &.light-mode {
    background: linear-gradient(135deg, rgba(248, 250, 252, 0.7), rgba(248, 250, 252, 0.5));
    border-color: rgba(226, 232, 240, 0.5);

    h3 {
      color: var(--crm-light-text);
    }
  }
`;

const TableCard = styled.div`
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.5), rgba(30, 41, 59, 0.3));
  border: 1px solid rgba(51, 65, 85, 0.4);
  border-radius: 14px;
  padding: 1.5rem;
  backdrop-filter: blur(8px);
  margin-bottom: 2rem;

  h3 {
    font-size: 14px;
    font-weight: 600;
    margin: 0 0 1.5rem 0;
    color: var(--crm-dark-text);
  }

  &.light-mode {
    background: linear-gradient(135deg, rgba(248, 250, 252, 0.7), rgba(248, 250, 252, 0.5));
    border-color: rgba(226, 232, 240, 0.5);

    h3 {
      color: var(--crm-light-text);
    }
  }
`;

const LeadsTableWrapper = styled.div`
  overflow-x: auto;
`;

const LeadsTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
`;

const TableHeaderCell = styled.th`
  text-align: left;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid rgba(51, 65, 85, 0.2);
  color: var(--crm-dark-muted);
  font-weight: 600;
  font-size: 12px;
  text-transform: uppercase;

  &.light-mode {
    border-bottom-color: rgba(226, 232, 240, 0.3);
    color: var(--crm-light-muted);
  }
`;

const TableDataCell = styled.td`
  padding: 1rem;
  border-bottom: 1px solid rgba(51, 65, 85, 0.1);
  color: var(--crm-dark-text);

  &.light-mode {
    border-bottom-color: rgba(226, 232, 240, 0.2);
    color: var(--crm-light-text);
  }
`;

const LeadName = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;

  .avatar {
    width: 32px;
    height: 32px;
    border-radius: 6px;
    background: linear-gradient(135deg, var(--crm-indigo), var(--crm-accent));
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 12px;
    font-weight: 600;
  }
`;

const BadgeSmall = styled.span`
  display: inline-block;
  padding: 0.35rem 0.75rem;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  background: ${props => {
    switch (props.type) {
      case 'hot':
        return 'rgba(239, 68, 68, 0.15)';
      case 'warm':
        return 'rgba(245, 158, 11, 0.15)';
      case 'cold':
        return 'rgba(99, 102, 241, 0.15)';
      default:
        return 'rgba(148, 163, 184, 0.15)';
    }
  }};
  color: ${props => {
    switch (props.type) {
      case 'hot':
        return '#EF4444';
      case 'warm':
        return '#F59E0B';
      case 'cold':
        return '#6366F1';
      default:
        return '#94A3B8';
    }
  }};
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 2rem;
  color: var(--crm-dark-muted);

  &.light-mode {
    color: var(--crm-light-muted);
  }
`;

const PlaceholderView = styled.div`
  text-align: center;
  padding: 4rem 2rem;
  color: var(--crm-dark-muted);

  h2 {
    color: var(--crm-dark-text);
    margin-bottom: 0.5rem;
  }

  &.light-mode {
    color: var(--crm-light-muted);

    h2 {
      color: var(--crm-light-text);
    }
  }
`;

// ============================================================================
// Component
// ============================================================================

const CRMPage = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [activeView, setActiveView] = useState('dashboard');
  const [dashboardData, setDashboardData] = useState(null);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = CRMStyles;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const summaryRes = await fetch('http://localhost:5000/api/dashboard/summary');
        if (!summaryRes.ok) throw new Error('Failed to fetch dashboard data');
        const summaryData = await summaryRes.json();
        setDashboardData(summaryData);

        const leadsRes = await fetch('http://localhost:5000/api/leads');
        if (!leadsRes.ok) throw new Error('Failed to fetch leads');
        const leadsData = await leadsRes.json();
        setLeads(Array.isArray(leadsData) ? leadsData : []);
      } catch (err) {
        console.error('Error fetching CRM data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const generateSparkline = (baseValue) => {
    const data = [];
    for (let i = 0; i < 7; i++) {
      const variance = (Math.random() - 0.5) * baseValue * 0.2;
      data.push(Math.max(0, baseValue + variance));
    }
    return data;
  };

  const SparklineSVG = ({ data }) => {
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    const points = data
      .map((v, i) => {
        const x = (i / (data.length - 1)) * 100;
        const y = 100 - ((v - min) / range) * 80 - 10;
        return `${x},${y}`;
      })
      .join(' ');

    return (
      <Sparkline viewBox="0 0 100 40" preserveAspectRatio="none">
        <defs>
          <linearGradient id="sparkGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--crm-accent)" stopOpacity="1" />
            <stop offset="100%" stopColor="var(--crm-indigo)" stopOpacity="1" />
          </linearGradient>
        </defs>
        <polyline
          points={points}
          fill="none"
          stroke="url(#sparkGrad)"
          strokeWidth="1.5"
          vectorEffect="non-scaling-stroke"
        />
      </Sparkline>
    );
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'leads', label: 'Leads', icon: '👥' },
    { id: 'pipeline', label: 'Pipeline', icon: '📈' },
    { id: 'campaigns', label: 'Campaigns', icon: '🎯' },
    { id: 'funnels', label: 'Funnels', icon: '🔗' },
    { id: 'ai', label: 'AI Optimization', icon: '⚡' },
  ];

  const modeClass = isDarkMode ? '' : 'light-mode';

  return (
    <CRMContainer className={modeClass}>
      <style>{`
        * { color-scheme: ${isDarkMode ? 'dark' : 'light'}; }
      `}</style>

      {/* Sidebar */}
      <Sidebar collapsed={sidebarCollapsed} className={modeClass}>
        <SidebarItem onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>
          <SidebarIcon>{sidebarCollapsed ? '▶' : '◀'}</SidebarIcon>
          <SidebarLabel collapsed={sidebarCollapsed}>Toggle</SidebarLabel>
        </SidebarItem>

        <SidebarSection></SidebarSection>

        <SidebarSectionLabel collapsed={sidebarCollapsed}>Main</SidebarSectionLabel>
        {navItems.map(item => (
          <SidebarItem
            key={item.id}
            active={activeView === item.id}
            onClick={() => setActiveView(item.id)}
          >
            <SidebarIcon>{item.icon}</SidebarIcon>
            <SidebarLabel collapsed={sidebarCollapsed}>{item.label}</SidebarLabel>
          </SidebarItem>
        ))}

        <SidebarSection></SidebarSection>

        <SidebarSectionLabel collapsed={sidebarCollapsed}>Tools</SidebarSectionLabel>
        <SidebarItem
          active={activeView === 'settings'}
          onClick={() => setActiveView('settings')}
        >
          <SidebarIcon>⚙️</SidebarIcon>
          <SidebarLabel collapsed={sidebarCollapsed}>Settings</SidebarLabel>
        </SidebarItem>
      </Sidebar>

      {/* Main Content */}
      <MainContent>
        {/* CRM Top Bar */}
        <TopBar className={modeClass}>
          <SearchBar>
            <SearchIcon>🔍</SearchIcon>
            <input type="text" placeholder="Search leads, companies, campaigns..." />
          </SearchBar>

          <TopBarRight>
            <BadgeIcon>
              <IconButton>🔔</IconButton>
              <div className="badge"></div>
            </BadgeIcon>

            <ThemeToggle onClick={() => setIsDarkMode(!isDarkMode)}>
              {isDarkMode ? '☀️' : '🌙'}
            </ThemeToggle>

            <Avatar>A</Avatar>
          </TopBarRight>
        </TopBar>

        {/* Dashboard Content */}
        <ContentArea className={modeClass}>
          {activeView === 'dashboard' && (
            <>
              <DashboardTitle>Dashboard</DashboardTitle>
              <DashboardSubtitle>Real-time insights and lead management</DashboardSubtitle>

              {error && (
                <div style={{ color: 'var(--crm-red)', marginBottom: '2rem' }}>
                  ⚠️ {error}
                </div>
              )}

              {loading ? (
                <EmptyState>Loading dashboard data...</EmptyState>
              ) : (
                <>
                  {/* KPI Cards */}
                  {dashboardData && (
                    <KPIGrid>
                      <KPICard className={modeClass}>
                        <KPILabel>Total Leads</KPILabel>
                        <KPIValue>{dashboardData.totalLeads || 0}</KPIValue>
                        <KPIDelta positive>↗ +12% from last week</KPIDelta>
                        <SparklineSVG data={generateSparkline(dashboardData.totalLeads || 50)} />
                      </KPICard>

                      <KPICard className={modeClass}>
                        <KPILabel>Hot Leads</KPILabel>
                        <KPIValue>{dashboardData.hotLeads || 0}</KPIValue>
                        <KPIDelta positive>↗ +8% from last week</KPIDelta>
                        <SparklineSVG data={generateSparkline(dashboardData.hotLeads || 15)} />
                      </KPICard>

                      <KPICard className={modeClass}>
                        <KPILabel>Warm Leads</KPILabel>
                        <KPIValue>{dashboardData.warmLeads || 0}</KPIValue>
                        <KPIDelta positive>↗ +5% from last week</KPIDelta>
                        <SparklineSVG data={generateSparkline(dashboardData.warmLeads || 20)} />
                      </KPICard>

                      <KPICard className={modeClass}>
                        <KPILabel>Activities</KPILabel>
                        <KPIValue>{dashboardData.recentActivities || 0}</KPIValue>
                        <KPIDelta positive>↗ +3% from last week</KPIDelta>
                        <SparklineSVG data={generateSparkline(dashboardData.recentActivities || 25)} />
                      </KPICard>
                    </KPIGrid>
                  )}

                  {/* Charts */}
                  <ChartsGrid>
                    <ChartCard className={modeClass}>
                      <h3>Campaign Performance</h3>
                      <svg viewBox="0 0 400 180" style={{ width: '100%', height: '140px' }}>
                        <defs>
                          <linearGradient id="perfGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="var(--crm-accent)" stopOpacity="0.3" />
                            <stop offset="100%" stopColor="var(--crm-accent)" stopOpacity="0" />
                          </linearGradient>
                        </defs>
                        <polyline
                          points="20,130 70,80 120,60 170,75 220,40 270,55 320,25 370,35"
                          fill="none"
                          stroke="var(--crm-accent)"
                          strokeWidth="2"
                        />
                        <polygon
                          points="20,130 70,80 120,60 170,75 220,40 270,55 320,25 370,35 370,180 20,180"
                          fill="url(#perfGrad)"
                        />
                      </svg>
                    </ChartCard>

                    <ChartCard className={modeClass}>
                      <h3>Traffic Breakdown</h3>
                      <svg viewBox="0 0 200 200" style={{ width: '100%', height: '140px', margin: '0 auto', display: 'block' }}>
                        <circle cx="100" cy="100" r="70" fill="none" stroke="var(--crm-accent)" strokeWidth="15" strokeDasharray="165 440" />
                        <circle cx="100" cy="100" r="70" fill="none" stroke="var(--crm-indigo)" strokeWidth="15" strokeDasharray="132 440" strokeDashoffset="-165" />
                        <circle cx="100" cy="100" r="70" fill="none" stroke="#3B82F6" strokeWidth="15" strokeDasharray="110 440" strokeDashoffset="-297" />
                        <text x="100" y="105" textAnchor="middle" fontSize="14" fontWeight="700" fill="var(--crm-dark-text)">
                          100%
                        </text>
                      </svg>
                    </ChartCard>
                  </ChartsGrid>

                  {/* Leads Table */}
                  <TableCard className={modeClass}>
                    <h3>Recent Leads</h3>
                    {leads.length > 0 ? (
                      <LeadsTableWrapper>
                        <LeadsTable>
                          <thead>
                            <tr>
                              <TableHeaderCell>Lead</TableHeaderCell>
                              <TableHeaderCell>Company</TableHeaderCell>
                              <TableHeaderCell>Score</TableHeaderCell>
                            </tr>
                          </thead>
                          <tbody>
                            {leads.slice(0, 10).map((lead, i) => (
                              <tr key={lead.id || i}>
                                <TableDataCell>
                                  <LeadName>
                                    <div className="avatar">
                                      {lead.name
                                        .split(' ')
                                        .map(n => n[0])
                                        .join('')
                                        .toUpperCase()}
                                    </div>
                                    <div>{lead.name}</div>
                                  </LeadName>
                                </TableDataCell>
                                <TableDataCell>{lead.company || 'N/A'}</TableDataCell>
                                <TableDataCell>
                                  <BadgeSmall type={lead.score?.toLowerCase()}>
                                    {lead.score || 'COLD'}
                                  </BadgeSmall>
                                </TableDataCell>
                              </tr>
                            ))}
                          </tbody>
                        </LeadsTable>
                      </LeadsTableWrapper>
                    ) : (
                      <EmptyState>No leads yet</EmptyState>
                    )}
                  </TableCard>
                </>
              )}
            </>
          )}

          {/* Placeholder Views */}
          {activeView !== 'dashboard' && (
            <PlaceholderView>
              <h2>{navItems.find(i => i.id === activeView)?.label || 'Settings'}</h2>
              <p>Coming soon...</p>
            </PlaceholderView>
          )}
        </ContentArea>
      </MainContent>
    </CRMContainer>
  );
};

export default CRMPage;
