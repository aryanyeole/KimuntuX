import { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import api from '../../services/api';

// ── Styled ────────────────────────────────────────────────────────────────────
const Page = styled.div`
  padding: 32px;
  max-width: 1200px;
  margin: 0 auto;
  font-family: 'Inter', sans-serif;
`;
const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
`;
const Title = styled.h1`font-size: 22px; font-weight: 700; color: #e2e8f0; margin: 0;`;
const SeedBtn = styled.button`
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  border: none; border-radius: 8px; color: #fff;
  font-size: 13px; font-weight: 600; padding: 9px 18px; cursor: pointer;
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;
const StatusMsg = styled.p`font-size: 13px; color: #10b981; margin: 0 0 16px 0;`;
const ErrMsg = styled.p`font-size: 13px; color: #ef4444; margin: 0 0 16px 0;`;

const Table = styled.table`width: 100%; border-collapse: collapse;`;
const Th = styled.th`
  font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .07em;
  color: #64748b; padding: 10px 12px; text-align: left; background: #1a1f2e;
  border-bottom: 1px solid #2a3045; white-space: nowrap;
`;
const Tr = styled.tr`
  border-bottom: 1px solid #2a3045;
  &:last-child { border-bottom: none; }
  &:hover { background: #1a1f2e; }
`;
const Td = styled.td`padding: 10px 12px; font-size: 13px; color: #e2e8f0;`;
const TagChip = styled.span`
  display: inline-block; font-size: 10px; padding: 2px 6px; border-radius: 999px;
  background: #1a1f2e; border: 1px solid #2a3045; color: #94a3b8; margin: 1px;
`;
const RegenBtn = styled.button`
  background: none; border: 1px solid #6366f1; color: #6366f1; border-radius: 6px;
  font-size: 11px; font-weight: 600; padding: 3px 9px; cursor: pointer;
  &:hover { background: #6366f1; color: #fff; }
  &:disabled { opacity: 0.4; cursor: not-allowed; }
`;
const EmptyMsg = styled.div`padding: 32px; text-align: center; color: #64748b; font-size: 14px;`;

// ── Component ─────────────────────────────────────────────────────────────────

export default function AdminOffers() {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [regenerating, setRegenerating] = useState({});
  const [status, setStatus] = useState('');
  const [err, setErr] = useState('');

  const fetchOffers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get('/api/v1/admin/offers');
      setOffers(data.data || []);
    } catch (e) {
      setErr(e.message || 'Failed to load curated offers.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchOffers(); }, [fetchOffers]);

  const handleSeed = async () => {
    setSeeding(true);
    setStatus('');
    setErr('');
    try {
      const result = await api.post('/api/v1/admin/offers/seed-curated');
      setStatus(`Seeded: ${result.created} created, ${result.updated} updated.`);
      await fetchOffers();
    } catch (e) {
      setErr(e.message || 'Seed failed.');
    } finally {
      setSeeding(false);
    }
  };

  const handleRegen = async (offerId) => {
    setRegenerating(prev => ({ ...prev, [offerId]: true }));
    try {
      const updated = await api.post(`/api/v1/admin/offers/${offerId}/regenerate-tags`);
      setOffers(prev => prev.map(o => o.id === offerId ? updated : o));
    } catch (e) {
      setErr(e.message || 'Regen failed.');
    } finally {
      setRegenerating(prev => ({ ...prev, [offerId]: false }));
    }
  };

  return (
    <Page>
      <Header>
        <Title>Admin: Curated Offers</Title>
        <SeedBtn onClick={handleSeed} disabled={seeding}>
          {seeding ? 'Seeding…' : '↺ Seed / Refresh Curated Catalog'}
        </SeedBtn>
      </Header>

      {status && <StatusMsg>{status}</StatusMsg>}
      {err && <ErrMsg>{err}</ErrMsg>}

      {loading ? (
        <EmptyMsg>Loading…</EmptyMsg>
      ) : offers.length === 0 ? (
        <EmptyMsg>No curated offers yet. Click "Seed / Refresh Curated Catalog" to load them.</EmptyMsg>
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Name</Th>
              <Th>Niche</Th>
              <Th>Network</Th>
              <Th>AOV</Th>
              <Th>Gravity</Th>
              <Th>Commission</Th>
              <Th>AI Tags</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {offers.map(o => (
              <Tr key={o.id}>
                <Td style={{ fontWeight: 700 }}>{o.name}</Td>
                <Td>{o.niche}</Td>
                <Td>{o.network}</Td>
                <Td>${(o.aov || 0).toFixed(0)}</Td>
                <Td>{o.gravity?.toFixed(1) ?? '—'}</Td>
                <Td>{o.commission_rate ? `${(o.commission_rate * 100).toFixed(0)}%` : '—'}</Td>
                <Td>
                  {(o.ai_tags || []).map((t, i) => <TagChip key={i}>{t.label}</TagChip>)}
                  {(!o.ai_tags || o.ai_tags.length === 0) && <span style={{ color: '#64748b', fontSize: 11 }}>No tags</span>}
                </Td>
                <Td>
                  <RegenBtn
                    onClick={() => handleRegen(o.id)}
                    disabled={regenerating[o.id]}
                  >
                    {regenerating[o.id] ? '…' : '↺ Tags'}
                  </RegenBtn>
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      )}
    </Page>
  );
}
