import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes, css } from 'styled-components';
import { getAccessToken } from '../../services/authService';
import { crm as C } from '../../styles/crmTheme';
import { mapSchedulerCardToCampaignPayload, updateCampaignRecord } from '../../services/contentSchedulerRepository';

const STATUS_COLOR = {
  scheduled: C.success, draft: C.muted,
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const API_BASE_URL = process.env.REACT_APP_API_URL || '';

const fmtMoney = n => '$' + Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 0 });
const fmtPct = n => `${Number(n || 0).toFixed(2)}%`;
const fmtCpl = n => `$${Number(n || 0).toFixed(2)}`;
const fmtX = n => `${Number(n || 0).toFixed(2)}x`;
const safeNum = n => (typeof n === 'number' && !isNaN(n)) ? n : 0;

function getCampaignHealth(roas) {
  const value = safeNum(roas);
  if (value >= 3) return { label: 'Strong', color: C.success };
  if (value >= 1.5) return { label: 'Average', color: C.warning };
  if (value > 0) return { label: 'Weak', color: C.danger };
  return { label: 'No data', color: C.muted };
}

function getPriorityTone(priority) {
  const normalized = String(priority || '').toLowerCase();
  if (normalized === 'high') return { label: 'High', background: `${C.danger}22`, color: C.danger };
  if (normalized === 'medium') return { label: 'Medium', background: `${C.warning}22`, color: C.warning };
  return { label: 'Low', background: `${C.accent}22`, color: C.accent };
}

function getPerformanceTone(performance) {
  const normalized = String(performance || '').toLowerCase();
  if (normalized === 'strong') return { background: `${C.success}22`, color: C.success };
  if (normalized === 'average') return { background: `${C.warning}22`, color: C.warning };
  return { background: `${C.danger}22`, color: C.danger };
}

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
const pulseOpacity = keyframes`0%{opacity:.45}50%{opacity:1}100%{opacity:.45}`;

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
const Table = styled.table`width:100%;border-collapse:collapse;min-width:700px;`;
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

const HealthWrap = styled.div`
  display:inline-flex;
  align-items:center;
  gap:6px;
  white-space:nowrap;
`;

const HealthDot = styled.span`
  width:8px;
  height:8px;
  border-radius:50%;
  display:inline-block;
  background:${({ $color }) => $color};
`;

const HealthLabel = styled.span`
  color:${C.text};
  font-size:12px;
  font-weight:600;
`;

const AnalyzeButton = styled.button`
  display:inline-flex;
  align-items:center;
  justify-content:center;
  gap:8px;
  min-width:220px;
  border-radius:8px;
  padding:10px 20px;
  font-size:13px;
  font-weight:600;
  transition:opacity .15s ease, transform .15s ease, background .15s ease;
  background:${({ $disabled }) => ($disabled ? C.card : C.accent)};
  color:${({ $disabled }) => ($disabled ? C.muted : '#fff')};
  border:${({ $disabled }) => ($disabled ? `1px solid ${C.border}` : 'none')};
  cursor:${({ $disabled }) => ($disabled ? 'not-allowed' : 'pointer')};
  opacity:${({ $disabled }) => ($disabled ? 0.5 : 1)};
  ${({ $loading }) => $loading ? css`animation:${pulseOpacity} 1.15s ease-in-out infinite;` : ''}
  &:hover{transform:${({ $disabled }) => ($disabled ? 'none' : 'translateY(-1px)')};}
`;

const AnalysisMessage = styled.div`
  margin-top:8px;
  color:${({ $type }) => ($type === 'error' ? C.danger : C.muted)};
  font-size:12px;
`;

const GradientTitle = styled.span`
  font-size:15px;font-weight:700;
  background:linear-gradient(135deg,${C.purple},${C.accent});
  -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
`;

const AiTitleRow = styled.div`
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:12px;
  margin-bottom:10px;
  flex-wrap:wrap;
`;

const AnalysisHeader = styled.div`
  display:flex;
  align-items:center;
  gap:12px;
`;

const AnalysisScoreCircle = styled.div`
  width:48px;
  height:48px;
  border-radius:50%;
  display:flex;
  align-items:center;
  justify-content:center;
  background:${({ $tone }) => $tone};
  color:#fff;
  font-weight:800;
  font-size:14px;
  flex:0 0 auto;
  box-shadow:0 0 20px ${({ $tone }) => $tone}44;
`;

const AnalysisTitleBlock = styled.div`
  display:flex;
  flex-direction:column;
  gap:4px;
`;

const AnalysisTitle = styled.div`
  font-size:15px;
  font-weight:700;
  color:${C.text};
`;

const AnalysisHealthLabel = styled.div`
  font-size:12px;
  font-weight:600;
  color:${C.muted};
`;

