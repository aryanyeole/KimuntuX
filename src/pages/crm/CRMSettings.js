import { useState } from 'react';
import { Link } from 'react-router-dom';
import styled, { keyframes, css } from 'styled-components';
import { crm as C } from '../../styles/crmTheme';

const VALIDATION_URLS = [
  { network: 'ClickBank',   code: 'CB',  url: 'https://kimux.io/track/cb/{affiliate_id}' },
  { network: 'BuyGoods',    code: 'BG',  url: 'https://kimux.io/track/bg/{affiliate_id}' },
  { network: 'MaxWeb',      code: 'MW',  url: 'https://kimux.io/track/mw/{affiliate_id}' },
  { network: 'Digistore24', code: 'D24', url: 'https://kimux.io/track/ds/{affiliate_id}' },
];

const TEAM = [
  { name: 'Yann Kayilu',    email: 'yann@kimux.io',  role: 'Owner',  color: C.accent  },
  { name: 'Marketing Team', email: 'team@kimux.io',  role: 'Admin',  color: C.purple  },
  { name: 'Sales Agent',    email: 'sales@kimux.io', role: 'Member', color: C.success },
];

const AI_TOGGLES = [
  { key: 'scoring',    label: 'Auto Lead Scoring',       desc: 'AI scores and classifies leads',             default: true  },
  { key: 'followup',   label: 'Smart Follow-ups',         desc: 'AI triggers follow-up sequences',           default: true  },
  { key: 'predictive', label: 'Predictive Analytics',     desc: 'AI predicts conversion, LTV, churn',        default: true  },
  { key: 'content',    label: 'Content Generation',       desc: 'AI generates outreach & creatives',         default: false },
  { key: 'budget',     label: 'Auto Budget Optimization', desc: 'AI adjusts budgets in real-time',           default: false },
];

const ROLE_COLOR = { Owner: C.accent, Admin: C.purple, Member: C.success };

const initials = name => name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

// ── Animations ────────────────────────────────────────────────────────────────
const fadeIn = keyframes`from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}`;

// ── Layout ────────────────────────────────────────────────────────────────────
const Page = styled.div`padding:20px;animation:${fadeIn} .2s ease;`;

// ── Section header ────────────────────────────────────────────────────────────
const SectionTitle = styled.h2`font-size:15px;font-weight:700;color:${C.text};margin:0 0 4px 0;`;
const SectionSub = styled.p`font-size:13px;color:${C.muted};margin:0 0 20px 0;`;
const ConnLink = styled(Link)`
  color:${C.accent};text-decoration:none;font-weight:600;
  &:hover{text-decoration:underline;}
`;

// ── Two-col grid ──────────────────────────────────────────────────────────────
const TwoCol = styled.div`
  display:grid;grid-template-columns:1fr 1fr;gap:16px;
  @media(max-width:900px){grid-template-columns:1fr;}
`;
const Card = styled.div`
  background:${C.card};border:1px solid ${C.border};border-radius:12px;padding:20px;
`;
const CardTitle = styled.h3`
  font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;
  color:${C.muted};margin:0 0 16px 0;
`;

// ── AI Toggles ────────────────────────────────────────────────────────────────
const ToggleRow = styled.div`
  display:flex;align-items:center;justify-content:space-between;padding:10px 0;
  border-bottom:1px solid ${C.border};&:last-child{border-bottom:none;}
`;
const ToggleInfo = styled.div`flex:1;min-width:0;`;
const ToggleLabel = styled.div`font-size:13px;font-weight:600;color:${C.text};`;
const ToggleDesc = styled.div`font-size:11px;color:${C.muted};margin-top:2px;`;
const PillSwitch = styled.div`
  width:42px;height:24px;border-radius:999px;cursor:pointer;flex-shrink:0;
  transition:background .2s;position:relative;margin-left:12px;
  background:${({ $on }) => $on ? C.accent : C.border};
`;
const PillCircle = styled.div`
  position:absolute;top:3px;width:18px;height:18px;border-radius:50%;background:#fff;
  transition:left .2s;
  left:${({ $on }) => $on ? '21px' : '3px'};
`;

