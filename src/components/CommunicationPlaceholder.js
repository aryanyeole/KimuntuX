import React from 'react';
import styled from 'styled-components';

const Grid = styled.div`
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: 1rem;
`;

const Pane = styled.div`
  border: 1px solid #E5E7EB;
  background: #FFFFFF;
  padding: 0.75rem;
  border-radius: 8px;
`;

const DisabledInput = styled.input`
  width: 100%;
  padding: 8px;
  border-radius: 6px;
  border: 1px solid #E5E7EB;
`;

export default function CommunicationPlaceholder() {
  const channels = ['Email', 'SMS', 'WhatsApp', 'Facebook', 'Google'];
  const messages = [
    { subject: 'Welcome', snippet: 'Thanks for signing up', time: '10:10' },
    { subject: 'Offer', snippet: 'Limited time discount', time: '09:00' }
  ];

  return (
    <Grid>
      <Pane aria-label="Channels">
        <h4 style={{ marginTop: 0 }}>Channels</h4>
        <ul style={{ paddingLeft: 16 }}>
          {channels.map(c => <li key={c}>{c}</li>)}
        </ul>
      </Pane>
      <Pane aria-label="Messages">
        <h4 style={{ marginTop: 0 }}>Messages</h4>
        <div>
          {messages.map((m,i) => (
            <div key={i} style={{ borderBottom: '1px solid #F3F4F6', padding: '8px 0' }}>
              <div style={{ fontWeight: 600 }}>{m.subject}</div>
              <div style={{ fontSize: 12, color: '#6B7280' }}>{m.snippet}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 8 }}>
          <DisabledInput placeholder="Composer (disabled)" disabled />
        </div>
      </Pane>
    </Grid>
  );
}