const AnalysisSummary = styled.div`
  background:${C.card};
  border-radius:8px;
  padding:12px 16px;
  margin:12px 0;
  font-size:13px;
  color:${C.muted};
  line-height:1.6;
`;

const RecommendationGrid = styled.div`
  display:grid;
  grid-template-columns:repeat(3,1fr);
  gap:12px;
  @media(max-width:800px){grid-template-columns:1fr;}
`;

const RecommendationCard = styled.div`
  background:${C.surface};
  border:1px solid ${C.border};
  border-radius:10px;
  padding:14px;
  display:flex;
  flex-direction:column;
  min-height:180px;
`;

const PriorityPill = styled.span`
  display:inline-flex;
  align-items:center;
  align-self:flex-start;
  padding:3px 8px;
  border-radius:999px;
  font-size:10px;
  font-weight:700;
  letter-spacing:.04em;
  text-transform:uppercase;
  color:${({ $color }) => $color};
  background:${({ $background }) => $background};
  margin-bottom:10px;
`;

const RecommendationTitle = styled.div`
  font-size:13px;
  font-weight:700;
  color:${C.text};
  margin-bottom:6px;
`;

const RecommendationDesc = styled.div`
  font-size:11px;
  color:${C.muted};
  line-height:1.55;
`;

const RecommendationAction = styled.button`
  margin-top:auto;
  background:none;
  border:1px solid ${C.border};
  border-radius:6px;
  color:${C.accent};
  font-size:11px;
  font-weight:600;
  padding:6px 10px;
  cursor:pointer;
  align-self:flex-start;
  &:hover{border-color:${C.accent};}
`;

const PlatformRow = styled.div`
  display:flex;
  flex-wrap:wrap;
  gap:8px;
  margin-top:14px;
`;

const PlatformPill = styled.span`
  display:inline-flex;
  align-items:center;
  gap:6px;
  padding:6px 10px;
  border-radius:999px;
  font-size:11px;
  font-weight:600;
  color:${({ $color }) => $color};
  background:${({ $background }) => $background};
`;

const NextStepsCard = styled.div`
  background:${C.card};
  border:1px solid ${C.border};
  border-radius:10px;
  padding:16px 20px;
  margin-top:12px;
`;

const NextStepsLabel = styled.div`
  font-size:11px;
  font-weight:700;
  text-transform:uppercase;
  letter-spacing:.08em;
  color:${C.muted};
  margin-bottom:10px;
`;

const NextStepRow = styled.div`
  display:flex;
  align-items:flex-start;
  gap:10px;
  margin-bottom:8px;
  &:last-child{margin-bottom:0;}
`;

const NextStepCircle = styled.div`
  width:20px;
  height:20px;
  border-radius:50%;
  background:${C.accent}22;
  color:${C.accent};
  font-size:10px;
  font-weight:700;
  display:flex;
  align-items:center;
  justify-content:center;
  flex-shrink:0;
  margin-top:1px;
`;

const NextStepText = styled.div`
  font-size:12px;
  color:${C.muted};
  line-height:1.6;
`;

const AiEmptyState = styled.div`
  padding:48px;
  text-align:center;
  display:flex;
  flex-direction:column;
  align-items:center;
  gap:12px;
  color:${C.muted};
  font-size:13px;
  line-height:1.6;
`;

const AiEmptyIcon = styled.div`
  font-size:32px;
  opacity:.35;
`;

const AnalyzeBar = styled.div`
  display:flex;
  align-items:center;
  justify-content:space-between;
  padding:12px 0;
  margin:4px 0;
`;

const AnalyzeBarLabel = styled.div`
  font-size:12px;
  color:${C.muted};
`;

const PlatformDot = styled.span`
  width:6px;
  height:6px;
  border-radius:50%;
  background:currentColor;
  display:inline-block;
  flex-shrink:0;
`;

const SkeletonGrid = styled.div`
  display:grid;
  grid-template-columns:repeat(3,1fr);
  gap:12px;
  @media(max-width:800px){grid-template-columns:1fr;}
`;

const SkeletonCard = styled.div`
  background:${C.surface};
  border:1px solid ${C.border};
  border-radius:10px;
  padding:14px;
  min-height:180px;
  animation:${pulseOpacity} 1.2s ease-in-out infinite;
`;

const SkeletonLine = styled.div`
  height:${({ $h }) => $h || '12px'};
  width:${({ $w }) => $w || '100%'};
  border-radius:999px;
  background:rgba(255,255,255,.08);
  margin-bottom:10px;
`;

const Toast = styled.div`
  position:fixed;
  right:24px;
  bottom:24px;
  z-index:30;
  min-width:220px;
  max-width:320px;
  padding:12px 14px;
  border-radius:10px;
  background:${C.card};
  border:1px solid ${C.border};
  color:${C.text};
  box-shadow:0 16px 40px rgba(0,0,0,.28);
`;

