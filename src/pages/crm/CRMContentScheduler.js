import React from 'react';
import styled, { keyframes } from 'styled-components';

const fadeIn = keyframes`from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}`;

const Wrap = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  gap: 16px;
  animation: ${fadeIn} .25s ease;
`;

const Icon = styled.div`font-size: 48px;`;

const Title = styled.h2`
  font-size: 22px;
  font-weight: 800;
  color: #e4eaf4;
  margin: 0;
`;

const Sub = styled.p`
  font-size: 14px;
  color: #6b7fa3;
  margin: 0;
`;

const Badge = styled.span`
  font-size: 11px;
  font-weight: 700;
  padding: 4px 12px;
  border-radius: 999px;
  background: #1a2d4d;
  color: #6b7fa3;
  border: 1px solid #1a2d4d;
`;

export default function CRMContentScheduler() {
  return (
    <Wrap>
      <Icon>CS</Icon>
      <Title>Content Scheduler</Title>
      <Sub>Plan, schedule, and publish content across all your marketing channels — coming soon.</Sub>
      <Badge>Coming Soon</Badge>
    </Wrap>
  );
}
