import React from 'react';
import styled from 'styled-components';

const Main = styled.main`
  min-height: calc(100vh - 200px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding: 4rem 1.5rem 3rem;
  background: ${p => p.theme?.colors?.background || '#f5f7fa'};
`;

const Title = styled.h1`
  margin: 0;
  font-size: 2.25rem;
  font-weight: 700;
  color: ${p => p.theme?.colors?.text || '#111'};
  font-family: ${p => p.theme?.fonts?.title || 'Poppins, sans-serif'};
  letter-spacing: -0.02em;
`;

export default function CRMLandingPage() {
  return (
    <Main>
      <Title>CRM</Title>
    </Main>
  );
}
