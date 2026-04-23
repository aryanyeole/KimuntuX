import { useState, useCallback } from 'react';
import styled, { keyframes, css } from 'styled-components';
import useLeads from '../../hooks/useLeads';
import api from '../../services/api';
import { crm as C } from '../../styles/crmTheme';

const COLUMNS = [
  { stage: 'new',         label: 'New',         color: C.accent   },
  { stage: 'contacted',   label: 'Contacted',   color: C.purple   },
  { stage: 'qualified',   label: 'Qualified',   color: '#06b6d4'  },
  { stage: 'proposal',    label: 'Proposal',    color: C.warning  },
  { stage: 'negotiation', label: 'Negotiation', color: '#f97316'  },
  { stage: 'won',         label: 'Won',         color: C.success  },
];

const CLASS_COLOR = { hot: C.danger, warm: C.warning, cold: C.muted };

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtMoney = n => n ? '$' + Number(n).toLocaleString(undefined, { maximumFractionDigits: 0 }) : '$0';
const initials = (f, l) => `${(f||'?')[0]}${(l||'?')[0]}`.toUpperCase();

// ── Animations ────────────────────────────────────────────────────────────────
const fadeIn = keyframes`from{opacity:0}to{opacity:1}`;

// ── Layout ────────────────────────────────────────────────────────────────────
const Page = styled.div`
  padding:20px;height:calc(100vh - 64px);display:flex;flex-direction:column;
  animation:${fadeIn} .2s ease;
`;
const BoardScroll = styled.div`
  flex:1;overflow-x:auto;overflow-y:hidden;
`;
const Board = styled.div`
  display:flex;gap:12px;height:100%;min-width:max-content;padding-bottom:12px;
`;

// ── Column ────────────────────────────────────────────────────────────────────
const Column = styled.div`
  width:220px;flex-shrink:0;display:flex;flex-direction:column;
  background:${C.surface};border:1px solid ${({ $over }) => $over ? C.accent : C.border};
  border-radius:12px;overflow:hidden;transition:border-color .15s;
`;
const ColHeader = styled.div`
  padding:12px 14px;border-bottom:1px solid ${C.border};flex-shrink:0;
`;
const ColHeaderTop = styled.div`
  display:flex;align-items:center;gap:8px;margin-bottom:4px;
`;
const ColDot = styled.div`
  width:8px;height:8px;border-radius:50%;background:${({ $color }) => $color};flex-shrink:0;
`;
const ColLabel = styled.div`font-size:13px;font-weight:700;color:${C.text};`;
const ColMeta = styled.div`display:flex;align-items:center;gap:8px;`;
const ColCount = styled.span`
  font-size:10px;font-weight:700;padding:1px 6px;border-radius:999px;
  background:${({ $color }) => $color}22;color:${({ $color }) => $color};
`;
const ColValue = styled.span`font-size:11px;color:${C.muted};`;

const CardsArea = styled.div`
  flex:1;overflow-y:auto;padding:10px;display:flex;flex-direction:column;gap:8px;
`;

// ── Lead card ─────────────────────────────────────────────────────────────────
const LeadCard = styled.div`
  background:${C.card};border:1px solid ${C.border};border-radius:8px;padding:12px;
  cursor:grab;user-select:none;transition:box-shadow .15s,border-color .15s;
  ${({ $dragging }) => $dragging && css`
    opacity:.5;border-color:${C.accent};
  `}
  &:hover{border-color:${C.muted};box-shadow:0 2px 8px rgba(0,0,0,.3);}
  &:active{cursor:grabbing;}
`;
const CardTop = styled.div`display:flex;align-items:center;gap:8px;margin-bottom:6px;`;
const CardAvatar = styled.div`
  flex-shrink:0;width:28px;height:28px;border-radius:50%;
  background:${({ $color }) => $color};display:flex;align-items:center;
  justify-content:center;font-size:10px;font-weight:700;color:#fff;
`;
const CardName = styled.div`font-size:12px;font-weight:700;color:${C.text};flex:1;min-width:0;
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap;`;
const CardCompany = styled.div`font-size:11px;color:${C.muted};margin-bottom:6px;
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap;`;
const CardBottom = styled.div`display:flex;align-items:center;justify-content:space-between;`;
const ClassBadge = styled.span`
  font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;
  padding:2px 6px;border-radius:999px;color:#fff;
  background:${({ $cls }) => CLASS_COLOR[$cls] || C.muted};
`;
const CardValue = styled.span`font-size:11px;font-weight:600;color:${C.success};`;

