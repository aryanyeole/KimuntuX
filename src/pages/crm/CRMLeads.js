import { useState, useEffect, useCallback, useRef } from 'react';
import styled, { keyframes, css } from 'styled-components';
import useLeads from '../../hooks/useLeads';
import useLead from '../../hooks/useLead';
import api from '../../services/api';
import { crm as C } from '../../styles/crmTheme';
import PlatformLogo from '../../components/crm/PlatformLogo';

// ── Shared data maps ──────────────────────────────────────────────────────────
const SOURCE_LABEL = {
  facebook_ads: 'Facebook Ads', google_ads: 'Google Ads', tiktok_ads: 'TikTok Ads',
  instagram: 'Instagram', landing_page: 'Landing Page', affiliate_link: 'Affiliate Link',
  website_widget: 'Widget', api: 'API',
};
const SOURCES = Object.keys(SOURCE_LABEL);
const STAGE_COLOR = {
  new: C.muted, contacted: C.accent, qualified: '#06b6d4',
  proposal: C.purple, negotiation: C.warning, won: C.success, lost: C.danger,
};
const STAGES = ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost'];
const ACTIVITY_ICON = {
  email_sent: '→', email_opened: '◎', email_clicked: '↗', call: '◌',
  meeting: '◈', form_submit: '◻', page_visit: '◦', ad_click: '✦',
  chatbot: '◉', note_added: '●', stage_changed: '⇄', score_updated: '★',
};
const CLASS_COLOR = { hot: C.danger, warm: C.warning, cold: C.muted };

// ── Helpers ───────────────────────────────────────────────────────────────────
function timeAgo(iso) {
  if (!iso) return '—';
  const d = Math.floor((Date.now() - new Date(iso)) / 86400000);
  if (d === 0) return 'today';
  if (d === 1) return '1d ago';
  if (d < 30) return `${d}d ago`;
  if (d < 365) return `${Math.floor(d / 30)}mo ago`;
  return `${Math.floor(d / 365)}y ago`;
}
function fmtMoney(n) {
  if (!n && n !== 0) return '—';
  return '$' + Number(n).toLocaleString(undefined, { maximumFractionDigits: 0 });
}
function initials(first, last) {
  return `${(first || '?')[0]}${(last || '?')[0]}`.toUpperCase();
}

// ── Animations ────────────────────────────────────────────────────────────────
const fadeIn = keyframes`from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}`;
const slideIn = keyframes`from{transform:translateX(100%)}to{transform:translateX(0)}`;

// ── Layout ────────────────────────────────────────────────────────────────────
const Page = styled.div`padding:20px;animation:${fadeIn} .2s ease;`;

// ── Filter bar ────────────────────────────────────────────────────────────────
const FilterBar = styled.div`
  display:flex;align-items:center;gap:10px;margin-bottom:16px;flex-wrap:wrap;
`;
const SearchWrap = styled.div`
  display:flex;align-items:center;gap:8px;background:${C.card};
  border:1px solid ${C.border};border-radius:8px;padding:7px 12px;flex:1;min-width:200px;max-width:320px;
`;
const SearchInput = styled.input`
  background:none;border:none;outline:none;color:${C.text};font-size:13px;width:100%;
  &::placeholder{color:${C.muted};}
`;
const Select = styled.select`
  background:${C.card};border:1px solid ${C.border};border-radius:8px;
  color:${C.text};font-size:13px;padding:7px 10px;outline:none;cursor:pointer;
  &:focus{border-color:${C.accent};}
  option{background:${C.card};}
`;
const CountLabel = styled.span`
  font-size:12px;color:${C.muted};margin-left:auto;white-space:nowrap;
`;

