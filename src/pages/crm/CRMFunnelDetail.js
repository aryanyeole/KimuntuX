import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import styled, { keyframes, css } from 'styled-components';
import { useFunnelPolling, regenerateFunnel, renameFunnel, deleteFunnel, generateFunnel } from '../../hooks/useFunnels';
import { crm as C } from '../../styles/crmTheme';

// ── Animations ────────────────────────────────────────────────────────────────

const fadeIn   = keyframes`from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}`;
const spin     = keyframes`from{transform:rotate(0deg)}to{transform:rotate(360deg)}`;
const pulse    = keyframes`0%,100%{opacity:.5}50%{opacity:1}`;

// ── Status colors ─────────────────────────────────────────────────────────────

const STATUS_COLOR = {
  draft:      '#9ca3af',
  generating: '#3b82f6',
  ready:      '#00C896',
  failed:     '#ef4444',
};

const STATUS_LABEL = {
  draft:      'Draft',
  generating: 'Generating',
  ready:      'Ready',
  failed:     'Failed',
};

// ── Layout ────────────────────────────────────────────────────────────────────

const Page = styled.div`padding: 20px; animation: ${fadeIn} .2s ease;`;

// ── Top bar ───────────────────────────────────────────────────────────────────

const TopBar = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
`;
const BackLink = styled(Link)`
  font-size: 13px;
  color: ${C.muted};
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
  &:hover { color: ${C.text}; }
`;
const TitleArea = styled.div`display: flex; align-items: center; gap: 10px; flex: 1; min-width: 0;`;
const TitleSpan = styled.span`
  font-size: 18px;
  font-weight: 700;
  color: ${C.text};
  cursor: pointer;
  border-bottom: 1px dashed transparent;
  padding-bottom: 1px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 420px;
  &:hover { border-bottom-color: ${C.muted}; }
`;
const TitleInput = styled.input`
  font-size: 18px;
  font-weight: 700;
  color: ${C.text};
  background: transparent;
  border: none;
  border-bottom: 2px solid ${C.accent};
  outline: none;
  padding-bottom: 1px;
  font-family: inherit;
  min-width: 200px;
  max-width: 420px;
`;
const StatusPill = styled.span`
  display: inline-block;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .05em;
  padding: 3px 9px;
  border-radius: 999px;
  background: ${({ $s }) => (STATUS_COLOR[$s] || '#9ca3af') + '22'};
  color: ${({ $s }) => STATUS_COLOR[$s] || '#9ca3af'};
  border: 1px solid ${({ $s }) => (STATUS_COLOR[$s] || '#9ca3af') + '55'};
  white-space: nowrap;
  ${({ $s }) => $s === 'generating' && css`animation: ${pulse} 1.5s ease-in-out infinite;`}
`;

const ActionRow = styled.div`display: flex; align-items: center; gap: 8px; margin-left: auto; flex-wrap: wrap;`;
const ActionBtn = styled.button`
  background: ${C.surface};
  border: 1px solid ${C.border};
  border-radius: 7px;
  color: ${({ $danger }) => $danger ? C.danger : C.muted};
  font-size: 12px;
  font-weight: 600;
  padding: 7px 14px;
  cursor: pointer;
  white-space: nowrap;
  &:hover:not(:disabled) {
    border-color: ${({ $danger }) => $danger ? C.danger : C.accent};
    color: ${({ $danger }) => $danger ? C.danger : C.text};
  }
  &:disabled { opacity: .35; cursor: not-allowed; }
`;

// ── Body states ───────────────────────────────────────────────────────────────

const BodyCard = styled.div`
  background: ${C.card};
  border: 1px solid ${C.border};
  border-radius: 12px;
  overflow: hidden;
`;

// Generating state
const GeneratingWrap = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 32px;
  text-align: center;
`;
const Spinner = styled.div`
  width: 36px;
  height: 36px;
  border: 3px solid ${C.border};
  border-top-color: ${C.accent};
  border-radius: 50%;
  animation: ${spin} .8s linear infinite;
  margin-bottom: 20px;
`;
const GeneratingTitle = styled.div`font-size: 16px; font-weight: 600; color: ${C.text}; margin-bottom: 8px;`;
const GeneratingBody  = styled.div`font-size: 13px; color: ${C.muted}; line-height: 1.5;`;

// Failed state
const FailedCard = styled.div`
  padding: 32px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
`;
const FailedTitle = styled.div`font-size: 15px; font-weight: 700; color: ${C.danger};`;
const FailedMsg   = styled.div`
  font-size: 13px;
  color: ${C.muted};
  background: ${C.surface};
  border: 1px solid ${C.border};
  border-radius: 8px;
  padding: 12px;
  font-family: monospace;
  line-height: 1.5;
  word-break: break-all;
`;
const RetryBtn = styled.button`
  background: ${C.accent};
  border: none;
  border-radius: 8px;
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  padding: 9px 20px;
  cursor: pointer;
  &:hover { background: ${C.accentHover}; }
  &:disabled { opacity: .35; cursor: not-allowed; }
`;

