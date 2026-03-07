import React from 'react';
import styled from 'styled-components';
import { PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, ResponsiveContainer } from 'recharts';

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
`;

const Card = styled.div`
  border: 1px solid #E5E7EB;
  background: #FFFFFF;
  padding: 0.75rem;
  border-radius: 8px;
`;

const pieData = [{ name: 'A', value: 40 }, { name: 'B', value: 30 }, { name: 'C', value: 30 }];
const barData = [{ name: 'Jan', v: 400 }, { name: 'Feb', v: 520 }, { name: 'Mar', v: 610 }];
const lineData = [{ name: 'Week1', v: 120 }, { name: 'Week2', v: 200 }, { name: 'Week3', v: 180 }];

export default function ReportsGrid() {
  const COLORS = ['#60A5FA', '#34D399', '#F97316'];

  return (
    <Grid>
      <Card>
        <h4 style={{ marginTop: 0 }}>Segment Distribution</h4>
        <ResponsiveContainer width="100%" height={140}>
          <PieChart>
            <Pie data={pieData} dataKey="value" outerRadius={50}>
              {pieData.map((entry, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </Card>

      <Card>
        <h4 style={{ marginTop: 0 }}>Revenue Trend</h4>
        <ResponsiveContainer width="100%" height={140}>
          <BarChart data={barData}><Bar dataKey="v" fill="#10B981" /></BarChart>
        </ResponsiveContainer>
      </Card>

      <Card>
        <h4 style={{ marginTop: 0 }}>Engagement</h4>
        <ResponsiveContainer width="100%" height={140}>
          <LineChart data={lineData}><Line dataKey="v" stroke="#059669" /></LineChart>
        </ResponsiveContainer>
      </Card>
    </Grid>
  );
}
