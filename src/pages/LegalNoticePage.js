import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import styled from 'styled-components';

const Main = styled.main`
  min-height: 100vh;
  padding: 120px 1.5rem 4rem;
  max-width: 720px;
  margin: 0 auto;
  color: ${p => p.theme?.colors?.text || '#111827'};
  line-height: 1.65;
`;

const Title = styled.h1`
  margin: 0 0 1rem;
  font-size: 1.75rem;
  font-family: ${p => p.theme?.fonts?.title || 'Poppins, sans-serif'};
`;

const Back = styled(Link)`
  display: inline-block;
  margin-top: 2rem;
  color: ${p => p.theme?.colors?.primary || '#00C896'};
  font-weight: 600;
  text-decoration: none;
  &:hover {
    text-decoration: underline;
  }
`;

export default function LegalNoticePage() {
  const { pathname } = useLocation();
  const isPrivacy = pathname === '/privacy';
  const title = isPrivacy ? 'Privacy Policy' : 'Terms and Conditions';

  return (
    <Main>
      <Title>{title}</Title>
      <p>
        {isPrivacy
          ? 'This page describes how KimuX handles your data. Full policy text is being finalized. For questions, contact hello@kimux.io.'
          : 'These terms govern use of KimuX. Full legal text is being finalized. For questions, contact hello@kimux.io.'}
      </p>
      <Back to="/">Back to home</Back>
    </Main>
  );
}
