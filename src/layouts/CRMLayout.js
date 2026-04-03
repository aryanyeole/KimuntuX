import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { useUser } from '../contexts/UserContext';

// ── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  bg: '#060d1b',
  surface: '#0c1527',
  card: '#121e34',
  border: '#1a2d4d',
  text: '#e4eaf4',
  muted: '#6b7fa3',
  accent: '#2d7aff',
  accentHover: '#4d93ff',
  danger: '#ef4444',
  green: '#22c55e',
};

// ── Root shell ────────────────────────────────────────────────────────────────
const Shell = styled.div`
  display: flex;
  height: 100vh;
  overflow: hidden;
  background: ${C.bg};
  color: ${C.text};
  font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
`;

// ── Sidebar ───────────────────────────────────────────────────────────────────
const Sidebar = styled.aside`
  width: ${({ $collapsed }) => ($collapsed ? '64px' : '215px')};
  min-width: ${({ $collapsed }) => ($collapsed ? '64px' : '215px')};
  background: ${C.surface};
  border-right: 1px solid ${C.border};
  display: flex;
  flex-direction: column;
  transition: width 0.2s ease, min-width 0.2s ease;
  overflow: hidden;
  z-index: 10;
`;

const LogoRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: ${({ $collapsed }) => ($collapsed ? 'center' : 'space-between')};
  padding: ${({ $collapsed }) => ($collapsed ? '18px 0' : '18px 16px')};
  border-bottom: 1px solid ${C.border};
  min-height: 64px;
`;

const LogoMark = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  overflow: hidden;
`;

const LogoBox = styled.div`
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  background: ${C.accent};
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 14px;
  color: #fff;
  letter-spacing: -0.5px;
`;

const LogoText = styled.span`
  font-weight: 700;
  font-size: 15px;
  color: ${C.text};
  white-space: nowrap;
  opacity: ${({ $collapsed }) => ($collapsed ? 0 : 1)};
  width: ${({ $collapsed }) => ($collapsed ? 0 : 'auto')};
  transition: opacity 0.15s ease;
`;

const CollapseBtn = styled.button`
  background: none;
  border: none;
  padding: 4px;
  color: ${C.muted};
  cursor: pointer;
  border-radius: 4px;
  display: flex;
  align-items: center;
  flex-shrink: 0;
  &:hover { color: ${C.text}; background: ${C.card}; }
`;

const Nav = styled.nav`
  flex: 1;
  padding: 12px 8px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow-y: auto;
  overflow-x: hidden;
`;

const NavItem = styled(NavLink)`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: ${({ $collapsed }) => ($collapsed ? '10px 0' : '10px 12px')};
  justify-content: ${({ $collapsed }) => ($collapsed ? 'center' : 'flex-start')};
  border-radius: 8px;
  text-decoration: none;
  color: ${C.muted};
  font-size: 13.5px;
  font-weight: 500;
  transition: background 0.15s, color 0.15s;
  white-space: nowrap;

  &:hover {
    background: ${C.card};
    color: ${C.text};
  }
  &.active {
    background: ${C.card};
    color: ${C.accent};
    box-shadow: inset 3px 0 0 ${C.accent};
  }
`;

const NavLabel = styled.span`
  opacity: ${({ $collapsed }) => ($collapsed ? 0 : 1)};
  width: ${({ $collapsed }) => ($collapsed ? 0 : 'auto')};
  overflow: hidden;
  transition: opacity 0.15s ease;
`;

const NavIcon = styled.span`
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const SidebarBottom = styled.div`
  padding: ${({ $collapsed }) => ($collapsed ? '12px 0' : '12px 16px')};
  border-top: 1px solid ${C.border};
  display: flex;
  align-items: center;
  gap: 10px;
  justify-content: ${({ $collapsed }) => ($collapsed ? 'center' : 'flex-start')};
  overflow: hidden;
`;

const Avatar = styled.div`
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: ${C.accent};
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 13px;
  color: #fff;
`;

const UserInfo = styled.div`
  overflow: hidden;
  opacity: ${({ $collapsed }) => ($collapsed ? 0 : 1)};
  width: ${({ $collapsed }) => ($collapsed ? 0 : 'auto')};
  transition: opacity 0.15s ease;
`;

const UserName = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: ${C.text};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const UserRole = styled.div`
  font-size: 11px;
  color: ${C.muted};
`;

// ── Right side: topbar + content ─────────────────────────────────────────────
const RightPane = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const TopBar = styled.header`
  height: 64px;
  min-height: 64px;
  background: ${C.surface};
  border-bottom: 1px solid ${C.border};
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 0 24px;
`;

const PageTitle = styled.h1`
  font-size: 16px;
  font-weight: 700;
  color: ${C.text};
  margin: 0;
  white-space: nowrap;
`;

const Spacer = styled.div`flex: 1;`;

const SearchBox = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  background: ${C.card};
  border: 1px solid ${C.border};
  border-radius: 8px;
  padding: 6px 12px;
  width: 220px;
`;

const SearchInput = styled.input`
  background: none;
  border: none;
  outline: none;
  color: ${C.text};
  font-size: 13px;
  width: 100%;
  &::placeholder { color: ${C.muted}; }
`;

