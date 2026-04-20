import { useState, useEffect } from 'react';
import styled, { keyframes, css } from 'styled-components';
import useCommunications from '../../hooks/useCommunications';
import api from '../../services/api';
import { crm as C } from '../../styles/crmTheme';

const CHANNEL_ICON = { email: 'EM', sms: 'SM', whatsapp: 'WA', chatbot: 'AI', social_dm: 'DM' };

// ── Helpers ───────────────────────────────────────────────────────────────────
function timeAgo(ts) {
  if (!ts) return '';
  const diff = Date.now() - new Date(ts).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ── Animations ────────────────────────────────────────────────────────────────
const fadeIn = keyframes`from{opacity:0}to{opacity:1}`;
const slideUp = keyframes`from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}`;

// ── Layout ────────────────────────────────────────────────────────────────────
const Page = styled.div`
  display:flex;height:calc(100vh - 64px);animation:${fadeIn} .2s ease;overflow:hidden;
`;

// ── Left Panel ────────────────────────────────────────────────────────────────
const LeftPanel = styled.div`
  width:360px;flex-shrink:0;border-right:1px solid ${C.border};
  display:flex;flex-direction:column;background:${C.surface};
`;
const SearchBar = styled.div`padding:12px;border-bottom:1px solid ${C.border};flex-shrink:0;`;
const SearchInput = styled.input`
  width:100%;background:${C.card};border:1px solid ${C.border};border-radius:8px;
  color:${C.text};font-size:13px;padding:8px 12px;outline:none;box-sizing:border-box;
  &::placeholder{color:${C.muted};}
  &:focus{border-color:${C.accent};}
`;
const MessageList = styled.div`flex:1;overflow-y:auto;`;
const MessageRow = styled.div`
  padding:12px 14px;cursor:pointer;border-bottom:1px solid ${C.border};
  transition:background .12s;
  ${({ $selected }) => $selected && css`background:${C.card};`}
  ${({ $unread }) => $unread && css`border-left:3px solid ${C.accent};`}
  ${({ $unread }) => !$unread && css`border-left:3px solid transparent;`}
  &:hover{background:${C.card};}
`;
const MsgTop = styled.div`display:flex;align-items:center;gap:8px;margin-bottom:3px;`;
const MsgIcon = styled.span`font-size:14px;flex-shrink:0;`;
const MsgName = styled.div`
  font-size:13px;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
  color:${C.text};
  ${({ $unread }) => $unread && css`font-weight:700;`}
`;
const MsgTime = styled.div`font-size:10px;color:${C.muted};flex-shrink:0;`;
const MsgSubject = styled.div`
  font-size:11px;color:${C.text};margin-bottom:2px;
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
`;
const MsgPreview = styled.div`
  font-size:11px;color:${C.muted};
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
`;
const MsgBadges = styled.div`display:flex;gap:4px;margin-top:5px;`;
const Badge = styled.span`
  font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;
  padding:1px 5px;border-radius:999px;
  background:${({ $bg }) => $bg || C.border}22;
  color:${({ $bg }) => $bg || C.muted};
  border:1px solid ${({ $bg }) => $bg || C.border}44;
`;
const EmptyList = styled.div`
  padding:40px 20px;text-align:center;color:${C.muted};font-size:13px;
`;

// ── Right Panel ───────────────────────────────────────────────────────────────
const RightPanel = styled.div`
  flex:1;display:flex;flex-direction:column;background:${C.bg};min-width:0;
`;
const EmptyState = styled.div`
  flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;
  color:${C.muted};gap:12px;
`;
const EmptyEmoji = styled.div`font-size:48px;`;
const EmptyText = styled.div`font-size:15px;`;

const DetailHeader = styled.div`
  padding:16px 20px;border-bottom:1px solid ${C.border};flex-shrink:0;
  display:flex;align-items:center;gap:12px;
`;
const DetailIcon = styled.span`font-size:22px;`;
const DetailMeta = styled.div`flex:1;min-width:0;`;
const DetailName = styled.div`font-size:15px;font-weight:700;color:${C.text};`;
const DetailSub = styled.div`font-size:11px;color:${C.muted};margin-top:1px;`;

const DetailBody = styled.div`flex:1;overflow-y:auto;padding:20px;`;
const MessageBubble = styled.div`
  max-width:75%;padding:14px 16px;border-radius:12px;line-height:1.6;font-size:13px;
  ${({ $out }) => $out
    ? css`background:${C.accent}22;border:1px solid ${C.accent}44;color:${C.text};margin-left:auto;`
    : css`background:${C.card};border:1px solid ${C.border};color:${C.text};`}
`;

const AiSuggestion = styled.div`
  background:${C.purple}11;border:1px solid ${C.purple}33;border-radius:10px;
  padding:14px;margin-bottom:12px;animation:${slideUp} .2s ease;
`;
const AiSugTitle = styled.div`
  font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;
  color:${C.purple};margin-bottom:6px;
`;
const AiSugText = styled.div`font-size:13px;color:${C.text};line-height:1.6;white-space:pre-wrap;`;
const AiSugActions = styled.div`display:flex;gap:8px;margin-top:10px;`;
const AiBtn = styled.button`
  font-size:11px;font-weight:700;padding:4px 12px;border-radius:6px;cursor:pointer;
  background:${C.purple};color:#fff;border:none;
  &:hover{opacity:.85;}
`;
const DismissBtn = styled.button`
  font-size:11px;font-weight:600;padding:4px 12px;border-radius:6px;cursor:pointer;
  background:none;color:${C.muted};border:1px solid ${C.border};
  &:hover{border-color:${C.muted};}
`;

const ReplyArea = styled.div`
  padding:16px 20px;border-top:1px solid ${C.border};flex-shrink:0;
`;
const ReplyTextarea = styled.textarea`
  width:100%;background:${C.card};border:1px solid ${C.border};border-radius:8px;
  color:${C.text};font-size:13px;padding:10px 12px;outline:none;resize:none;
  line-height:1.5;box-sizing:border-box;
  &::placeholder{color:${C.muted};}
  &:focus{border-color:${C.accent};}
`;
const ReplyActions = styled.div`display:flex;gap:8px;margin-top:8px;justify-content:flex-end;`;
const SendBtn = styled.button`
  font-size:12px;font-weight:700;padding:7px 18px;border-radius:7px;cursor:pointer;
  background:${C.accent};color:#fff;border:none;
  &:hover{background:#4d93ff;}
  &:disabled{opacity:.5;cursor:default;}
`;
const AiReplyBtn = styled.button`
  font-size:12px;font-weight:700;padding:7px 18px;border-radius:7px;cursor:pointer;
  background:none;color:${C.purple};border:1px solid ${C.purple}66;
  &:hover{background:${C.purple}22;}
  &:disabled{opacity:.5;cursor:default;}
`;

// ── Component ─────────────────────────────────────────────────────────────────
export default function CRMCommunication() {
  const { messages, loading } = useCommunications();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [leadNames, setLeadNames] = useState({});

  useEffect(() => {
    if (!messages.length) return;
    const ids = [...new Set(messages.map(m => m.lead_id).filter(Boolean))];
    // Only fetch IDs we don't already have
    const missing = ids.filter(id => !leadNames[id]);
    if (!missing.length) return;

    Promise.allSettled(missing.map(id => api.get(`/api/v1/crm/leads/${id}`))).then(results => {
      const names = {};
      results.forEach((r, i) => {
        if (r.status === 'fulfilled' && r.value) {
          const lead = r.value;
          names[missing[i]] = `${lead.first_name || ''} ${lead.last_name || ''}`.trim() || `Lead #${missing[i].slice(0, 6)}`;
        } else {
          names[missing[i]] = `Lead #${missing[i].slice(0, 6)}`;
        }
      });
      setLeadNames(prev => ({ ...prev, ...names }));
    });
  }, [messages]); // eslint-disable-line react-hooks/exhaustive-deps

  const getLeadName = (lead_id) => leadNames[lead_id] || `Lead #${(lead_id || '').slice(0, 6)}`;
  const [reply, setReply] = useState('');
  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [sending, setSending] = useState(false);

  const filtered = messages.filter(m => {
    const q = search.toLowerCase();
    return !q
      || (m.subject || '').toLowerCase().includes(q)
      || (m.preview || '').toLowerCase().includes(q)
      || (m.body || '').toLowerCase().includes(q);
  });

  async function handleAiReply() {
    if (!selected?.lead_id) return;
    setAiLoading(true);
    try {
      const res = await api.post(`/api/v1/crm/leads/${selected.lead_id}/ai/outreach`, { tone: 'friendly' });
      setAiSuggestion(res.outreach || res.data?.outreach || '');
    } catch (err) {
      console.error('AI reply failed:', err.message);
    } finally {
      setAiLoading(false);
    }
  }

  async function handleSend() {
    if (!reply.trim() || !selected) return;
    setSending(true);
    try {
      await api.post('/api/v1/crm/communications', {
        lead_id: selected.lead_id,
        channel: selected.channel,
        direction: 'outbound',
        subject: selected.subject ? `Re: ${selected.subject}` : null,
        body: reply.trim(),
      });
      setReply('');
    } catch (err) {
      console.error('Send failed:', err.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <Page>
      {/* ── Left Panel ── */}
      <LeftPanel>
        <SearchBar>
          <SearchInput
            placeholder="Search messages…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </SearchBar>

        <MessageList>
          {loading && <EmptyList>Loading messages…</EmptyList>}
          {!loading && filtered.length === 0 && <EmptyList>No messages found.</EmptyList>}
          {!loading && filtered.map(msg => {
            const ch = (msg.channel || '').toLowerCase();
            const isOut = msg.direction === 'outbound';
            return (
              <MessageRow
                key={msg.id}
                $selected={selected?.id === msg.id}
                $unread={!msg.read && !isOut}
                onClick={() => { setSelected(msg); setAiSuggestion(null); setReply(''); }}
              >
                <MsgTop>
                  <MsgIcon>{CHANNEL_ICON[ch] || 'CH'}</MsgIcon>
                  <MsgName $unread={!msg.read && !isOut}>{getLeadName(msg.lead_id)}</MsgName>
                  <MsgTime>{timeAgo(msg.timestamp)}</MsgTime>
                </MsgTop>
                {msg.subject && <MsgSubject>{msg.subject}</MsgSubject>}
                <MsgPreview>{msg.preview || msg.body?.slice(0, 80)}</MsgPreview>
                <MsgBadges>
                  <Badge $bg={isOut ? C.muted : C.accent}>{isOut ? 'Out' : 'In'}</Badge>
                  <Badge $bg={C.purple}>{ch}</Badge>
                </MsgBadges>
              </MessageRow>
            );
          })}
        </MessageList>
      </LeftPanel>

      {/* ── Right Panel ── */}
      <RightPanel>
        {!selected ? (
          <EmptyState>
            <EmptyEmoji>CH</EmptyEmoji>
            <EmptyText>Select a conversation</EmptyText>
          </EmptyState>
        ) : (
          <>
            <DetailHeader>
              <DetailIcon>{CHANNEL_ICON[(selected.channel || '').toLowerCase()] || 'CH'}</DetailIcon>
              <DetailMeta>
                <DetailName>{selected.subject || 'No Subject'}</DetailName>
                <DetailSub>
                  {getLeadName(selected.lead_id)} · {selected.channel} · {timeAgo(selected.timestamp)}
                </DetailSub>
              </DetailMeta>
              <Badge $bg={selected.direction === 'outbound' ? C.muted : C.accent}>
                {selected.direction === 'outbound' ? 'Sent' : 'Received'}
              </Badge>
            </DetailHeader>

            <DetailBody>
              <MessageBubble $out={selected.direction === 'outbound'}>
                {selected.body}
              </MessageBubble>
            </DetailBody>

            <ReplyArea>
              {aiSuggestion && (
                <AiSuggestion>
                  <AiSugTitle>AI Suggestion</AiSugTitle>
                  <AiSugText>{aiSuggestion}</AiSugText>
                  <AiSugActions>
                    <AiBtn onClick={() => { setReply(aiSuggestion); setAiSuggestion(null); }}>
                      Use This
                    </AiBtn>
                    <DismissBtn onClick={() => setAiSuggestion(null)}>Dismiss</DismissBtn>
                  </AiSugActions>
                </AiSuggestion>
              )}

              <ReplyTextarea
                rows={3}
                placeholder="Write a reply…"
                value={reply}
                onChange={e => setReply(e.target.value)}
              />
              <ReplyActions>
                <AiReplyBtn onClick={handleAiReply} disabled={aiLoading}>
                  {aiLoading ? 'Generating…' : 'AI Reply'}
                </AiReplyBtn>
                <SendBtn onClick={handleSend} disabled={!reply.trim() || sending}>
                  {sending ? 'Sending…' : 'Send'}
                </SendBtn>
              </ReplyActions>
            </ReplyArea>
          </>
        )}
      </RightPanel>
    </Page>
  );
}
