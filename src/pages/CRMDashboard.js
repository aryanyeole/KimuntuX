import React, { useState, useEffect, useMemo } from 'react';
import styled, { createGlobalStyle } from 'styled-components';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell,
} from 'recharts';
import PlatformIntegrationsPanel from '../components/CRMDashboard/PlatformIntegrationsPanel';

// ─────────────────────────────────────────────────────────────────────────────
// CSS TOKEN INJECTION  (dark/light hybrid, no global ThemeProvider)
// ─────────────────────────────────────────────────────────────────────────────
const CRMTokens = createGlobalStyle`
  .crm-dark {
    --crm-bg:      #0F172A;
    --crm-panel:   #1E293B;
    --crm-panel2:  #162033;
    --crm-glass:   rgba(30,41,59,0.55);
    --crm-text:    #F1F5F9;
    --crm-muted:   #94A3B8;
    --crm-border:  rgba(51,65,85,0.5);
    --crm-accent:  #00C896;
    --crm-indigo:  #6366F1;
    --crm-red:     #EF4444;
    --crm-amber:   #F59E0B;
    --crm-green:   #22C55E;
    --crm-bar:     rgba(30,41,59,0.85);
  }
  .crm-light {
    --crm-bg:      #F1F5F9;
    --crm-panel:   #FFFFFF;
    --crm-panel2:  #F8FAFC;
    --crm-glass:   rgba(255,255,255,0.7);
    --crm-text:    #0F172A;
    --crm-muted:   #64748B;
    --crm-border:  rgba(226,232,240,0.7);
    --crm-accent:  #00A87A;
    --crm-indigo:  #6366F1;
    --crm-red:     #EF4444;
    --crm-amber:   #F59E0B;
    --crm-green:   #16A34A;
    --crm-bar:     rgba(255,255,255,0.9);
  }
`;

// ─────────────────────────────────────────────────────────────────────────────
// SHELL LAYOUT
// ─────────────────────────────────────────────────────────────────────────────
const Shell = styled.div`
  position: fixed;
  top: 80px;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  overflow: hidden;
  z-index: 500;
  background: var(--crm-bg);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', 'Plus Jakarta Sans', sans-serif;
  color: var(--crm-text);
  transition: background 0.25s;
`;

// ─────────────────────────────────────────────────────────────────────────────
// SIDEBAR
// ─────────────────────────────────────────────────────────────────────────────
const SidebarWrap = styled.aside`
  width: ${p => p.$collapsed ? '72px' : '220px'};
  flex-shrink: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--crm-glass);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-right: 1px solid var(--crm-border);
  transition: width 0.28s cubic-bezier(.4,0,.2,1);
  overflow: hidden;
  z-index: 30;

  @media (max-width: 768px) {
    position: absolute;
    top: 0;
    left: ${p => p.$collapsed ? '-220px' : '0'};
    width: 220px;
    height: 100%;
    z-index: 100;
    box-shadow: 4px 0 24px rgba(0,0,0,0.4);
  }
`;

const SidebarLogo = styled.div`
  height: 60px;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0 ${p => p.$collapsed ? '0' : '1.2rem'};
  justify-content: ${p => p.$collapsed ? 'center' : 'flex-start'};
  border-bottom: 1px solid var(--crm-border);
  flex-shrink: 0;
`;

const LogoBadge = styled.div`
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: linear-gradient(135deg, var(--crm-accent), var(--crm-indigo));
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  font-weight: 800;
  color: #fff;
  flex-shrink: 0;
  letter-spacing: -0.5px;
`;

const LogoText = styled.span`
  font-size: 15px;
  font-weight: 700;
  color: var(--crm-text);
  white-space: nowrap;
  opacity: ${p => p.$hidden ? '0' : '1'};
  transition: opacity 0.2s;
`;

const NavList = styled.nav`
  flex: 1;
  overflow-y: auto;
  padding: 0.75rem 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
  &::-webkit-scrollbar { width: 0; }
`;

