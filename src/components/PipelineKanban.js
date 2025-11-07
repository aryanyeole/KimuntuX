import React from 'react';
import styled from 'styled-components';

const Board = styled.div`
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 1rem;
`;

const Column = styled.div`
  background: #FFFFFF;
  border: 1px solid #E5E7EB;
  border-radius: 0.5rem;
  padding: 0.75rem;
  min-height: 160px;
`;

const ColTitle = styled.h4`
  margin: 0 0 0.5rem 0;
  color: #111827;
`;

const LeadCard = styled.div`
  background: #F8FAFC;
  border: 1px solid #E5E7EB;
  padding: 0.5rem;
  border-radius: 8px;
  margin-bottom: 0.5rem;
`;

function Lead({ name, score, lastTouch, owner }) {
  return (
    <LeadCard>
      <div style={{ fontWeight: 600 }}>{name}</div>
      <div style={{ fontSize: 12, color: '#6B7280' }}>{owner} • {score} pts</div>
      <div style={{ fontSize: 12, color: '#9CA3AF' }}>{lastTouch}</div>
    </LeadCard>
  );
}

export default function PipelineKanban() {
  const columns = [
    { key: 'New', items: [{ name: 'Ava Thompson', score: 88, lastTouch: '2d', owner: 'Maya' }, { name: 'Liam Johnson', score: 45, lastTouch: '6d', owner: 'Ava' }] },
    { key: 'Contacted', items: [{ name: 'Noah Patel', score: 72, lastTouch: '4d', owner: 'Liam' }, { name: 'Olivia Brown', score: 66, lastTouch: '3d', owner: 'Liam' }] },
    { key: 'Engaged', items: [{ name: 'Emma Garcia', score: 95, lastTouch: '1d', owner: 'Maya' }, { name: 'Mia Davis', score: 82, lastTouch: '0d', owner: 'Maya' }] },
    { key: 'Converted', items: [{ name: 'James Williams', score: 78, lastTouch: '1d', owner: 'Liam' }] },
    { key: 'Closed', items: [{ name: 'Sophia Martinez', score: 33, lastTouch: '3w', owner: 'Ava' }] }
  ];

  return (
    <Board aria-label="Pipeline Kanban">
      {columns.map(col => (
        <Column key={col.key}>
          <ColTitle>{col.key}</ColTitle>
          {col.items.map((it, i) => (
            <Lead key={i} {...it} />
          ))}
        </Column>
      ))}
    </Board>
  );
}
