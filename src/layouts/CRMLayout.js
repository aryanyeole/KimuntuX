import React, { useEffect, useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { useUser } from '../contexts/UserContext';
import { useTenant } from '../contexts/TenantContext';
import useStrategy from '../hooks/useStrategy';
import { crm as C } from '../styles/crmTheme';
import darkNewLogo from '../assets/dark_new_logo.jpeg';

// ── Root shell ────────────────────────────────────────────────────────────────
const Shell = styled.div`
  display: flex;
  height: 100vh;
  overflow: hidden;
  background: ${C.bg};
  color: ${C.text};
  font-family: ${C.fontFamily};
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
  overflow: hidden;
`;

const LogoImage = styled.img`
  display: block;
  object-fit: contain;
  flex-shrink: 0;
  max-width: ${({ $collapsed }) => ($collapsed ? '36px' : '128px')};
  height: ${({ $collapsed }) => ($collapsed ? '36px' : '40px')};
`;

const HiddenTextForA11y = styled.span`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
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
  padding: 8px 8px 12px;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  overflow-x: hidden;
`;

// ── Section label (PLATFORM, COMMERCE, INTELLIGENCE) ─────────────────────────
const SectionLabel = styled.div`
  font-size: 9.5px;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: ${C.muted};
  padding: 14px 12px 4px;
  white-space: nowrap;
  opacity: ${({ $collapsed }) => ($collapsed ? 0 : 1)};
  height: ${({ $collapsed }) => ($collapsed ? '6px' : 'auto')};
  overflow: hidden;
  transition: opacity 0.15s ease, height 0.15s ease;
  pointer-events: none;
`;

// ── Regular nav item (NavLink) ────────────────────────────────────────────────
const NavItem = styled(NavLink)`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: ${({ $collapsed }) => ($collapsed ? '9px 0' : '9px 10px')};
  justify-content: ${({ $collapsed }) => ($collapsed ? 'center' : 'flex-start')};
  border-radius: 7px;
  text-decoration: none;
  color: ${C.muted};
  font-size: 13px;
  font-weight: 500;
  transition: background 0.15s, color 0.15s;
  white-space: nowrap;
  position: relative;

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

// ── Sub-item (indented NavLink for children) ──────────────────────────────────
const SubNavItem = styled(NavLink)`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: ${({ $collapsed }) => ($collapsed ? '8px 0' : '8px 10px 8px 30px')};
  justify-content: ${({ $collapsed }) => ($collapsed ? 'center' : 'flex-start')};
  border-radius: 7px;
  text-decoration: none;
  color: ${C.muted};
  font-size: 12.5px;
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

// ── Disabled/coming-soon item (not a NavLink) ─────────────────────────────────
const DisabledItem = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: ${({ $collapsed }) => ($collapsed ? '9px 0' : '9px 10px')};
  justify-content: ${({ $collapsed }) => ($collapsed ? 'center' : 'flex-start')};
  border-radius: 7px;
  color: ${C.border};
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  cursor: not-allowed;
  user-select: none;
`;

// ── Expandable parent item (button) ──────────────────────────────────────────
const ParentItem = styled.button`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: ${({ $collapsed }) => ($collapsed ? '9px 0' : '9px 10px')};
  justify-content: ${({ $collapsed }) => ($collapsed ? 'center' : 'flex-start')};
  border-radius: 7px;
  background: ${({ $active }) => ($active ? C.card : 'none')};
  color: ${({ $active }) => ($active ? C.accent : C.muted)};
  box-shadow: ${({ $active }) => ($active ? `inset 3px 0 0 ${C.accent}` : 'none')};
  border: none;
  width: 100%;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
  white-space: nowrap;
  text-align: left;

  &:hover {
    background: ${C.card};
    color: ${C.text};
  }
`;

const NavIcon = styled.span`
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const NavLabel = styled.span`
  flex: 1;
  opacity: ${({ $collapsed }) => ($collapsed ? 0 : 1)};
  width: ${({ $collapsed }) => ($collapsed ? 0 : 'auto')};
  overflow: hidden;
  transition: opacity 0.15s ease;
`;

// ── Badges ────────────────────────────────────────────────────────────────────
const ActiveBadge = styled.span`
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 2px 6px;
  border-radius: 999px;
  background: ${C.green}22;
  color: ${C.green};
  border: 1px solid ${C.green}44;
  flex-shrink: 0;
`;

const ComingSoonBadge = styled.span`
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  padding: 2px 6px;
  border-radius: 999px;
  background: ${C.card};
  color: ${C.muted};
  border: 1px solid ${C.border};
  flex-shrink: 0;
`;

// ── Chevron for expand/collapse ───────────────────────────────────────────────
const Chevron = styled.span`
  flex-shrink: 0;
  display: flex;
  align-items: center;
  color: ${C.muted};
  transform: ${({ $open }) => ($open ? 'rotate(180deg)' : 'rotate(0deg)')};
  transition: transform 0.2s ease;
  opacity: ${({ $collapsed }) => ($collapsed ? 0 : 1)};
  width: ${({ $collapsed }) => ($collapsed ? 0 : 'auto')};
`;

// ── Nav item with separate arrow button (navigable parent) ───────────────────
const NavItemRow = styled.div`position: relative;`;

const ArrowBtn = styled.button`
  position: absolute;
  right: 6px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  color: ${C.muted};
  display: flex;
  align-items: center;
  padding: 4px;
  border-radius: 4px;
  &:hover { color: ${C.text}; background: ${C.card}; }
`;

// ── Sidebar bottom ────────────────────────────────────────────────────────────
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

const TenantBadge = styled.div`
  font-size: 11px;
  font-weight: 700;
  color: ${C.muted};
  background: ${C.card};
  border: 1px solid ${C.border};
  border-radius: 6px;
  padding: 4px 10px;
  white-space: nowrap;
`;

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
  strategy: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L2 7l10 5 10-5-10-5z"/>
      <path d="M2 17l10 5 10-5"/>
      <path d="M2 12l10 5 10-5"/>
    </svg>
  ),
  scheduler: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
  contentGenerator: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l1.6 3.9L18 8.5l-3.4 2.7L15.6 16 12 13.8 8.4 16l1-4.8L6 8.5l4.4-1.6L12 3z"/>
      <path d="M5 19l2 .8L8 22l.8-2.2L11 19l-2.2-.8L8 16l-1 2.2L5 19z"/>
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
  campaigns: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
      <path d="M19.07 4.93a10 10 0 010 14.14"/>
      <path d="M15.54 8.46a5 5 0 010 7.07"/>
    </svg>
  ),
  messages: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
    </svg>
  ),
  blockchain: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1"/>
      <rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="14" y="14" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/>
      <line x1="10" y1="6.5" x2="14" y2="6.5"/>
      <line x1="10" y1="17.5" x2="14" y2="17.5"/>
      <line x1="6.5" y1="10" x2="6.5" y2="14"/>
      <line x1="17.5" y1="10" x2="17.5" y2="14"/>
    </svg>
  ),
  funnel: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
    </svg>
  ),
  connections: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/>
      <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/>
    </svg>
  ),
  fintech: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23"/>
      <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
    </svg>
  ),
  affiliate: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
    </svg>
  ),
  offers: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/>
      <circle cx="7" cy="7" r="1.5" fill="currentColor" stroke="none"/>
    </svg>
  ),
  analytics: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/>
    </svg>
  ),
  academy: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
      <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"/>
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
  chevronDown: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  ),
  calendar: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
};