// ── Table ─────────────────────────────────────────────────────────────────────
const TableWrap = styled.div`
  background:${C.card};border:1px solid ${C.border};border-radius:12px;overflow:hidden;
`;
const Table = styled.table`width:100%;border-collapse:collapse;`;
const Th = styled.th`
  font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;
  color:${C.muted};padding:12px 16px;text-align:left;background:${C.surface};
  border-bottom:1px solid ${C.border};white-space:nowrap;
  ${({ $sortable }) => $sortable && css`cursor:pointer;user-select:none;
    &:hover{color:${C.text};}
  `}
`;
const SortIndicator = styled.span`margin-left:4px;opacity:.8;`;
const Tr = styled.tr`
  border-bottom:1px solid ${C.border};cursor:pointer;transition:background .12s;
  &:last-child{border-bottom:none;}
  &:hover{background:${C.surface};}
`;
const Td = styled.td`padding:12px 16px;font-size:13px;color:${C.text};vertical-align:middle;`;

const NameCell = styled.div`display:flex;align-items:center;gap:10px;`;
const Avatar = styled.div`
  flex-shrink:0;width:32px;height:32px;border-radius:50%;
  background:${({ $color }) => $color};display:flex;align-items:center;
  justify-content:center;font-size:11px;font-weight:700;color:#fff;
`;
const NameInfo = styled.div``;
const LeadName = styled.div`font-weight:600;`;
const LeadEmail = styled.div`font-size:11px;color:${C.muted};`;

const ClassBadge = styled.span`
  display:inline-flex;align-items:center;gap:4px;font-size:10px;font-weight:700;
  text-transform:uppercase;letter-spacing:.06em;padding:3px 8px;border-radius:999px;
  color:#fff;background:${({ $cls }) => CLASS_COLOR[$cls] || C.muted};
`;
const StageBadge = styled.span`
  display:inline-block;font-size:11px;font-weight:600;padding:3px 9px;
  border-radius:999px;color:#fff;background:${({ $stage }) => STAGE_COLOR[$stage] || C.muted};
  text-transform:capitalize;
`;
const ScoreNum = styled.span`
  font-size:12px;font-weight:700;color:${C.muted};margin-left:5px;
`;

const EmptyRow = styled.tr``;
const EmptyCell = styled.td`
  padding:48px;text-align:center;color:${C.muted};font-size:13px;
`;
const LoadingCell = styled(EmptyCell)``;

// ── Pagination ────────────────────────────────────────────────────────────────
const PaginationRow = styled.div`
  display:flex;align-items:center;justify-content:space-between;
  padding:12px 16px;border-top:1px solid ${C.border};font-size:12px;color:${C.muted};
`;
const PagBtn = styled.button`
  background:${C.card};border:1px solid ${C.border};border-radius:6px;
  color:${({ disabled }) => disabled ? C.border : C.text};padding:5px 12px;
  font-size:12px;cursor:${({ disabled }) => disabled ? 'default' : 'pointer'};
  &:hover:not(:disabled){border-color:${C.accent};color:${C.accent};}
`;

