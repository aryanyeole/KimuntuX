import React from 'react';
import styled from 'styled-components';

const Card = styled.div`
  border: 1px solid #E5E7EB;
  background: #FFFFFF;
  border-radius: 0.5rem;
  padding: 1rem;
  box-shadow: 0 1px 2px rgba(0,0,0,0.03);
`;

const Label = styled.div`
  font-size: 0.825rem;
  color: #6B7280;
`;

const Value = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
`;

const Delta = styled.span`
  background: #ECFDF5;
  color: #059669;
  font-size: 0.75rem;
  padding: 0.125rem 0.5rem;
  border-radius: 999px;
  margin-left: 0.5rem;
`;

export default function KpiCard({ label, value, delta }) {
  return (
    <Card role="region" aria-label={label}>
      <Label>{label}</Label>
      <div style={{ display: 'flex', alignItems: 'center', marginTop: 6 }}>
        <Value>{value}</Value>
        {delta ? <Delta>{delta}</Delta> : null}
      </div>
    </Card>
  );
}
