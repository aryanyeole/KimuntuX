import React from 'react';
import styled from 'styled-components';

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
`;

const Card = styled.div`
  border: 1px solid #E5E7EB;
  background: #FFFFFF;
  padding: 0.75rem;
  border-radius: 8px;
`;

const DisabledButton = styled.button`
  background: #E5E7EB;
  color: #9CA3AF;
  border: none;
  padding: 6px 10px;
  border-radius: 6px;
`;

export default function SettingsIntegrations() {
  const services = ['Facebook', 'Google', 'Stripe', 'PayPal'];
  return (
    <div>
      <Grid>
        {services.map(s => (
          <Card key={s} aria-label={`integration ${s}`}>
            <div style={{ fontWeight: 700 }}>{s}</div>
            <div style={{ fontSize: 12, color: '#6B7280', margin: '6px 0' }}>Not connected</div>
            <DisabledButton disabled>Connect</DisabledButton>
          </Card>
        ))}
      </Grid>

      <div style={{ marginTop: 12 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <DisabledButton disabled>Import CSV</DisabledButton>
          <DisabledButton disabled>Export CSV</DisabledButton>
        </div>

        <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: 12, color: '#6B7280' }}>Audit Log</div>
          <ul style={{ paddingLeft: 16 }}>
            <li>Oct 24 — Settings updated (system)</li>
            <li>Oct 23 — Integration tried (user)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
