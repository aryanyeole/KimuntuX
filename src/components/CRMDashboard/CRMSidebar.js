import React from 'react';
import styled from 'styled-components';
import { Link, useLocation } from 'react-router-dom';

const SidebarWrapper = styled.div`
  width: 260px;
  background: ${props => props.theme.colors.cardBackground};
  border-right: 1px solid ${props => props.theme.colors.border};
  display: flex;
  flex-direction: column;
  padding: 0;
  position: sticky;
  top: 80px;
  max-height: calc(100vh - 80px);
  overflow-y: auto;

  @media (max-width: 768px) {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid ${props => props.theme.colors.border};
    margin-bottom: 1.5rem;
    position: relative;
    top: 0;
    max-height: none;
  }
`;

const SidebarSection = styled.div`
  padding: 1rem 0;
  border-bottom: 1px solid ${props => props.theme.colors.border};

  &:last-child {
    border-bottom: none;
  }
`;

const SectionTitle = styled.h4`
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: ${props => props.theme.colors.text};
  opacity: 0.5;
  margin: 0;
  padding: 0.5rem 1rem;
`;

const NavList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
`;

const NavItemWrapper = styled.li``;

const NavLink = styled(Link)`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  color: ${props => props.active ? props.theme.colors.primary : props.theme.colors.text};
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: ${props => props.active ? 600 : 500};
  border-left: 3px solid ${props => props.active ? props.theme.colors.primary : 'transparent'};
  background: ${props => props.active ? `${props.theme.colors.primary}10` : 'transparent'};
  transition: all 0.2s ease;
  cursor: pointer;

  &:hover {
    background: ${props => props.theme.colors.primary}08;
    border-left-color: ${props => props.theme.colors.primary};
  }
`;

const NavIcon = styled.span`
  font-size: 1.1rem;
  width: 20px;
  text-align: center;
`;

const NavLabel = styled.span``;

const ComingSoonBadge = styled.span`
  font-size: 0.65rem;
  font-weight: 700;
  background: ${props => props.theme.colors.accent}40;
  color: ${props => props.theme.colors.accent};
  padding: 2px 6px;
  border-radius: 3px;
  margin-left: auto;
  text-transform: uppercase;
`;

export default function CRMSidebar() {
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const mainNav = [
    { path: '/crm', label: 'Dashboard', icon: '📊', active: isActive('/crm') },
    { path: '/crm/leads', label: 'Leads', icon: '👥', active: isActive('/crm/leads'), comingSoon: true },
    { path: '/crm/pipeline', label: 'Pipeline', icon: '📈', active: isActive('/crm/pipeline'), comingSoon: true },
    { path: '/crm/campaigns', label: 'Campaigns', icon: '🎯', active: isActive('/crm/campaigns'), comingSoon: true }
  ];

  const toolsNav = [
    { path: '/crm/ai-tools', label: 'AI Tools', icon: '🤖', active: isActive('/crm/ai-tools'), comingSoon: true },
    { path: '/crm/settings', label: 'Settings', icon: '⚙️', active: isActive('/crm/settings'), comingSoon: true }
  ];

  return (
    <SidebarWrapper>
      <SidebarSection>
        <SectionTitle>Main</SectionTitle>
        <NavList>
          {mainNav.map(item => (
            <NavItemWrapper key={item.path}>
              <NavLink to={item.path} active={item.active}>
                <NavIcon>{item.icon}</NavIcon>
                <NavLabel>{item.label}</NavLabel>
                {item.comingSoon && <ComingSoonBadge>Soon</ComingSoonBadge>}
              </NavLink>
            </NavItemWrapper>
          ))}
        </NavList>
      </SidebarSection>

      <SidebarSection>
        <SectionTitle>Tools</SectionTitle>
        <NavList>
          {toolsNav.map(item => (
            <NavItemWrapper key={item.path}>
              <NavLink to={item.path} active={item.active}>
                <NavIcon>{item.icon}</NavIcon>
                <NavLabel>{item.label}</NavLabel>
                {item.comingSoon && <ComingSoonBadge>Soon</ComingSoonBadge>}
              </NavLink>
            </NavItemWrapper>
          ))}
        </NavList>
      </SidebarSection>
    </SidebarWrapper>
  );
}
