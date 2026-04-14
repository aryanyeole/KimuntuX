import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';

const PAGE_BG = '#000000';
const CARD_BG = '#111111';
const BORDER = 'rgba(255, 255, 255, 0.1)';
const TEAL = '#00c896';
const TEXT = '#ffffff';
const TEXT_MUTED = 'rgba(255, 255, 255, 0.72)';

const PageWrap = styled.div`
  min-height: 100vh;
  background: ${PAGE_BG};
  padding: 7rem 1.5rem 4rem;
  color: ${TEXT};
`;

const Inner = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;

const PageTitle = styled.h1`
  font-size: clamp(2.125rem, 5vw, 3rem);
  font-weight: 700;
  margin: 0 0 0.65rem;
  color: ${TEXT};
  font-family: ${(props) => props.theme?.fonts?.title || 'Poppins, sans-serif'};
`;

const PageSubtitle = styled.p`
  font-size: 1.3rem;
  color: ${TEXT_MUTED};
  margin: 0 0 2.25rem;
  line-height: 1.55;
  max-width: 48rem;

  @media (max-width: 768px) {
    font-size: 1.15rem;
  }
`;

const TabRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
`;

const TabButton = styled.button`
  padding: 0.8rem 1.45rem;
  border-radius: 8px;
  border: 1px solid ${(p) => (p.$active ? TEAL : BORDER)};
  background: ${(p) => (p.$active ? 'rgba(0, 200, 150, 0.15)' : 'transparent')};
  color: ${(p) => (p.$active ? TEAL : TEXT_MUTED)};
  font-size: 1.125rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  @media (max-width: 768px) {
    font-size: 1.05rem;
    padding: 0.7rem 1.15rem;
  }

  &:hover {
    border-color: ${TEAL};
    color: ${TEAL};
  }
`;

const Panel = styled.section`
  background: ${CARD_BG};
  border: 1px solid ${BORDER};
  border-radius: 12px;
  padding: 1.75rem 2rem;
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.45);

  @media (max-width: 768px) {
    padding: 1.35rem 1.15rem;
  }
`;

const PanelTitle = styled.h2`
  font-size: 1.6rem;
  font-weight: 600;
  margin: 0 0 1.15rem;
  color: ${TEXT};

  @media (max-width: 768px) {
    font-size: 1.35rem;
  }
`;

const TableScroll = styled.div`
  overflow-x: auto;
  margin: 0 -0.25rem;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 1.0625rem;
  min-width: 720px;

  @media (max-width: 768px) {
    font-size: 1rem;
  }
`;

const Th = styled.th`
  text-align: left;
  padding: 0.9rem 0.65rem;
  color: ${TEAL};
  font-weight: 600;
  font-size: 1.05rem;
  border-bottom: 1px solid ${BORDER};
  white-space: nowrap;

  @media (max-width: 768px) {
    font-size: 1rem;
    padding: 0.75rem 0.5rem;
  }
`;

const Td = styled.td`
  padding: 0.8rem 0.65rem;
  border-bottom: 1px solid ${BORDER};
  color: rgba(255, 255, 255, 0.88);
  vertical-align: top;
  word-break: break-word;
  font-size: 1.0625rem;
  line-height: 1.45;

  @media (max-width: 768px) {
    font-size: 1rem;
    padding: 0.7rem 0.5rem;
  }
`;

const ErrorBox = styled.div`
  background: rgba(204, 51, 51, 0.15);
  color: #ff8a8a;
  padding: 1.1rem 1.15rem;
  border-radius: 8px;
  border: 1px solid rgba(255, 100, 100, 0.35);
  margin-bottom: 1rem;
  font-size: 1.0625rem;
  line-height: 1.5;
`;

const EmptyNote = styled.p`
  color: ${TEXT_MUTED};
  margin: 0;
  font-size: 1.125rem;
  line-height: 1.55;

  @media (max-width: 768px) {
    font-size: 1.05rem;
  }

  strong {
    font-size: inherit;
  }