const EmptyCol = styled.div`
  flex:1;display:flex;align-items:center;justify-content:center;
  font-size:11px;color:${C.border};text-align:center;padding:12px;
  border:2px dashed ${C.border};border-radius:8px;margin:10px;
`;

// ── Component ─────────────────────────────────────────────────────────────────
export default function CRMPipeline() {
  const { leads, loading, refetch } = useLeads();
  const [draggingId, setDraggingId] = useState(null);
  const [overStage, setOverStage] = useState(null);

  // Fetch all leads up front with a high limit
  // We trigger this once on mount via useLeads' built-in useEffect,
  // but we override with limit=200 right away
  const fetchAll = useCallback(() => {
    refetch({ limit: 200, page: 1 });
  }, [refetch]);

  // Run once to get full dataset
  useState(() => { fetchAll(); }); // eslint-disable-line

  // Group leads by stage
  const byStage = {};
  COLUMNS.forEach(col => { byStage[col.stage] = []; });
  leads.forEach(lead => {
    if (byStage[lead.stage]) byStage[lead.stage].push(lead);
  });

  // ── Drag handlers ──────────────────────────────────────────────────────────
  function onDragStart(e, leadId) {
    setDraggingId(leadId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', leadId);
  }

  function onDragEnd() {
    setDraggingId(null);
    setOverStage(null);
  }

  function onDragOver(e, stage) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setOverStage(stage);
  }

  function onDragLeave() {
    setOverStage(null);
  }

  async function onDrop(e, targetStage) {
    e.preventDefault();
    const leadId = e.dataTransfer.getData('text/plain') || draggingId;
    setDraggingId(null);
    setOverStage(null);

    const lead = leads.find(l => l.id === leadId);
    if (!lead || lead.stage === targetStage) return;

    try {
      await api.patch(`/api/v1/crm/leads/${leadId}/stage`, { stage: targetStage });
      fetchAll();
    } catch (err) {
      console.error('Stage update failed:', err.message);
    }
  }

  if (loading && leads.length === 0) {
    return (
      <Page style={{ alignItems: 'center', justifyContent: 'center', color: C.muted, fontSize: 14 }}>
        Loading pipeline…
      </Page>
    );
  }

  return (
    <Page>
      <BoardScroll>
        <Board>
          {COLUMNS.map(col => {
            const colLeads = byStage[col.stage] || [];
            const colValue = colLeads.reduce((s, l) => s + (l.predicted_value || 0), 0);
            const isOver = overStage === col.stage;

            return (
              <Column
                key={col.stage}
                $over={isOver}
                onDragOver={e => onDragOver(e, col.stage)}
                onDragLeave={onDragLeave}
                onDrop={e => onDrop(e, col.stage)}
              >
                <ColHeader>
                  <ColHeaderTop>
                    <ColDot $color={col.color} />
                    <ColLabel>{col.label}</ColLabel>
                  </ColHeaderTop>
                  <ColMeta>
                    <ColCount $color={col.color}>{colLeads.length}</ColCount>
                    <ColValue>{fmtMoney(colValue)}</ColValue>
                  </ColMeta>
                </ColHeader>

                <CardsArea>
                  {colLeads.length === 0 && (
                    <EmptyCol>Drop leads here</EmptyCol>
                  )}
                  {colLeads.map(lead => (
                    <LeadCard
                      key={lead.id}
                      draggable
                      $dragging={draggingId === lead.id}
                      onDragStart={e => onDragStart(e, lead.id)}
                      onDragEnd={onDragEnd}
                    >
                      <CardTop>
                        <CardAvatar $color={CLASS_COLOR[lead.classification] || C.muted}>
                          {initials(lead.first_name, lead.last_name)}
                        </CardAvatar>
                        <CardName>{lead.first_name} {lead.last_name}</CardName>
                      </CardTop>
                      <CardCompany>{lead.company || lead.email}</CardCompany>
                      <CardBottom>
                        <ClassBadge $cls={lead.classification}>{lead.classification}</ClassBadge>
                        <CardValue>{fmtMoney(lead.predicted_value)}</CardValue>
                      </CardBottom>
                    </LeadCard>
                  ))}
                </CardsArea>
              </Column>
            );
          })}
        </Board>
      </BoardScroll>
    </Page>
  );
}