// ── Nav config ────────────────────────────────────────────────────────────────
const NAV_SECTIONS = [
  {
    label: 'PLATFORM',
    items: [
      { label: 'Dashboard',       to: '/crm/dashboard',     icon: 'dashboard'  },
      { label: 'Strategy Engine', to: '/crm/strategy',      icon: 'strategy',  badge: 'active' },
      { label: 'Leads',           to: '/crm/leads',         icon: 'leads'      },
      { label: 'Pipeline',        to: '/crm/pipeline',      icon: 'pipeline'   },
      {
        label: 'Campaigns', to: '/crm/campaigns', icon: 'campaigns', expandable: true,
        children: [
          { label: 'Content Scheduler', to: '/crm/content-scheduler', icon: 'calendar' },
          { label: 'Content Generator', to: '/crm/content-gen', icon: 'contentGenerator' },
        ],
      },
      { label: 'Messages',        to: '/crm/communication', icon: 'messages'   },
    ],
  },
  {
    label: 'COMMERCE',
    items: [
      { label: 'Connections',     to: '/crm/connections',   icon: 'connections'               },
      { label: 'Funnel Builder',  to: '/crm/funnels',       icon: 'funnel'                    },
      { label: 'Fintech Hub',     to: '/crm/fintech',       icon: 'fintech'    },
      {
        label: 'Affiliate Center', icon: 'affiliate', expandable: true,
        children: [
          { label: 'Offers', to: '/crm/offers', icon: 'offers' },
        ],
      },
    ],
  },
  {
    label: 'INTELLIGENCE',
    items: [
      { label: 'Analytics',       to: '/crm/analytics',     icon: 'analytics'  },
      { label: 'KimuX Academy',   to: '/crm/academy',       icon: 'academy'    },
      { label: 'Settings',        to: '/crm/settings',      icon: 'settings'   },
    ],
  },
];

