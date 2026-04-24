import { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import useOffers from '../../hooks/useOffers';
import { crm as C } from '../../styles/crmTheme';
import PlatformLogo from '../../components/crm/PlatformLogo';

// ── Constants ─────────────────────────────────────────────────────────────────

const NICHES = [
  '', 'Weight Loss', 'Fitness', 'Keto / Diet', 'Health', 'Self Help',
  'Relationships', 'Spirituality', 'Make Money Online', 'Hobbies', 'Survival',
  'Green Energy', 'Wealth', 'Lottery',
];

const NETWORKS = ['ClickBank', 'BuyGoods', 'MaxWeb', 'Digistore24'];

const SORT_OPTIONS = [
  { value: 'gravity',         label: 'Gravity' },
  { value: 'aov',             label: 'AOV' },
  { value: 'commission_rate', label: 'Commission' },
];

const SOURCE_BADGE = {
  seed:               { label: 'Demo',      color: '#64748b' },
  curated:            { label: 'Curated',   color: '#0ea5e9' },
  clickbank_account:  { label: 'My CB Acct', color: '#8b5cf6' },
  user_added:         { label: 'My Track',  color: '#10b981' },
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const pct  = n => (n != null) ? `${(n * 100).toFixed(0)}%` : '—';
const fmtMoney = n => (n != null) ? `$${Number(n).toFixed(0)}` : '—';
const fmtGravity = n => (n != null) ? Number(n).toFixed(1) : '—';

// ── Animations ────────────────────────────────────────────────────────────────
const fadeIn = keyframes`from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}`;

// ── Styled components ─────────────────────────────────────────────────────────
const Page = styled.div`padding:20px;animation:${fadeIn} .2s ease;`;

const SectionCard = styled.div`
  background:${C.card};border:1px solid ${C.border};border-radius:12px;
  padding:20px;margin-bottom:20px;
`;
const SectionHeader = styled.div`
  display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:16px;
`;
const SectionTitle = styled.h3`
  font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;
  color:${C.muted};margin:0;
`;

const FilterRow = styled.div`display:flex;gap:8px;align-items:center;flex-wrap:wrap;`;
const SmallSelect = styled.select`
  background:${C.surface};border:1px solid ${C.border};border-radius:8px;
  color:${C.text};font-size:12px;padding:6px 10px;outline:none;cursor:pointer;
  option{background:${C.card};}
`;

const TagFilterWrap = styled.div`position:relative;`;
const TagFilterBtn = styled.button`
  background:${C.surface};border:1px solid ${C.border};border-radius:8px;
  color:${C.text};font-size:12px;padding:6px 10px;cursor:pointer;
  &:hover{border-color:${C.accent};}
`;
const TagDropdown = styled.div`
  position:absolute;top:calc(100% + 4px);left:0;z-index:100;
  background:${C.card};border:1px solid ${C.border};border-radius:8px;
  padding:8px;min-width:180px;display:flex;flex-direction:column;gap:4px;
`;
const TagOption = styled.label`
  display:flex;align-items:center;gap:6px;font-size:12px;color:${C.text};cursor:pointer;
  padding:3px 4px;border-radius:4px;&:hover{background:${C.surface};}
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
const SourceBadge = styled.span`
  font-size:10px;font-weight:600;padding:2px 8px;border-radius:999px;
  background:${({ $c }) => $c + '22'};color:${({ $c }) => $c};border:1px solid ${({ $c }) => $c + '44'};
`;
const TagChip = styled.span`
  display:inline-block;font-size:10px;padding:2px 7px;border-radius:999px;margin:1px;
  background:${C.surface};border:1px solid ${C.border};color:${C.muted};white-space:nowrap;
`;
const TrendUp = styled.span`color:${C.success};font-weight:700;`;
const TrendDown = styled.span`color:${C.danger};font-weight:700;`;
const PromoteBtn = styled.a`
  display:inline-block;border:1px solid ${C.accent};color:${C.accent};border-radius:6px;
  font-size:11px;font-weight:700;padding:4px 10px;cursor:pointer;text-decoration:none;
  &:hover{background:${C.accent};color:#fff;}
`;
const EmptyMsg = styled.div`padding:24px;text-align:center;color:${C.muted};font-size:13px;`;
const AddBtn = styled.button`
  background:linear-gradient(135deg,#6366f1,#8b5cf6);border:none;border-radius:8px;
  color:#fff;font-size:12px;font-weight:600;padding:7px 14px;cursor:pointer;
  &:hover{opacity:.88;}
`;

// ── Add Offer Modal ───────────────────────────────────────────────────────────
const Overlay = styled.div`
  position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:1000;
  display:flex;align-items:center;justify-content:center;
`;
const ModalBox = styled.div`
  background:${C.card};border:1px solid ${C.border};border-radius:12px;
  padding:28px;width:460px;max-width:95vw;
`;
const ModalTitle = styled.h3`font-size:16px;font-weight:700;color:${C.text};margin:0 0 20px 0;`;
const Field = styled.div`display:flex;flex-direction:column;gap:4px;margin-bottom:14px;`;
const Label = styled.label`font-size:12px;color:${C.muted};`;
const Input = styled.input`
  padding:9px 12px;border-radius:8px;border:1px solid ${C.border};
  background:${C.surface};color:${C.text};font-size:13px;
  &:focus{outline:none;border-color:${C.accent};}
`;
const ErrMsg = styled.p`font-size:12px;color:#ef4444;margin:0 0 12px 0;`;
const ModalBtnRow = styled.div`display:flex;gap:10px;justify-content:flex-end;`;
const CancelBtn = styled.button`
  background:${C.surface};border:1px solid ${C.border};border-radius:8px;
  color:${C.text};font-size:13px;padding:8px 16px;cursor:pointer;
`;
const SubmitBtn = styled.button`
  background:linear-gradient(135deg,#6366f1,#8b5cf6);border:none;border-radius:8px;
  color:#fff;font-size:13px;font-weight:600;padding:8px 16px;cursor:pointer;
  &:disabled{opacity:.5;cursor:not-allowed;}
`;

function AddOfferModal({ onClose, onAdd }) {
  const [form, setForm] = useState({
    name: '', niche: '', network: 'ClickBank', aov: '', commission_rate: '',
    external_url: '', notes: '',
  });
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.niche || !form.network) {
      setErr('Name, Niche, and Network are required.');
      return;
    }
    setSaving(true);
    setErr('');
    try {
      await onAdd({
        name: form.name,
        niche: form.niche,
        network: form.network,
        aov: parseFloat(form.aov) || 0,
        commission_rate: parseFloat(form.commission_rate) || 0,
        external_url: form.external_url || null,
        notes: form.notes || null,
      });
      onClose();
    } catch (ex) {
      setErr(ex.message || 'Failed to add offer.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Overlay onClick={onClose}>
      <ModalBox onClick={e => e.stopPropagation()}>
        <ModalTitle>Track New Offer</ModalTitle>
        <form onSubmit={handleSubmit}>
          <Field><Label>Name *</Label><Input value={form.name} onChange={set('name')} placeholder="e.g. Resurge" /></Field>
          <Field><Label>Niche *</Label><Input value={form.niche} onChange={set('niche')} placeholder="e.g. Weight Loss" /></Field>
          <Field>
            <Label>Network *</Label>
            <SmallSelect style={{ padding: '9px 12px' }} value={form.network} onChange={set('network')}>
              {NETWORKS.map(n => <option key={n}>{n}</option>)}
            </SmallSelect>
          </Field>
          <Field><Label>AOV ($)</Label><Input type="number" value={form.aov} onChange={set('aov')} placeholder="e.g. 47" /></Field>
          <Field><Label>Commission (0–1, e.g. 0.75)</Label><Input type="number" step="0.01" value={form.commission_rate} onChange={set('commission_rate')} placeholder="e.g. 0.75" /></Field>
          <Field><Label>External URL</Label><Input value={form.external_url} onChange={set('external_url')} placeholder="https://..." /></Field>
          <Field><Label>Notes</Label><Input value={form.notes} onChange={set('notes')} placeholder="Optional notes" /></Field>
          {err && <ErrMsg>{err}</ErrMsg>}
          <ModalBtnRow>
            <CancelBtn type="button" onClick={onClose}>Cancel</CancelBtn>
            <SubmitBtn type="submit" disabled={saving}>{saving ? 'Saving…' : 'Add Offer'}</SubmitBtn>
          </ModalBtnRow>
        </form>
      </ModalBox>
    </Overlay>
  );
}

// ── Offer row ─────────────────────────────────────────────────────────────────

function OfferRow({ offer, onDelete }) {
  const src = SOURCE_BADGE[offer.source] || { label: offer.source, color: '#64748b' };
  const tags = offer.ai_tags || [];
  const visibleTags = tags.slice(0, 3);
  const extraCount = tags.length - 3;

  return (
    <OTr>
      <OTd style={{ fontWeight: 700 }}>
        {offer.external_url
          ? <a href={offer.external_url} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>{offer.name}</a>
          : offer.name
        }
      </OTd>
      <OTd><SourceBadge $c={src.color}>{src.label}</SourceBadge></OTd>
      <OTd>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <PlatformLogo name={offer.network} size={18} />
          {offer.network}
        </span>
      </OTd>
      <OTd><NicheBadge>{offer.niche}</NicheBadge></OTd>
      <OTd style={{ fontWeight: 700 }}>{fmtMoney(offer.aov)}</OTd>
      <OTd style={{ color: C.success, fontWeight: 600 }}>{pct(offer.commission_rate)}</OTd>
      <OTd style={{ color: C.muted }}>{offer.gravity ? fmtGravity(offer.gravity) : '—'}</OTd>
      <OTd>
        {offer.trend_direction === 'up' && <TrendUp>↑ {offer.trend_value?.toFixed(1)}%</TrendUp>}
        {offer.trend_direction === 'down' && <TrendDown>↓ {offer.trend_value?.toFixed(1)}%</TrendDown>}
        {offer.trend_direction === 'stable' && <span style={{ color: C.muted }}>—</span>}
      </OTd>
      <OTd>
        {visibleTags.map((t, i) => <TagChip key={i}>{t.label}</TagChip>)}
        {extraCount > 0 && <TagChip>+{extraCount}</TagChip>}
      </OTd>
      <OTd>
        {offer.external_url
          ? <PromoteBtn href={offer.external_url} target="_blank" rel="noopener noreferrer">Promote</PromoteBtn>
          : <span style={{ color: C.muted, fontSize: 11 }}>—</span>
        }
        {offer.source === 'user_added' && onDelete && (
          <button
            onClick={() => onDelete(offer.id)}
            style={{ marginLeft: 8, background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 12 }}
          >
            Remove
          </button>
        )}
      </OTd>
    </OTr>
  );
}

function OffersTableBlock({ offers, loading, onDelete }) {
  if (loading) return <EmptyMsg>Loading…</EmptyMsg>;
  if (!offers.length) return <EmptyMsg>No offers found.</EmptyMsg>;
  return (
    <OffersTable>
      <thead>
        <tr>
          <OTh>Offer</OTh>
          <OTh>Source</OTh>
          <OTh>Network</OTh>
          <OTh>Niche</OTh>
          <OTh>AOV</OTh>
          <OTh>Commission</OTh>
          <OTh>Gravity</OTh>
          <OTh>Trend</OTh>
          <OTh>Tags</OTh>
          <OTh>Action</OTh>
        </tr>
      </thead>
      <tbody>
        {offers.map(o => <OfferRow key={o.id} offer={o} onDelete={onDelete} />)}
      </tbody>
    </OffersTable>
  );
}

// ── Tag filter helper ─────────────────────────────────────────────────────────

function collectTags(offers) {
  const labels = new Set();
  for (const o of offers) {
    for (const t of (o.ai_tags || [])) {
      if (t.label) labels.add(t.label);
    }
  }
  return Array.from(labels).sort();
}

function TagFilter({ offers, selectedTags, onChange }) {
  const [open, setOpen] = useState(false);
  const allTags = collectTags(offers);
  if (!allTags.length) return null;

  const toggle = (label) => {
    onChange(
      selectedTags.includes(label)
        ? selectedTags.filter(t => t !== label)
        : [...selectedTags, label]
    );
  };

  return (
    <TagFilterWrap>
      <TagFilterBtn onClick={() => setOpen(v => !v)}>
        Tags {selectedTags.length > 0 ? `(${selectedTags.length})` : '▾'}
      </TagFilterBtn>
      {open && (
        <TagDropdown>
          {allTags.map(label => (
            <TagOption key={label}>
              <input type="checkbox" checked={selectedTags.includes(label)} onChange={() => toggle(label)} />
              {label}
            </TagOption>
          ))}
        </TagDropdown>
      )}
    </TagFilterWrap>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function CRMOffers() {
  const [niche, setNiche] = useState('');
  const [network, setNetwork] = useState('');
  const [sortBy, setSortBy] = useState('gravity');
  const [selectedTags, setSelectedTags] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);

  const { offers, loading, refetch, addOffer, deleteOffer } = useOffers();

  useEffect(() => {
    refetch({ niche: niche || undefined, network: network || undefined, sort_by: sortBy, sort_dir: 'desc' });
  }, [niche, network, sortBy]); // eslint-disable-line

  // Partition by source
  const cbAccount = offers.filter(o => o.source === 'clickbank_account');
  const curated   = offers.filter(o => o.source === 'curated' || o.source === 'seed');
  const userAdded = offers.filter(o => o.source === 'user_added');

  // Apply tag filter (client-side, only to curated — that's where tags are)
  const filterByTags = (list) => {
    if (!selectedTags.length) return list;
    return list.filter(o =>
      selectedTags.every(tag =>
        (o.ai_tags || []).some(t => t.label === tag)
      )
    );
  };

  const handleDelete = async (offerId) => {
    if (!window.confirm('Remove this offer?')) return;
    await deleteOffer(offerId);
  };

  return (
    <Page>
      {/* ── Global filters ── */}
      <SectionCard style={{ marginBottom: 20 }}>
        <FilterRow>
          <SmallSelect value={niche} onChange={e => setNiche(e.target.value)}>
            <option value="">All Niches</option>
            {NICHES.filter(Boolean).map(n => <option key={n} value={n}>{n}</option>)}
          </SmallSelect>
          <SmallSelect value={network} onChange={e => setNetwork(e.target.value)}>
            <option value="">All Networks</option>
            {NETWORKS.map(n => <option key={n} value={n}>{n}</option>)}
          </SmallSelect>
          <SmallSelect value={sortBy} onChange={e => setSortBy(e.target.value)}>
            {SORT_OPTIONS.map(s => <option key={s.value} value={s.value}>Sort by {s.label}</option>)}
          </SmallSelect>
          <TagFilter offers={curated} selectedTags={selectedTags} onChange={setSelectedTags} />
        </FilterRow>
      </SectionCard>

      {/* ── Section 1: My ClickBank Account ── */}
      {cbAccount.length > 0 && (
        <SectionCard>
          <SectionHeader>
            <SectionTitle>My ClickBank Account Offers</SectionTitle>
            <span style={{ fontSize: 12, color: C.muted }}>{cbAccount.length} offers</span>
          </SectionHeader>
          <OffersTableBlock offers={cbAccount} loading={false} />
        </SectionCard>
      )}

      {/* ── Section 2: Curated ── */}
      <SectionCard>
        <SectionHeader>
          <SectionTitle>Curated Trending Offers</SectionTitle>
          <span style={{ fontSize: 12, color: C.muted }}>{filterByTags(curated).length} offers</span>
        </SectionHeader>
        <OffersTableBlock offers={filterByTags(curated)} loading={loading} />
      </SectionCard>

      {/* ── Section 3: My Tracked Offers ── */}
      <SectionCard>
        <SectionHeader>
          <SectionTitle>My Tracked Offers</SectionTitle>
          <AddBtn onClick={() => setShowAddModal(true)}>+ Add Offer</AddBtn>
        </SectionHeader>
        <OffersTableBlock offers={userAdded} loading={false} onDelete={handleDelete} />
      </SectionCard>

      {showAddModal && (
        <AddOfferModal onClose={() => setShowAddModal(false)} onAdd={addOffer} />
      )}
    </Page>
  );
}
