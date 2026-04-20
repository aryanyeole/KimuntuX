import { useState, useMemo } from 'react';
import styled, { keyframes, css } from 'styled-components';
import useStrategy from '../../hooks/useStrategy';
import { crm as C } from '../../styles/crmTheme';

// ── Animations ────────────────────────────────────────────────────────────────
const fadeIn = keyframes`from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}`;
const pulse = keyframes`0%,100%{opacity:1}50%{opacity:.4}`;
const spin = keyframes`to{transform:rotate(360deg)}`;

// ── Shared layout ─────────────────────────────────────────────────────────────
const Page = styled.div`padding:20px;animation:${fadeIn} .25s ease;`;
const SectionTitle = styled.h2`
  font-size:22px;font-weight:800;color:${C.text};margin:0 0 4px 0;
`;
const SectionSub = styled.p`font-size:13px;color:${C.muted};margin:0 0 20px 0;`;

// ── Wizard ────────────────────────────────────────────────────────────────────
const WizardWrap = styled.div`
  max-width:680px;margin:0 auto;animation:${fadeIn} .2s ease;
`;
const ProgressRow = styled.div`
  display:flex;align-items:center;gap:8px;margin-bottom:28px;
`;
const ProgressSegment = styled.div`
  flex:1;height:4px;border-radius:999px;
  background:${({ $active }) => $active ? C.accent : C.border};
  transition:background .3s;
`;
const StepLabel = styled.div`
  font-size:11px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;
  color:${C.muted};margin-bottom:16px;
`;
const PhaseTitle = styled.h3`
  font-size:20px;font-weight:800;color:${C.text};margin:0 0 6px 0;
`;
const PhaseSub = styled.p`font-size:13px;color:${C.muted};margin:0 0 24px 0;`;

const FieldGroup = styled.div`display:flex;flex-direction:column;gap:16px;`;
const Field = styled.div`display:flex;flex-direction:column;gap:6px;`;
const Label = styled.label`font-size:12px;font-weight:700;color:${C.muted};text-transform:uppercase;letter-spacing:.06em;`;
const Input = styled.input`
  background:${C.card};border:1px solid ${C.border};border-radius:8px;
  color:${C.text};font-size:13px;padding:10px 12px;outline:none;
  &::placeholder{color:${C.muted};}
  &:focus{border-color:${C.accent};}
`;
const Textarea = styled.textarea`
  background:${C.card};border:1px solid ${C.border};border-radius:8px;
  color:${C.text};font-size:13px;padding:10px 12px;outline:none;resize:vertical;
  min-height:88px;line-height:1.5;
  &::placeholder{color:${C.muted};}
  &:focus{border-color:${C.accent};}
`;
const Select = styled.select`
  background:${C.card};border:1px solid ${C.border};border-radius:8px;
  color:${C.text};font-size:13px;padding:10px 12px;outline:none;cursor:pointer;
  &:focus{border-color:${C.accent};}
  option{background:${C.card};}
`;
const BudgetWrap = styled.div`position:relative;`;
const BudgetPrefix = styled.span`
  position:absolute;left:12px;top:50%;transform:translateY(-50%);
  font-size:13px;color:${C.muted};pointer-events:none;
`;
const BudgetInput = styled(Input)`padding-left:24px;`;

const CheckboxGrid = styled.div`
  display:grid;grid-template-columns:repeat(3,1fr);gap:8px;
`;
const CheckboxItem = styled.label`
  display:flex;align-items:center;gap:8px;padding:8px 12px;
  background:${C.card};border:1px solid ${({ $checked }) => $checked ? C.accent : C.border};
  border-radius:8px;cursor:pointer;font-size:12px;font-weight:600;color:${C.text};
  transition:border .15s;
  &:hover{border-color:${C.accent}44;}
`;

const WizardFooter = styled.div`
  display:flex;align-items:center;justify-content:space-between;
  margin-top:32px;padding-top:20px;border-top:1px solid ${C.border};
`;
const BackBtn = styled.button`
  font-size:13px;font-weight:600;padding:9px 20px;border-radius:8px;cursor:pointer;
  background:none;border:1px solid ${C.border};color:${C.muted};
  &:hover{border-color:${C.accent};color:${C.text};}
`;
const NextBtn = styled.button`
  font-size:13px;font-weight:700;padding:9px 24px;border-radius:8px;cursor:pointer;
  background:${C.accent};color:#fff;border:none;
  &:hover{background:#4d93ff;}
  &:disabled{opacity:.5;cursor:default;}
`;
const GenerateBtn = styled.button`
  font-size:14px;font-weight:800;padding:11px 28px;border-radius:10px;cursor:pointer;
  background:linear-gradient(135deg,#00c48c,#2d7aff);color:#fff;border:none;
  display:flex;align-items:center;gap:8px;
  &:hover{opacity:.9;}
  &:disabled{opacity:.5;cursor:default;}
`;

// ── Loading state ─────────────────────────────────────────────────────────────
const LoadingWrap = styled.div`
  display:flex;flex-direction:column;align-items:center;justify-content:center;
  min-height:340px;gap:16px;
`;
const Spinner = styled.div`
  width:40px;height:40px;border-radius:50%;
  border:3px solid ${C.border};border-top-color:${C.accent};
  animation:${spin} .8s linear infinite;
`;
const LoadingText = styled.div`
  font-size:15px;font-weight:600;color:${C.text};animation:${pulse} 1.8s ease infinite;
`;
const LoadingSub = styled.div`font-size:12px;color:${C.muted};`;

