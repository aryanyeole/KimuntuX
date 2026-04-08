import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { getAccessToken } from '../../services/authService';
import { mapSchedulerCardToCampaignPayload, updateCampaignRecord } from '../../services/contentSchedulerRepository';

// ── Palette ───────────────────────────────────────────────────────────────────
const C = {
  bg: '#060d1b', surface: '#0c1527', card: '#121e34', border: '#1a2d4d',
  text: '#e4eaf4', muted: '#6b7fa3', accent: '#2d7aff',
  success: '#00c48c', warning: '#ffb020', danger: '#ff4757', purple: '#8b5cf6',
};

const STATUS_COLOR = {
  scheduled: C.success, draft: C.muted,
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api/v1';

const fmtMoney = n => '$' + Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 0 });
const fmtPct = n => `${Number(n || 0).toFixed(2)}%`;
const fmtCpl = n => `$${Number(n || 0).toFixed(2)}`;
const fmtX = n => `${Number(n || 0).toFixed(2)}x`;
const safeNum = n => (typeof n === 'number' && !isNaN(n)) ? n : 0;

async function apiRequest(path, { method = 'GET', signal } = {}) {
  const token = getAccessToken();
  const headers = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    signal,
  });

  const text = await response.text();
  let payload = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = { detail: text };
    }
  }

  if (!response.ok) {
    const message = typeof payload?.detail === 'string' ? payload.detail : 'Failed to fetch campaigns';
    throw new Error(message);
  }

  return payload;
}

// ── Animations ────────────────────────────────────────────────────────────────
const fadeIn = keyframes`from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}`;

// ── Layout ────────────────────────────────────────────────────────────────────
const Page = styled.div`padding:20px;animation:${fadeIn} .2s ease;`;

// ── KPI row ───────────────────────────────────────────────────────────────────
const KpiRow = styled.div`
  display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin-bottom:20px;
  @media(max-width:1100px){grid-template-columns:repeat(3,1fr);}
  @media(max-width:680px){grid-template-columns:repeat(2,1fr);}
`;
const KpiCard = styled.div`
  background:${C.card};border:1px solid ${C.border};border-radius:12px;padding:18px 20px;
`;
const KpiLabel = styled.div`
  font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:${C.muted};margin-bottom:6px;
`;
const KpiValue = styled.div`
  font-size:26px;font-weight:800;color:${({ $color }) => $color || C.text};line-height:1;
`;
const KpiSub = styled.div`font-size:11px;color:${C.muted};margin-top:4px;`;

// ── Campaign table ────────────────────────────────────────────────────────────
const TableCard = styled.div`
  background:${C.card};border:1px solid ${C.border};border-radius:12px;
  overflow:hidden;margin-bottom:20px;
`;
const TableScroll = styled.div`overflow-x:auto;`;
const Table = styled.table`width:100%;border-collapse:collapse;min-width:900px;`;
const Th = styled.th`
  font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;
  color:${C.muted};padding:11px 14px;text-align:left;background:${C.surface};
  border-bottom:1px solid ${C.border};white-space:nowrap;
`;
const Tr = styled.tr`
  border-bottom:1px solid ${C.border};&:last-child{border-bottom:none;}
  transition:background .12s;
  background:${({ $selected }) => ($selected ? `${C.accent}1A` : 'transparent')};
  &:hover{background:${({ $selected }) => ($selected ? `${C.accent}1A` : C.surface)};}
`;
const Td = styled.td`
  padding:11px 14px;font-size:12px;color:${C.text};vertical-align:middle;
  border-left:${({ $selectedFirst }) => ($selectedFirst ? `3px solid ${C.accent}` : '3px solid transparent')};
`;

const StatusBadge = styled.span`
  font-size:10px;font-weight:700;text-transform:capitalize;letter-spacing:.05em;
  padding:3px 9px;border-radius:999px;color:#fff;
  background:${({ $status }) => STATUS_COLOR[$status] || C.muted};
`;
const RoasBadge = styled.span`
  font-weight:700;color:${({ $good }) => $good ? C.success : C.warning};
`;
const EmptyRow = styled.tr``;
const EmptyCell = styled.td`
  padding:40px;text-align:center;color:${C.muted};font-size:13px;
`;
const InlineMessage = styled.div`
  padding:10px 12px;
  font-size:12px;
  color:${({ $type }) => ($type === 'error' ? C.danger : C.muted)};
`;

