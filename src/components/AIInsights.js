import React from 'react';
import styled from 'styled-components';

const Card = styled.div`
  border: 1px solid #E5E7EB;
  background: #FFFFFF;
  border-radius: 0.5rem;
  padding: 1rem;
`;

const Bullet = styled.li`
  margin-bottom: 0.5rem;
`;

const DisabledButton = styled.button`
  background: #E5E7EB;
  color: #9CA3AF;
  border: none;
  padding: 8px 12px;
  border-radius: 8px;
  margin-top: 8px;
`;

export default function AIInsights() {
  return (
    <Card aria-label="AI Insights Preview">
      <h3 style={{ marginTop: 0, color: '#111827' }}>AI Insights (Preview)</h3>
      <ul style={{ paddingLeft: 16, color: '#111827' }}>
        <Bullet>Segment tip: focus on 'trial' users with score &gt; 70 for higher conversions.</Bullet>
        <Bullet>Best send time: Wed 10:00–12:00 local for this audience.</Bullet>
        <Bullet>Anomaly: Spike in CPC detected for Facebook campaigns on Oct 20.</Bullet>
      </ul>
      <DisabledButton aria-disabled>Generate again</DisabledButton>
    </Card>
  );
}