// ── Strategy view styled components ──────────────────────────────────────────

// Page header
const ViewHeader = styled.div`
  display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:20px;
`;
const ViewTitleRow = styled.div`display:flex;align-items:center;gap:10px;`;
const AiBadge = styled.span`
  font-size:9px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;
  padding:3px 8px;border-radius:999px;
  background:linear-gradient(90deg,${C.accent},${C.purple});color:#fff;
`;
const ViewSubtitle = styled.div`font-size:12px;color:${C.muted};margin-top:4px;`;
const HeaderActions = styled.div`display:flex;gap:8px;align-items:center;`;
const StratSelect = styled.select`
  font-size:12px;font-weight:600;background:${C.card};border:1px solid ${C.border};
  border-radius:8px;color:${C.text};padding:6px 10px;outline:none;cursor:pointer;
  option{background:${C.card};}
`;
const ExportBtn = styled.button`
  font-size:12px;font-weight:700;padding:7px 14px;border-radius:8px;cursor:pointer;
  background:none;border:1px solid ${C.border};color:${C.muted};
  &:hover{border-color:${C.muted};color:${C.text};}
`;
const NewStratBtn = styled.button`
  font-size:12px;font-weight:700;padding:7px 14px;border-radius:8px;cursor:pointer;
  background:none;border:1px solid ${C.accent}66;color:${C.accent};
  &:hover{background:${C.accent}22;}
`;

// Metrics row
const MetricRow = styled.div`
  display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:16px;
`;
const MetricCard = styled.div`
  background:${C.card};border:1px solid ${C.border};border-radius:12px;
  padding:16px 18px;display:flex;flex-direction:column;align-items:center;gap:5px;
`;
const MetricLabel = styled.div`
  font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:${C.muted};
`;
const MetricText = styled.div`font-size:11px;color:${C.muted};`;

// SVG score ring
function ScoreRingSvg({ score, color, size = 72 }) {
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={C.border} strokeWidth="6"/>
      <circle
        cx={size/2} cy={size/2} r={r} fill="none"
        stroke={color} strokeWidth="6"
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        style={{ transition: 'stroke-dasharray .6s ease' }}
      />
      <text
        x={size/2} y={size/2} textAnchor="middle" dominantBaseline="central"
        fill={color} fontSize="18" fontWeight="800"
        style={{ transform: `rotate(90deg) translate(0, -${size/2*2}px)`, transformOrigin: `${size/2}px ${size/2}px` }}
      >
        {score}
      </text>
    </svg>
  );
}

// Journey progress segments
const JourneyWrap = styled.div`display:flex;gap:3px;margin-top:2px;`;
const JourneySeg = styled.div`
  height:5px;flex:1;border-radius:999px;
  background:${({ $filled }) => $filled ? C.accent : C.border};
`;

const MetricBig = styled.div`
  font-size:22px;font-weight:800;color:${C.text};line-height:1;
`;

// Main layout
const MainLayout = styled.div`
  display:grid;grid-template-columns:1fr 300px;gap:16px;margin-bottom:16px;
`;
const LeftCol = styled.div`display:flex;flex-direction:column;gap:16px;`;

// Strategy core card
const CoreCard = styled.div`
  background:linear-gradient(135deg,${C.card} 0%,#1a2540 100%);
  border:1px solid ${C.border};border-radius:14px;padding:22px;
  position:relative;overflow:hidden;
  &:before{
    content:'';position:absolute;inset:0;
    background:linear-gradient(135deg,${C.accent}08 0%,${C.purple}06 100%);
    pointer-events:none;
  }
`;
const CoreHeader = styled.div`
  display:flex;align-items:center;gap:10px;margin-bottom:18px;
`;
const CoreTitle = styled.h3`font-size:15px;font-weight:800;color:${C.text};margin:0;flex:1;`;
const CoreDate = styled.div`font-size:11px;color:${C.muted};`;
const CoreGrid = styled.div`
  display:grid;grid-template-columns:repeat(3,1fr);gap:18px;
`;
const CoreSection = styled.div``;
const CoreLabel = styled.div`
  font-size:9px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;
  color:${C.accent};margin-bottom:8px;padding-bottom:6px;
  border-bottom:1px solid ${C.border};
`;
const PersonaName = styled.div`font-size:14px;font-weight:700;color:${C.text};margin-bottom:2px;`;
const PersonaMeta = styled.div`font-size:11px;color:${C.muted};margin-bottom:8px;line-height:1.4;`;
const TagWrap = styled.div`display:flex;flex-wrap:wrap;gap:4px;`;
const Tag = styled.span`
  font-size:10px;font-weight:600;padding:2px 7px;border-radius:999px;
  background:${C.surface};border:1px solid ${C.border};color:${C.muted};
`;
const UspStatement = styled.div`
  font-size:13px;font-weight:700;color:${C.text};line-height:1.6;margin-bottom:8px;
  font-style:italic;
`;
const ProofPoint = styled.div`
  font-size:11px;color:${C.muted};margin-bottom:4px;
  &:before{content:"✓ ";color:${C.success};}
`;
const GTMPhase = styled.div`
  display:flex;flex-direction:column;gap:1px;margin-bottom:10px;
  &:last-child{margin-bottom:0;}
`;
const GTMName = styled.div`font-size:12px;font-weight:700;color:${C.text};`;
const GTMDuration = styled.div`font-size:10px;color:${C.muted};`;
const GTMTactics = styled.div`
  font-size:10px;color:${C.muted};margin-top:3px;line-height:1.4;
`;