// ── Team ──────────────────────────────────────────────────────────────────────
const TeamRow = styled.div`
  display:flex;align-items:center;gap:12px;padding:10px 0;
  border-bottom:1px solid ${C.border};&:last-child{border-bottom:none;}
`;
const Avatar = styled.div`
  width:34px;height:34px;border-radius:50%;background:${({ $color }) => $color};
  display:flex;align-items:center;justify-content:center;
  font-size:11px;font-weight:800;color:#fff;flex-shrink:0;
`;
const MemberInfo = styled.div`flex:1;min-width:0;`;
const MemberName = styled.div`font-size:13px;font-weight:700;color:${C.text};`;
const MemberEmail = styled.div`font-size:11px;color:${C.muted};`;
const RoleBadge = styled.span`
  font-size:10px;font-weight:700;text-transform:uppercase;
  padding:2px 8px;border-radius:999px;
  background:${({ $role }) => (ROLE_COLOR[$role] || C.muted) + '22'};
  color:${({ $role }) => ROLE_COLOR[$role] || C.muted};
`;

// ── Validation URLs ───────────────────────────────────────────────────────────
const ValidTitle = styled.div`
  font-size:12px;font-weight:700;color:${C.muted};margin:16px 0 10px;
  text-transform:uppercase;letter-spacing:.07em;
`;
const UrlRow = styled.div`display:flex;align-items:center;gap:8px;margin-bottom:8px;`;
const UrlNetwork = styled.span`font-size:12px;font-weight:600;color:${C.text};width:90px;flex-shrink:0;`;
const UrlInput = styled.input`
  flex:1;background:${C.surface};border:1px solid ${C.border};border-radius:6px;
  color:${C.muted};font-family:monospace;font-size:11px;padding:5px 8px;outline:none;
`;
const CopyBtn = styled.button`
  font-size:10px;font-weight:700;padding:4px 10px;border-radius:6px;cursor:pointer;
  background:none;border:1px solid ${C.border};color:${C.muted};
  ${({ $copied }) => $copied && css`border-color:${C.success};color:${C.success};`}
  &:hover{border-color:${C.accent};color:${C.accent};}
`;

// ── Component ─────────────────────────────────────────────────────────────────
export default function CRMSettings() {
  const initialToggles = Object.fromEntries(AI_TOGGLES.map(t => [t.key, t.default]));
  const [aiToggles, setAiToggles] = useState(initialToggles);
  const [copied, setCopied] = useState({});

  function handleCopy(url, key) {
    navigator.clipboard.writeText(url).catch(() => {});
    setCopied(prev => ({ ...prev, [key]: true }));
    setTimeout(() => setCopied(prev => ({ ...prev, [key]: false })), 1500);
  }

  return (
    <Page>
      <SectionTitle>Account Settings</SectionTitle>
      <SectionSub>
        Manage your AI preferences and team access. Looking for integrations? They moved to{' '}
        <ConnLink to="/crm/connections">Connections →</ConnLink>
      </SectionSub>

      <TwoCol>
        {/* AI Configuration */}
        <Card>
          <CardTitle>AI Configuration</CardTitle>
          {AI_TOGGLES.map(t => (
            <ToggleRow key={t.key}>
              <ToggleInfo>
                <ToggleLabel>{t.label}</ToggleLabel>
                <ToggleDesc>{t.desc}</ToggleDesc>
              </ToggleInfo>
              <PillSwitch
                $on={aiToggles[t.key]}
                onClick={() => setAiToggles(prev => ({ ...prev, [t.key]: !prev[t.key] }))}
              >
                <PillCircle $on={aiToggles[t.key]} />
              </PillSwitch>
            </ToggleRow>
          ))}
        </Card>

        {/* Team & Permissions */}
        <Card>
          <CardTitle>Team &amp; Permissions</CardTitle>
          {TEAM.map(member => (
            <TeamRow key={member.email}>
              <Avatar $color={member.color}>{initials(member.name)}</Avatar>
              <MemberInfo>
                <MemberName>{member.name}</MemberName>
                <MemberEmail>{member.email}</MemberEmail>
              </MemberInfo>
              <RoleBadge $role={member.role}>{member.role}</RoleBadge>
            </TeamRow>
          ))}

          <ValidTitle>Validation URLs</ValidTitle>
          {VALIDATION_URLS.map(v => (
            <UrlRow key={v.network}>
              <UrlNetwork>{v.code} {v.network}</UrlNetwork>
              <UrlInput readOnly value={v.url} />
              <CopyBtn
                $copied={copied[v.network]}
                onClick={() => handleCopy(v.url, v.network)}
              >
                {copied[v.network] ? 'Copied!' : 'Copy'}
              </CopyBtn>
            </UrlRow>
          ))}
        </Card>
      </TwoCol>
    </Page>
  );
}