const AiCard = styled.div`
  background:${C.card};
  border:1px solid ${C.border};
  border-radius:12px;
  padding:20px;
  ${({ $scoreColor }) => $scoreColor ? `border-top:3px solid ${$scoreColor};` : ''}
`;

// ── Component ─────────────────────────────────────────────────────────────────
export default function CRMCampaigns() {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCampaignId, setSelectedCampaignId] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const toastTimerRef = useRef(null);

  const showToast = (message) => {
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }
    setToastMessage(message);
    toastTimerRef.current = window.setTimeout(() => {
      setToastMessage('');
      toastTimerRef.current = null;
    }, 2600);
  };

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

  useEffect(() => {
    setAnalysis(null);
    setAnalysisError(null);
    setIsAnalyzing(false);
  }, [selectedCampaignId]);

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

  const handleAnalyzeCampaign = async () => {
    if (!selectedCampaignId || isAnalyzing) {
      return;
    }

    setAnalysisError(null);
    setStatusMessage('');
    setErrorMessage('');
    setAnalysis(null);
    setIsAnalyzing(true);

    try {
      const response = await apiRequest(`/crm/campaigns/${selectedCampaignId}/analyze`, { method: 'POST' });
      setAnalysis(response || null);
    } catch (err) {
      setAnalysisError(err?.message || 'Unable to analyze campaign');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRecommendationAction = (action) => {
    switch (action) {
      case 'Increase Budget':
        showToast('Budget management coming soon');
        break;
      case 'Pause Campaign':
        handlePauseSelectedCampaign();
        break;
      case 'Refresh Creative':
      case 'Create Campaign':
        navigate('/crm/content-gen');
        break;
      case 'Scale Campaign':
        showToast('Scaling coming soon');
        break;
      case 'Review Targeting':
        showToast('Targeting coming soon');
        break;
      default:
        break;
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
                <Th style={{ width: 1 }}>Status</Th>
                <Th style={{ width: 1 }}>Health</Th>
                <Th style={{ width: 1 }}>Leads</Th>
                <Th style={{ width: 1 }}>Conversions</Th>
                <Th style={{ width: 1 }}>Spend</Th>
                <Th style={{ width: 1 }}>Revenue</Th>
                <Th style={{ width: 1 }}>ROAS</Th>
                <Th style={{ width: 1 }}>CTR</Th>
                <Th style={{ width: 1 }}>CPL</Th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <EmptyRow><EmptyCell colSpan={12}>Loading campaigns…</EmptyCell></EmptyRow>
              )}
              {!loading && campaigns.length === 0 && (
                <EmptyRow><EmptyCell colSpan={12}>No campaigns found.</EmptyCell></EmptyRow>
              )}
              {!loading && campaigns.map(c => {
                const actuals = c?.metrics?.actuals || {};
                const spend = actuals.spend;
                const revenue = actuals.revenue;
                const roas = actuals.roas;
                const health = getCampaignHealth(roas);
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
                    <Td $selectedFirst={isSelected} style={{ fontWeight: 700, minWidth: 140 }}>{c.name}</Td>
                    <Td style={{ whiteSpace: 'nowrap' }}><span style={{ color: C.muted }}>{platformLabel}</span></Td>
                    <Td style={{ whiteSpace: 'nowrap', color: C.accent }}>{offerName}</Td>
                    <Td style={{ whiteSpace: 'nowrap' }}><StatusBadge $status={statusValue}>{statusText}</StatusBadge></Td>
                    <Td style={{ whiteSpace: 'nowrap' }}>
                      <HealthWrap>
                        <HealthDot $color={health.color} />
                        <HealthLabel>{health.label}</HealthLabel>
                      </HealthWrap>
                    </Td>
                    <Td style={{ whiteSpace: 'nowrap', fontSize: 11 }}>0</Td>
                    <Td style={{ whiteSpace: 'nowrap', fontSize: 11 }}>0</Td>
                    <Td style={{ whiteSpace: 'nowrap', fontSize: 11 }}>{fmtMoney(spend)}</Td>
                    <Td style={{ whiteSpace: 'nowrap', fontSize: 11, color: C.success }}>{fmtMoney(revenue)}</Td>
                    <Td style={{ whiteSpace: 'nowrap', fontSize: 11 }}>
                      <RoasBadge $good={safeNum(roas) >= 3}>{fmtX(roas)}</RoasBadge>
                    </Td>
                    <Td style={{ whiteSpace: 'nowrap', fontSize: 11, color: C.muted }}>{fmtPct(0)}</Td>
                    <Td style={{ whiteSpace: 'nowrap', fontSize: 11, color: C.muted }}>{fmtCpl(0)}</Td>
                  </Tr>
                );
              })}
            </tbody>
          </Table>
        </TableScroll>
      </TableCard>
      {!!statusMessage && <InlineMessage>{statusMessage}</InlineMessage>}
      {!!errorMessage && <InlineMessage $type="error">{errorMessage}</InlineMessage>}

      <AnalyzeBar>
        <AnalyzeBarLabel>
          {selectedCampaignId
            ? `Analyzing: ${campaigns.find(c => c.id === selectedCampaignId)?.name || ''}`
            : 'Select a campaign row to analyze'}
        </AnalyzeBarLabel>
        <AnalyzeButton
          type="button"
          onClick={handleAnalyzeCampaign}
          $disabled={!selectedCampaignId || isAnalyzing}
          $loading={isAnalyzing}
          disabled={!selectedCampaignId || isAnalyzing}
        >
          {isAnalyzing ? 'Analyzing...' : 'Analyze Campaign'}
        </AnalyzeButton>
      </AnalyzeBar>
      {!!analysisError && <AnalysisMessage $type="error">{analysisError}</AnalysisMessage>}

      {/* ── AI Optimization ── */}
      <AiCard $scoreColor={!isAnalyzing && analysis ? (safeNum(analysis.health_score) >= 70 ? C.success : safeNum(analysis.health_score) >= 40 ? C.warning : C.danger) : null}>
        {!isAnalyzing && !analysis && (
          <AiEmptyState>
            <AiEmptyIcon>📊</AiEmptyIcon>
            Select a campaign and click Analyze to get AI-powered recommendations.
          </AiEmptyState>
        )}

        {isAnalyzing && (
          <SkeletonGrid>
            {[0, 1, 2].map(index => (
              <SkeletonCard key={index}>
                <SkeletonLine $w="40%" $h="16px" />
                <SkeletonLine $w="80%" />
                <SkeletonLine $w="92%" />
                <SkeletonLine $w="66%" />
                <SkeletonLine $w="38%" />
              </SkeletonCard>
            ))}
          </SkeletonGrid>
        )}

        {!isAnalyzing && analysis && (() => {
          const scoreColor = safeNum(analysis.health_score) >= 70 ? C.success : safeNum(analysis.health_score) >= 40 ? C.warning : C.danger;
          return (
          <>
            <AiTitleRow>
              <AnalysisHeader>
                <AnalysisScoreCircle $tone={scoreColor}>
                  {safeNum(analysis.health_score)}
                </AnalysisScoreCircle>
                <AnalysisTitleBlock>
                  <AnalysisTitle>AI Campaign Analysis</AnalysisTitle>
                  <AnalysisHealthLabel>{analysis.health_label}</AnalysisHealthLabel>
                </AnalysisTitleBlock>
              </AnalysisHeader>
            </AiTitleRow>

            <AnalysisSummary>{analysis.summary}</AnalysisSummary>

            {(analysis.recommendations || []).length > 0 ? (
              <RecommendationGrid>
                {(analysis.recommendations || []).map((item, index) => {
                  const tone = getPriorityTone(item.priority);
                  return (
                    <RecommendationCard key={`${item.title || 'recommendation'}-${index}`}>
                      <PriorityPill $color={tone.color} $background={tone.background}>{tone.label}</PriorityPill>
                      <RecommendationTitle>{item.title}</RecommendationTitle>
                      <RecommendationDesc>{item.description}</RecommendationDesc>
                      <RecommendationAction type="button" onClick={() => handleRecommendationAction(item.action)}>
                        {item.action}
                      </RecommendationAction>
                    </RecommendationCard>
                  );
                })}
              </RecommendationGrid>
            ) : (
              <AnalysisMessage>No recommendations were returned for this campaign.</AnalysisMessage>
            )}

            {!!analysis.platform_breakdown?.length && (
              <PlatformRow>
                {analysis.platform_breakdown.map((platformItem, index) => {
                  const tone = getPerformanceTone(platformItem.performance);
                  return (
                    <PlatformPill
                      key={`${platformItem.platform || 'platform'}-${index}`}
                      $color={tone.color}
                      $background={tone.background}
                    >
                      {platformItem.platform}
                      <PlatformDot />
                      {platformItem.performance}
                    </PlatformPill>
                  );
                })}
              </PlatformRow>
            )}

            {!!analysis.next_steps?.length && (
              <NextStepsCard>
                <NextStepsLabel>Recommended Next Steps</NextStepsLabel>
                {analysis.next_steps.map((step, index) => (
                  <NextStepRow key={`${step}-${index}`}>
                    <NextStepCircle>{index + 1}</NextStepCircle>
                    <NextStepText>{step}</NextStepText>
                  </NextStepRow>
                ))}
              </NextStepsCard>
            )}
          </>
          );
        })()}
      </AiCard>
      {!!toastMessage && <Toast>{toastMessage}</Toast>}
    </Page>
  );
}