// Channel scores
const ChannelRow = styled.div`display:flex;flex-wrap:wrap;gap:8px;`;
const ChannelPill = styled.div`
  font-size:11px;font-weight:700;padding:6px 14px;border-radius:999px;
  background:${({ $color }) => $color}22;
  color:${({ $color }) => $color};
  border:1px solid ${({ $color }) => $color}44;
  ${({ $top }) => $top && `
    font-size:12px;
    padding:7px 16px;
    border-width:2px;
  `}
`;

// Execution modules
const ExecGrid = styled.div`
  display:grid;grid-template-columns:repeat(4,1fr);gap:12px;
`;
const ExecCard = styled.div`
  background:${C.card};border:1px solid ${C.border};border-radius:12px;
  overflow:hidden;display:flex;flex-direction:column;
`;
const ExecTop = styled.div`
  height:3px;background:${({ $color }) => $color};
`;
const ExecBody = styled.div`padding:16px;flex:1;`;
const ExecIcon = styled.div`font-size:20px;margin-bottom:8px;`;
const ExecTitle = styled.div`font-size:13px;font-weight:700;color:${C.text};margin-bottom:4px;`;
const ExecSub = styled.div`font-size:11px;color:${C.muted};margin-bottom:10px;line-height:1.4;`;
const ExecTactic = styled.div`
  font-size:11px;color:${C.text};margin-bottom:3px;
  &:before{content:"→ ";color:${C.muted};}
`;
const ManageBtn = styled.button`
  display:block;width:calc(100% - 32px);margin:0 16px 16px;
  font-size:11px;font-weight:700;padding:6px;border-radius:6px;cursor:pointer;
  background:none;border:1px solid ${C.border};color:${C.muted};
  &:hover{border-color:${C.accent};color:${C.accent};}
`;

// Two-column
const TwoCol = styled.div`
  display:grid;grid-template-columns:1fr 1fr;gap:12px;
`;
const Card = styled.div`
  background:${C.card};border:1px solid ${C.border};border-radius:12px;padding:18px;
`;
const CardTitle = styled.h3`
  font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;
  color:${C.muted};margin:0 0 14px 0;
`;
const WeekBlock = styled.div`margin-bottom:12px;&:last-child{margin-bottom:0;}`;
const WeekHeader = styled.div`
  font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;
  color:${C.accent};margin-bottom:5px;
`;
const TaskItem = styled.div`
  font-size:11px;color:${C.text};margin-bottom:3px;
  &:before{content:"• ";color:${C.muted};}
`;
const KpiText = styled.div`font-size:10px;color:${C.muted};margin-top:3px;`;
const BudgetItem = styled.div`margin-bottom:10px;`;
const BudgetLabelRow = styled.div`display:flex;justify-content:space-between;margin-bottom:4px;`;
const BudgetBarBg = styled.div`height:5px;background:${C.border};border-radius:999px;overflow:hidden;`;
const BudgetBarFill = styled.div`
  height:100%;border-radius:999px;background:${({ $color }) => $color};
  width:${({ $pct }) => $pct}%;transition:width .5s ease;
`;
const InsightCard = styled.div`
  background:${C.accent}11;border:1px solid ${C.accent}33;border-radius:10px;
  padding:12px 14px;margin-top:14px;
`;
const InsightLabel = styled.div`
  font-size:9px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;
  color:${C.accent};margin-bottom:5px;
`;
const InsightText = styled.div`font-size:12px;color:${C.text};line-height:1.6;`;

// KPI row
const KpiStrip = styled.div`
  display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin-bottom:16px;
`;
const KpiStripCard = styled.div`
  background:${C.card};border:1px solid ${C.border};border-radius:12px;padding:14px 16px;
`;
const KpiName = styled.div`
  font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;
  color:${C.muted};margin-bottom:6px;
`;
const KpiVal = styled.div`font-size:20px;font-weight:800;color:${C.text};line-height:1;`;
const KpiChange = styled.div`font-size:11px;font-weight:700;color:${C.success};margin-top:4px;`;

// AI Coach sidebar
const CoachCard = styled.div`
  background:${C.card};border:1px solid ${C.border};border-radius:14px;
  overflow:hidden;display:flex;flex-direction:column;height:fit-content;
  position:sticky;top:0;
`;
const CoachHeader = styled.div`
  padding:16px;border-bottom:1px solid ${C.border};
  display:flex;align-items:center;gap:8px;
`;
const CoachTitle = styled.div`font-size:13px;font-weight:800;color:${C.text};flex:1;`;
const BetaBadge = styled.span`
  font-size:9px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;
  padding:2px 6px;border-radius:999px;
  background:${C.warning}22;color:${C.warning};border:1px solid ${C.warning}44;
`;
const CoachBody = styled.div`padding:16px;display:flex;flex-direction:column;gap:14px;`;
const CoachAvatar = styled.div`
  width:56px;height:56px;border-radius:50%;
  background:linear-gradient(135deg,${C.accent}44,${C.purple}44);
  border:2px solid ${C.accent}44;
  display:flex;align-items:center;justify-content:center;
  font-size:28px;margin:0 auto;
`;
const CoachDesc = styled.div`font-size:12px;color:${C.muted};text-align:center;line-height:1.5;`;
const ChatBubble = styled.div`
  background:${C.surface};border:1px solid ${C.border};border-radius:10px;
  border-bottom-left-radius:2px;padding:12px;
  font-size:12px;color:${C.text};line-height:1.6;
`;
const ActionCard = styled.div`
  background:${C.surface};border:1px solid ${C.border};border-radius:10px;padding:12px;
`;
const ActionTitle = styled.div`
  font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.07em;
  color:${C.muted};margin-bottom:6px;
`;
const ActionText = styled.div`font-size:12px;color:${C.text};margin-bottom:10px;line-height:1.4;`;
const ActionBtn = styled.button`
  font-size:11px;font-weight:700;padding:6px 12px;border-radius:7px;cursor:pointer;
  background:linear-gradient(90deg,${C.accent},${C.purple});color:#fff;border:none;width:100%;
  &:hover{opacity:.85;}
`;
const ActionLinks = styled.div`display:flex;gap:12px;margin-top:8px;`;
const ActionLink = styled.span`
  font-size:11px;color:${C.muted};cursor:pointer;
  &:hover{color:${C.accent};}
`;
const ChatInput = styled.div`
  padding:12px;border-top:1px solid ${C.border};display:flex;gap:8px;
`;
const ChatField = styled.input`
  flex:1;background:${C.surface};border:1px solid ${C.border};border-radius:7px;
  color:${C.text};font-size:12px;padding:7px 10px;outline:none;
  &::placeholder{color:${C.muted};}
  &:focus{border-color:${C.accent};}
`;
const ChatSend = styled.button`
  font-size:12px;font-weight:700;padding:7px 12px;border-radius:7px;cursor:pointer;
  background:${C.accent};color:#fff;border:none;
  &:hover{background:#4d93ff;}
`;

