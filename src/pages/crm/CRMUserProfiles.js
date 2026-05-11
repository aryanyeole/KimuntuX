import React, { useCallback, useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { useUser } from '../../contexts/UserContext';
import { parseJsonOrApiError } from '../../utils/parseFetchJson';
import { crm as C } from '../../styles/crmTheme';

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://127.0.0.1:8000/api/v1';

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
`;

const Page = styled.div`
  padding: 24px;
  animation: ${fadeIn} 0.25s ease;
  font-family: ${C.fontFamily};
`;

const Title = styled.h1`
  margin: 0 0 8px;
  font-size: 20px;
  font-weight: 700;
  color: ${C.text};
`;

const Sub = styled.p`
  margin: 0 0 20px;
  font-size: 13px;
  color: ${C.muted};
  line-height: 1.5;
  max-width: 640px;
`;

const Card = styled.div`
  background: ${C.card};
  border: 1px solid ${C.border};
  border-radius: 12px;
  padding: 18px;
  overflow-x: auto;
`;

const ErrorBox = styled.div`
  background: ${C.danger}18;
  border: 1px solid ${C.danger}44;
  color: ${C.danger};
  padding: 12px 14px;
  border-radius: 8px;
  font-size: 13px;
  margin-bottom: 14px;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  min-width: 1100px;
`;

const Th = styled.th`
  text-align: left;
  padding: 10px 8px;
  color: ${C.accent};
  font-weight: 600;
  border-bottom: 1px solid ${C.border};
  white-space: nowrap;
`;

const Td = styled.td`
  padding: 10px 8px;
  border-bottom: 1px solid ${C.border};
  color: ${C.text};
  vertical-align: middle;
  word-break: break-word;
`;

const ActionCell = styled.td`
  padding: 10px 8px;
  border-bottom: 1px solid ${C.border};
  vertical-align: middle;
  white-space: nowrap;
`;

const ActionGroup = styled.div`
  display: flex;
  flex-wrap: nowrap;
  gap: 8px;
  align-items: center;
`;

const Btn = styled.button`
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  border: 1px solid ${C.accent};
  background: ${C.accent}22;
  color: ${C.accent};
  &:hover:not(:disabled) {
    background: ${C.accent}33;
  }
  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
`;

const BtnSecondary = styled(Btn)`
  border-color: ${C.border};
  background: ${C.surface};
  color: ${C.muted};
  &:hover:not(:disabled) {
    border-color: ${C.accent};
    color: ${C.accent};
  }
`;

const Empty = styled.p`
  margin: 0;
  color: ${C.muted};
  font-size: 14px;
`;

const PLAN_LABEL = {
  starter: 'Starter',
  growth: 'Pro',
  scalex: 'Enterprise',
};

function planLabel(id) {
  if (!id) return '—';
  return PLAN_LABEL[id] || id;
}

function formatApiError(status, data) {
  let detail = data?.detail;
  if (Array.isArray(detail)) {
    detail = detail.map((d) => d.msg || d).join(' ');
  }
  if (typeof detail !== 'string') {
    detail = detail ? String(detail) : 'Request failed';
  }
  if (status === 401 && String(detail).includes('validate credentials')) {
    return `${detail}. Try signing out and back in.`;
  }
  return detail;
}

export default function CRMUserProfiles() {
  const { user, token, login, isLoading } = useUser();
  const navigate = useNavigate();
  const isAdmin = !!(user?.isAdmin ?? user?.is_admin);

  const [users, setUsers] = useState([]);
  const [loadError, setLoadError] = useState('');
  const [loading, setLoading] = useState(false);
  const [actionError, setActionError] = useState('');
  const [actingOnUserId, setActingOnUserId] = useState(null);

  const authHeaders = useCallback(() => {
    const h = { 'Content-Type': 'application/json' };
    if (token) h.Authorization = `Bearer ${token}`;
    return h;
  }, [token]);

  const loadUsers = useCallback(async () => {
    if (!token || !isAdmin) return;
    setLoading(true);
    setLoadError('');
    try {
      const r = await fetch(`${API_BASE}/admin/users`, { headers: authHeaders() });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(formatApiError(r.status, data) || 'Failed to load users');
      setUsers(Array.isArray(data) ? data : []);
    } catch (e) {
      setLoadError(e.message || 'Request failed');
    } finally {
      setLoading(false);
    }
  }, [token, isAdmin, authHeaders]);

  useEffect(() => {
    if (!isLoading && isAdmin && token) loadUsers();
  }, [isLoading, isAdmin, token, loadUsers]);

  const mapTokenUserToContext = (data) => ({
    id: data.user.id,
    name: data.user.full_name,
    email: data.user.email,
    isActive: data.user.is_active ?? data.user.isActive,
    isAdmin: !!(data.user?.is_admin ?? data.user?.isAdmin),
    joinDate: data.user.created_at,
  });

  const handleAccessAccount = async (target) => {
    if (!token || !isAdmin) return;
    setActionError('');
    setActingOnUserId(target.id);
    try {
      const r = await fetch(`${API_BASE}/admin/users/${target.id}/access-token`, {
        method: 'POST',
        headers: authHeaders(),
      });
      const data = await parseJsonOrApiError(r);
      const backup = {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          isActive: user.isActive ?? user.is_active,
          isAdmin: !!(user.isAdmin ?? user.is_admin),
          joinDate: user.joinDate,
        },
      };
      try {
        sessionStorage.setItem('kimuntu_admin_restore', JSON.stringify(backup));
      } catch {
        /* ignore */
      }
      login(
        mapTokenUserToContext(data),
        data.access_token,
        data.tenant === undefined ? undefined : data.tenant
      );
      navigate('/crm/dashboard');
    } catch (e) {
      setActionError(e.message || 'Could not open user session');
    } finally {
      setActingOnUserId(null);
    }
  };

  const handleMakeAdmin = async (target) => {
    if (!token || !isAdmin) return;
    if (target.is_admin) return;
    setActionError('');
    setActingOnUserId(target.id);
    try {
      const r = await fetch(`${API_BASE}/admin/users/${target.id}/role`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ is_admin: true }),
      });
      await parseJsonOrApiError(r);
      setUsers((prev) => prev.map((row) => (row.id === target.id ? { ...row, is_admin: true } : row)));
    } catch (e) {
      setActionError(e.message || 'Could not update admin role');
    } finally {
      setActingOnUserId(null);
    }
  };

  if (isLoading) {
    return (
      <Page>
        <Empty>Checking access…</Empty>
      </Page>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/crm/dashboard" replace />;
  }

  return (
    <Page>
      <Title>User profiles</Title>
      <Sub>
        All registered accounts. Use actions to open a user session or grant administrator access (same
        capabilities as the legacy admin area).
      </Sub>
      <Card>
        {loadError && <ErrorBox>{loadError}</ErrorBox>}
        {actionError && <ErrorBox>{actionError}</ErrorBox>}
        {loading ? (
          <Empty>Loading…</Empty>
        ) : loadError ? null : users.length === 0 ? (
          <Empty>No users yet.</Empty>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Full name</Th>
                <Th>Email</Th>
                <Th>Phone</Th>
                <Th>Address</Th>
                <Th>Plan</Th>
                <Th>Password</Th>
                <Th>Active</Th>
                <Th>Admin</Th>
                <Th>Joined</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const isSelf = u.id === user?.id;
                const busy = actingOnUserId === u.id;
                return (
                  <tr key={u.id}>
                    <Td>{u.full_name}</Td>
                    <Td>{u.email}</Td>
                    <Td>{u.phone || '—'}</Td>
                    <Td title={u.address || ''}>{u.address ? (u.address.length > 48 ? `${u.address.slice(0, 48)}…` : u.address) : '—'}</Td>
                    <Td>{planLabel(u.signup_plan)}</Td>
                    <Td title={u.password_note}>{u.password_note}</Td>
                    <Td>{u.is_active ? 'Yes' : 'No'}</Td>
                    <Td>{u.is_admin ? 'Yes' : 'No'}</Td>
                    <Td>{u.created_at ? new Date(u.created_at).toLocaleString() : '—'}</Td>
                    <ActionCell>
                      <ActionGroup>
                        <BtnSecondary
                          type="button"
                          disabled={busy || isSelf}
                          title={isSelf ? 'Already your account' : 'Sign in as this user'}
                          onClick={() => handleAccessAccount(u)}
                        >
                          Access account
                        </BtnSecondary>
                        <Btn
                          type="button"
                          disabled={busy || u.is_admin}
                          title={u.is_admin ? 'Already an administrator' : 'Grant administrator access'}
                          onClick={() => handleMakeAdmin(u)}
                        >
                          Make admin
                        </Btn>
                      </ActionGroup>
                    </ActionCell>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        )}
      </Card>
    </Page>
  );
}