// ── Drawer overlay + panel ────────────────────────────────────────────────────
const Overlay = styled.div`
  position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:200;
  display:flex;justify-content:flex-end;
`;
const Panel = styled.div`
  width:460px;max-width:100vw;background:${C.surface};border-left:1px solid ${C.border};
  display:flex;flex-direction:column;overflow:hidden;
  animation:${slideIn} .2s ease;
`;
const DrawerHeader = styled.div`
  padding:20px;border-bottom:1px solid ${C.border};
  display:flex;align-items:center;gap:14px;
`;
const DrawerAvatar = styled.div`
  flex-shrink:0;width:44px;height:44px;border-radius:50%;
  background:${({ $color }) => $color};display:flex;align-items:center;
  justify-content:center;font-size:15px;font-weight:700;color:#fff;
`;
const DrawerTitle = styled.div`flex:1;min-width:0;`;
const DrawerName = styled.div`font-size:16px;font-weight:700;color:${C.text};`;
const DrawerSub = styled.div`font-size:12px;color:${C.muted};margin-top:2px;`;
const CloseBtn = styled.button`
  background:none;border:none;color:${C.muted};cursor:pointer;font-size:18px;
  padding:4px;border-radius:6px;line-height:1;
  &:hover{color:${C.text};background:${C.card};}
`;
const DrawerMeta = styled.div`
  padding:12px 20px;border-bottom:1px solid ${C.border};
  display:flex;align-items:center;gap:12px;flex-wrap:wrap;
`;
const StageSelect = styled.select`
  background:${C.card};border:1px solid ${C.border};border-radius:6px;
  color:${C.text};font-size:12px;padding:5px 8px;outline:none;cursor:pointer;
  option{background:${C.card};}
  &:focus{border-color:${C.accent};}
`;
const Tabs = styled.div`
  display:flex;border-bottom:1px solid ${C.border};
`;
const Tab = styled.button`
  background:none;border:none;border-bottom:2px solid ${({ $active }) => $active ? C.accent : 'transparent'};
  color:${({ $active }) => $active ? C.text : C.muted};font-size:13px;font-weight:600;
  padding:12px 20px;cursor:pointer;transition:color .15s,border-color .15s;
  &:hover{color:${C.text};}
`;
const TabBody = styled.div`flex:1;overflow-y:auto;padding:20px;`;

// Overview tab
const DetailGrid = styled.div`display:flex;flex-direction:column;gap:0;`;
const DetailRow = styled.div`
  display:flex;padding:9px 0;border-bottom:1px solid ${C.border};
  &:last-child{border-bottom:none;}
`;
const DetailLabel = styled.div`font-size:12px;color:${C.muted};width:130px;flex-shrink:0;padding-top:1px;`;
const DetailValue = styled.div`font-size:13px;color:${C.text};flex:1;word-break:break-all;`;
const NotesBox = styled.div`
  font-size:13px;color:${C.muted};font-style:italic;
  background:${C.card};border:1px solid ${C.border};border-radius:8px;
  padding:10px;margin-top:4px;line-height:1.5;
`;

// Activity tab
const ActivityList = styled.div`display:flex;flex-direction:column;gap:0;`;
const ActivityItem = styled.div`
  display:flex;gap:12px;padding:10px 0;border-bottom:1px solid ${C.border};
  &:last-child{border-bottom:none;}
`;
const ActivityIconBox = styled.div`
  flex-shrink:0;width:30px;height:30px;background:${C.card};border:1px solid ${C.border};
  border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;
`;
const ActivityBody = styled.div`flex:1;`;
const ActivityDesc = styled.div`font-size:13px;color:${C.text};`;
const ActivityTime = styled.div`font-size:11px;color:${C.muted};margin-top:2px;`;
const EmptyActivity = styled.div`text-align:center;color:${C.muted};font-size:13px;padding:32px 0;`;