// Draft state
const DraftCard = styled.div`
  padding: 48px 32px;
  text-align: center;
`;
const DraftTitle = styled.div`font-size: 15px; font-weight: 600; color: ${C.text}; margin-bottom: 8px;`;
const DraftBody  = styled.div`font-size: 13px; color: ${C.muted}; margin-bottom: 24px;`;
const StartBtn   = styled.button`
  background: ${C.accent};
  border: none;
  border-radius: 8px;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  padding: 10px 24px;
  cursor: pointer;
  &:hover { background: ${C.accentHover}; }
`;

// Ready state — iframe + metadata
const IframeWrap = styled.div`padding: 0;`;
const MetaPanel = styled.div`
  padding: 16px 20px;
  border-top: 1px solid ${C.border};
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
`;
const MetaItem = styled.div``;
const MetaLabel = styled.div`font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: .06em; color: ${C.muted}; margin-bottom: 2px;`;
const MetaValue = styled.div`font-size: 13px; color: ${C.text};`;

// ── Delete confirmation modal ─────────────────────────────────────────────────

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,.55);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
`;
const ModalBox = styled.div`
  background: ${C.card};
  border: 1px solid ${C.border};
  border-radius: 12px;
  padding: 28px;
  width: 400px;
  max-width: 95vw;
`;
const ModalTitle = styled.h3`font-size: 16px; font-weight: 700; color: ${C.text}; margin: 0 0 8px 0;`;
const ModalBody  = styled.p`font-size: 13px; color: ${C.muted}; margin: 0 0 24px 0; line-height: 1.5;`;
const ModalBtns  = styled.div`display: flex; gap: 10px; justify-content: flex-end;`;
const CancelBtn  = styled.button`background: ${C.surface}; border: 1px solid ${C.border}; border-radius: 8px; color: ${C.text}; font-size: 13px; padding: 8px 16px; cursor: pointer;`;
const ConfirmBtn = styled.button`background: ${C.danger}; border: none; border-radius: 8px; color: #fff; font-size: 13px; font-weight: 600; padding: 8px 16px; cursor: pointer; &:disabled{opacity:.5;cursor:not-allowed;}`;

const ErrorMsg = styled.div`font-size: 12px; color: ${C.danger}; margin-bottom: 12px;`;

// ── Loading shell ─────────────────────────────────────────────────────────────

const LoadingWrap = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: ${C.muted};
  font-size: 13px;
