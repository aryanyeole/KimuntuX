import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import useDashboard from '../../hooks/useDashboard';
import { crm as C } from '../../styles/crmTheme';

const STAGE_ORDER = ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won'];
const STAGE_LABEL = {
  new: 'New', contacted: 'Contacted', qualified: 'Qualified',
  proposal: 'Proposal', negotiation: 'Negotiation', won: 'Won',
};
const STAGE_COLOR = {
  new: C.accent, contacted: C.purple, qualified: '#06b6d4',
  proposal: C.warning, negotiation: '#f97316', won: C.success,
};


// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtMoney = n => n ? '$' + Number(n).toLocaleString(undefined, { maximumFractionDigits: 0 }) : '$0';

// ── Animations ────────────────────────────────────────────────────────────────
const fadeIn = keyframes`from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}`;

// ── Layout ────────────────────────────────────────────────────────────────────
const Page = styled.div`padding:20px;animation:${fadeIn} .2s ease;`;

// ── KPI Row ───────────────────────────────────────────────────────────────────
const KpiRow = styled.div`
  display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px;
  @media(max-width:900px){grid-template-columns:repeat(2,1fr);}
`;
const KpiCard = styled.div`
  background:${C.card};border:1px solid ${C.border};border-radius:12px;padding:18px 20px;
`;
const KpiLabel = styled.div`
  font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;
  color:${C.muted};margin-bottom:6px;
`;
const KpiValue = styled.div`
  font-size:26px;font-weight:800;color:${({ $color }) => $color || C.text};line-height:1;
`;
const KpiSub = styled.div`font-size:11px;color:${C.muted};margin-top:4px;`;

// ── Two-col grid ──────────────────────────────────────────────────────────────
const TwoCol = styled.div`
  display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px;
  @media(max-width:900px){grid-template-columns:1fr;}
`;
const Card = styled.div`
  background:${C.card};border:1px solid ${C.border};border-radius:12px;padding:20px;
`;
const CardTitle = styled.h3`
  font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;
  color:${C.muted};margin:0 0 18px 0;
`;

// ── Score Distribution ────────────────────────────────────────────────────────
const CircleRow = styled.div`display:flex;justify-content:space-around;margin-bottom:18px;`;
const CircleItem = styled.div`display:flex;flex-direction:column;align-items:center;gap:8px;`;
const Circle = styled.div`
  width:68px;height:68px;border-radius:50%;
  border:4px solid ${({ $color }) => $color};
  display:flex;align-items:center;justify-content:center;
  font-size:17px;font-weight:800;color:${({ $color }) => $color};
`;
const CircleLabel = styled.div`font-size:11px;font-weight:700;color:${C.muted};`;
const CircleCount = styled.div`font-size:11px;color:${C.text};`;
const StackBar = styled.div`
  height:8px;border-radius:999px;overflow:hidden;display:flex;background:${C.border};
`;
const StackSegment = styled.div`
  height:100%;background:${({ $color }) => $color};flex:${({ $flex }) => $flex};
`;

// ── Pipeline by Stage ─────────────────────────────────────────────────────────
const StageRow = styled.div`margin-bottom:12px;`;
const StageTop = styled.div`
  display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;
`;
const StageName = styled.span`font-size:12px;font-weight:600;color:${C.text};`;
const StageMeta = styled.span`font-size:11px;color:${C.muted};`;
const StageBarBg = styled.div`height:6px;background:${C.border};border-radius:999px;overflow:hidden;`;
const StageBarFill = styled.div`
  height:100%;border-radius:999px;
  background:${({ $color }) => $color};
  width:${({ $pct }) => $pct}%;
  transition:width .4s ease;
`;

// ── ROI Table ─────────────────────────────────────────────────────────────────
const TableCard = styled.div`
  background:${C.card};border:1px solid ${C.border};border-radius:12px;overflow:hidden;
`;
const TableTitle = styled.div`
  font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;
  color:${C.muted};padding:16px 20px 14px;
`;

// ── Empty states ──────────────────────────────────────────────────────────────
const EmptyState = styled.div`
  display:flex;flex-direction:column;align-items:center;justify-content:center;
  text-align:center;padding:32px 16px;gap:10px;color:${C.muted};
`;
const EmptyText = styled.div`font-size:12px;line-height:1.6;max-width:260px;`;
const EmptyBtn = styled.button`
  background:${C.accent};color:#fff;border:none;border-radius:8px;
  padding:7px 14px;font-size:12px;font-weight:600;cursor:pointer;margin-top:4px;
  &:hover{opacity:.85;}
`;

