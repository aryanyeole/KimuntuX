import React from 'react';
import styled from 'styled-components';
import payouts from '../data/payouts.json';

const Card = styled.div`
  border: 1px solid #E5E7EB;
  background: #FFFFFF;
  border-radius: 0.5rem;
  padding: 1rem;
`;

const Small = styled.div`
  display: flex;
  gap: 12px;
`;

const Badge = styled.span`
  padding: 4px 8px;
  border-radius: 999px;
  background: ${p => p.status === 'Pending' ? '#FEF3C7' : '#ECFDF5'};
  color: ${p => p.status === 'Pending' ? '#B45309' : '#059669'};
`;

export default function PayoutsPanel() {
  return (
    <Card aria-label="Payouts Panel">
      <h3 style={{ marginTop: 0 }}>Payouts</h3>
      <Small>
        <div>
          <div style={{ fontSize: 12, color: '#6B7280' }}>Pending total</div>
          <div style={{ fontWeight: 700 }}>$2,480.00</div>
        </div>
        <div>
          <div style={{ fontSize: 12, color: '#6B7280' }}>Paid this month</div>
          <div style={{ fontWeight: 700 }}>3</div>
        </div>
        <div>
          <div style={{ fontSize: 12, color: '#6B7280' }}>Avg payout time</div>
          <div style={{ fontWeight: 700 }}>3 days</div>
        </div>
        <div>
          <div style={{ fontSize: 12, color: '#6B7280' }}>Disputes</div>
          <div style={{ fontWeight: 700 }}>1</div>
        </div>
      </Small>

      <div style={{ marginTop: 12, overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', color: '#6B7280' }}>
              <th>Affiliate</th>
              <th>Period</th>
              <th>Amount</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {payouts.map(p => (
              <tr key={p.id} style={{ borderTop: '1px solid #F3F4F6' }}>
                <td style={{ padding: 8 }}>{p.affiliate}</td>
                <td style={{ padding: 8 }}>{p.period}</td>
                <td style={{ padding: 8 }}>${p.amount.toFixed(2)}</td>
                <td style={{ padding: 8 }}><Badge status={p.status}>{p.status}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 12 }}>
        <div style={{ fontSize: 12, color: '#6B7280' }}>Compliance</div>
        <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
          <div style={{ background: '#EEF2FF', padding: '4px 8px', borderRadius: 6 }}>KYC Verified</div>
          <div style={{ background: '#EEF2FF', padding: '4px 8px', borderRadius: 6 }}>AML Clear</div>
          <div style={{ background: '#EEF2FF', padding: '4px 8px', borderRadius: 6 }}>Docs on file</div>
        </div>
      </div>
    </Card>
  );
}
