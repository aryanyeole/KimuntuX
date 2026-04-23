import React from 'react';
import { Outlet } from 'react-router-dom';
import styled from 'styled-components';
import { useUser } from '../contexts/UserContext';
import CRMLandingPage from '../pages/crm/CRMLandingPage';
import { crm as C } from '../styles/crmTheme';

const LoadingShell = styled.div`
  display: flex;
  height: 100vh;
  align-items: center;
  justify-content: center;
  background: ${C.bg};
  color: ${C.muted};
  font-size: 14px;
  font-family: ${C.fontFamily};
`;

/**
 * Renders the full CRM app (via Outlet → CRMLayout) only when authenticated.
 * Logged-out visitors to /crm/* see the public CRM landing page instead.
 */
export default function CRMGate() {
  const { isAuthenticated, isLoading } = useUser();

  if (isLoading) {
    return <LoadingShell>Loading…</LoadingShell>;
  }

  if (!isAuthenticated) {
    return <CRMLandingPage />;
  }

  return <Outlet />;
}
