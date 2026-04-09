import React from 'react';
import styled from 'styled-components';
import payouts from '../data/payouts.json';

// ── Palette (matches CRMLayout / CRMDashboard) ────────────────────────────────
const C = {
  surface: '#0c1527',
  card: '#121e34',
  border: '#1a2d4d',
  text: '#e4eaf4',
  muted: '#6b7fa3',
  accent: '#2d7aff',
  success: '#00c48c',
  warning: '#ffb020',
};

const Panel = styled.div`
  background: ${C.card};
  border: 1px solid ${C.border};
  border-radius: 12px;
  padding: 16px;
`;

const SummaryRow = styled.div`
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 14px;
`;

const SummaryItem = styled.div``;

const SummaryLabel = styled.div`
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: ${C.muted};
  margin-bottom: 2px;
`;

const SummaryValue = styled.div`
  font-size: 16px;
  font-weight: 800;
  color: ${C.text};
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const Th = styled.th`
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: ${C.muted};
  text-align: left;
  padding: 6px 8px;
  border-bottom: 1px solid ${C.border};
`;

const Td = styled.td`
  font-size: 12px;
  color: ${C.text};
  padding: 8px;
  border-bottom: 1px solid ${C.border};

  &:last-child { border-bottom: none; }
`;

const Badge = styled.span`
  display: inline-block;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #fff;
  background: ${({ $status }) => $status === 'Pending' ? C.warning : C.success};
`;

const ComplianceTags = styled.div`
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: 12px;
`;

const Tag = styled.div`
  background: ${C.surface};
  border: 1px solid ${C.border};
  color: ${C.accent};
  font-size: 10px;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 6px;
`;

export default function PayoutsPanel() {
  return (
    <Panel aria-label="Payouts Panel">
      <SummaryRow>
        <SummaryItem>
          <SummaryLabel>Pending total</SummaryLabel>
          <SummaryValue>$2,480.00</SummaryValue>
        </SummaryItem>
        <SummaryItem>
          <SummaryLabel>Paid this month</SummaryLabel>
          <SummaryValue>3</SummaryValue>
        </SummaryItem>
        <SummaryItem>
          <SummaryLabel>Avg payout time</SummaryLabel>
          <SummaryValue>3 days</SummaryValue>
        </SummaryItem>
        <SummaryItem>
          <SummaryLabel>Disputes</SummaryLabel>
          <SummaryValue>1</SummaryValue>
        </SummaryItem>
      </SummaryRow>

      <div style={{ overflowX: 'auto' }}>
        <Table>
          <thead>
            <tr>
              <Th>Affiliate</Th>
              <Th>Period</Th>
              <Th>Amount</Th>
              <Th>Status</Th>
            </tr>
          </thead>
          <tbody>
            {payouts.map(p => (
              <tr key={p.id}>
                <Td>{p.affiliate}</Td>
                <Td>{p.period}</Td>
                <Td>${p.amount.toFixed(2)}</Td>
                <Td><Badge $status={p.status}>{p.status}</Badge></Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>

      <ComplianceTags>
        <Tag>KYC Verified</Tag>
        <Tag>AML Clear</Tag>
        <Tag>Docs on file</Tag>
      </ComplianceTags>
    </Panel>
  );
}
