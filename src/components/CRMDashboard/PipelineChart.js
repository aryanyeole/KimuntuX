import React from 'react';
import styled from 'styled-components';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const ChartWrapper = styled.div`
  background: ${props => props.theme.colors.cardBackground};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
`;

const ChartTitle = styled.h3`
  font-size: 1.1rem;
  font-weight: 600;
  color: ${props => props.theme.colors.text};
  margin: 0 0 1rem 0;
`;

const LoadingPlaceholder = styled.div`
  width: 100%;
  height: 300px;
  background: linear-gradient(90deg, 
    ${props => props.theme.colors.border} 25%, 
    ${props => props.theme.colors.cardBackground} 50%, 
    ${props => props.theme.colors.border} 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
  border-radius: 8px;

  @keyframes loading {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
`;

export default function PipelineChart({ data, loading, isDarkMode }) {
  if (loading) {
    return (
      <ChartWrapper>
        <ChartTitle>Pipeline Distribution</ChartTitle>
        <LoadingPlaceholder />
      </ChartWrapper>
    );
  }

  // Transform leadsByStage data for chart
  const chartData = Object.entries(data?.leadsByStage || {}).map(([stage, count]) => ({
    name: stage.replace(/_/g, ' '),
    count: count
  }));

  if (chartData.length === 0) {
    chartData.push({ name: 'No Data', count: 0 });
  }

  return (
    <ChartWrapper>
      <ChartTitle>Pipeline Distribution</ChartTitle>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke={isDarkMode ? '#444' : '#e5e7eb'}
          />
          <XAxis 
            dataKey="name" 
            tick={{ fill: isDarkMode ? '#999' : '#666', fontSize: 12 }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis 
            tick={{ fill: isDarkMode ? '#999' : '#666', fontSize: 12 }}
          />
          <Tooltip 
            contentStyle={{
              background: isDarkMode ? '#2a2a2a' : '#ffffff',
              border: `1px solid ${isDarkMode ? '#444' : '#e5e7eb'}`,
              borderRadius: '8px',
              color: isDarkMode ? '#e0e0e0' : '#111'
            }}
            cursor={{ fill: isDarkMode ? 'rgba(0, 200, 150, 0.1)' : 'rgba(0, 200, 150, 0.05)' }}
          />
          <Bar dataKey="count" fill="#00c896" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartWrapper>
  );
}