// ── AI Optimization ───────────────────────────────────────────────────────────
const AiCard = styled.div`
  background:${C.card};border:1px solid ${C.border};border-radius:12px;padding:20px;
`;
const AiTitleRow = styled.div`display:flex;align-items:center;gap:10px;margin-bottom:16px;`;
const GradientTitle = styled.span`
  font-size:15px;font-weight:700;
  background:linear-gradient(135deg,${C.purple},${C.accent});
  -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
`;
const SuggestionsGrid = styled.div`
  display:grid;grid-template-columns:repeat(3,1fr);gap:12px;
  @media(max-width:800px){grid-template-columns:1fr;}
`;
const SuggestionCard = styled.div`
  background:${C.surface};border:1px solid ${C.border};border-radius:10px;padding:14px;
`;
const SuggestionEmoji = styled.div`font-size:22px;margin-bottom:8px;`;
const SuggestionTitle = styled.div`font-size:13px;font-weight:700;color:${C.text};margin-bottom:4px;`;
const SuggestionDesc = styled.div`font-size:11px;color:${C.muted};line-height:1.5;`;
const SuggestionAction = styled.button`
  margin-top:10px;background:none;border:1px solid ${C.border};border-radius:6px;
  color:${C.accent};font-size:11px;font-weight:600;padding:4px 10px;cursor:pointer;
  &:hover{border-color:${C.accent};}
`;

const AI_SUGGESTIONS = [
  {
    emoji: '🎯',
    title: 'Scale AI Growth Q1',
    desc: 'This campaign has a 3.4x ROAS. Increasing daily budget by 30% could yield an additional $4,200 in monthly revenue.',
    action: 'Increase Budget',
  },
  {
    emoji: '⏸️',
    title: 'Pause IG Retargeting',
    desc: 'ROAS dropped below 1.5x over the last 14 days. Reallocating spend to Facebook Cold would improve overall efficiency.',
    action: 'Pause Campaign',
  },
  {
    emoji: '🔥',
    title: 'Scale Trending Offers on TikTok',
    desc: 'LeanBiome and CitrusBurn gravity scores surged 15%+ this week. Launch TikTok UGC before the window closes.',
    action: 'Create Campaign',
  },
];