`;

// ── Component ─────────────────────────────────────────────────────────────────

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

export default function CRMFunnelDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { funnel, loading, error, refresh } = useFunnelPolling(id, { enabled: true });

  // Inline rename state
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleInput, setTitleInput]     = useState('');
  const titleRef = useRef(null);

  // Action state
  const [acting, setActing]             = useState(false);
  const [actionError, setActionError]   = useState('');

  // Delete modal
  const [showDelete, setShowDelete]     = useState(false);
  const [deleting, setDeleting]         = useState(false);
  const [deleteError, setDeleteError]   = useState('');

  // Focus the title input when editing starts
  useEffect(() => {
    if (editingTitle && titleRef.current) {
      titleRef.current.focus();
      titleRef.current.select();
    }
  }, [editingTitle]);

  function startRename() {
    if (!funnel) return;
    setTitleInput(funnel.title);
    setEditingTitle(true);
  }

  async function commitRename() {
    setEditingTitle(false);
    if (!funnel || !titleInput.trim() || titleInput.trim() === funnel.title) return;
    try {
      await renameFunnel(funnel.id, titleInput.trim());
      refresh();
    } catch (err) {
      setActionError(err.message || 'Failed to rename');
    }
  }

  function handleTitleKeyDown(e) {
    if (e.key === 'Enter')  commitRename();
    if (e.key === 'Escape') setEditingTitle(false);
  }

  async function handleRegenerate() {
    if (!funnel) return;
    setActing(true);
    setActionError('');
    try {
      await regenerateFunnel(funnel.id);
      refresh();
    } catch (err) {
      setActionError(err.message || 'Failed to regenerate');
    } finally {
      setActing(false);
    }
  }

  async function handleGenerate() {
    if (!funnel) return;
    setActing(true);
    setActionError('');
    try {
      await generateFunnel(funnel.id);
      refresh();
    } catch (err) {
      setActionError(err.message || 'Failed to start generation');
    } finally {
      setActing(false);
    }
  }

  function handleDownload() {
    if (!funnel?.generated_html) return;
    const blob = new Blob([funnel.generated_html], { type: 'text/html' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `${funnel.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleDelete() {
    if (!funnel) return;
    setDeleting(true);
    setDeleteError('');
    try {
      await deleteFunnel(funnel.id);
      navigate('/crm/funnels');
    } catch (err) {
      setDeleteError(err.message || 'Failed to delete');
      setDeleting(false);
    }
  }

  if (loading && !funnel) {
    return <Page><LoadingWrap>Loading funnel…</LoadingWrap></Page>;
  }

  if (error && !funnel) {
    return (
      <Page>
        <BackLink to="/crm/funnels">← Back to Funnels</BackLink>
        <ErrorMsg style={{ marginTop: 16 }}>{error}</ErrorMsg>
      </Page>
    );
  }

  if (!funnel) return null;

  const meta = funnel.generation_metadata || {};
  const canRegen = funnel.status === 'ready' || funnel.status === 'failed';

  return (
    <Page>
      {/* Top bar */}
      <TopBar>
        <BackLink to="/crm/funnels">← Funnels</BackLink>

        <TitleArea>
          {editingTitle ? (
            <TitleInput
              ref={titleRef}
              value={titleInput}
              onChange={e => setTitleInput(e.target.value)}
              onBlur={commitRename}
              onKeyDown={handleTitleKeyDown}
            />
          ) : (
            <TitleSpan onClick={startRename} title="Click to rename">
              {funnel.title}
            </TitleSpan>
          )}
          <StatusPill $s={funnel.status}>
            {STATUS_LABEL[funnel.status] || funnel.status}
          </StatusPill>
        </TitleArea>

        <ActionRow>
          {actionError && <ErrorMsg style={{ marginBottom: 0 }}>{actionError}</ErrorMsg>}
          <ActionBtn
            disabled={funnel.status !== 'ready'}
            onClick={handleDownload}
          >
            Download HTML
          </ActionBtn>
          <ActionBtn
            disabled={!canRegen || acting}
            onClick={handleRegenerate}
          >
            {acting ? 'Working…' : 'Regenerate'}
          </ActionBtn>
          <ActionBtn $danger onClick={() => { setDeleteError(''); setShowDelete(true); }}>
            Delete
          </ActionBtn>
        </ActionRow>
      </TopBar>

      {/* Body */}
      <BodyCard>
        {funnel.status === 'draft' && (
          <DraftCard>
            <DraftTitle>Funnel not yet generated</DraftTitle>
            <DraftBody>This funnel was created but generation has not started. Click below to generate it now.</DraftBody>
            <StartBtn onClick={handleGenerate} disabled={acting}>
              {acting ? 'Starting…' : 'Generate this funnel'}
            </StartBtn>
          </DraftCard>
        )}

        {funnel.status === 'generating' && (
          <GeneratingWrap>
            <Spinner />
            <GeneratingTitle>Generating your funnel…</GeneratingTitle>
            <GeneratingBody>
              This usually takes 10–30 seconds. The page will update automatically.
            </GeneratingBody>
          </GeneratingWrap>
        )}

        {funnel.status === 'failed' && (
          <FailedCard>
            <FailedTitle>Generation failed</FailedTitle>
            {funnel.error_message && <FailedMsg>{funnel.error_message}</FailedMsg>}
            <RetryBtn onClick={handleRegenerate} disabled={acting}>
              {acting ? 'Retrying…' : 'Try again'}
            </RetryBtn>
          </FailedCard>
        )}

        {funnel.status === 'ready' && (
          <IframeWrap>
            <iframe
              srcDoc={funnel.generated_html}
              sandbox="allow-same-origin"
              title={funnel.title}
              style={{ width: '100%', height: '70vh', border: 'none', display: 'block' }}
            />
            <MetaPanel>
              <MetaItem>
                <MetaLabel>Model</MetaLabel>
                <MetaValue>{meta.model_used || '—'}</MetaValue>
              </MetaItem>
              <MetaItem>
                <MetaLabel>Generation time</MetaLabel>
                <MetaValue>{meta.generation_seconds != null ? `${meta.generation_seconds}s` : '—'}</MetaValue>
              </MetaItem>
              <MetaItem>
                <MetaLabel>Generated at</MetaLabel>
                <MetaValue>{fmtDate(meta.generated_at)}</MetaValue>
              </MetaItem>
              {meta.tokens_used != null && (
                <MetaItem>
                  <MetaLabel>Tokens used</MetaLabel>
                  <MetaValue>{meta.tokens_used.toLocaleString()}</MetaValue>
                </MetaItem>
              )}
            </MetaPanel>
          </IframeWrap>
        )}
      </BodyCard>

      {/* Delete confirmation */}
      {showDelete && (
        <Overlay onClick={() => !deleting && setShowDelete(false)}>
          <ModalBox onClick={e => e.stopPropagation()}>
            <ModalTitle>Delete funnel?</ModalTitle>
            <ModalBody>
              "{funnel.title}" will be permanently deleted. This cannot be undone.
            </ModalBody>
            {deleteError && <ErrorMsg>{deleteError}</ErrorMsg>}
            <ModalBtns>
              <CancelBtn onClick={() => setShowDelete(false)} disabled={deleting}>Cancel</CancelBtn>
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