// Positioning
const PositioningCard = styled.div`
  background:${C.card};border:1px solid ${C.border};border-radius:12px;padding:24px;
  margin-bottom:16px;
`;
const PositioningText = styled.div`
  font-size:17px;font-style:italic;color:${C.text};line-height:1.7;
  text-align:center;font-weight:500;
`;

// Error
const ErrorBox = styled.div`
  background:${C.danger}11;border:1px solid ${C.danger}33;border-radius:10px;
  padding:12px 16px;font-size:13px;color:${C.danger};margin-bottom:16px;
`;

// ── Helpers ───────────────────────────────────────────────────────────────────
const CHANNELS = ['SEO', 'Paid Ads', 'Social Media', 'Email', 'Affiliate', 'None'];
const CHANNEL_KEY_MAP = {
  seo: 'SEO', paid_social: 'Social Ads', google_ads: 'Google Ads',
  email: 'Email', social_organic: 'Organic Social', affiliate: 'Affiliate',
};

function scoreColor(score) {
  if (score >= 70) return C.success;
  if (score >= 40) return C.warning;
  return C.danger;
}
function channelColor(score) {
  if (score >= 8) return C.success;
  if (score >= 5) return C.warning;
  return C.muted;
}
function pctNum(str) {
  if (!str) return 0;
  return parseInt(String(str).replace('%', ''), 10) || 0;
}
function fmtDate(dt) {
  return dt ? new Date(dt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '';
}

// ── Default wizard state ──────────────────────────────────────────────────────
const DEFAULT_WIZARD = {
  business_type: '', industry: '', product_description: '',
  pricing_model: '', growth_stage: '',
  target_audience_text: '', pain_point: '', competitors_text: '', geography: '', languages_text: '',
  monthly_budget: '', team_size: '', tried_channels: [], primary_goal: '', target_timeline: '',
};

// ── Component ─────────────────────────────────────────────────────────────────
export default function CRMStrategy() {
  const { strategies, loading: listLoading, createStrategy } = useStrategy();

  const [mode, setMode] = useState(null); // null = detecting, 'wizard', 'view'
  const [step, setStep] = useState(0); // 0=A, 1=B, 2=C
  const [wizard, setWizard] = useState(DEFAULT_WIZARD);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState(null);
  const [activeStrategyId, setActiveStrategyId] = useState(null);
  const [coachInput, setCoachInput] = useState('');

  // After list loads, decide initial mode
  useMemo(() => {
    if (listLoading) return;
    if (mode === null) {
      setMode(strategies.length > 0 ? 'view' : 'wizard');
      if (strategies.length > 0) setActiveStrategyId(strategies[0].id);
    }
  }, [listLoading, strategies, mode]);

  const activeStrategy = useMemo(
    () => strategies.find(s => s.id === activeStrategyId) || strategies[0] || null,
    [strategies, activeStrategyId]
  );

  // ── Wizard field updater ──────────────────────────────────────────────────
  function set(field, value) {
    setWizard(prev => ({ ...prev, [field]: value }));
  }
  function toggleChannel(ch) {
    setWizard(prev => ({
      ...prev,
      tried_channels: prev.tried_channels.includes(ch)
        ? prev.tried_channels.filter(c => c !== ch)
        : [...prev.tried_channels, ch],
    }));
  }

  // ── Validation ────────────────────────────────────────────────────────────
  function phaseAValid() {
    return wizard.business_type && wizard.industry && wizard.product_description.length >= 10;
  }

  // ── Submit ────────────────────────────────────────────────────────────────
  async function handleGenerate() {
    setGenerating(true);
    setGenError(null);
    try {
      const competitors = wizard.competitors_text
        ? wizard.competitors_text.split(',').map(s => s.trim()).filter(Boolean).slice(0, 3)
        : undefined;
      const languages = wizard.languages_text
        ? wizard.languages_text.split(',').map(s => s.trim()).filter(Boolean)
        : undefined;

      const payload = {
        business_type: wizard.business_type,
        industry: wizard.industry,
        product_description: wizard.product_description,
        pricing_model: wizard.pricing_model || undefined,
        growth_stage: wizard.growth_stage || undefined,
        target_audience: wizard.target_audience_text
          ? { description: wizard.target_audience_text }
          : undefined,
        pain_point: wizard.pain_point || undefined,
        competitors,
        geography: wizard.geography || undefined,
        languages,
        monthly_budget: wizard.monthly_budget ? parseFloat(wizard.monthly_budget) : undefined,
        team_size: wizard.team_size || undefined,
        tried_channels: wizard.tried_channels.length ? wizard.tried_channels : undefined,
        primary_goal: wizard.primary_goal || undefined,
        target_timeline: wizard.target_timeline ? parseInt(wizard.target_timeline) : undefined,
      };

      const result = await createStrategy(payload);
      setActiveStrategyId(result.id);
      setMode('view');
      setWizard(DEFAULT_WIZARD);
      setStep(0);
    } catch (err) {
      setGenError(err.message || 'Failed to generate strategy. Please try again.');
    } finally {
      setGenerating(false);
    }
  }

  // ── Loading / detecting ───────────────────────────────────────────────────
  if (listLoading || mode === null) {
    return (
      <Page>
        <LoadingWrap>
          <Spinner />
          <LoadingText>Loading your strategies…</LoadingText>
        </LoadingWrap>
      </Page>
    );
  }

  // ── Generating ────────────────────────────────────────────────────────────
  if (generating) {
    return (
      <Page>
        <LoadingWrap>
          <Spinner />
          <LoadingText>AI is generating your strategy…</LoadingText>
          <LoadingSub>This usually takes 15–30 seconds. Gemini is analyzing your business profile.</LoadingSub>
        </LoadingWrap>
      </Page>
    );
  }

  // ── WIZARD MODE ───────────────────────────────────────────────────────────
  if (mode === 'wizard') {
    return (
      <Page>
        <WizardWrap>
          <SectionTitle>Strategy Wizard</SectionTitle>
          <SectionSub>Answer a few questions and AI will build your personalized marketing strategy.</SectionSub>

          {genError && <ErrorBox>{genError}</ErrorBox>}

          <ProgressRow>
            {[0, 1, 2].map(i => <ProgressSegment key={i} $active={i <= step} />)}
          </ProgressRow>

          {/* ── Phase A: Business ── */}
          {step === 0 && (
            <>
              <StepLabel>Step 1 of 3</StepLabel>
              <PhaseTitle>Your Business</PhaseTitle>
              <PhaseSub>Tell us what you do and where you are in your journey.</PhaseSub>
              <FieldGroup>
                <Field>
                  <Label>Business Type *</Label>
                  <Select value={wizard.business_type} onChange={e => set('business_type', e.target.value)}>
                    <option value="">Select type…</option>
                    {['B2B', 'B2C', 'SaaS', 'Marketplace', 'Other'].map(v => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </Select>
                </Field>
                <Field>
                  <Label>Industry *</Label>
                  <Input
                    placeholder="e.g. Health & Wellness, SaaS, E-commerce"
                    value={wizard.industry}
                    onChange={e => set('industry', e.target.value)}
                  />
                </Field>
                <Field>
                  <Label>Product / Service Description *</Label>
                  <Textarea
                    placeholder="Describe what you sell, who benefits, and what makes it valuable…"
                    value={wizard.product_description}
                    onChange={e => set('product_description', e.target.value)}
                  />
                </Field>
                <Field>
                  <Label>Pricing Model</Label>
                  <Select value={wizard.pricing_model} onChange={e => set('pricing_model', e.target.value)}>
                    <option value="">Select model…</option>
                    {[['subscription','Subscription'],['one-time','One-time'],['freemium','Freemium'],
                      ['service','Service-based'],['physical','Physical product']].map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </Select>
                </Field>
                <Field>
                  <Label>Growth Stage</Label>
                  <Select value={wizard.growth_stage} onChange={e => set('growth_stage', e.target.value)}>
                    <option value="">Select stage…</option>
                    {[['idea','Idea'],['prelaunch','Pre-launch'],['launched','Launched'],['scaling','Scaling']].map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </Select>
                </Field>
              </FieldGroup>
            </>
          )}

          {/* ── Phase B: Market ── */}
          {step === 1 && (
            <>
              <StepLabel>Step 2 of 3</StepLabel>
              <PhaseTitle>Your Market</PhaseTitle>
              <PhaseSub>Help us understand your target customers and competitive landscape.</PhaseSub>
              <FieldGroup>
                <Field>
                  <Label>Ideal Customer</Label>
                  <Textarea
                    placeholder="Describe their age, role, location, needs, and what keeps them up at night…"
                    value={wizard.target_audience_text}
                    onChange={e => set('target_audience_text', e.target.value)}
                  />
                </Field>
                <Field>
                  <Label>Problem You Solve</Label>
                  <Textarea
                    placeholder="What pain point does your product eliminate?"
                    value={wizard.pain_point}
                    onChange={e => set('pain_point', e.target.value)}
                  />
                </Field>
                <Field>
                  <Label>Top Competitors</Label>
                  <Input
                    placeholder="e.g. Competitor A, Competitor B (comma-separated, up to 3)"
                    value={wizard.competitors_text}
                    onChange={e => set('competitors_text', e.target.value)}
                  />
                </Field>
                <Field>
                  <Label>Geographic Market</Label>
                  <Select value={wizard.geography} onChange={e => set('geography', e.target.value)}>
                    <option value="">Select geography…</option>
                    {['Local','National','Global'].map(v => (
                      <option key={v} value={v.toLowerCase()}>{v}</option>
                    ))}
                  </Select>
                </Field>
                <Field>
                  <Label>Audience Languages</Label>
                  <Input
                    placeholder="e.g. English, Spanish, French (comma-separated)"
                    value={wizard.languages_text}
                    onChange={e => set('languages_text', e.target.value)}
                  />
                </Field>
              </FieldGroup>
            </>
          )}

          {/* ── Phase C: Resources ── */}
          {step === 2 && (
            <>
              <StepLabel>Step 3 of 3</StepLabel>
              <PhaseTitle>Your Resources</PhaseTitle>
              <PhaseSub>Tell us your budget, team, and goals so AI can prioritize the right channels.</PhaseSub>
              <FieldGroup>
                <Field>
                  <Label>Monthly Marketing Budget</Label>
                  <BudgetWrap>
                    <BudgetPrefix>$</BudgetPrefix>
                    <BudgetInput
                      type="number"
                      min="0"
                      placeholder="500"
                      value={wizard.monthly_budget}
                      onChange={e => set('monthly_budget', e.target.value)}
                    />
                  </BudgetWrap>
                </Field>
                <Field>
                  <Label>Team Size</Label>
                  <Select value={wizard.team_size} onChange={e => set('team_size', e.target.value)}>
                    <option value="">Select size…</option>
                    {[['1','Just me'],['2-5','2–5 people'],['6-20','6–20 people'],['20+','20+ people']].map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </Select>
                </Field>
                <Field>
                  <Label>Channels Already Tried</Label>
                  <CheckboxGrid>
                    {CHANNELS.map(ch => (
                      <CheckboxItem key={ch} $checked={wizard.tried_channels.includes(ch)}>
                        <input
                          type="checkbox"
                          checked={wizard.tried_channels.includes(ch)}
                          onChange={() => toggleChannel(ch)}
                          style={{ accentColor: C.accent }}
                        />
                        {ch}
                      </CheckboxItem>
                    ))}
                  </CheckboxGrid>
                </Field>
                <Field>
                  <Label>Primary Goal</Label>
                  <Select value={wizard.primary_goal} onChange={e => set('primary_goal', e.target.value)}>
                    <option value="">Select goal…</option>
                    {[['leads','Generate Leads'],['sales','Increase Sales'],
                      ['brand_awareness','Build Brand Awareness'],['retention','Retain Customers']].map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </Select>
                </Field>
                <Field>
                  <Label>Timeline to First Results</Label>
                  <Select value={wizard.target_timeline} onChange={e => set('target_timeline', e.target.value)}>
                    <option value="">Select timeline…</option>
                    {[30, 60, 90, 180].map(d => (
                      <option key={d} value={d}>{d} days</option>
                    ))}
                  </Select>
                </Field>
              </FieldGroup>
            </>
          )}

          <WizardFooter>
            <BackBtn
              onClick={() => step === 0 ? (strategies.length > 0 ? setMode('view') : null) : setStep(s => s - 1)}
              disabled={step === 0 && strategies.length === 0}
            >
              {step === 0 ? (strategies.length > 0 ? '← Back' : 'Back') : '← Back'}
            </BackBtn>
            {step < 2 ? (
              <NextBtn
                onClick={() => setStep(s => s + 1)}
                disabled={step === 0 && !phaseAValid()}
              >
                Next →
              </NextBtn>
            ) : (
              <GenerateBtn onClick={handleGenerate}>
                Generate Strategy
              </GenerateBtn>
            )}
          </WizardFooter>
        </WizardWrap>
      </Page>
    );
  }

  // ── STRATEGY VIEW ─────────────────────────────────────────────────────────
  const out = activeStrategy?.strategy_output || {};
  const score = activeStrategy?.strategy_score || out.strategy_score || 0;
  const persona = (out.target_personas || [])[0] || {};
  const usp = out.usp || {};
  const gtm = out.gtm_strategy || {};
  const channelScores = out.channel_scores || {};
  const plan = out.ninety_day_plan || [];
  const budgetAlloc = out.budget_allocation || {};
  const keyInsight = out.key_insight || '';
  const positioning = out.positioning || '';

  // Journey progress: days elapsed vs target timeline
  const totalTimeline = activeStrategy?.target_timeline || 90;
  const daysElapsed = activeStrategy?.created_at
    ? Math.floor((Date.now() - new Date(activeStrategy.created_at)) / 86400000)
    : 0;
  const JOURNEY_SEGS = 12;
  const filledSegs = Math.min(JOURNEY_SEGS, Math.round((daysElapsed / totalTimeline) * JOURNEY_SEGS));

  // Channel scores sorted
  const channelEntries = Object.entries(channelScores).sort(([, a], [, b]) => b - a);
  const topChannelKey = channelEntries[0]?.[0];

  // Execution modules from GTM phases + optimization
  const execModules = [
    {
      icon: '01', title: gtm.phase1?.name || 'Foundation',
      sub: gtm.phase1?.duration || 'Weeks 1–4',
      tactics: (gtm.phase1?.tactics || ['Define brand voice', 'Set up analytics', 'Launch landing page']).slice(0, 3),
      color: C.accent,
    },
    {
      icon: '02', title: gtm.phase2?.name || 'Growth',
      sub: gtm.phase2?.duration || 'Weeks 5–8',
      tactics: (gtm.phase2?.tactics || ['Run first paid campaign', 'Build email list', 'Test creatives']).slice(0, 3),
      color: C.success,
    },
    {
      icon: '03', title: gtm.phase3?.name || 'Scale',
      sub: gtm.phase3?.duration || 'Weeks 9–12',
      tactics: (gtm.phase3?.tactics || ['Scale winning channels', 'Add retargeting', 'Expand audience']).slice(0, 3),
      color: C.purple,
    },
    {
      icon: '04', title: 'Optimization',
      sub: 'Ongoing',
      tactics: ['A/B test ad creatives', 'Retarget engaged users', 'Review KPIs weekly'],
      color: C.warning,
    },
  ];

  // KPI strip (placeholder until campaign tracking is live)
  const KPI_STRIP = [
    { name: 'Leads / Mo',  val: '—', note: 'Connect campaigns' },
    { name: 'Conv. Rate',  val: '—', note: 'Track conversions' },
    { name: 'Avg CPA',     val: '—', note: 'Link ad spend' },
    { name: 'ROAS',        val: '—', note: 'Add revenue data' },
    { name: 'Est. LTV',    val: '—', note: 'From lead scores' },
  ];

  // Coach dynamic message
  const topChannelLabel = topChannelKey ? (CHANNEL_KEY_MAP[topChannelKey] || topChannelKey) : 'content marketing';
  const coachMessage = keyInsight
    ? `Score: ${score}/100. Prioritize ${topChannelLabel} — it's your highest-potential channel. ${keyInsight}`
    : `Your strategy score is ${score}/100. Start with the ${gtm.phase1?.name || 'Foundation'} phase and track your KPIs weekly.`;

  return (
    <Page>
      {/* ── Page header ── */}
      <ViewHeader>
        <div>
          <ViewTitleRow>
            <SectionTitle>Marketing Strategy</SectionTitle>
            <AiBadge>AI Powered</AiBadge>
          </ViewTitleRow>
          <ViewSubtitle>
            {[activeStrategy?.industry, activeStrategy?.business_type, `Generated ${fmtDate(activeStrategy?.created_at)}`].filter(Boolean).join(' · ')}
          </ViewSubtitle>
        </div>
        <HeaderActions>
          {strategies.length > 1 && (
            <StratSelect
              value={activeStrategyId || ''}
              onChange={e => setActiveStrategyId(e.target.value)}
            >
              {strategies.map(s => (
                <option key={s.id} value={s.id}>
                  {s.industry} · {s.business_type} · {fmtDate(s.created_at)}
                </option>
              ))}
            </StratSelect>
          )}
          <ExportBtn>Export PDF</ExportBtn>
          <NewStratBtn onClick={() => { setMode('wizard'); setStep(0); }}>+ New Strategy</NewStratBtn>
        </HeaderActions>
      </ViewHeader>

      {/* ── Metrics row ── */}
      <MetricRow>
        <MetricCard>
          <MetricLabel>Strategy Score</MetricLabel>
          <ScoreRingSvg score={score} color={scoreColor(score)} size={72} />
          <MetricText>out of 100</MetricText>
        </MetricCard>
        <MetricCard>
          <MetricLabel>Current Phase</MetricLabel>
          <MetricBig style={{ color: C.accent, fontSize: 15, textTransform: 'capitalize', textAlign: 'center', lineHeight: 1.2 }}>
            {activeStrategy?.current_phase || 'Foundation'}
          </MetricBig>
          <MetricText style={{ textTransform: 'capitalize' }}>
            {(activeStrategy?.growth_stage || 'Early Stage').replace('_', ' ')}
          </MetricText>
        </MetricCard>
        <MetricCard>
          <MetricLabel>Journey Progress</MetricLabel>
          <MetricBig>{daysElapsed}d</MetricBig>
          <JourneyWrap>
            {Array.from({ length: JOURNEY_SEGS }, (_, i) => (
              <JourneySeg key={i} $filled={i < filledSegs} />
            ))}
          </JourneyWrap>
          <MetricText>of {totalTimeline} days</MetricText>
        </MetricCard>
        <MetricCard>
          <MetricLabel>Active Streak</MetricLabel>
          <MetricBig style={{ fontSize: 26 }}>5</MetricBig>
          <MetricText>days this week</MetricText>
        </MetricCard>
      </MetricRow>

      {/* ── Main layout: 75% left / 25% coach ── */}
      <MainLayout>
        <LeftCol>
          {/* Strategy core card */}
          <CoreCard>
            <CoreHeader>
              <span style={{ fontSize: 12, fontWeight: 800, color: C.accent }}>AI</span>
              <CoreTitle>AI Growth Strategy</CoreTitle>
              <CoreDate>{fmtDate(activeStrategy?.created_at)}</CoreDate>
            </CoreHeader>
            <CoreGrid>
              <CoreSection>
                <CoreLabel>Target Persona</CoreLabel>
                {persona.name && <PersonaName>{persona.name}</PersonaName>}
                <PersonaMeta>
                  {[persona.age, persona.role, persona.location].filter(Boolean).join(' · ')}
                </PersonaMeta>
                {persona.pain_points?.length > 0 && (
                  <TagWrap>
                    {persona.pain_points.map((p, i) => <Tag key={i}>{p}</Tag>)}
                  </TagWrap>
                )}
              </CoreSection>
              <CoreSection>
                <CoreLabel>Unique Value Proposition</CoreLabel>
                {usp.statement && <UspStatement>"{usp.statement}"</UspStatement>}
                {(usp.proof_points || []).map((p, i) => <ProofPoint key={i}>{p}</ProofPoint>)}
              </CoreSection>
              <CoreSection>
                <CoreLabel>Go-To-Market Phases</CoreLabel>
                {['phase1', 'phase2', 'phase3'].map(k => gtm[k] && (
                  <GTMPhase key={k}>
                    <GTMName>{gtm[k].name}</GTMName>
                    <GTMDuration>{gtm[k].duration}</GTMDuration>
                    {gtm[k].tactics?.slice(0, 1).map((t, i) => (
                      <GTMTactics key={i}>{t}</GTMTactics>
                    ))}
                  </GTMPhase>
                ))}
              </CoreSection>
            </CoreGrid>
          </CoreCard>

          {/* Channel scores */}
          <ChannelRow>
            {channelEntries.map(([key, val]) => (
              <ChannelPill key={key} $color={channelColor(val)} $top={key === topChannelKey}>
                {key === topChannelKey && '★ '}{CHANNEL_KEY_MAP[key] || key} — {val}/10
              </ChannelPill>
            ))}
          </ChannelRow>

          {/* Execution modules */}
          <ExecGrid>
            {execModules.map((mod, i) => (
              <ExecCard key={i}>
                <ExecTop $color={mod.color} />
                <ExecBody>
                  <ExecIcon>{mod.icon}</ExecIcon>
                  <ExecTitle>{mod.title}</ExecTitle>
                  <ExecSub>{mod.sub}</ExecSub>
                  {mod.tactics.map((t, j) => <ExecTactic key={j}>{t}</ExecTactic>)}
                </ExecBody>
                <ManageBtn>Manage</ManageBtn>
              </ExecCard>
            ))}
          </ExecGrid>

          {/* 90-day plan + budget */}
          <TwoCol>
            <Card>
              <CardTitle>90-Day Action Plan</CardTitle>
              {plan.length === 0 && (
                <div style={{ fontSize: 12, color: C.muted }}>No plan data. Re-generate your strategy.</div>
              )}
              {plan.map((block, i) => (
                <WeekBlock key={i}>
                  <WeekHeader>Week {block.week}</WeekHeader>
                  {(block.tasks || []).map((t, j) => <TaskItem key={j}>{t}</TaskItem>)}
                  {block.kpis?.length > 0 && (
                    <KpiText>KPIs: {block.kpis.join(' · ')}</KpiText>
                  )}
                </WeekBlock>
              ))}
            </Card>
            <Card>
              <CardTitle>Budget Allocation</CardTitle>
              {[
                { label: 'Organic', key: 'organic', color: C.success },
                { label: 'Paid',    key: 'paid',    color: C.accent  },
                { label: 'Tools',   key: 'tools',   color: C.purple  },
              ].map(({ label, key, color }) => (
                <BudgetItem key={key}>
                  <BudgetLabelRow>
                    <span style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{label}</span>
                    <span style={{ fontSize: 12, color: C.muted }}>{budgetAlloc[key] || '0%'}</span>
                  </BudgetLabelRow>
                  <BudgetBarBg>
                    <BudgetBarFill $color={color} $pct={pctNum(budgetAlloc[key])} />
                  </BudgetBarBg>
                </BudgetItem>
              ))}
              {keyInsight && (
                <InsightCard>
                  <InsightLabel>Key Insight</InsightLabel>
                  <InsightText>{keyInsight}</InsightText>
                </InsightCard>
              )}
            </Card>
          </TwoCol>

          {/* KPI strip */}
          <KpiStrip>
            {KPI_STRIP.map((kpi, i) => (
              <KpiStripCard key={i}>
                <KpiName>{kpi.name}</KpiName>
                <KpiVal>{kpi.val}</KpiVal>
                <KpiChange style={{ color: C.muted, fontSize: 10 }}>{kpi.note}</KpiChange>
              </KpiStripCard>
            ))}
          </KpiStrip>
        </LeftCol>

        {/* ── AI Coach sidebar ── */}
        <CoachCard>
          <CoachHeader>
            <CoachTitle>AI Strategy Coach</CoachTitle>
            <BetaBadge>BETA</BetaBadge>
          </CoachHeader>
          <CoachBody>
            <CoachAvatar>AI</CoachAvatar>
            <CoachDesc>
              Your personal AI coach analyzes your strategy and suggests next best actions.
            </CoachDesc>
            <ChatBubble>{coachMessage}</ChatBubble>
            <ActionCard>
              <ActionTitle>Recommended Next Step</ActionTitle>
              <ActionText>
                {gtm.phase1?.name
                  ? `Start your "${gtm.phase1.name}" phase. Focus on ${(gtm.phase1?.tactics || ['building your foundation'])[0]}.`
                  : 'Set up analytics tracking and define your first marketing experiment.'}
              </ActionText>
              <ActionBtn>Take Action</ActionBtn>
              <ActionLinks>
                <ActionLink>Remind me later</ActionLink>
                <ActionLink>All actions</ActionLink>
              </ActionLinks>
            </ActionCard>
          </CoachBody>
          <ChatInput>
            <ChatField
              placeholder="Ask your coach anything…"
              value={coachInput}
              onChange={e => setCoachInput(e.target.value)}
            />
            <ChatSend>→</ChatSend>
          </ChatInput>
        </CoachCard>
      </MainLayout>

      {/* ── Positioning statement ── */}
      {positioning && (
        <PositioningCard>
          <CardTitle style={{ textAlign: 'center', marginBottom: 16 }}>Positioning Statement</CardTitle>
          <PositioningText>"{positioning}"</PositioningText>
        </PositioningCard>
      )}
    </Page>
  );
}