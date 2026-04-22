import { useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components'; // keyframes used for fadeIn
import useDashboard from '../../hooks/useDashboard';
import { crm as C } from '../../styles/crmTheme';
import PlatformLogo from '../../components/crm/PlatformLogo';

// ── Helpers ───────────────────────────────────────────────────────────────────

const SOURCE_LABEL = {
  facebook_ads:   'Facebook Ads',
  google_ads:     'Google Ads',
  tiktok_ads:     'TikTok Ads',
  instagram:      'Instagram',
  landing_page:   'Landing Page',
  affiliate_link: 'Affiliate Link',
  website_widget: 'Website Widget',
  api:            'API',
};

const STAGE_ORDER = ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost'];

const STAGE_COLOR = {
  new:         C.muted,
  contacted:   C.accent,
  qualified:   '#06b6d4',
  proposal:    C.purple,
  negotiation: C.warning,
  won:         C.success,
  lost:        C.danger,
};

function timeAgo(isoString) {
  const diff = Date.now() - new Date(isoString).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return `${Math.floor(d / 30)}mo ago`;
}

function initials(first, last) {
  return `${(first || '?')[0]}${(last || '?')[0]}`.toUpperCase();
}

function fmt(n) {
  if (n === null || n === undefined) return '—';
  return Number(n).toLocaleString();
}

function fmtMoney(n) {
  if (n === null || n === undefined) return '—';
  return '$' + Number(n).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

// ── Animations ────────────────────────────────────────────────────────────────
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
`;

// ── Shared layout ─────────────────────────────────────────────────────────────
const Page = styled.div`
  padding: 24px;
  animation: ${fadeIn} 0.25s ease;
`;

const SectionTitle = styled.h2`
  font-size: 14px;
  font-weight: 700;
  color: ${C.text};
  margin: 0 0 14px 0;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Card = styled.div`
  background: ${C.card};
  border: 1px solid ${C.border};
  border-radius: 12px;
`;

// ── Loading / Error ───────────────────────────────────────────────────────────
const CenterMsg = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 60vh;
  color: ${C.muted};
  font-size: 14px;
`;

// ── KPI Cards ─────────────────────────────────────────────────────────────────
const KpiRow = styled.div`
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
  margin-bottom: 20px;

  @media (max-width: 1100px) { grid-template-columns: repeat(3, 1fr); }
  @media (max-width: 700px)  { grid-template-columns: repeat(2, 1fr); }
`;

const KpiCard = styled(Card)`
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const KpiLabel = styled.div`
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: ${C.muted};
`;

const KpiValue = styled.div`
  font-size: 28px;
  font-weight: 800;
  color: ${({ $color }) => $color || C.text};
  line-height: 1;
`;

const KpiSub = styled.div`
  font-size: 11px;
  color: ${C.muted};
`;

// ── Two-column grid ───────────────────────────────────────────────────────────
const TwoCol = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 20px;

  @media (max-width: 900px) { grid-template-columns: 1fr; }
`;

// ── AI Insights ───────────────────────────────────────────────────────────────
const InsightsCard = styled(Card)`
  padding: 20px;
`;

const InsightsTitleRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
`;

const GradientTitle = styled.span`
  font-size: 15px;
  font-weight: 700;
  background: linear-gradient(135deg, ${C.purple}, ${C.accent});
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;


const InsightsEmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 32px 16px;
  gap: 12px;
  color: ${C.muted};
`;

const InsightsEmptyIcon = styled.div`
  font-size: 32px;
  opacity: 0.4;
`;

const InsightsEmptyText = styled.div`
  font-size: 13px;
  line-height: 1.6;
  max-width: 260px;
`;

const InsightsEmptyBtn = styled.button`
  background: ${C.accent};
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 8px 16px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  &:hover { opacity: 0.85; }
`;


// ── Sources + Pipeline (right column) ────────────────────────────────────────
const RightColumnCard = styled(Card)`
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const SourceList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const SourceRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const SourceMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;


const SourceName = styled.span`
  font-size: 12px;
  font-weight: 600;
  color: ${C.text};
  flex: 1;
`;

const SourceCount = styled.span`
  font-size: 12px;
  color: ${C.muted};
`;

const SourcePct = styled.span`
  font-size: 11px;
  font-weight: 600;
  color: ${C.accent};
  width: 36px;
  text-align: right;
`;

const ProgressTrack = styled.div`
  height: 4px;
  background: ${C.border};
  border-radius: 999px;
  overflow: hidden;
`;

const ProgressFill = styled.div`
  height: 100%;
  width: ${({ $pct }) => $pct}%;
  background: linear-gradient(90deg, ${C.accent}, ${C.purple});
  border-radius: 999px;
  transition: width 0.6s ease;
`;

const Divider = styled.div`
  height: 1px;
  background: ${C.border};
`;

const PipelineGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
`;

const PipelineStageCard = styled.div`
  background: ${C.surface};
  border: 1px solid ${C.border};
  border-top: 2px solid ${({ $color }) => $color || C.muted};
  border-radius: 8px;
  padding: 10px 8px;
  text-align: center;
`;

const StageCount = styled.div`
  font-size: 20px;
  font-weight: 800;
  color: ${C.text};
  line-height: 1;
`;

const StageLabel = styled.div`
  font-size: 10px;
  text-transform: capitalize;
  color: ${C.muted};
  margin-top: 3px;
`;

// ── Recent Leads ──────────────────────────────────────────────────────────────
const RecentCard = styled(Card)`
  padding: 20px;
`;

const RecentHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
`;

const ViewAllBtn = styled.button`
  background: none;
  border: none;
  color: ${C.accent};
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  padding: 0;
  &:hover { color: #4d93ff; }
`;

const LeadRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid ${C.border};
  &:last-child { border-bottom: none; }
`;

const LeadAvatar = styled.div`
  flex-shrink: 0;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: ${({ $color }) => $color || C.accent};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  color: #fff;
`;

const LeadInfo = styled.div`flex: 1; min-width: 0;`;

const LeadName = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: ${C.text};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const LeadMeta = styled.div`
  font-size: 11px;
  color: ${C.muted};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ScoreBadge = styled.span`
  flex-shrink: 0;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 3px 8px;
  border-radius: 999px;
  color: #fff;
  background: ${({ $cls }) =>
    $cls === 'hot'  ? C.hot  :
    $cls === 'warm' ? C.warm :
                      C.cold};
`;

const TimeAgo = styled.div`
  flex-shrink: 0;
  font-size: 11px;
  color: ${C.muted};
  white-space: nowrap;
`;

// Avatar accent colours cycle
const AVATAR_COLORS = [C.accent, C.purple, C.success, C.warning, C.danger];

// ── Component ─────────────────────────────────────────────────────────────────
export default function CRMDashboard() {
  const { summary, loading, error } = useDashboard();
  const navigate = useNavigate();

  if (loading) return <CenterMsg>Loading…</CenterMsg>;
  if (error)   return <CenterMsg style={{ color: C.danger }}>{error}</CenterMsg>;
  if (!summary) return null;

  // Derived values for source breakdown percentages
  const totalFromSources = summary.source_breakdown.reduce((s, r) => s + r.count, 0) || 1;

  // Sort pipeline in canonical stage order
  const pipelineSorted = STAGE_ORDER
    .map(stage => summary.pipeline_summary.find(p => p.stage === stage))
    .filter(Boolean);

  return (
    <Page>

      {/* ── KPI row ── */}
      <KpiRow>
        <KpiCard>
          <KpiLabel>Total Leads</KpiLabel>
          <KpiValue>{fmt(summary.total_leads)}</KpiValue>
          <KpiSub>all time</KpiSub>
        </KpiCard>

        <KpiCard>
          <KpiLabel>Hot Leads</KpiLabel>
          <KpiValue $color={C.hot}>{fmt(summary.hot_leads)}</KpiValue>
          <KpiSub>classification = hot</KpiSub>
        </KpiCard>

        <KpiCard>
          <KpiLabel>Revenue</KpiLabel>
          <KpiValue $color={C.success}>{fmtMoney(summary.total_revenue)}</KpiValue>
          <KpiSub>won leads predicted value</KpiSub>
        </KpiCard>

        <KpiCard>
          <KpiLabel>Conversion Rate</KpiLabel>
          <KpiValue $color={C.accent}>{summary.conversion_rate}%</KpiValue>
          <KpiSub>won / total leads</KpiSub>
        </KpiCard>

        <KpiCard>
          <KpiLabel>Avg AI Score</KpiLabel>
          <KpiValue $color={C.purple}>{summary.avg_ai_score}</KpiValue>
          <KpiSub>out of 100</KpiSub>
        </KpiCard>
      </KpiRow>

      {/* ── Two-column grid ── */}
      <TwoCol>

        {/* Left — AI Insights */}
        <InsightsCard>
          <InsightsTitleRow>
            <GradientTitle>AI Insights</GradientTitle>
          </InsightsTitleRow>

          <InsightsEmptyState>
            <InsightsEmptyIcon>🤖</InsightsEmptyIcon>
            <InsightsEmptyText>
              AI Insights will appear here once you have active campaigns and leads.
              Connect an integration to get started.
            </InsightsEmptyText>
            <InsightsEmptyBtn onClick={() => navigate('/crm/settings')}>
              Connect Integration →
            </InsightsEmptyBtn>
          </InsightsEmptyState>
        </InsightsCard>

        {/* Right — Sources + Pipeline */}
        <RightColumnCard>

          {/* Lead Sources */}
          <div>
            <SectionTitle>Lead Sources</SectionTitle>
            <SourceList>
              {summary.source_breakdown
                .slice()
                .sort((a, b) => b.count - a.count)
                .map(row => {
                  const pct = Math.round((row.count / totalFromSources) * 100);
                  const key = row.source;
                  return (
                    <SourceRow key={key}>
                      <SourceMeta>
                        <PlatformLogo name={key} size={20} />
                        <SourceName>{SOURCE_LABEL[key] || key}</SourceName>
                        <SourceCount>{row.count} leads</SourceCount>
                        <SourcePct>{pct}%</SourcePct>
                      </SourceMeta>
                      <ProgressTrack>
                        <ProgressFill $pct={pct} />
                      </ProgressTrack>
                    </SourceRow>
                  );
                })}
            </SourceList>
          </div>

          <Divider />

          {/* Pipeline */}
          <div>
            <SectionTitle>Pipeline</SectionTitle>
            <PipelineGrid>
              {pipelineSorted.map(p => (
                <PipelineStageCard key={p.stage} $color={STAGE_COLOR[p.stage]}>
                  <StageCount>{p.count}</StageCount>
                  <StageLabel>{p.stage}</StageLabel>
                </PipelineStageCard>
              ))}
            </PipelineGrid>
          </div>

        </RightColumnCard>
      </TwoCol>

      {/* ── Recent Leads ── */}
      <RecentCard>
        <RecentHeader>
          <SectionTitle style={{ margin: 0 }}>Recent Leads</SectionTitle>
          <ViewAllBtn onClick={() => navigate('/crm/leads')}>View All →</ViewAllBtn>
        </RecentHeader>

        {summary.recent_leads.map((lead, i) => (
          <LeadRow key={lead.id}>
            <LeadAvatar $color={AVATAR_COLORS[i % AVATAR_COLORS.length]}>
              {initials(lead.first_name, lead.last_name)}
            </LeadAvatar>

            <LeadInfo>
              <LeadName>{lead.first_name} {lead.last_name}</LeadName>
              <LeadMeta>
                {lead.company || lead.email} &nbsp;·&nbsp;
                <PlatformLogo name={lead.source} size={14} />{' '}{SOURCE_LABEL[lead.source] || lead.source}
              </LeadMeta>
            </LeadInfo>

            <ScoreBadge $cls={lead.classification}>{lead.classification}</ScoreBadge>

            <TimeAgo>{timeAgo(lead.created_at)}</TimeAgo>
          </LeadRow>
        ))}
      </RecentCard>

    </Page>
  );
}