const NavItem = styled.button`
  display: flex;
  align-items: center;
  gap: 0.8rem;
  width: calc(100% - 1rem);
  margin: 0 0.5rem;
  padding: ${p => p.$collapsed ? '0.75rem 0' : '0.7rem 0.9rem'};
  justify-content: ${p => p.$collapsed ? 'center' : 'flex-start'};
  border: none;
  border-radius: 10px;
  cursor: pointer;
  background: ${p => p.$active ? 'rgba(0,200,150,0.12)' : 'transparent'};
  color: ${p => p.$active ? 'var(--crm-accent)' : 'var(--crm-muted)'};
  font-size: 13.5px;
  font-weight: ${p => p.$active ? '600' : '500'};
  transition: all 0.18s;
  position: relative;
  white-space: nowrap;

  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 20%;
    height: 60%;
    width: 3px;
    border-radius: 0 3px 3px 0;
    background: var(--crm-accent);
    opacity: ${p => p.$active ? '1' : '0'};
    transition: opacity 0.18s;
  }

  &:hover {
    background: rgba(0,200,150,0.08);
    color: var(--crm-accent);
    box-shadow: 0 0 12px rgba(0,200,150,0.08);
  }
`;

const NavIcon = styled.span`
  font-size: 17px;
  flex-shrink: 0;
  line-height: 1;
`;

const NavLabel = styled.span`
  opacity: ${p => p.$hidden ? '0' : '1'};
  transition: opacity 0.2s;
  overflow: hidden;
  white-space: nowrap;
`;

const SidebarFooter = styled.div`
  padding: 0.75rem 0.5rem;
  border-top: 1px solid var(--crm-border);
`;

const CollapseBtn = styled.button`
  display: flex;
  align-items: center;
  justify-content: ${p => p.$collapsed ? 'center' : 'flex-start'};
  gap: 0.75rem;
  width: 100%;
  padding: ${p => p.$collapsed ? '0.7rem 0' : '0.7rem 0.9rem'};
  border: none;
  border-radius: 10px;
  background: transparent;
  color: var(--crm-muted);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.18s;
  &:hover { background: rgba(148,163,184,0.08); color: var(--crm-text); }
`;

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COLUMN
// ─────────────────────────────────────────────────────────────────────────────
const MainCol = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const TopBar = styled.header`
  height: 60px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0 1.75rem;
  background: var(--crm-bar);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border-bottom: 1px solid var(--crm-border);
  z-index: 20;
`;

const MobileMenuBtn = styled.button`
  display: none;
  border: none;
  background: none;
  color: var(--crm-muted);
  font-size: 20px;
  cursor: pointer;
  padding: 0;
  @media (max-width: 768px) { display: flex; align-items: center; }
`;

const SearchWrap = styled.div`
  flex: 1;
  max-width: 380px;
  position: relative;
  svg {
    position: absolute;
    left: 0.75rem;
    top: 50%;
    transform: translateY(-50%);
    color: var(--crm-muted);
    pointer-events: none;
  }
  input {
    width: 100%;
    box-sizing: border-box;
    padding: 0.5rem 1rem 0.5rem 2.4rem;
    background: var(--crm-panel2);
    border: 1px solid var(--crm-border);
    border-radius: 9px;
    color: var(--crm-text);
    font-size: 13px;
    transition: border-color 0.2s, box-shadow 0.2s;
    &::placeholder { color: var(--crm-muted); }
    &:focus {
      outline: none;
      border-color: var(--crm-accent);
      box-shadow: 0 0 0 3px rgba(0,200,150,0.12);
    }
  }
`;

const TopRight = styled.div`
  display: flex;
  align-items: center;
  gap: 1.1rem;
  margin-left: auto;
`;

const IconBtn = styled.button`
  background: none;
  border: none;
  width: 36px;
  height: 36px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--crm-muted);
  font-size: 17px;
  cursor: pointer;
  transition: all 0.18s;
  position: relative;
  &:hover { background: rgba(148,163,184,0.1); color: var(--crm-text); }
`;

const NotifBadge = styled.span`
  position: absolute;
  top: 4px;
  right: 4px;
  width: 9px;
  height: 9px;
  background: var(--crm-red);
  border-radius: 50%;
  border: 2px solid var(--crm-panel);
`;

const ToggleBtn = styled.button`
  background: var(--crm-panel2);
  border: 1px solid var(--crm-border);
  border-radius: 20px;
  padding: 0.3rem 0.65rem;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 12px;
  color: var(--crm-muted);
  cursor: pointer;
  transition: all 0.18s;
  &:hover { border-color: var(--crm-accent); color: var(--crm-accent); }
`;

const AvatarWrap = styled.div`
  position: relative;
  cursor: pointer;
`;

