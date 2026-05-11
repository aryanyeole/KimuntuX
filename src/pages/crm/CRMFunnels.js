import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes, css } from 'styled-components';
import useFunnels, { deleteFunnel } from '../../hooks/useFunnels';
import { crm as C } from '../../styles/crmTheme';

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

const FUNNEL_STATUS_COLOR = {
  draft:      '#9ca3af',
  generating: '#3b82f6',
  ready:      '#00C896',
  failed:     '#ef4444',
};

const FUNNEL_STATUS_LABEL = {
  draft:      'Draft',
  generating: 'Generating',
  ready:      'Ready',
  failed:     'Failed',
};

// ── Animations ────────────────────────────────────────────────────────────────

const fadeIn = keyframes`from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}`;
const pulse  = keyframes`0%,100%{opacity:.5}50%{opacity:1}`;

// ── Layout ────────────────────────────────────────────────────────────────────

const Page = styled.div`padding:20px;animation:${fadeIn} .2s ease;`;

const PageHeader = styled.div`
  display:flex;align-items:flex-start;justify-content:space-between;
  margin-bottom:20px;gap:12px;flex-wrap:wrap;
`;
const HeaderLeft = styled.div``;
const PageTitle = styled.h1`
  font-size:22px;font-weight:700;color:${C.text};margin:0 0 4px 0;
`;
const PageSubtitle = styled.p`font-size:13px;color:${C.muted};margin:0;`;

const NewBtn = styled.button`
  background:${C.accent};color:#fff;border:none;border-radius:8px;
  padding:9px 16px;font-size:13px;font-weight:600;cursor:pointer;white-space:nowrap;
  display:flex;align-items:center;gap:6px;
  &:hover{background:${C.accentHover};}
`;

// ── Empty state ───────────────────────────────────────────────────────────────

const EmptyCard = styled.div`
  background:${C.card};border:1px solid ${C.border};border-radius:12px;
  padding:64px 32px;text-align:center;
`;
const EmptyTitle = styled.div`font-size:15px;font-weight:600;color:${C.text};margin-bottom:8px;`;
const EmptyBody = styled.div`font-size:13px;color:${C.muted};max-width:360px;margin:0 auto 24px;line-height:1.5;`;
const EmptyBtn = styled.button`
  background:${C.accent};color:#fff;border:none;border-radius:8px;
  padding:10px 22px;font-size:14px;font-weight:600;cursor:pointer;
  &:hover{background:${C.accentHover};}
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
`;
const Tr = styled.tr`
  border-bottom:1px solid ${C.border};cursor:pointer;transition:background .12s;
  &:last-child{border-bottom:none;}
  &:hover{background:${C.surface};}
`;
const Td = styled.td`padding:12px 16px;font-size:13px;color:${C.text};vertical-align:middle;`;

const FunnelTitle = styled.div`font-weight:600;color:${C.text};`;

const StatusPill = styled.span`
  display:inline-block;font-size:10px;font-weight:700;text-transform:uppercase;
  letter-spacing:.05em;padding:2px 8px;border-radius:999px;
  background:${({ $s }) => (FUNNEL_STATUS_COLOR[$s] || '#9ca3af') + '22'};
  color:${({ $s }) => FUNNEL_STATUS_COLOR[$s] || '#9ca3af'};
  border:1px solid ${({ $s }) => (FUNNEL_STATUS_COLOR[$s] || '#9ca3af') + '55'};
  ${({ $s }) => $s === 'generating' && css`animation:${pulse} 1.5s ease-in-out infinite;`}
`;

const ActionsCell = styled.div`display:flex;align-items:center;gap:8px;`;
const ViewLink = styled.button`
  background:none;border:1px solid ${C.border};border-radius:6px;
  color:${C.muted};font-size:12px;padding:4px 10px;cursor:pointer;
  &:hover{border-color:${C.accent};color:${C.accent};}
`;
const DelLink = styled.button`
  background:none;border:1px solid transparent;border-radius:6px;
  color:${C.muted};font-size:12px;padding:4px 10px;cursor:pointer;
  &:hover{border-color:${C.danger};color:${C.danger};}
`;

const EmptyCell = styled.td`padding:48px;text-align:center;color:${C.muted};font-size:13px;`;

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

// ── Delete confirmation modal ─────────────────────────────────────────────────

