import React from 'react';
import styled from 'styled-components';

const Overlay = styled.div`
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.3);
  display: flex;
  justify-content: flex-end;
  z-index: 80;
`;

const Panel = styled.div`
  width: 420px;
  background: #FFFFFF;
  padding: 1rem;
  border-left: 1px solid #E5E7EB;
  overflow: auto;
`;

const DisabledButton = styled.button`
  background: #E5E7EB;
  color: #9CA3AF;
  border: none;
  padding: 8px 12px;
  border-radius: 6px;
`;

export default function LeadDrawer({ lead, onClose }) {
  if (!lead) return null;
  return (
    <Overlay role="dialog" aria-label={`Lead details ${lead.name}`} onClick={onClose}>
      <Panel onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0 }}>{lead.name}</h3>
          <button onClick={onClose} aria-label="Close">✕</button>
        </div>
        <p style={{ color: '#6B7280' }}>{lead.email}</p>
        <h4>Profile</h4>
        <p>Owner: {lead.owner}</p>
        <p>Score: {lead.score}</p>
        <p>Source: {lead.source}</p>
        <h4>Activity</h4>
        <div style={{ fontSize: 13, color: '#6B7280' }}>
          <div>Oct 24 — Email opened</div>
          <div>Oct 23 — Demo scheduled</div>
          <div>Oct 22 — Form submitted</div>
        </div>
        <h4 style={{ marginTop: 12 }}>Quick Actions</h4>
        <div style={{ display: 'flex', gap: 8 }}>
          <DisabledButton disabled>Email</DisabledButton>
          <DisabledButton disabled>SMS</DisabledButton>
          <DisabledButton disabled>WhatsApp</DisabledButton>
        </div>
      </Panel>
    </Overlay>
  );
}