const AvatarCircle = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--crm-accent), var(--crm-indigo));
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  border: 2px solid var(--crm-border);
`;

const StatusDot = styled.span`
  position: absolute;
  bottom: 1px;
  right: 1px;
  width: 9px;
  height: 9px;
  background: var(--crm-green);
  border: 2px solid var(--crm-panel);
  border-radius: 50%;
`;

const ContentArea = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 1.75rem 2rem;
  background: var(--crm-bg);
  @media (max-width: 768px) { padding: 1.25rem; }
  &::-webkit-scrollbar { width: 6px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: var(--crm-border); border-radius: 3px; }
`;

// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD INNER
// ─────────────────────────────────────────────────────────────────────────────
const PageTitle = styled.h1`
  font-size: 22px;
  font-weight: 700;
  margin: 0 0 0.25rem 0;
  color: var(--crm-text);
  letter-spacing: -0.3px;
`;

const PageSub = styled.p`
  font-size: 13px;
  color: var(--crm-muted);
  margin: 0 0 1.75rem 0;
`;

const StatusBanner = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 13px;
  padding: 0.65rem 1rem;
  border-radius: 10px;
  margin-bottom: 1.5rem;
  background: ${p => p.$error ? 'rgba(239,68,68,0.1)' : 'rgba(0,200,150,0.08)'};
  border: 1px solid ${p => p.$error ? 'rgba(239,68,68,0.3)' : 'rgba(0,200,150,0.2)'};
  color: ${p => p.$error ? 'var(--crm-red)' : 'var(--crm-accent)'};
`;

// KPI
const KPIGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.25rem;
  margin-bottom: 1.75rem;
  @media (max-width: 1200px) { grid-template-columns: repeat(2, 1fr); }
  @media (max-width: 600px)  { grid-template-columns: 1fr; }
`;

const KPICard = styled.div`
  background: var(--crm-panel);
  border: 1px solid var(--crm-border);
  border-radius: 16px;
  padding: 1.35rem 1.4rem 1.1rem;
  backdrop-filter: blur(8px);
  position: relative;
  overflow: hidden;
  transition: box-shadow 0.2s;
  &::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 3px;
    background: ${p => p.$accent || 'linear-gradient(90deg,var(--crm-accent),var(--crm-indigo))'};
    border-radius: 16px 16px 0 0;
  }
  &:hover { box-shadow: 0 8px 32px rgba(0,0,0,0.18); }
`;

const KPILabel = styled.div`
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.7px;
  color: var(--crm-muted);
  margin-bottom: 0.6rem;
`;

const KPIRow = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
`;

const KPIValue = styled.div`
  font-size: 30px;
  font-weight: 700;
  color: var(--crm-text);
  line-height: 1;
  letter-spacing: -1px;
`;

const KPIDelta = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 11px;
  font-weight: 600;
  padding: 0.25rem 0.55rem;
  border-radius: 6px;
  background: ${p => p.$up ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)'};
  color: ${p => p.$up ? 'var(--crm-green)' : 'var(--crm-red)'};
`;

const SparkWrap = styled.div`
  height: 38px;
  margin-top: 0.5rem;
`;

// Charts
const ChartsRow = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 1.25rem;
  margin-bottom: 1.75rem;
  @media (max-width: 960px) { grid-template-columns: 1fr; }
`;

const ChartCard = styled.div`
  background: var(--crm-panel);
  border: 1px solid var(--crm-border);
  border-radius: 16px;
  padding: 1.4rem;
  backdrop-filter: blur(8px);
`;

const CardTitle = styled.h3`
  font-size: 13.5px;
  font-weight: 600;
  color: var(--crm-text);
  margin: 0 0 1.25rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const CardMuted = styled.span`
  font-size: 12px;
  color: var(--crm-muted);
  font-weight: 400;
`;

// Funnel
const FunnelWrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
`;

const FunnelRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 12.5px;
`;

const FunnelLabel = styled.div`
  width: 110px;
  flex-shrink: 0;
  color: var(--crm-muted);
  font-weight: 500;
  font-size: 12px;
`;

const FunnelBarTrack = styled.div`
  flex: 1;
  height: 22px;
  background: var(--crm-panel2);
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid var(--crm-border);
`;

const FunnelBarFill = styled.div`
  height: 100%;
  width: ${p => p.$pct}%;
  background: linear-gradient(90deg, var(--crm-accent), var(--crm-indigo));
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 8px;
  font-size: 10px;
  font-weight: 700;
  color: #fff;
`;

// Bottom row
const BottomRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 1.25rem;
  @media (max-width: 1100px) { grid-template-columns: 1fr; }