// Map path segment → TopBar title
const PATH_TITLES = {
  dashboard:     'Dashboard',
  strategy:      'Strategy Engine',
  leads:         'Leads',
  pipeline:      'Pipeline',
  campaigns:           'Campaigns',
  'content-scheduler': 'Content Scheduler',
  'content-gen':   'Content Generator',
  communication:       'Messages',
  offers:        'Offer Discovery',
  funnels:       'Funnel Builder',
  fintech:       'Fintech Hub',
  analytics:     'Analytics',
  academy:       'KimuX Academy',
  settings:      'Settings',
  connections:   'Connections',
};

const LoadingShell = styled.div`
  display: flex;
  height: 100vh;
  align-items: center;
  justify-content: center;
  background: ${C.bg};
  color: ${C.muted};
  font-size: 14px;
  font-family: ${C.fontFamily};
`;

// ── Component ─────────────────────────────────────────────────────────────────
export default function CRMLayout() {
  // All hooks must be called unconditionally before any early return
  const [collapsed, setCollapsed] = useState(false);
  const [affiliateExpanded, setAffiliateExpanded] = useState(true);
  const [campaignsExpanded, setCampaignsExpanded] = useState(true);
  const { user, isLoading } = useUser();
  const { currentTenant } = useTenant();
  const { strategies } = useStrategy();
  const navigate = useNavigate();
  const location = useLocation();

useEffect(() => {
  const inCampaignSection =
    location.pathname.startsWith('/crm/campaigns') ||
    location.pathname === '/crm/content-gen' ||
    location.pathname === '/crm/content-scheduler';
  if (!inCampaignSection) {
    setCampaignsExpanded(false);
  }
}, [location.pathname]);

  // Block rendering until auth + tenant bootstrap is complete
  if (isLoading) return <LoadingShell>Loading…</LoadingShell>;

  const hasStrategy = strategies.length > 0;
  const segment = location.pathname.split('/')[2] || 'dashboard';
  const pageTitle = PATH_TITLES[segment] || 'CRM';

  const initials = user?.full_name
    ? user.full_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  // Is any Affiliate Center child currently active?
  const affiliateActive = NAV_SECTIONS[1].items
    .find(i => i.expandable)
    ?.children?.some(c => location.pathname.startsWith(c.to)) || false;

  return (
    <Shell>
      {/* ── Sidebar ── */}
      <Sidebar $collapsed={collapsed}>
        <LogoRow $collapsed={collapsed}>
          <LogoMark>
            <LogoImage src={darkNewLogo} alt="KimuX" $collapsed={collapsed} />
            <HiddenTextForA11y>KimuX</HiddenTextForA11y>
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
          {NAV_SECTIONS.map((section) => (
            <React.Fragment key={section.label}>
              <SectionLabel $collapsed={collapsed}>{section.label}</SectionLabel>

              {section.items.map((item) => {
                // ── Disabled item ──
                if (item.disabled) {
                  return (
                    <DisabledItem key={item.label} $collapsed={collapsed} title={collapsed ? item.label : undefined}>
                      <NavIcon>{icons[item.icon]}</NavIcon>
                      <NavLabel $collapsed={collapsed}>{item.label}</NavLabel>
                      {!collapsed && <ComingSoonBadge>Soon</ComingSoonBadge>}
                    </DisabledItem>
                  );
                }

                // ── Navigable parent with children (e.g. Campaigns) ──
                // Has both a route (`to`) and sub-items; NavLink navigates, arrow toggles
                if (item.expandable && item.to) {
                  const isExpanded = item.label === 'Campaigns' ? campaignsExpanded : false;
                  const toggle = item.label === 'Campaigns'
                    ? () => setCampaignsExpanded(prev => !prev)
                    : () => {};
                  return (
                    <React.Fragment key={item.to}>
                      <NavItemRow>
                        <NavItem
                          to={item.to}
                          $collapsed={collapsed}
                          title={collapsed ? item.label : undefined}
                          style={!collapsed ? { paddingRight: '30px' } : undefined}
                        >
                          <NavIcon>{icons[item.icon]}</NavIcon>
                          <NavLabel $collapsed={collapsed}>{item.label}</NavLabel>
                        </NavItem>
                        {!collapsed && (
                          <ArrowBtn onClick={toggle} title={isExpanded ? 'Collapse' : 'Expand'}>
                            <Chevron $open={isExpanded} $collapsed={false}>
                              {icons.chevronDown}
                            </Chevron>
                          </ArrowBtn>
                        )}
                      </NavItemRow>

                      {!collapsed && isExpanded && item.children?.map(child => (
                        <SubNavItem
                          key={child.to}
                          to={child.to}
                          $collapsed={collapsed}
                          title={child.label}
                        >
                          <NavIcon>{icons[child.icon]}</NavIcon>
                          <NavLabel $collapsed={collapsed}>{child.label}</NavLabel>
                        </SubNavItem>
                      ))}
                    </React.Fragment>
                  );
                }

                // ── Pure expandable parent — no route (e.g. Affiliate Center) ──
                if (item.expandable) {
                  return (
                    <React.Fragment key={item.label}>
                      <ParentItem
                        $collapsed={collapsed}
                        $active={affiliateActive}
                        title={collapsed ? item.label : undefined}
                        onClick={() => {
                          if (collapsed) {
                            if (item.children?.[0]?.to) navigate(item.children[0].to);
                          } else {
                            setAffiliateExpanded(prev => !prev);
                          }
                        }}
                      >
                        <NavIcon>{icons[item.icon]}</NavIcon>
                        <NavLabel $collapsed={collapsed}>{item.label}</NavLabel>
                        <Chevron $open={affiliateExpanded} $collapsed={collapsed}>
                          {icons.chevronDown}
                        </Chevron>
                      </ParentItem>

                      {!collapsed && affiliateExpanded && item.children?.map(child => (
                        <SubNavItem
                          key={child.to}
                          to={child.to}
                          $collapsed={collapsed}
                          title={child.label}
                        >
                          <NavIcon>{icons[child.icon]}</NavIcon>
                          <NavLabel $collapsed={collapsed}>{child.label}</NavLabel>
                        </SubNavItem>
                      ))}
                    </React.Fragment>
                  );
                }

                // ── Regular nav item ──
                return (
                  <NavItem
                    key={item.to}
                    to={item.to}
                    $collapsed={collapsed}
                    title={collapsed ? item.label : undefined}
                  >
                    <NavIcon>{icons[item.icon]}</NavIcon>
                    <NavLabel $collapsed={collapsed}>{item.label}</NavLabel>
                    {!collapsed && item.badge === 'active' && hasStrategy && (
                      <ActiveBadge>Active</ActiveBadge>
                    )}
                    {!collapsed && item.badge === 'soon' && (
                      <ComingSoonBadge>Soon</ComingSoonBadge>
                    )}
                  </NavItem>
                );
              })}
            </React.Fragment>
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
          {currentTenant && <TenantBadge>{currentTenant.name}</TenantBadge>}
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
