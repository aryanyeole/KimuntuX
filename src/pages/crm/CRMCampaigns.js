import { useMemo } from 'react';
import styled, { keyframes } from 'styled-components';
import useCampaigns from '../../hooks/useCampaigns';
import { crm as C } from '../../styles/crmTheme';
import PlatformLogo from '../../components/crm/PlatformLogo';

const PLATFORM_LABEL = {
  facebook_ads: 'Facebook Ads', google_ads: 'Google Ads', tiktok_ads: 'TikTok Ads',
  instagram: 'Instagram', youtube: 'YouTube', email: 'Email',
};

const STATUS_COLOR = {
  active: C.success, paused: C.warning, completed: C.muted, draft: C.border,
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtMoney = n => (n != null) ? '$' + Number(n).toLocaleString(undefined, { maximumFractionDigits: 0 }) : '—';
const fmtPct = n => (n != null) ? `${Number(n).toFixed(1)}%` : '—';
const fmtX = n => (n != null) ? `${Number(n).toFixed(2)}x` : '—';
const safeNum = n => (typeof n === 'number' && !isNaN(n)) ? n : 0;

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
  transition:background .12s;&:hover{background:${C.surface};}
`;
const Td = styled.td`padding:11px 14px;font-size:12px;color:${C.text};vertical-align:middle;`;

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
    emoji: null,
    title: 'Scale AI Growth Q1',
    desc: 'This campaign has a 3.4x ROAS. Increasing daily budget by 30% could yield an additional $4,200 in monthly revenue.',
    action: 'Increase Budget',
  },
  {
    emoji: null,
    title: 'Pause IG Retargeting',
    desc: 'ROAS dropped below 1.5x over the last 14 days. Reallocating spend to Facebook Cold would improve overall efficiency.',
    action: 'Pause Campaign',
  },
  {
    emoji: null,
    title: 'Scale Trending Offers on TikTok',
    desc: 'LeanBiome and CitrusBurn gravity scores surged 15%+ this week. Launch TikTok UGC before the window closes.',
    action: 'Create Campaign',
  },
];

// ── Component ─────────────────────────────────────────────────────────────────
export default function CRMCampaigns() {
  const { campaigns, loading } = useCampaigns();

  // Compute KPI aggregates client-side
  const kpis = useMemo(() => {
    const active = campaigns.filter(c => c.status === 'active').length;
    let spend = 0, roasSum = 0, roasCount = 0, leads = 0, conversions = 0;
    campaigns.forEach(c => {
      const m = c.metrics || {};
      spend += safeNum(m.spend);
      leads += safeNum(m.leads);
      conversions += safeNum(m.conversions);
      if (m.roas != null) { roasSum += safeNum(m.roas); roasCount++; }
    });
    return {
      active,
      spend,
      avgRoas: roasCount ? roasSum / roasCount : 0,
      leads,
      conversions,
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
                const m = c.metrics || {};
                const roas = m.roas;
                const platform = c.platform?.toLowerCase().replace(' ', '_');
                return (
                  <Tr key={c.id}>
                    <Td style={{ fontWeight: 700, maxWidth: 200 }}>{c.name}</Td>
                    <Td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <PlatformLogo name={c.platform} size={20} />
                        <span style={{ color: C.muted }}>
                          {PLATFORM_LABEL[platform] || c.platform}
                        </span>
                      </span>
                    </Td>
                    <Td style={{ color: C.accent }}>{c.offer_name || '—'}</Td>
                    <Td><StatusBadge $status={c.status}>{c.status}</StatusBadge></Td>
                    <Td>{safeNum(m.leads).toLocaleString() || '—'}</Td>
                    <Td>{safeNum(m.conversions).toLocaleString() || '—'}</Td>
                    <Td>{m.spend != null ? fmtMoney(m.spend) : '—'}</Td>
                    <Td style={{ color: C.success }}>{m.revenue != null ? fmtMoney(m.revenue) : '—'}</Td>
                    <Td>
                      {roas != null
                        ? <RoasBadge $good={roas >= 3}>{fmtX(roas)}</RoasBadge>
                        : <span style={{ color: C.muted }}>—</span>}
                    </Td>
                    <Td style={{ color: C.muted }}>{m.ctr != null ? fmtPct(m.ctr) : '—'}</Td>
                    <Td style={{ color: C.muted }}>{m.cpl != null ? fmtMoney(m.cpl) : '—'}</Td>
                  </Tr>
                );
              })}
            </tbody>
          </Table>
        </TableScroll>
      </TableCard>

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
              <SuggestionAction>{s.action}</SuggestionAction>
            </SuggestionCard>
          ))}
        </SuggestionsGrid>
      </AiCard>
    </Page>
  );
}
