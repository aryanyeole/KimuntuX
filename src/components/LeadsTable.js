import React, { useState } from 'react';
import styled from 'styled-components';
import leads from '../data/leads.json';
import LeadDrawer from './LeadDrawer';

const Wrapper = styled.div`
  border: 1px solid #E5E7EB;
  background: #FFFFFF;
  border-radius: 0.5rem;
  padding: 1rem;
  overflow: auto;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const Th = styled.th`
  font-size: 0.85rem;
  text-align: left;
  padding: 0.5rem 0;
  color: #6B7280;
`;

const Tr = styled.tr`
  cursor: pointer;
  &:hover { background: #F8FAFC; }
`;

const Td = styled.td`
  padding: 0.5rem 0;
  color: #111827;
`;

function ScoreBadge({ score }) {
  const tier = score >= 80 ? '#10B981' : score >= 60 ? '#F59E0B' : '#EF4444';
  return <span style={{ background: tier + '22', color: tier, padding: '4px 8px', borderRadius: 999 }}>{score}</span>;
}

export default function LeadsTable() {
  const [selected, setSelected] = useState(null);

  return (
    <>
      <Wrapper aria-label="Leads table">
        <Table>
          <thead>
            <tr>
              <Th>Name</Th>
              <Th>Source</Th>
              <Th>Score</Th>
              <Th>Status</Th>
              <Th>Last Contact</Th>
              <Th>Owner</Th>
              <Th>Tags</Th>
            </tr>
          </thead>
          <tbody>
            {leads.slice(0, 10).map(l => (
              <Tr key={l.id} onClick={() => setSelected(l)} aria-label={`Lead ${l.name}`}>
                <Td>{l.name}</Td>
                <Td>{l.source}</Td>
                <Td><ScoreBadge score={l.score} /></Td>
                <Td>{l.status}</Td>
                <Td>{new Date(l.lastContact).toLocaleString()}</Td>
                <Td>{l.owner}</Td>
                <Td>{l.tags.join(', ')}</Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </Wrapper>
      {selected ? <LeadDrawer lead={selected} onClose={() => setSelected(null)} /> : null}
    </>
  );
}