`;

const TableCard = styled(ChartCard)`
  overflow: hidden;
  padding: 0;
`;

const TableHeader = styled.div`
  padding: 1.2rem 1.4rem;
  border-bottom: 1px solid var(--crm-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
`;

const Th = styled.th`
  padding: 0.65rem 1.25rem;
  text-align: left;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--crm-muted);
  border-bottom: 1px solid var(--crm-border);
`;

const Td = styled.td`
  padding: 0.85rem 1.25rem;
  color: var(--crm-text);
  border-bottom: 1px solid var(--crm-border);
  vertical-align: middle;
`;

const LeadAvatar = styled.div`
  width: 30px;
  height: 30px;
  border-radius: 8px;
  background: ${p => p.$color || 'linear-gradient(135deg,var(--crm-indigo),var(--crm-accent))'};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  color: #fff;
  flex-shrink: 0;
`;

const LeadCell = styled.div`
  display: flex;
  align-items: center;
  gap: 0.65rem;
`;

const LeadInfo = styled.div`
  .name { font-weight: 600; font-size: 13px; }
  .co   { font-size: 11px; color: var(--crm-muted); }
`;

const Tag = styled.span`
  display: inline-block;
  padding: 0.22rem 0.6rem;
  border-radius: 5px;
  font-size: 11px;
  font-weight: 600;
  ${p => {
    const map = {
      hot:     ['rgba(239,68,68,0.14)',   '#EF4444'],
      warm:    ['rgba(245,158,11,0.14)',  '#F59E0B'],
      cold:    ['rgba(99,102,241,0.14)',  '#8B5CF6'],
      organic: ['rgba(34,197,94,0.12)',   '#22C55E'],
      paid:    ['rgba(99,102,241,0.12)',  '#818CF8'],
      social:  ['rgba(236,72,153,0.12)', '#EC4899'],
      referral:['rgba(245,158,11,0.12)', '#FBBF24'],
      email:   ['rgba(14,165,233,0.12)', '#38BDF8'],
    };
    const [bg, color] = map[p.$type?.toLowerCase()] || ['rgba(148,163,184,0.12)','#94A3B8'];
    return `background:${bg};color:${color};`;
  }}
`;

const ValueBadge = styled.span`
  font-weight: 600;
  color: var(--crm-accent);
`;

// AI Panel
const AIPanelCard = styled(ChartCard)``;

const AIItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.85rem 0;
  border-bottom: 1px solid var(--crm-border);
  &:last-child { border-bottom: none; }
`;

const AIIcon = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: ${p => p.$bg || 'rgba(99,102,241,0.12)'};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  flex-shrink: 0;
`;

const AIText = styled.div`
  flex: 1;
  .title { font-size: 12.5px; font-weight: 600; color: var(--crm-text); margin-bottom: 0.2rem; line-height: 1.3; }
  .desc  { font-size: 11.5px; color: var(--crm-muted); line-height: 1.4; }
`;

const PriorityTag = styled.span`
  font-size: 10px;
  font-weight: 700;
  padding: 0.18rem 0.5rem;
  border-radius: 4px;
  flex-shrink: 0;
  align-self: flex-start;
  background: ${p =>
    p.$level === 'high'   ? 'rgba(239,68,68,0.14)'   :
    p.$level === 'medium' ? 'rgba(245,158,11,0.14)' :
    'rgba(34,197,94,0.12)'};
  color: ${p =>
    p.$level === 'high'   ? '#EF4444' :
    p.$level === 'medium' ? '#F59E0B' :
    '#22C55E'};
`;

// Placeholder
const PlaceholderWrap = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 60vh;
  gap: 1rem;
  color: var(--crm-muted);
  text-align: center;
`;

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────
const NAV = [
  { id: 'dashboard',  label: 'Dashboard',      icon: '📊' },
  { id: 'leads',      label: 'Leads',           icon: '👥' },
  { id: 'pipeline',   label: 'Pipeline',        icon: '📈' },
  { id: 'campaigns',  label: 'Campaigns',       icon: '🎯' },
  { id: 'funnels',    label: 'Funnels',         icon: '🔗' },
  { id: 'ai',         label: 'AI Optimization', icon: '⚡' },
  { id: 'settings',   label: 'Settings',        icon: '⚙️' },
];

const MOCK_SOURCES = ['Organic', 'Paid', 'Social', 'Referral', 'Email'];
const MOCK_VALUES  = [1200, 3400, 800, 2100, 960, 4500, 1750, 600, 2900, 1400];

