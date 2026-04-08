import { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import useOffers from '../../hooks/useOffers';

// ── Palette ───────────────────────────────────────────────────────────────────
const C = {
  bg: '#060d1b', surface: '#0c1527', card: '#121e34', border: '#1a2d4d',
  text: '#e4eaf4', muted: '#6b7fa3', accent: '#2d7aff', accentHover: '#4d93ff',
  success: '#00c48c', warning: '#ffb020', danger: '#ff4757', purple: '#8b5cf6',
};

const NICHES = [
  'All Niches', 'Weight Loss', 'Muscle Building', 'Skin Care', 'Hair Growth',
  'Brain Health', 'Blood Sugar', 'Joint Pain', 'Sleep Aid', 'Gut Health', 'Anti-Aging',
];

const NETWORKS = [
  { id: 'ClickBank',   emoji: '🟠' },
  { id: 'BuyGoods',   emoji: '🟢' },
  { id: 'MaxWeb',     emoji: '🔵' },
  { id: 'Digistore24',emoji: '🟣' },
];

const PLATFORM_EMOJI = {
  ClickBank: '🟠', BuyGoods: '🟢', MaxWeb: '🔵', Digistore24: '🟣',
};

const SORT_OPTIONS = [
  { value: 'gravity',         label: 'Sort by Gravity' },
  { value: 'aov',             label: 'Sort by AOV' },
  { value: 'commission_rate', label: 'Sort by Commission' },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
const pct = n => (n !== null && n !== undefined) ? `${(n * 100).toFixed(0)}%` : '—';
const fmtMoney = n => (n !== null && n !== undefined) ? `$${Number(n).toFixed(0)}` : '—';
const fmtGravity = n => (n !== null && n !== undefined) ? Number(n).toFixed(1) : '—';

// ── Animations ────────────────────────────────────────────────────────────────
const fadeIn = keyframes`from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}`;

// ── Layout ────────────────────────────────────────────────────────────────────
const Page = styled.div`padding:20px;animation:${fadeIn} .2s ease;`;
const TwoCol = styled.div`
  display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px;
  @media(max-width:800px){grid-template-columns:1fr;}
`;
const Card = styled.div`
  background:${C.card};border:1px solid ${C.border};border-radius:12px;padding:20px;
`;
const CardTitle = styled.h3`
  font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;
  color:${C.muted};margin:0 0 14px 0;
`;

// ── Niche + Network selectors ─────────────────────────────────────────────────
const NicheSelect = styled.select`
  width:100%;background:${C.surface};border:1px solid ${C.border};border-radius:8px;
  color:${C.text};font-size:13px;padding:9px 12px;outline:none;cursor:pointer;
  &:focus{border-color:${C.accent};}option{background:${C.card};}
`;
const NetworkList = styled.div`display:flex;flex-direction:column;gap:10px;`;
const NetworkRow = styled.label`
  display:flex;align-items:center;gap:10px;cursor:pointer;padding:10px 12px;
  background:${C.surface};border:1px solid ${({ $checked }) => $checked ? C.accent : C.border};
  border-radius:8px;transition:border-color .15s;
  &:hover{border-color:${C.accent};}
`;
const Checkbox = styled.input.attrs({ type: 'checkbox' })`
  accent-color:${C.accent};width:14px;height:14px;cursor:pointer;
`;
const NetworkEmoji = styled.span`font-size:16px;`;
const NetworkName = styled.span`font-size:13px;font-weight:600;color:${C.text};flex:1;`;

// ── Trending tables ───────────────────────────────────────────────────────────
const SmallTable = styled.table`width:100%;border-collapse:collapse;`;
const STh = styled.th`
  font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;
  color:${C.muted};padding:6px 8px;text-align:left;border-bottom:1px solid ${C.border};
`;
const STr = styled.tr`
  border-bottom:1px solid ${C.border};&:last-child{border-bottom:none;}
`;
const STd = styled.td`padding:8px;font-size:12px;color:${C.text};`;

// ── Best Offers table ─────────────────────────────────────────────────────────
const FullCard = styled(Card)`margin-bottom:0;`;
const TableHeader = styled.div`
  display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;flex-wrap:wrap;gap:8px;
`;
const SortSelect = styled.select`
  background:${C.surface};border:1px solid ${C.border};border-radius:8px;
  color:${C.text};font-size:12px;padding:6px 10px;outline:none;cursor:pointer;
  option{background:${C.card};}
`;
const OffersTable = styled.table`width:100%;border-collapse:collapse;`;
const OTh = styled.th`
  font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;
  color:${C.muted};padding:10px 12px;text-align:left;background:${C.surface};
  border-bottom:1px solid ${C.border};white-space:nowrap;
`;
const OTr = styled.tr`
  border-bottom:1px solid ${C.border};&:last-child{border-bottom:none;}
  transition:background .12s;&:hover{background:${C.surface};}
`;
const OTd = styled.td`padding:10px 12px;font-size:13px;color:${C.text};`;
const NicheBadge = styled.span`
  font-size:10px;font-weight:600;padding:2px 8px;border-radius:999px;
  background:${C.surface};border:1px solid ${C.border};color:${C.muted};
`;
const PromoteBtn = styled.button`
  background:none;border:1px solid ${C.accent};color:${C.accent};border-radius:6px;
  font-size:11px;font-weight:700;padding:4px 10px;cursor:pointer;
  &:hover{background:${C.accent};color:#fff;}
`;
const TrendUp = styled.span`color:${C.success};font-weight:700;`;
const TrendDown = styled.span`color:${C.danger};font-weight:700;`;

const EmptyMsg = styled.div`padding:24px;text-align:center;color:${C.muted};font-size:13px;`;

// ── Component ─────────────────────────────────────────────────────────────────
export default function CRMOffers() {
  const [niche, setNiche] = useState('');
  const [checkedNetworks, setCheckedNetworks] = useState(
    Object.fromEntries(NETWORKS.map(n => [n.id, true]))
  );
  const [sortBy, setSortBy] = useState('gravity');

  const { offers, loading, refetch } = useOffers();

  // Refetch when niche or sort changes
  useEffect(() => {
    refetch({
      niche: niche || undefined,
      sort_by: sortBy,
      sort_dir: 'desc',
    });
  }, [niche, sortBy]); // eslint-disable-line

  // Client-side network filter
  const activeNetworks = NETWORKS.filter(n => checkedNetworks[n.id]).map(n => n.id);
  const filtered = offers.filter(o => activeNetworks.includes(o.network));

  const trendingUp = filtered
    .filter(o => o.trend_direction === 'up')
    .sort((a, b) => (b.trend_value || 0) - (a.trend_value || 0));

  const trendingDown = filtered
    .filter(o => o.trend_direction === 'down')
    .sort((a, b) => (a.trend_value || 0) - (b.trend_value || 0));

  function toggleNetwork(id) {
    setCheckedNetworks(prev => ({ ...prev, [id]: !prev[id] }));
  }

  return (
    <Page>
      {/* ── Row 1: Niche + Networks ── */}
      <TwoCol>
        <Card>
          <CardTitle>Select Niche</CardTitle>
          <NicheSelect value={niche} onChange={e => setNiche(e.target.value === 'All Niches' ? '' : e.target.value)}>
            {NICHES.map(n => <option key={n} value={n === 'All Niches' ? '' : n}>{n}</option>)}
          </NicheSelect>
        </Card>

        <Card>
          <CardTitle>Select Networks</CardTitle>
          <NetworkList>
            {NETWORKS.map(net => (
              <NetworkRow key={net.id} $checked={checkedNetworks[net.id]}>
                <Checkbox
                  checked={checkedNetworks[net.id]}
                  onChange={() => toggleNetwork(net.id)}
                />
                <NetworkEmoji>{net.emoji}</NetworkEmoji>
                <NetworkName>{net.id}</NetworkName>
              </NetworkRow>
            ))}
          </NetworkList>
        </Card>
      </TwoCol>

      {/* ── Row 2: Trending Up + Down ── */}
      <TwoCol>
        <Card>
          <CardTitle>📈 Trending Up</CardTitle>
          {loading ? <EmptyMsg>Loading…</EmptyMsg> : trendingUp.length === 0 ? (
            <EmptyMsg>No trending offers found.</EmptyMsg>
          ) : (
            <SmallTable>
              <thead>
                <tr>
                  <STh>Product</STh>
                  <STh>Gravity</STh>
                  <STh>Increase</STh>
                </tr>
              </thead>
              <tbody>
                {trendingUp.map(o => (
                  <STr key={o.id}>
                    <STd style={{ fontWeight: 600 }}>{o.name}</STd>
                    <STd>{fmtGravity(o.gravity)}</STd>
                    <STd><TrendUp>+{o.trend_value?.toFixed(1)}%</TrendUp></STd>
                  </STr>
                ))}
              </tbody>
            </SmallTable>
          )}
        </Card>

        <Card>
          <CardTitle>📉 Trending Down</CardTitle>
          {loading ? <EmptyMsg>Loading…</EmptyMsg> : trendingDown.length === 0 ? (
            <EmptyMsg>No declining offers found.</EmptyMsg>
          ) : (
            <SmallTable>
              <thead>
                <tr>
                  <STh>Product</STh>
                  <STh>Gravity</STh>
                  <STh>Decrease</STh>
                </tr>
              </thead>
              <tbody>
                {trendingDown.map(o => (
                  <STr key={o.id}>
                    <STd style={{ fontWeight: 600 }}>{o.name}</STd>
                    <STd>{fmtGravity(o.gravity)}</STd>
                    <STd><TrendDown>{o.trend_value?.toFixed(1)}%</TrendDown></STd>
                  </STr>
                ))}
              </tbody>
            </SmallTable>
          )}
        </Card>
      </TwoCol>

      {/* ── Row 3: Best Offers ── */}
      <FullCard>
        <TableHeader>
          <CardTitle style={{ margin: 0 }}>Best Offers to Promote</CardTitle>
          <SortSelect value={sortBy} onChange={e => setSortBy(e.target.value)}>
            {SORT_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </SortSelect>
        </TableHeader>

        {loading ? <EmptyMsg>Loading offers…</EmptyMsg> : filtered.length === 0 ? (
          <EmptyMsg>No offers match your filters.</EmptyMsg>
        ) : (
          <OffersTable>
            <thead>
              <tr>
                <OTh>Offer</OTh>
                <OTh>Network</OTh>
                <OTh>Niche</OTh>
                <OTh>AOV</OTh>
                <OTh>Commission</OTh>
                <OTh>Conv Rate</OTh>
                <OTh>Trend</OTh>
                <OTh>Action</OTh>
              </tr>
            </thead>
            <tbody>
              {filtered.map(o => (
                <OTr key={o.id}>
                  <OTd style={{ fontWeight: 700 }}>{o.name}</OTd>
                  <OTd>{PLATFORM_EMOJI[o.network] || '🌐'} {o.network}</OTd>
                  <OTd><NicheBadge>{o.niche}</NicheBadge></OTd>
                  <OTd style={{ fontWeight: 700 }}>{fmtMoney(o.aov)}</OTd>
                  <OTd style={{ color: C.success, fontWeight: 600 }}>{pct(o.commission_rate)}</OTd>
                  <OTd style={{ color: C.muted }}>{o.conversion_rate ? pct(o.conversion_rate) : '—'}</OTd>
                  <OTd>
                    {o.trend_direction === 'up' && <TrendUp>↑ +{o.trend_value?.toFixed(1)}%</TrendUp>}
                    {o.trend_direction === 'down' && <TrendDown>↓ {o.trend_value?.toFixed(1)}%</TrendDown>}
                    {o.trend_direction === 'stable' && <span style={{ color: C.muted }}>—</span>}
                  </OTd>
                  <OTd><PromoteBtn>Promote</PromoteBtn></OTd>
                </OTr>
              ))}
            </tbody>
          </OffersTable>
        )}
      </FullCard>
    </Page>
  );
}
