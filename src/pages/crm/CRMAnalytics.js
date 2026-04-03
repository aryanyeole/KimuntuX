import { useMemo } from 'react';
import styled, { keyframes } from 'styled-components';
import useDashboard from '../../hooks/useDashboard';

// ── Palette ───────────────────────────────────────────────────────────────────
const C = {
  bg: '#060d1b', surface: '#0c1527', card: '#121e34', border: '#1a2d4d',
  text: '#e4eaf4', muted: '#6b7fa3', accent: '#2d7aff',
  success: '#00c48c', warning: '#ffb020', danger: '#ff4757', purple: '#8b5cf6',
};

const STAGE_ORDER = ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won'];
const STAGE_LABEL = {
  new: 'New', contacted: 'Contacted', qualified: 'Qualified',
  proposal: 'Proposal', negotiation: 'Negotiation', won: 'Won',
};
const STAGE_COLOR = {
  new: C.accent, contacted: C.purple, qualified: '#06b6d4',
  proposal: C.warning, negotiation: '#f97316', won: C.success,
};

const ROI_TABLE = [
  { channel: 'Google Ads', emoji: '🔍', clicks: 5978, leads: 1475, ctr: 6.3,  cpl: 7.75,  cpa: 28.40,  roas: 4.6  },
  { channel: 'Facebook',   emoji: '📘', clicks: 4109, leads: 929,  ctr: 5.2,  cpl: 8.35,  cpa: 92.90,  roas: 3.8  },
  { channel: 'Instagram',  emoji: '📸', clicks: 3410, leads: 813,  ctr: 4.7,  cpl: 9.20,  cpa: 94.90,  roas: 3.1  },
  { channel: 'YouTube',    emoji: '▶️', clicks: 2987, leads: 654,  ctr: 3.8,  cpl: 10.75, cpa: 41.20,  roas: 2.6  },
  { channel: 'TikTok',     emoji: '🎵', clicks: 3276, leads: 689,  ctr: 5.2,  cpl: 11.11, cpa: 140.00, roas: 4.17 },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtMoney = n => n ? '$' + Number(n).toLocaleString(undefined, { maximumFractionDigits: 0 }) : '$0';
const fmtX = n => `${Number(n).toFixed(2)}x`;
const fmtPct = n => `${Number(n).toFixed(1)}%`;

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
const TableScroll = styled.div`overflow-x:auto;`;
const Table = styled.table`width:100%;border-collapse:collapse;min-width:700px;`;
const Th = styled.th`
  font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;
  color:${C.muted};padding:11px 14px;text-align:left;background:${C.surface};
  border-bottom:1px solid ${C.border};white-space:nowrap;
`;
const Tr = styled.tr`
  border-bottom:1px solid ${C.border};&:last-child{border-bottom:none;}
  transition:background .12s;&:hover{background:${C.surface};}
`;
const Td = styled.td`padding:11px 14px;font-size:12px;color:${C.text};vertical-align:middle;`;

// ── Component ─────────────────────────────────────────────────────────────────
export default function CRMAnalytics() {
  const { summary, loading } = useDashboard();

  const kpis = useMemo(() => {
    if (!summary) return { pipelineValue: 0, avgScore: 0, wonCount: 0 };
    const pipeline = summary.pipeline_summary || [];
    const pipelineValue = pipeline.reduce((s, p) => s + (p.total_value || 0), 0);
    const wonStage = pipeline.find(p => p.stage === 'won');
    return {
      pipelineValue,
      avgScore: summary.avg_ai_score || 0,
      wonCount: wonStage?.count || 0,
    };
  }, [summary]);

  const classBreakdown = useMemo(() => {
    if (!summary) return { hot: 0, warm: 0, cold: 0, total: 1 };
    const cb = summary.classification_breakdown || [];
    const find = cls => cb.find(x => x.classification === cls)?.count || 0;
    const hot = find('hot'), warm = find('warm'), cold = find('cold');
    return { hot, warm, cold, total: Math.max(hot + warm + cold, 1) };
  }, [summary]);

  const pipelineStages = useMemo(() => {
    if (!summary?.pipeline_summary) return [];
    const sorted = STAGE_ORDER
      .map(s => summary.pipeline_summary.find(p => p.stage === s))
      .filter(Boolean);
    const maxCount = Math.max(...sorted.map(s => s.count), 1);
    return sorted.map(s => ({ ...s, pct: Math.round((s.count / maxCount) * 100) }));
  }, [summary]);

  const { hot, warm, cold, total } = classBreakdown;

  if (loading && !summary) {
    return (
      <Page style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 64px)', color: C.muted, fontSize: 14 }}>
        Loading analytics…
      </Page>
    );
  }

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
          <KpiValue $color={C.warning}>$235,590</KpiValue>
          <KpiSub>April 2026</KpiSub>
        </KpiCard>
      </KpiRow>

      {/* ── Two-col ── */}
      <TwoCol>
        <Card>
          <CardTitle>Score Distribution</CardTitle>
          <CircleRow>
            <CircleItem>
              <Circle $color={C.danger}>{Math.round((hot / total) * 100)}%</Circle>
              <CircleLabel>Hot</CircleLabel>
              <CircleCount>{hot} leads</CircleCount>
            </CircleItem>
            <CircleItem>
              <Circle $color={C.warning}>{Math.round((warm / total) * 100)}%</Circle>
              <CircleLabel>Warm</CircleLabel>
              <CircleCount>{warm} leads</CircleCount>
            </CircleItem>
            <CircleItem>
              <Circle $color={C.accent}>{Math.round((cold / total) * 100)}%</Circle>
              <CircleLabel>Cold</CircleLabel>
              <CircleCount>{cold} leads</CircleCount>
            </CircleItem>
          </CircleRow>
          <StackBar>
            <StackSegment $color={C.danger} $flex={hot || 0} />
            <StackSegment $color={C.warning} $flex={warm || 0} />
            <StackSegment $color={C.accent} $flex={cold || 0} />
          </StackBar>
        </Card>

        <Card>
          <CardTitle>Pipeline by Stage</CardTitle>
          {pipelineStages.map(s => (
            <StageRow key={s.stage}>
              <StageTop>
                <StageName>{STAGE_LABEL[s.stage] || s.stage}</StageName>
                <StageMeta>{s.count} leads · {fmtMoney(s.total_value)}</StageMeta>
              </StageTop>
              <StageBarBg>
                <StageBarFill $color={STAGE_COLOR[s.stage] || C.muted} $pct={s.pct} />
              </StageBarBg>
            </StageRow>
          ))}
        </Card>
      </TwoCol>

      {/* ── ROI Table ── */}
      <TableCard>
        <TableTitle>ROI &amp; CPA Overview</TableTitle>
        <TableScroll>
          <Table>
            <thead>
              <tr>
                <Th>Channel</Th>
                <Th>Clicks</Th>
                <Th>Leads</Th>
                <Th>CTR</Th>
                <Th>CPL</Th>
                <Th>CPA</Th>
                <Th>ROAS</Th>
              </tr>
            </thead>
            <tbody>
              {ROI_TABLE.map(row => (
                <Tr key={row.channel}>
                  <Td style={{ fontWeight: 700 }}>{row.emoji} {row.channel}</Td>
                  <Td style={{ color: C.muted }}>{row.clicks.toLocaleString()}</Td>
                  <Td>{row.leads.toLocaleString()}</Td>
                  <Td style={{ color: row.ctr > 5 ? C.success : C.muted }}>{fmtPct(row.ctr)}</Td>
                  <Td style={{ color: C.muted }}>${row.cpl.toFixed(2)}</Td>
                  <Td style={{ color: C.muted }}>${row.cpa.toFixed(2)}</Td>
                  <Td style={{ fontWeight: 700, color: row.roas >= 4 ? C.success : C.warning }}>
                    {fmtX(row.roas)}
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </TableScroll>
      </TableCard>
    </Page>
  );
}