const AI_SUGGESTIONS = [
  { icon: '🎯', bg: 'rgba(99,102,241,0.12)',  title: 'Re-engage warm leads',        desc: '14 warm leads haven\'t been contacted in 7+ days. Send a targeted follow-up sequence.', level: 'high'   },
  { icon: '💡', bg: 'rgba(245,158,11,0.12)',  title: 'Optimize Paid channel',       desc: 'Paid traffic shows 23% lower conversion vs Organic. Reallocate 15% budget to top-performing creatives.', level: 'medium' },
  { icon: '📧', bg: 'rgba(14,165,233,0.12)',  title: 'Email open-rate dip',         desc: 'Campaign #4 open rate dropped to 18%. A/B test subject lines with personalization tokens.', level: 'medium' },
  { icon: '🔁', bg: 'rgba(34,197,94,0.12)',   title: 'Funnel bottleneck',           desc: '41% drop-off between Lead Capture and Landing Page. Add social proof elements.', level: 'low'    },
  { icon: '🏆', bg: 'rgba(236,72,153,0.12)',  title: 'Hot leads closing window',    desc: '3 hot leads have shown intent signals. Schedule demos within 48 hrs.', level: 'high'   },
];

const FUNNEL_STAGES = [
  { label: 'Lead Capture', pct: 100, count: 1240 },
  { label: 'Landing Page', pct: 59,  count:  732 },
  { label: 'Upsell Offer', pct: 34,  count:  422 },
  { label: 'Checkout',     pct: 21,  count:  258 },
  { label: 'Converted',    pct: 13,  count:  165 },
];

const DONUT_DATA = [
  { name: 'Organic',  value: 38, color: '#22C55E' },
  { name: 'Paid',     value: 29, color: '#6366F1' },
  { name: 'Social',   value: 20, color: '#EC4899' },
  { name: 'Referral', value: 13, color: '#F59E0B' },
];

const CAMPAIGN_DATA = [
  { week: 'W1', clicks: 420,  sales: 18 },
  { week: 'W2', clicks: 680,  sales: 32 },
  { week: 'W3', clicks: 540,  sales: 25 },
  { week: 'W4', clicks: 910,  sales: 51 },
  { week: 'W5', clicks: 730,  sales: 40 },
  { week: 'W6', clicks: 1100, sales: 63 },
  { week: 'W7', clicks: 980,  sales: 57 },
  { week: 'W8', clicks: 1350, sales: 78 },
];

const AVATAR_COLORS = [
  'linear-gradient(135deg,#6366F1,#00C896)',
  'linear-gradient(135deg,#EC4899,#F59E0B)',
  'linear-gradient(135deg,#14B8A6,#6366F1)',
  'linear-gradient(135deg,#F59E0B,#EF4444)',
  'linear-gradient(135deg,#8B5CF6,#3B82F6)',
];

// ─────────────────────────────────────────────────────────────────────────────
// TOOLTIP
// ─────────────────────────────────────────────────────────────────────────────
const TooltipBox = styled.div`
  background: #1E293B;
  border: 1px solid rgba(51,65,85,0.6);
  border-radius: 8px;
  padding: 0.55rem 0.85rem;
  font-size: 12px;
  color: #F1F5F9;
  .label { color: #94A3B8; margin-bottom: 0.2rem; font-size: 11px; }
  .row   { display: flex; gap: 0.5rem; align-items: center; }
  .dot   { width: 8px; height: 8px; border-radius: 50%; }
`;

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <TooltipBox>
      <div className="label">{label}</div>
      {payload.map(p => (
        <div className="row" key={p.name}>
          <div className="dot" style={{ background: p.color }} />
          <span>{p.name}: <strong>{p.value}</strong></span>
        </div>
      ))}
    </TooltipBox>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// SPARKLINE
// ─────────────────────────────────────────────────────────────────────────────
const buildSparkline = (base, len = 7) =>
  Array.from({ length: len }, (_, i) => ({
    i,
    v: Math.max(0, base + (Math.random() - 0.5) * base * 0.3),
  }));