// ── Component ─────────────────────────────────────────────────────────────────
export default function CRMCampaigns() {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCampaignId, setSelectedCampaignId] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  async function loadCampaigns(signal) {
    setLoading(true);
    try {
      const response = await apiRequest('/crm/campaigns', { signal });
      setCampaigns(Array.isArray(response?.items) ? response.items : []);
    } catch {
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const controller = new AbortController();

    loadCampaigns(controller.signal);
    return () => controller.abort();
  }, []);

  const handlePauseSelectedCampaign = async () => {
    setErrorMessage('');
    setStatusMessage('');

    if (!selectedCampaignId) {
      return;
    }

    const selectedCampaign = campaigns.find(c => c.id === selectedCampaignId);
    if (!selectedCampaign) {
      return;
    }

    if (!selectedCampaign.is_used) {
      setStatusMessage('Campaign is not scheduled');
      return;
    }

    try {
      const payload = mapSchedulerCardToCampaignPayload(selectedCampaign, {
        campaignId: selectedCampaign.id,
        used: false,
        startDate: '',
        endDate: '',
      });
      await updateCampaignRecord(selectedCampaign.id, payload);
      await loadCampaigns();
      setSelectedCampaignId(null);
    } catch (err) {
      setErrorMessage(err?.message || 'Unable to pause campaign');
    }
  };

  // Compute KPI aggregates client-side
  const kpis = useMemo(() => {
    const active = campaigns.filter(c => c.is_used === true).length;
    let spend = 0;
    let roasSum = 0;
    let roasCount = 0;
    campaigns.forEach(c => {
      const actuals = c?.metrics?.actuals || {};
      spend += safeNum(actuals.spend);
      if (actuals.roas != null) {
        roasSum += safeNum(actuals.roas);
        roasCount += 1;
      }
    });

    return {
      active,
      spend,
      avgRoas: roasCount ? roasSum / roasCount : 0,
      leads: 0,
      conversions: 0,
    };
  }, [campaigns]);

  return (
    <Page>
      {/* ── KPI row ── */}
      <KpiRow>
        <KpiCard>
          <KpiLabel>Active Campaigns</KpiLabel>
          <KpiValue $color={C.success}>{kpis.active}</KpiValue>
          <KpiSub>of {campaigns.length} total</KpiSub>
        </KpiCard>
        <KpiCard>
          <KpiLabel>Total Spend</KpiLabel>
          <KpiValue>{fmtMoney(kpis.spend)}</KpiValue>
          <KpiSub>all campaigns</KpiSub>
        </KpiCard>
        <KpiCard>
          <KpiLabel>Avg ROAS</KpiLabel>
          <KpiValue $color={kpis.avgRoas >= 3 ? C.success : C.warning}>{fmtX(kpis.avgRoas)}</KpiValue>
          <KpiSub>return on ad spend</KpiSub>
        </KpiCard>
        <KpiCard>
          <KpiLabel>Total Leads</KpiLabel>
          <KpiValue $color={C.accent}>{kpis.leads.toLocaleString()}</KpiValue>
          <KpiSub>from campaigns</KpiSub>
        </KpiCard>
        <KpiCard>
          <KpiLabel>Conversions</KpiLabel>
          <KpiValue $color={C.purple}>{kpis.conversions.toLocaleString()}</KpiValue>
          <KpiSub>across all campaigns</KpiSub>
        </KpiCard>
      </KpiRow>

      {/* ── Campaign table ── */}
      <TableCard>
        <TableScroll>
          <Table>
            <thead>
              <tr>
                <Th>Campaign</Th>
                <Th>Platform</Th>
                <Th>Offer</Th>
                <Th>Status</Th>
                <Th>Leads</Th>
                <Th>Conversions</Th>
                <Th>Spend</Th>
                <Th>Revenue</Th>
                <Th>ROAS</Th>
                <Th>CTR</Th>
                <Th>CPL</Th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <EmptyRow><EmptyCell colSpan={11}>Loading campaigns…</EmptyCell></EmptyRow>
              )}
              {!loading && campaigns.length === 0 && (
                <EmptyRow><EmptyCell colSpan={11}>No campaigns found.</EmptyCell></EmptyRow>
              )}
              {!loading && campaigns.map(c => {
                const actuals = c?.metrics?.actuals || {};
                const spend = actuals.spend;
                const revenue = actuals.revenue;
                const roas = actuals.roas;
                const platformLabel = Array.isArray(c?.platforms) && c.platforms.length
                  ? c.platforms.join(', ')
                  : '—';
                const statusValue = c?.is_used ? 'scheduled' : 'draft';
                const statusText = c?.is_used ? 'Scheduled' : 'Draft';
                const offerName = c?.affiliate_product?.offer_name || '—';
                const isSelected = selectedCampaignId === c.id;

                return (
                  <Tr
                    key={c.id}
                    $selected={isSelected}
                    onClick={() => {
                      setErrorMessage('');
                      setStatusMessage('');
                      setSelectedCampaignId(prev => (prev === c.id ? null : c.id));
                    }}
                  >
                    <Td $selectedFirst={isSelected} style={{ fontWeight: 700, maxWidth: 200 }}>{c.name}</Td>
                    <Td><span style={{ color: C.muted }}>{platformLabel}</span></Td>
                    <Td style={{ color: C.accent }}>{offerName}</Td>
                    <Td><StatusBadge $status={statusValue}>{statusText}</StatusBadge></Td>
                    <Td>0</Td>
                    <Td>0</Td>
                    <Td>{fmtMoney(spend)}</Td>
                    <Td style={{ color: C.success }}>{fmtMoney(revenue)}</Td>
                    <Td>
                      <RoasBadge $good={safeNum(roas) >= 3}>{fmtX(roas)}</RoasBadge>
                    </Td>
                    <Td style={{ color: C.muted }}>{fmtPct(0)}</Td>
                    <Td style={{ color: C.muted }}>{fmtCpl(0)}</Td>
                  </Tr>
                );
              })}
            </tbody>
          </Table>
        </TableScroll>
      </TableCard>
      {!!statusMessage && <InlineMessage>{statusMessage}</InlineMessage>}
      {!!errorMessage && <InlineMessage $type="error">{errorMessage}</InlineMessage>}

      {/* ── AI Optimization ── */}
      <AiCard>
        <AiTitleRow>
          <GradientTitle>AI Campaign Optimization</GradientTitle>
        </AiTitleRow>
        <SuggestionsGrid>
          {AI_SUGGESTIONS.map((s, i) => (
            <SuggestionCard key={i}>
              <SuggestionEmoji>{s.emoji}</SuggestionEmoji>
              <SuggestionTitle>{s.title}</SuggestionTitle>
              <SuggestionDesc>{s.desc}</SuggestionDesc>
              <SuggestionAction
                onClick={() => {
                  if (s.action === 'Create Campaign') {
                    navigate('/crm/content-gen');
                  }
                  if (s.action === 'Pause Campaign') {
                    handlePauseSelectedCampaign();
                  }
                }}
              >
                {s.action}
              </SuggestionAction>
            </SuggestionCard>
          ))}
        </SuggestionsGrid>
      </AiCard>
    </Page>
  );
}
