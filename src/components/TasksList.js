import React from 'react';
import styled from 'styled-components';

const Card = styled.div`
  border: 1px solid #E5E7EB;
  background: #FFFFFF;
  border-radius: 0.5rem;
  padding: 1rem;
`;

const Task = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid #F3F4F6;
`;

const DisabledButton = styled.button`
  background: #E5E7EB;
  color: #9CA3AF;
  border: none;
  padding: 6px 8px;
  border-radius: 6px;
`;

export default function TasksList() {
  const tasks = [
    { id: 't1', title: 'Call: Ava Thompson', due: 'Today' },
    { id: 't2', title: 'Email: Noah Patel', due: 'Tomorrow' },
    { id: 't3', title: 'WhatsApp: Emma Garcia', due: 'Today' }
  ];

  return (
    <Card aria-label="Tasks List">
      <h3 style={{ marginTop: 0, color: '#111827' }}>Tasks</h3>
      {tasks.map(t => (
        <Task key={t.id}>
          <div>
            <div style={{ fontWeight: 600 }}>{t.title}</div>
            <div style={{ fontSize: 12, color: '#6B7280' }}>{t.due}</div>
          </div>
          <DisabledButton aria-disabled>Action</DisabledButton>
        </Task>
      ))}
    </Card>
  );
}