const SparklineChart = ({ data, color = '#00C896' }) => {
  const gradId = `sg${color.replace(/[^a-zA-Z0-9]/g, '')}`;
  return (
    <ResponsiveContainer width="100%" height={38}>
      <AreaChart data={data} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={color} stopOpacity={0.4} />
            <stop offset="100%" stopColor={color} stopOpacity={0}   />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5}
          fill={`url(#${gradId})`} dot={false} isAnimationActive={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function CRMDashboard() {
  const [isDark,     setIsDark]     = useState(true);
  const [collapsed,  setCollapsed]  = useState(false);
  const [activeView, setActiveView] = useState('dashboard');
  const [summary,    setSummary]    = useState(null);
  const [leads,      setLeads]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [refreshTick, setRefreshTick] = useState(0);

  const kpiSparks = useMemo(() => ({
    total:    buildSparkline(summary?.totalLeads       || 60),
    hot:      buildSparkline(summary?.hotLeads         || 18),
    warm:     buildSparkline(summary?.warmLeads        || 28),
    activity: buildSparkline(summary?.recentActivities || 35),
  }), [summary]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        setLoading(true);
        setFetchError(null);
        const [sumRes, leadsRes] = await Promise.all([
          fetch('http://localhost:5000/api/dashboard/summary'),
          fetch('http://localhost:5000/api/leads'),
        ]);
        if (!alive) return;
        if (sumRes.ok)   setSummary(await sumRes.json());
        if (leadsRes.ok) {
          const d = await leadsRes.json();
          setLeads(Array.isArray(d) ? d : []);
        }
      } catch {
        if (alive) setFetchError('Backend offline — showing mock data');
      } finally {
        if (alive) setLoading(false);
      }
    };
    load();
    const t = setInterval(load, 30000);
    return () => { alive = false; clearInterval(t); };
  }, [refreshTick]);

  const modeClass = isDark ? 'crm-dark' : 'crm-light';

  const kpis = [
    { label: 'Total Leads',   value: summary?.totalLeads       ?? 248, delta: '+12%', up: true,  accent: 'linear-gradient(90deg,#00C896,#6366F1)', color: '#00C896', spark: kpiSparks.total    },
    { label: 'Hot Leads',     value: summary?.hotLeads         ?? 37,  delta: '+8%',  up: true,  accent: 'linear-gradient(90deg,#EF4444,#F59E0B)', color: '#EF4444', spark: kpiSparks.hot      },
    { label: 'Warm Leads',    value: summary?.warmLeads        ?? 94,  delta: '+5%',  up: true,  accent: 'linear-gradient(90deg,#F59E0B,#FBBF24)', color: '#F59E0B', spark: kpiSparks.warm     },
    { label: 'Activities (7d)', value: summary?.recentActivities ?? 182, delta: '-3%', up: false, accent: 'linear-gradient(90deg,#6366F1,#8B5CF6)', color: '#8B5CF6', spark: kpiSparks.activity },
  ];

  const MOCK_LEADS = Array.from({ length: 8 }, (_, i) => ({
    id: i + 1,
    name:    ['Alex Morgan','Jamie Lee','Sam Chen','Taylor Kim','Jordan Fox','Riley Park','Casey Wu','Drew Hall'][i],
    company: ['Acme Corp','Nova Ltd','Peak Ventures','Bolt Inc','Wave Co','Core AI','ZenTech','SkyNet'][i],
    stage:   ['hot','warm','cold','hot','warm','cold','warm','hot'][i],
  }));

  const displayLeads = leads.length > 0 ? leads.slice(0, 8) : MOCK_LEADS;

  return (
    <div className={modeClass}>
      <CRMTokens />
      <Shell>

        {/* SIDEBAR */}
        <SidebarWrap $collapsed={collapsed}>
          <SidebarLogo $collapsed={collapsed}>
            <LogoBadge>K</LogoBadge>
            <LogoText $hidden={collapsed}>KimuX CRM</LogoText>
          </SidebarLogo>

          <NavList>
            {NAV.map(item => (
              <NavItem
                key={item.id}
                $active={activeView === item.id}
                $collapsed={collapsed}
                onClick={() => setActiveView(item.id)}
                title={collapsed ? item.label : undefined}
              >
                <NavIcon>{item.icon}</NavIcon>
                <NavLabel $hidden={collapsed}>{item.label}</NavLabel>
              </NavItem>
            ))}
          </NavList>

          <SidebarFooter>
            <CollapseBtn $collapsed={collapsed} onClick={() => setCollapsed(c => !c)}>
              <NavIcon>{collapsed ? '▶' : '◀'}</NavIcon>
              <NavLabel $hidden={collapsed} style={{ fontSize: 12 }}>Collapse</NavLabel>
            </CollapseBtn>
          </SidebarFooter>
        </SidebarWrap>

        {/* MAIN */}
        <MainCol>
          <TopBar>
            <MobileMenuBtn onClick={() => setCollapsed(c => !c)}>☰</MobileMenuBtn>

            <SearchWrap>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input placeholder="Search leads, companies, campaigns…" />
            </SearchWrap>

            <TopRight>
              <IconBtn title="Notifications">
                🔔
                <NotifBadge />
              </IconBtn>
              <ToggleBtn onClick={() => setIsDark(d => !d)}>
                {isDark ? '☀️' : '🌙'}
                <span>{isDark ? 'Light' : 'Dark'}</span>
              </ToggleBtn>
              <AvatarWrap>
                <AvatarCircle>AK</AvatarCircle>
                <StatusDot />
              </AvatarWrap>
            </TopRight>
          </TopBar>

          <ContentArea>

            {/* ══ DASHBOARD ══════════════════════════════════════════════════ */}
            {activeView === 'dashboard' && (
              <>
                <PageTitle>Dashboard</PageTitle>
                <PageSub>
                  Real-time insights ·{' '}
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </PageSub>

                {fetchError && <StatusBanner $error>⚠️ {fetchError}</StatusBanner>}
                {loading    && <StatusBanner>⏳ Loading live data from backend…</StatusBanner>}

                {/* KPI Grid */}
                <KPIGrid>
                  {kpis.map(k => (
                    <KPICard key={k.label} $accent={k.accent}>
                      <KPILabel>{k.label}</KPILabel>
                      <KPIRow>
                        <KPIValue>{k.value.toLocaleString()}</KPIValue>
                        <KPIDelta $up={k.up}>{k.up ? '↗' : '↘'} {k.delta}</KPIDelta>
                      </KPIRow>
                      <SparkWrap><SparklineChart data={k.spark} color={k.color} /></SparkWrap>
                    </KPICard>
                  ))}
                </KPIGrid>

                {/* Charts */}
                <ChartsRow>
                  <ChartCard>
                    <CardTitle>Campaign Performance <CardMuted>· last 8 weeks</CardMuted></CardTitle>
                    <ResponsiveContainer width="100%" height={210}>
                      <AreaChart data={CAMPAIGN_DATA} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
                        <defs>
                          <linearGradient id="clicksGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%"   stopColor="#6366F1" stopOpacity={0.35} />
                            <stop offset="100%" stopColor="#6366F1" stopOpacity={0}    />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="week" tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis yAxisId="left"  tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis yAxisId="right" orientation="right" tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} />
                        <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(148,163,184,0.12)', strokeWidth: 1 }} />
                        <Area   yAxisId="left"  type="monotone" dataKey="clicks" name="Clicks" stroke="#6366F1" strokeWidth={2} fill="url(#clicksGrad)" dot={false} />
                        <Bar    yAxisId="right"                  dataKey="sales"  name="Sales"  fill="#00C896" fillOpacity={0.8} radius={[4,4,0,0]} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </ChartCard>

                  <ChartCard>
                    <CardTitle>Traffic Breakdown</CardTitle>
                    <ResponsiveContainer width="100%" height={175}>
                      <PieChart>
                        <Pie data={DONUT_DATA} cx="50%" cy="50%" innerRadius={52} outerRadius={75}
                          paddingAngle={3} dataKey="value" strokeWidth={0}>
                          {DONUT_DATA.map(d => <Cell key={d.name} fill={d.color} />)}
                        </Pie>
                        <Tooltip formatter={v => `${v}%`}
                          contentStyle={{ background: '#1E293B', border: '1px solid rgba(51,65,85,0.6)', borderRadius: 8, fontSize: 12 }} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.25rem' }}>
                      {DONUT_DATA.map(d => (
                        <span key={d.name} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: 11, color: 'var(--crm-muted)' }}>
                          <span style={{ width: 8, height: 8, borderRadius: 2, background: d.color, display: 'inline-block' }} />
                          {d.name} {d.value}%
                        </span>
                      ))}
                    </div>
                  </ChartCard>
                </ChartsRow>

                {/* Funnel */}
                <div style={{ marginBottom: '1.75rem' }}>
                  <ChartCard>
                    <CardTitle>Funnel Drop-off</CardTitle>
                    <FunnelWrap>
                      {FUNNEL_STAGES.map(s => (
                        <FunnelRow key={s.label}>
                          <FunnelLabel>{s.label}</FunnelLabel>
                          <FunnelBarTrack>
                            <FunnelBarFill $pct={s.pct}>{s.pct > 20 ? `${s.pct}%` : ''}</FunnelBarFill>
                          </FunnelBarTrack>
                          <span style={{ fontSize: 11, color: 'var(--crm-muted)', width: 38, textAlign: 'right', flexShrink: 0 }}>
                            {s.count.toLocaleString()}
                          </span>
                        </FunnelRow>
                      ))}
                    </FunnelWrap>
                  </ChartCard>
                </div>

                {/* Leads Table + AI Panel */}
                <BottomRow>
                  <TableCard>
                    <TableHeader>
                      <CardTitle style={{ margin: 0 }}>Recent Leads</CardTitle>
                      <Tag $type="organic" style={{ cursor: 'pointer' }}>View all →</Tag>
                    </TableHeader>
                    <div style={{ overflowX: 'auto' }}>
                      <Table>
                        <thead>
                          <tr>
                            <Th>Lead</Th>
                            <Th>Source</Th>
                            <Th>Value</Th>
                            <Th>Status</Th>
                          </tr>
                        </thead>
                        <tbody>
                          {displayLeads.map((l, i) => (
                            <tr key={l.id || i}
                              onMouseEnter={e => e.currentTarget.style.background = 'rgba(148,163,184,0.04)'}
                              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            >
                              <Td>
                                <LeadCell>
                                  <LeadAvatar $color={AVATAR_COLORS[i % AVATAR_COLORS.length]}>
                                    {(l.name || '?').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                                  </LeadAvatar>
                                  <LeadInfo>
                                    <div className="name">{l.name}</div>
                                    <div className="co">{l.company || 'Unknown Co.'}</div>
                                  </LeadInfo>
                                </LeadCell>
                              </Td>
                              <Td><Tag $type={MOCK_SOURCES[i % MOCK_SOURCES.length].toLowerCase()}>{MOCK_SOURCES[i % MOCK_SOURCES.length]}</Tag></Td>
                              <Td><ValueBadge>${MOCK_VALUES[i % MOCK_VALUES.length].toLocaleString()}</ValueBadge></Td>
                              <Td>
                                <Tag $type={(l.stage || (l.score >= 80 ? 'hot' : l.score >= 55 ? 'warm' : 'cold')).toLowerCase()}>
                                  {l.stage ? l.stage.charAt(0).toUpperCase() + l.stage.slice(1) : (l.score >= 80 ? 'Hot' : l.score >= 55 ? 'Warm' : 'Cold')}
                                </Tag>
                              </Td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  </TableCard>

                  <AIPanelCard>
                    <CardTitle>🤖 AI Optimization</CardTitle>
                    {AI_SUGGESTIONS.map((s, i) => (
                      <AIItem key={i}>
                        <AIIcon $bg={s.bg}>{s.icon}</AIIcon>
                        <AIText>
                          <div className="title">{s.title}</div>
                          <div className="desc">{s.desc}</div>
                        </AIText>
                        <PriorityTag $level={s.level}>{s.level.toUpperCase()}</PriorityTag>
                      </AIItem>
                    ))}
                  </AIPanelCard>
                </BottomRow>
              </>
            )}

            {/* ══ PLACEHOLDER VIEWS ══════════════════════════════════════════ */}
            {activeView === 'settings' && (
              <PlatformIntegrationsPanel onDataRefresh={() => setRefreshTick(t => t + 1)} />
            )}

            {activeView !== 'dashboard' && activeView !== 'settings' && (() => {
              const item = NAV.find(n => n.id === activeView);
              return (
                <PlaceholderWrap>
                  <div style={{ fontSize: 52, opacity: 0.7 }}>{item?.icon}</div>
                  <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--crm-text)', margin: 0 }}>{item?.label}</h2>
                  <p style={{ fontSize: 14, maxWidth: 320, lineHeight: 1.6 }}>
                    This section is under active development. Check back soon — it will be part of the full KimuX CRM release.
                  </p>
                  <Tag $type="organic" style={{ cursor: 'pointer', fontSize: 12, padding: '0.4rem 1rem' }}
                    onClick={() => setActiveView('dashboard')}>
                    ← Back to Dashboard
                  </Tag>
                </PlaceholderWrap>
              );
            })()}

          </ContentArea>
        </MainCol>
      </Shell>
    </div>
  );
}