// AI Assist tab
const AICard = styled.div`
  background:${C.card};border:1px solid ${C.border};border-radius:10px;padding:16px;
  margin-bottom:14px;
`;
const AICardTitle = styled.div`
  font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;
  color:${C.muted};margin-bottom:12px;
`;
const AIMetricRow = styled.div`
  display:flex;justify-content:space-between;align-items:center;
  padding:7px 0;border-bottom:1px solid ${C.border};
  &:last-child{border-bottom:none;}
`;
const AIMetricLabel = styled.div`font-size:12px;color:${C.muted};`;
const AIMetricValue = styled.div`
  font-size:13px;font-weight:700;color:${({ $color }) => $color || C.text};
`;
const ToneRow = styled.div`display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap;`;
const ToneBtn = styled.button`
  background:${({ $active }) => $active ? C.accent : C.card};
  border:1px solid ${({ $active }) => $active ? C.accent : C.border};
  color:${({ $active }) => $active ? '#fff' : C.muted};
  border-radius:6px;font-size:12px;padding:5px 12px;cursor:pointer;
  &:hover{border-color:${C.accent};color:${C.text};}
`;
const GenBtn = styled.button`
  width:100%;background:${C.accent};color:#fff;border:none;border-radius:8px;
  padding:10px;font-size:13px;font-weight:600;cursor:pointer;margin-bottom:14px;
  &:hover{background:${C.accentHover};}
  &:disabled{background:${C.border};cursor:default;}
`;
const OutreachCard = styled.div`
  background:${C.card};border:1px solid ${C.border};border-radius:10px;padding:16px;
`;
const OutreachSubject = styled.div`
  font-size:13px;font-weight:700;color:${C.text};margin-bottom:8px;
`;
const OutreachBody = styled.pre`
  font-size:12px;color:${C.muted};white-space:pre-wrap;font-family:inherit;
  line-height:1.6;margin:0 0 12px 0;
`;
const OutreachActions = styled.div`display:flex;gap:8px;`;
const SmBtn = styled.button`
  background:${({ $primary }) => $primary ? C.accent : C.card};
  border:1px solid ${({ $primary }) => $primary ? C.accent : C.border};
  color:${({ $primary }) => $primary ? '#fff' : C.muted};
  border-radius:6px;font-size:12px;padding:6px 14px;cursor:pointer;
  &:hover{border-color:${C.accent};color:${C.text};}
`;