const IconBtn = styled.button`
  background: ${C.card};
  border: 1px solid ${C.border};
  border-radius: 8px;
  padding: 7px;
  color: ${C.muted};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  &:hover { color: ${C.text}; border-color: ${C.muted}; }
`;

const NewLeadBtn = styled.button`
  background: ${C.accent};
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
  &:hover { background: ${C.accentHover}; }
`;

const Content = styled.main`
  flex: 1;
  overflow-y: auto;
  background: ${C.bg};
`;

// ── SVG Icons ─────────────────────────────────────────────────────────────────
const icons = {
  dashboard: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
    </svg>
  ),
  offers: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/>
      <circle cx="7" cy="7" r="1.5" fill="currentColor" stroke="none"/>
    </svg>
  ),
  campaigns: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
      <path d="M19.07 4.93a10 10 0 010 14.14"/>
      <path d="M15.54 8.46a5 5 0 010 7.07"/>
    </svg>
  ),
  leads: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
    </svg>
  ),
  pipeline: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="4" height="18" rx="1"/>
      <rect x="10" y="7" width="4" height="14" rx="1"/>
      <rect x="17" y="11" width="4" height="10" rx="1"/>
    </svg>
  ),
  messages: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
    </svg>
  ),
  analytics: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/>
    </svg>
  ),
  settings: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
    </svg>
  ),
  search: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  ),
  bell: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 01-3.46 0"/>
    </svg>
  ),
  plus: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  ),
  chevronLeft: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6"/>
    </svg>
  ),
  chevronRight: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  ),
};

// ── Nav config ────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { label: 'Dashboard',  to: '/crm/dashboard',     icon: 'dashboard'  },
  { label: 'Offers',     to: '/crm/offers',         icon: 'offers'     },
  { label: 'Campaigns',  to: '/crm/campaigns',      icon: 'campaigns'  },
  { label: 'Leads',      to: '/crm/leads',          icon: 'leads'      },
  { label: 'Pipeline',   to: '/crm/pipeline',       icon: 'pipeline'   },
  { label: 'Messages',   to: '/crm/communication',  icon: 'messages'   },
  { label: 'Analytics',  to: '/crm/analytics',      icon: 'analytics'  },
  { label: 'Settings',   to: '/crm/settings',       icon: 'settings'   },
];

// Map path segment to display title shown in the TopBar
const PATH_TITLES = {
  dashboard:     'Dashboard',
  offers:        'Offer Discovery',
  campaigns:     'Campaigns',
  leads:         'Leads',
  pipeline:      'Pipeline',
  communication: 'Messages',
  analytics:     'Analytics',
  settings:      'Settings',
};

// ── Component ─────────────────────────────────────────────────────────────────
export default function CRMLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const { user } = useUser();
  const navigate = useNavigate();
  const location = useLocation();

  // Derive the section title from the current path segment
  const segment = location.pathname.split('/')[2] || 'dashboard';
  const pageTitle = PATH_TITLES[segment] || 'CRM';

  // Derive initials for the avatar
  const initials = user?.full_name
    ? user.full_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  return (
    <Shell>
      {/* ── Sidebar ── */}
      <Sidebar $collapsed={collapsed}>
        <LogoRow $collapsed={collapsed}>
          <LogoMark>
            <LogoBox>KX</LogoBox>
            <LogoText $collapsed={collapsed}>KimuX</LogoText>
          </LogoMark>
          {!collapsed && (
            <CollapseBtn onClick={() => setCollapsed(true)} title="Collapse sidebar">
              {icons.chevronLeft}
            </CollapseBtn>
          )}
        </LogoRow>

        {collapsed && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0' }}>
            <CollapseBtn onClick={() => setCollapsed(false)} title="Expand sidebar">
              {icons.chevronRight}
            </CollapseBtn>
          </div>
        )}

        <Nav>
          {NAV_ITEMS.map(({ label, to, icon }) => (
            <NavItem key={to} to={to} $collapsed={collapsed} title={collapsed ? label : undefined}>
              <NavIcon>{icons[icon]}</NavIcon>
              <NavLabel $collapsed={collapsed}>{label}</NavLabel>
            </NavItem>
          ))}
        </Nav>

        <SidebarBottom $collapsed={collapsed}>
          <Avatar title={user?.full_name || 'User'}>{initials}</Avatar>
          <UserInfo $collapsed={collapsed}>
            <UserName>{user?.full_name || 'User'}</UserName>
            <UserRole>{user?.email || ''}</UserRole>
          </UserInfo>
        </SidebarBottom>
      </Sidebar>

      {/* ── Right pane ── */}
      <RightPane>
        <TopBar>
          <PageTitle>{pageTitle}</PageTitle>
          <Spacer />
          <SearchBox>
            {icons.search}
            <SearchInput placeholder="Search leads, campaigns…" />
          </SearchBox>
          <IconBtn title="Notifications">{icons.bell}</IconBtn>
          <NewLeadBtn onClick={() => navigate('/crm/leads')}>
            {icons.plus} New Lead
          </NewLeadBtn>
        </TopBar>

        <Content>
          <Outlet />
        </Content>
      </RightPane>
    </Shell>
  );
}