const Overlay = styled.div`
  position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:1000;
  display:flex;align-items:center;justify-content:center;
`;
const ModalBox = styled.div`
  background:${C.card};border:1px solid ${C.border};border-radius:12px;
  padding:28px;width:400px;max-width:95vw;
`;
const ModalTitle = styled.h3`font-size:16px;font-weight:700;color:${C.text};margin:0 0 8px 0;`;
const ModalBody  = styled.p`font-size:13px;color:${C.muted};margin:0 0 24px 0;line-height:1.5;`;
const ModalBtns  = styled.div`display:flex;gap:10px;justify-content:flex-end;`;
const CancelBtn  = styled.button`
  background:${C.surface};border:1px solid ${C.border};border-radius:8px;
  color:${C.text};font-size:13px;padding:8px 16px;cursor:pointer;
`;
const ConfirmBtn = styled.button`
  background:${C.danger};border:none;border-radius:8px;
  color:#fff;font-size:13px;font-weight:600;padding:8px 16px;cursor:pointer;
  &:disabled{opacity:.5;cursor:not-allowed;}
`;

const ErrorMsg = styled.div`
  font-size:12px;color:${C.danger};margin-bottom:12px;
`;

// ── Component ─────────────────────────────────────────────────────────────────

const LIMIT = 20;

export default function CRMFunnels() {
  const navigate = useNavigate();
  const { funnels, total, loading, error, page, setPage, refresh } = useFunnels();

  const [deleteTarget, setDeleteTarget] = useState(null); // funnel being deleted
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError('');
    try {
      await deleteFunnel(deleteTarget.id);
      setDeleteTarget(null);
      refresh();
    } catch (err) {
      setDeleteError(err.message || 'Failed to delete funnel');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Page>
      <PageHeader>
        <HeaderLeft>
          <PageTitle>Funnels</PageTitle>
          <PageSubtitle>AI-generated landing pages that capture leads into your CRM</PageSubtitle>
        </HeaderLeft>
        <NewBtn onClick={() => navigate('/crm/funnels/new')}>
          + New Funnel
        </NewBtn>
      </PageHeader>

      {error && <ErrorMsg>{error}</ErrorMsg>}

      {!loading && funnels.length === 0 ? (
        <EmptyCard>
          <EmptyTitle>No funnels yet</EmptyTitle>
          <EmptyBody>
            Create your first AI-generated landing page in about 30 seconds.
          </EmptyBody>
          <EmptyBtn onClick={() => navigate('/crm/funnels/new')}>
            Create Funnel
          </EmptyBtn>
        </EmptyCard>
      ) : (
        <TableWrap>
          <Table>
            <thead>
              <tr>
                <Th>Title</Th>
                <Th>Status</Th>
                <Th>Created</Th>
                <Th>Updated</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><EmptyCell colSpan={5}>Loading funnels…</EmptyCell></tr>
              ) : funnels.map(funnel => (
                <Tr key={funnel.id} onClick={() => navigate(`/crm/funnels/${funnel.id}`)}>
                  <Td><FunnelTitle>{funnel.title}</FunnelTitle></Td>
                  <Td>
                    <StatusPill $s={funnel.status}>
                      {FUNNEL_STATUS_LABEL[funnel.status] || funnel.status}
                    </StatusPill>
                  </Td>
                  <Td style={{ color: C.muted }}>{timeAgo(funnel.created_at)}</Td>
                  <Td style={{ color: C.muted }}>{timeAgo(funnel.updated_at)}</Td>
                  <Td onClick={e => e.stopPropagation()}>
                    <ActionsCell>
                      <ViewLink onClick={() => navigate(`/crm/funnels/${funnel.id}`)}>
                        View
                      </ViewLink>
                      <DelLink onClick={() => { setDeleteTarget(funnel); setDeleteError(''); }}>
                        Delete
                      </DelLink>
                    </ActionsCell>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>

          {!loading && total > LIMIT && (
            <PaginationRow>
              <span>Showing {Math.min((page - 1) * LIMIT + 1, total)}–{Math.min(page * LIMIT, total)} of {total}</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <PagBtn disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Prev</PagBtn>
                <PagBtn disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next →</PagBtn>
              </div>
            </PaginationRow>
          )}
        </TableWrap>
      )}

      {deleteTarget && (
        <Overlay onClick={() => !deleting && setDeleteTarget(null)}>
          <ModalBox onClick={e => e.stopPropagation()}>
            <ModalTitle>Delete funnel?</ModalTitle>
            <ModalBody>
              "{deleteTarget.title}" will be permanently deleted. This cannot be undone.
            </ModalBody>
            {deleteError && <ErrorMsg>{deleteError}</ErrorMsg>}
            <ModalBtns>
              <CancelBtn onClick={() => setDeleteTarget(null)} disabled={deleting}>Cancel</CancelBtn>
              <ConfirmBtn onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Deleting…' : 'Delete'}
              </ConfirmBtn>
            </ModalBtns>
          </ModalBox>
        </Overlay>
      )}
    </Page>
  );
}