// ── Component ─────────────────────────────────────────────────────────────────
export default function CRMAnalytics() {
  const { summary, loading } = useDashboard();
  const navigate = useNavigate();

  const kpis = useMemo(() => {
    if (!summary) return { pipelineValue: 0, avgScore: 0, wonCount: 0, wonRevenue: 0 };
    const pipeline = summary.pipeline_summary || [];
    const pipelineValue = pipeline.reduce((s, p) => s + (p.total_value || 0), 0);
    const wonStage = pipeline.find(p => p.stage === 'won');
    return {
      pipelineValue,
      avgScore: summary.avg_ai_score || 0,
      wonCount: wonStage?.count || 0,
      wonRevenue: wonStage?.total_value || 0,
    };
  }, [summary]);

  const classBreakdown = useMemo(() => {
    if (!summary) return { hot: 0, warm: 0, cold: 0, realTotal: 0 };
    const hot = summary.hot_leads || 0;
    const warm = summary.warm_leads || 0;
    const cold = summary.cold_leads || 0;
    return { hot, warm, cold, realTotal: hot + warm + cold };
  }, [summary]);

  const pipelineStages = useMemo(() => {
    if (!summary?.pipeline_summary) return [];
    const sorted = STAGE_ORDER
      .map(s => summary.pipeline_summary.find(p => p.stage === s))
      .filter(Boolean);
    const maxCount = Math.max(...sorted.map(s => s.count), 1);
    return sorted.map(s => ({ ...s, pct: Math.round((s.count / maxCount) * 100) }));
  }, [summary]);

  const { hot, warm, cold, realTotal } = classBreakdown;
  const scoreTotal = Math.max(realTotal, 1); // avoid divide-by-zero for percentages

  if (loading && !summary) {
    return (
      <Page style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 64px)', color: C.muted, fontSize: 14 }}>
        Loading analytics…
      </Page>
    );
  }

  const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <Page>
      {/* ── KPI Row ── */}
      <KpiRow>
        <KpiCard>
          <KpiLabel>Total Pipeline Value</KpiLabel>
          <KpiValue $color={C.success}>{fmtMoney(kpis.pipelineValue)}</KpiValue>
          <KpiSub>across all stages</KpiSub>
        </KpiCard>
        <KpiCard>
          <KpiLabel>Avg Lead Score</KpiLabel>
          <KpiValue $color={C.accent}>{Math.round(kpis.avgScore)}</KpiValue>
          <KpiSub>AI-computed score</KpiSub>
        </KpiCard>
        <KpiCard>
          <KpiLabel>Won Deals</KpiLabel>
          <KpiValue $color={C.success}>{kpis.wonCount}</KpiValue>
          <KpiSub>converted leads</KpiSub>
        </KpiCard>
        <KpiCard>
          <KpiLabel>Month Sales</KpiLabel>
          <KpiValue $color={C.warning}>{fmtMoney(kpis.wonRevenue)}</KpiValue>
          <KpiSub>{currentMonth}</KpiSub>
        </KpiCard>
      </KpiRow>

      {/* ── Two-col ── */}
      <TwoCol>
        {/* Score Distribution — empty state when no leads scored */}
        <Card>
          <CardTitle>Score Distribution</CardTitle>
          {realTotal === 0 ? (
            <EmptyState>
              <EmptyText>Score distribution will appear once leads are scored by AI.</EmptyText>
            </EmptyState>
          ) : (
            <>
              <CircleRow>
                <CircleItem>
                  <Circle $color={C.danger}>{Math.round((hot / scoreTotal) * 100)}%</Circle>
                  <CircleLabel>Hot</CircleLabel>
                  <CircleCount>{hot} leads</CircleCount>
                </CircleItem>
                <CircleItem>
                  <Circle $color={C.warning}>{Math.round((warm / scoreTotal) * 100)}%</Circle>
                  <CircleLabel>Warm</CircleLabel>
                  <CircleCount>{warm} leads</CircleCount>
                </CircleItem>
                <CircleItem>
                  <Circle $color={C.accent}>{Math.round((cold / scoreTotal) * 100)}%</Circle>
                  <CircleLabel>Cold</CircleLabel>
                  <CircleCount>{cold} leads</CircleCount>
                </CircleItem>
              </CircleRow>
              <StackBar>
                <StackSegment $color={C.danger} $flex={hot || 0} />
                <StackSegment $color={C.warning} $flex={warm || 0} />
                <StackSegment $color={C.accent} $flex={cold || 0} />
              </StackBar>
            </>
          )}
        </Card>

        {/* Pipeline by Stage — empty state when no data */}
        <Card>
          <CardTitle>Pipeline by Stage</CardTitle>
          {pipelineStages.length === 0 ? (
            <EmptyState>
              <EmptyText>
                No deals in pipeline yet. Add leads and move them through stages to see pipeline distribution.
              </EmptyText>
            </EmptyState>
          ) : (
            pipelineStages.map(s => (
              <StageRow key={s.stage}>
                <StageTop>
                  <StageName>{STAGE_LABEL[s.stage] || s.stage}</StageName>
                  <StageMeta>{s.count} leads · {fmtMoney(s.total_value)}</StageMeta>
                </StageTop>
                <StageBarBg>
                  <StageBarFill $color={STAGE_COLOR[s.stage] || C.muted} $pct={s.pct} />
                </StageBarBg>
              </StageRow>
            ))
          )}
        </Card>
      </TwoCol>

      {/* ── ROI Table — empty state until campaign data exists ── */}
      <TableCard>
        <TableTitle>ROI &amp; CPA Overview</TableTitle>
        <EmptyState style={{ padding: '32px 20px' }}>
          <EmptyText>
            No campaign data yet. ROI and CPA metrics appear after campaigns start running.
          </EmptyText>
          <EmptyBtn onClick={() => navigate('/crm/campaigns')}>
            Create a Campaign →
          </EmptyBtn>
        </EmptyState>
      </TableCard>
    </Page>
  );
}