// ── Lead Drawer ───────────────────────────────────────────────────────────────
function LeadDetailDrawer({ leadId, onClose, onStageUpdated }) {
  const { lead, activities, loading } = useLead(leadId);
  const [activeTab, setActiveTab] = useState('overview');
  const [tone, setTone] = useState('professional');
  const [outreach, setOutreach] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [stageSaving, setStageSaving] = useState(false);

  // Derive computed AI metrics from lead data
  const convProb = lead
    ? Math.min(95, Math.round(
        lead.ai_score * 0.75 +
        (lead.classification === 'hot' ? 20 : lead.classification === 'warm' ? 8 : 0)
      ))
    : null;
  const churnRisk = lead
    ? lead.classification === 'cold' ? 'High' : lead.classification === 'warm' ? 'Medium' : 'Low'
    : null;
  const recAction = lead
    ? lead.classification === 'hot'
        ? 'Schedule a call immediately'
        : lead.classification === 'warm'
        ? 'Send a follow-up email'
        : 'Run a re-engagement sequence'
    : null;

  async function handleStageChange(e) {
    const newStage = e.target.value;
    setStageSaving(true);
    try {
      await api.patch(`/api/v1/crm/leads/${leadId}/stage`, { stage: newStage });
      onStageUpdated(leadId, newStage);
    } finally {
      setStageSaving(false);
    }
  }

  async function handleGenerate() {
    setGenerating(true);
    setOutreach(null);
    try {
      const res = await api.post(`/api/v1/crm/leads/${leadId}/ai/outreach`, { tone });
      setOutreach(res);
    } finally {
      setGenerating(false);
    }
  }

  if (loading || !lead) {
    return (
      <Overlay onClick={onClose}>
        <Panel onClick={e => e.stopPropagation()}>
          <DrawerHeader>
            <DrawerAvatar $color={C.muted}>…</DrawerAvatar>
            <DrawerTitle><DrawerName>Loading…</DrawerName></DrawerTitle>
            <CloseBtn onClick={onClose}>✕</CloseBtn>
          </DrawerHeader>
        </Panel>
      </Overlay>
    );
  }

  const avatarColor = CLASS_COLOR[lead.classification] || C.muted;

  return (
    <Overlay onClick={onClose}>
      <Panel onClick={e => e.stopPropagation()}>

        {/* Header */}
        <DrawerHeader>
          <DrawerAvatar $color={avatarColor}>
            {initials(lead.first_name, lead.last_name)}
          </DrawerAvatar>
          <DrawerTitle>
            <DrawerName>{lead.first_name} {lead.last_name}</DrawerName>
            <DrawerSub>{lead.company || lead.email}</DrawerSub>
          </DrawerTitle>
          <CloseBtn onClick={onClose} title="Close">✕</CloseBtn>
        </DrawerHeader>

        {/* Meta row: score badge + stage dropdown */}
        <DrawerMeta>
          <ClassBadge $cls={lead.classification}>{lead.classification}</ClassBadge>
          <ScoreNum style={{ color: C.text }}>Score: {lead.ai_score}</ScoreNum>
          <StageSelect
            value={lead.stage}
            onChange={handleStageChange}
            disabled={stageSaving}
            title="Change stage"
          >
            {STAGES.map(s => (
              <option key={s} value={s} style={{ textTransform: 'capitalize' }}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </StageSelect>
        </DrawerMeta>

        {/* Tabs */}
        <Tabs>
          {['overview', 'activity', 'ai'].map(t => (
            <Tab key={t} $active={activeTab === t} onClick={() => setActiveTab(t)}>
              {t === 'ai' ? 'AI Assist' : t.charAt(0).toUpperCase() + t.slice(1)}
            </Tab>
          ))}
        </Tabs>

        {/* Tab bodies */}
        <TabBody>

          {/* Overview */}
          {activeTab === 'overview' && (
            <DetailGrid>
              <DetailRow>
                <DetailLabel>Email</DetailLabel>
                <DetailValue>{lead.email}</DetailValue>
              </DetailRow>
              <DetailRow>
                <DetailLabel>Phone</DetailLabel>
                <DetailValue>{lead.phone || '—'}</DetailValue>
              </DetailRow>
              <DetailRow>
                <DetailLabel>Industry</DetailLabel>
                <DetailValue>{lead.industry || '—'}</DetailValue>
              </DetailRow>
              <DetailRow>
                <DetailLabel>Job Title</DetailLabel>
                <DetailValue>{lead.job_title || '—'}</DetailValue>
              </DetailRow>
              <DetailRow>
                <DetailLabel>Source</DetailLabel>
                <DetailValue style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <PlatformLogo name={lead.source} size={16} />
                  {SOURCE_LABEL[lead.source] || lead.source}
                </DetailValue>
              </DetailRow>
              <DetailRow>
                <DetailLabel>Predicted Value</DetailLabel>
                <DetailValue style={{ color: C.success }}>{fmtMoney(lead.predicted_value)}</DetailValue>
              </DetailRow>
              <DetailRow>
                <DetailLabel>LTV</DetailLabel>
                <DetailValue>{fmtMoney(lead.ltv)}</DetailValue>
              </DetailRow>
              <DetailRow>
                <DetailLabel>Created</DetailLabel>
                <DetailValue>{lead.created_at ? new Date(lead.created_at).toLocaleDateString() : '—'}</DetailValue>
              </DetailRow>
              <DetailRow>
                <DetailLabel>Last Contact</DetailLabel>
                <DetailValue>{timeAgo(lead.last_contact_at)}</DetailValue>
              </DetailRow>
              {lead.notes && (
                <DetailRow style={{ flexDirection: 'column', gap: 6 }}>
                  <DetailLabel>Notes</DetailLabel>
                  <NotesBox>{lead.notes}</NotesBox>
                </DetailRow>
              )}
            </DetailGrid>
          )}

          {/* Activity */}
          {activeTab === 'activity' && (
            <ActivityList>
              {activities.length === 0 && (
                <EmptyActivity>No activity recorded yet.</EmptyActivity>
              )}
              {activities.map(a => (
                <ActivityItem key={a.id}>
                  <ActivityIconBox>
                    {ACTIVITY_ICON[a.activity_type] || '·'}
                  </ActivityIconBox>
                  <ActivityBody>
                    <ActivityDesc>{a.description}</ActivityDesc>
                    <ActivityTime>{timeAgo(a.timestamp)}</ActivityTime>
                  </ActivityBody>
                </ActivityItem>
              ))}
            </ActivityList>
          )}

          {/* AI Assist */}
          {activeTab === 'ai' && (
            <>
              <AICard>
                <AICardTitle>AI Analysis</AICardTitle>
                <AIMetricRow>
                  <AIMetricLabel>Conversion Probability</AIMetricLabel>
                  <AIMetricValue $color={convProb >= 70 ? C.success : convProb >= 40 ? C.warning : C.danger}>
                    {convProb}%
                  </AIMetricValue>
                </AIMetricRow>
                <AIMetricRow>
                  <AIMetricLabel>Predicted LTV</AIMetricLabel>
                  <AIMetricValue $color={C.accent}>{fmtMoney(lead.predicted_value)}</AIMetricValue>
                </AIMetricRow>
                <AIMetricRow>
                  <AIMetricLabel>Churn Risk</AIMetricLabel>
                  <AIMetricValue $color={churnRisk === 'High' ? C.danger : churnRisk === 'Medium' ? C.warning : C.success}>
                    {churnRisk}
                  </AIMetricValue>
                </AIMetricRow>
                <AIMetricRow>
                  <AIMetricLabel>Recommended Action</AIMetricLabel>
                  <AIMetricValue style={{ textAlign: 'right', fontSize: 12 }}>{recAction}</AIMetricValue>
                </AIMetricRow>
              </AICard>

              <AICard>
                <AICardTitle>Generate Outreach</AICardTitle>
                <ToneRow>
                  {['professional', 'friendly', 'urgent'].map(t => (
                    <ToneBtn key={t} $active={tone === t} onClick={() => setTone(t)}>
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </ToneBtn>
                  ))}
                </ToneRow>
                <GenBtn onClick={handleGenerate} disabled={generating}>
                  {generating ? 'Generating…' : 'Generate AI Outreach'}
                </GenBtn>

                {outreach && (
                  <OutreachCard>
                    <OutreachSubject>Subject: {outreach.subject}</OutreachSubject>
                    <OutreachBody>{outreach.body}</OutreachBody>
                    <OutreachActions>
                      <SmBtn $primary onClick={() => navigator.clipboard?.writeText(outreach.body)}>
                        Copy
                      </SmBtn>
                      <SmBtn onClick={handleGenerate}>Regenerate</SmBtn>
                    </OutreachActions>
                  </OutreachCard>
                )}
              </AICard>
            </>
          )}
        </TabBody>
      </Panel>
    </Overlay>
  );
}

// ── Main CRMLeads component ───────────────────────────────────────────────────
export default function CRMLeads() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [source, setSource] = useState('');
  const [classification, setClassification] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortDir, setSortDir] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedId, setSelectedId] = useState(null);
  const debounceRef = useRef(null);

  // Debounce search input 300ms
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [search]);

  const { leads, total, totalPages, loading, refetch, updateStage } = useLeads();

  // Re-fetch whenever any filter/sort/page changes
  useEffect(() => {
    refetch({
      search: debouncedSearch || undefined,
      source: source || undefined,
      classification: classification || undefined,
      sort_by: sortBy,
      sort_dir: sortDir,
      page: currentPage,
      limit: 20,
    });
  }, [debouncedSearch, source, classification, sortBy, sortDir, currentPage]); // eslint-disable-line

  function handleSort(field) {
    if (sortBy === field) {
      setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(field);
      setSortDir('desc');
    }
    setCurrentPage(1);
  }

  function sortIcon(field) {
    if (sortBy !== field) return <SortIndicator>⇅</SortIndicator>;
    return <SortIndicator>{sortDir === 'desc' ? '↓' : '↑'}</SortIndicator>;
  }

  // Called from drawer when stage changes so table reflects it immediately
  function handleStageUpdated(id, newStage) {
    updateStage(id, newStage);
  }

  return (
    <Page>
      {/* Filter bar */}
      <FilterBar>
        <SearchWrap>
          <span style={{ color: C.muted, fontSize: 13 }}>⌕</span>
          <SearchInput
            placeholder="Search name, email, company…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </SearchWrap>

        <Select value={source} onChange={e => { setSource(e.target.value); setCurrentPage(1); }}>
          <option value="">All Sources</option>
          {SOURCES.map(s => (
            <option key={s} value={s}>{SOURCE_LABEL[s]}</option>
          ))}
        </Select>

        <Select value={classification} onChange={e => { setClassification(e.target.value); setCurrentPage(1); }}>
          <option value="">All Classifications</option>
          <option value="hot">Hot</option>
          <option value="warm">Warm</option>
          <option value="cold">Cold</option>
        </Select>

        <CountLabel>{total.toLocaleString()} lead{total !== 1 ? 's' : ''}</CountLabel>
      </FilterBar>

      {/* Table */}
      <TableWrap>
        <Table>
          <thead>
            <tr>
              <Th $sortable onClick={() => handleSort('first_name')}>
                Name {sortIcon('first_name')}
              </Th>
              <Th>Company</Th>
              <Th>Source</Th>
              <Th $sortable onClick={() => handleSort('ai_score')}>
                Score {sortIcon('ai_score')}
              </Th>
              <Th>Stage</Th>
              <Th $sortable onClick={() => handleSort('predicted_value')}>
                Value {sortIcon('predicted_value')}
              </Th>
              <Th $sortable onClick={() => handleSort('last_contact_at')}>
                Last Contact {sortIcon('last_contact_at')}
              </Th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <EmptyRow>
                <LoadingCell colSpan={7}>Loading leads…</LoadingCell>
              </EmptyRow>
            )}
            {!loading && leads.length === 0 && (
              <EmptyRow>
                <EmptyCell colSpan={7}>No leads match your filters.</EmptyCell>
              </EmptyRow>
            )}
            {!loading && leads.map(lead => (
              <Tr key={lead.id} onClick={() => setSelectedId(lead.id)}>
                <Td>
                  <NameCell>
                    <Avatar $color={CLASS_COLOR[lead.classification] || C.muted}>
                      {initials(lead.first_name, lead.last_name)}
                    </Avatar>
                    <NameInfo>
                      <LeadName>{lead.first_name} {lead.last_name}</LeadName>
                      <LeadEmail>{lead.email}</LeadEmail>
                    </NameInfo>
                  </NameCell>
                </Td>
                <Td style={{ color: C.muted }}>{lead.company || '—'}</Td>
                <Td>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <PlatformLogo name={lead.source} size={18} />
                    <span style={{ color: C.muted }}>{SOURCE_LABEL[lead.source] || lead.source}</span>
                  </span>
                </Td>
                <Td>
                  <ClassBadge $cls={lead.classification}>{lead.classification}</ClassBadge>
                  <ScoreNum>{lead.ai_score}</ScoreNum>
                </Td>
                <Td><StageBadge $stage={lead.stage}>{lead.stage}</StageBadge></Td>
                <Td style={{ color: C.success }}>{fmtMoney(lead.predicted_value)}</Td>
                <Td style={{ color: C.muted }}>{timeAgo(lead.last_contact_at)}</Td>
              </Tr>
            ))}
          </tbody>
        </Table>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <PaginationRow>
            <span>Page {currentPage} of {totalPages}</span>
            <div style={{ display: 'flex', gap: 6 }}>
              <PagBtn disabled={currentPage <= 1} onClick={() => setCurrentPage(p => p - 1)}>
                ← Prev
              </PagBtn>
              <PagBtn disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => p + 1)}>
                Next →
              </PagBtn>
            </div>
          </PaginationRow>
        )}
      </TableWrap>

      {/* Lead drawer */}
      {selectedId && (
        <LeadDetailDrawer
          leadId={selectedId}
          onClose={() => setSelectedId(null)}
          onStageUpdated={handleStageUpdated}
        />
      )}
    </Page>
  );
}