`;

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://127.0.0.1:8000/api/v1';

function formatApiError(status, data) {
  let detail = data?.detail;
  if (Array.isArray(detail)) {
    detail = detail.map((d) => d.msg || d).join(' ');
  }
  if (typeof detail !== 'string') {
    detail = detail ? String(detail) : 'Request failed';
  }
  if (status === 401 && detail.includes('validate credentials')) {
    return `${detail}. Your session may have expired or the server secret changed — use Logout, then sign in again. This is not a database connection error.`;
  }
  return detail;
}

const TABS = [
  { id: 'users', label: 'User profiles' },
  { id: 'contacts', label: 'Contact form results' },
  { id: 'support', label: 'Support inbox (support@kimux.io)' }
];

const AdminPage = () => {
  const { user, token, isLoading } = useUser();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [support, setSupport] = useState([]);
  const [loadError, setLoadError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      navigate('/login');
      return;
    }
    const admin = !!(user?.isAdmin ?? user?.is_admin);
    if (!admin) {
      navigate('/dashboard');
    }
  }, [user, isLoading, navigate]);

  const authHeaders = useCallback(() => {
    const h = { 'Content-Type': 'application/json' };
    if (token) h.Authorization = `Bearer ${token}`;
    return h;
  }, [token]);

  const loadTab = useCallback(async () => {
    if (!token || !(user?.isAdmin ?? user?.is_admin)) return;
    setLoading(true);
    setLoadError('');
    try {
      if (activeTab === 'users') {
        const r = await fetch(`${API_BASE_URL}/admin/users`, { headers: authHeaders() });
        const data = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(formatApiError(r.status, data) || 'Failed to load users');
        setUsers(Array.isArray(data) ? data : []);
      } else if (activeTab === 'contacts') {
        const r = await fetch(`${API_BASE_URL}/admin/contact-submissions`, {
          headers: authHeaders()
        });
        const data = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(formatApiError(r.status, data) || 'Failed to load contact submissions');
        setContacts(Array.isArray(data) ? data : []);
      } else {
        const r = await fetch(`${API_BASE_URL}/admin/support-messages`, {
          headers: authHeaders()
        });
        const data = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(formatApiError(r.status, data) || 'Failed to load support messages');
        setSupport(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      setLoadError(e.message || 'Request failed');
    } finally {
      setLoading(false);
    }
  }, [activeTab, token, user, authHeaders]);

  useEffect(() => {
    if (!(user?.isAdmin ?? user?.is_admin) || !token) return;
    loadTab();
  }, [activeTab, user, token, loadTab]);

  const isAdminUser = !!(user?.isAdmin ?? user?.is_admin);

  if (isLoading || !isAdminUser) {
    return (
      <PageWrap>
        <Inner>
          <PageTitle>Admin</PageTitle>
          <PageSubtitle>Checking access…</PageSubtitle>
        </Inner>
      </PageWrap>
    );
  }

  return (
    <PageWrap>
      <Inner>
        <PageTitle>Admin Dashboard</PageTitle>
        <PageSubtitle>
          Manage registered users, homepage contact leads, and messages sent to support@kimux.io. Only
          administrator accounts can view this area.
        </PageSubtitle>

        <TabRow>
          {TABS.map((t) => (
            <TabButton
              key={t.id}
              type="button"
              $active={activeTab === t.id}
              onClick={() => setActiveTab(t.id)}
            >
              {t.label}
            </TabButton>
          ))}
        </TabRow>

        <Panel>
          {activeTab === 'users' && (
            <>
              <PanelTitle>User profiles</PanelTitle>
              {loadError && <ErrorBox>{loadError}</ErrorBox>}
              {loading ? (
                <EmptyNote>Loading…</EmptyNote>
              ) : loadError ? null : users.length === 0 ? (
                <EmptyNote>No users yet.</EmptyNote>
              ) : (
                <TableScroll>
                  <Table>
                    <thead>
                      <tr>
                        <Th>Full name</Th>
                        <Th>Email / username</Th>
                        <Th>Password</Th>
                        <Th>Active</Th>
                        <Th>Joined</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => (
                        <tr key={u.id}>
                          <Td>{u.full_name}</Td>
                          <Td>{u.email}</Td>
                          <Td title={u.password_note}>{u.password_note}</Td>
                          <Td>{u.is_active ? 'Yes' : 'No'}</Td>
                          <Td>{u.created_at ? new Date(u.created_at).toLocaleString() : '—'}</Td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </TableScroll>
              )}
            </>
          )}

          {activeTab === 'contacts' && (
            <>
              <PanelTitle>Contact form results</PanelTitle>
              {loadError && <ErrorBox>{loadError}</ErrorBox>}
              {loading ? (
                <EmptyNote>Loading…</EmptyNote>
              ) : loadError ? null : contacts.length === 0 ? (
                <EmptyNote>No contact submissions yet.</EmptyNote>
              ) : (
                <TableScroll>
                  <Table>
                    <thead>
                      <tr>
                        <Th>Name</Th>
                        <Th>Email</Th>
                        <Th>Company</Th>
                        <Th>Country</Th>
                        <Th>Interest</Th>
                        <Th>Message</Th>
                        <Th>Source</Th>
                        <Th>Date</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {contacts.map((c) => (
                        <tr key={c.id}>
                          <Td>{c.full_name}</Td>
                          <Td>{c.email}</Td>
                          <Td>{c.company || '—'}</Td>
                          <Td>{c.country || '—'}</Td>
                          <Td>{c.primary_interest || '—'}</Td>
                          <Td>{c.message || '—'}</Td>
                          <Td>{c.source}</Td>
                          <Td>{c.created_at ? new Date(c.created_at).toLocaleString() : '—'}</Td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </TableScroll>
              )}
            </>
          )}

          {activeTab === 'support' && (
            <>
              <PanelTitle>Support inbox</PanelTitle>
              <EmptyNote style={{ marginBottom: '1rem' }}>
                Messages addressed to <strong style={{ color: TEAL }}>support@kimux.io</strong>
              </EmptyNote>
              {loadError && <ErrorBox>{loadError}</ErrorBox>}
              {loading ? (
                <EmptyNote>Loading…</EmptyNote>
              ) : loadError ? null : support.length === 0 ? (
                <EmptyNote>No support messages yet.</EmptyNote>
              ) : (
                <TableScroll>
                  <Table>
                    <thead>
                      <tr>
                        <Th>To</Th>
                        <Th>From</Th>
                        <Th>Name</Th>
                        <Th>Subject</Th>
                        <Th>Message</Th>
                        <Th>Date</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {support.map((m) => (
                        <tr key={m.id}>
                          <Td>{m.to_address}</Td>
                          <Td>{m.from_email}</Td>
                          <Td>{m.from_name || '—'}</Td>
                          <Td>{m.subject}</Td>
                          <Td>{m.body || '—'}</Td>
                          <Td>{m.created_at ? new Date(m.created_at).toLocaleString() : '—'}</Td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </TableScroll>
              )}
            </>
          )}
        </Panel>
      </Inner>
    </PageWrap>
  );
};

export default AdminPage;
