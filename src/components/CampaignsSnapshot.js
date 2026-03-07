import React from 'react';
import styled from 'styled-components';
import { LineChart, Line, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import campaigns from '../data/campaigns.json';

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
`;

const SmallCard = styled.div`
  border: 1px solid #E5E7EB;
  background: #FFFFFF;
  padding: 0.75rem;
  border-radius: 0.5rem;
`;

export default function CampaignsSnapshot() {
  const small = campaigns.slice(0,4).map(c => ({ name: c.name, ctr: c.ctr }));
  const pie = campaigns.reduce((acc, c) => {
    const found = acc.find(a => a.name === c.channel);
    if (found) found.value += c.leads; else acc.push({ name: c.channel, value: c.leads });
    return acc;
  }, []);

  const barData = campaigns.map(c => ({ name: c.name, revenue: c.leads * 30, spend: c.spend }));
  const COLORS = ['#60A5FA', '#34D399', '#F97316', '#F472B6'];

  return (
    <div>
      <Grid>
        {small.map((s, i) => (
          <SmallCard key={i} aria-label={s.name}>
            <div style={{ fontSize: 12, color: '#6B7280' }}>{s.name}</div>
            <div style={{ height: 60 }}>
              <ResponsiveContainer width="100%" height={60}>
                <LineChart data={campaigns.slice(0,6)}> 
                  <Line type="monotone" dataKey="ctr" stroke="#059669" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div style={{ fontWeight: 700, marginTop: 6 }}>{s.ctr}% CTR</div>
          </SmallCard>
        ))}
      </Grid>

      <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
        <div style={{ flex: 1, border: '1px solid #E5E7EB', borderRadius: 8, padding: 8, background: '#FFF' }}>
          <h4 style={{ marginTop: 0 }}>Attribution (Leads by Source)</h4>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={pie} dataKey="value" nameKey="name" outerRadius={60} fill="#8884d8">
                {pie.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div style={{ flex: 1, border: '1px solid #E5E7EB', borderRadius: 8, padding: 8, background: '#FFF' }}>
          <h4 style={{ marginTop: 0 }}>Revenue vs Spend</h4>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={barData}>
              <XAxis dataKey="name" hide />
              <YAxis hide />
              <Tooltip />
              <Bar dataKey="revenue" fill="#10B981" />
              <Bar dataKey="spend" fill="#F97316" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
