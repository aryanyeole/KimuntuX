import React, { useEffect, useState, useCallback } from 'react';
import styled from 'styled-components';
import { parseJsonOrApiError } from '../../utils/parseFetchJson';
import { crm as C } from '../../styles/crmTheme';

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://127.0.0.1:8000/api/v1';

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
`;

const PLAN_LABEL = {
  starter: 'Starter (Starting Plan)',
  growth: 'Growth (Pro Plan)',
  scalex: 'ScaleX (Business Plan)',
};

const Dialog = styled.div`
  background: ${C.surface};
  border: 1px solid ${C.border};
  border-radius: 14px;
  width: 100%;
  max-width: 480px;
  max-height: min(90vh, 560px);
  overflow: auto;
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.5);
  font-family: ${C.fontFamily};
`;

const DialogHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 18px;
  border-bottom: 1px solid ${C.border};
`;

const DialogTitle = styled.h2`
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: ${C.text};
`;

const CloseBtn = styled.button`
  background: ${C.card};
  border: 1px solid ${C.border};
  color: ${C.muted};
  width: 32px;
  height: 32px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  line-height: 1;
  &:hover {
    color: ${C.text};
    border-color: ${C.muted};
  }
`;

const Body = styled.div`
  padding: 18px;
`;

const Row = styled.div`
  margin-bottom: 14px;
  &:last-child {
    margin-bottom: 0;
  }
`;

const Label = styled.div`
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: ${C.muted};
  margin-bottom: 4px;
`;

const Value = styled.div`
  font-size: 14px;
  color: ${C.text};
  line-height: 1.45;
  word-break: break-word;
`;

const Muted = styled.div`
  font-size: 12px;
  color: ${C.muted};
  margin-top: 14px;
  line-height: 1.4;
`;

const ErrorText = styled.div`
  font-size: 13px;
  color: ${C.danger};
  margin-bottom: 12px;
`;

const LoadingText = styled.div`
  font-size: 14px;
  color: ${C.muted};
`;

export default function CRMProfilePanel({ open, onClose, token }) {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const r = await fetch(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await parseJsonOrApiError(r);
      setProfile(data);
    } catch (e) {
      setError(e.message || 'Could not load profile');
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!open) {
      setProfile(null);
      setError('');
      return;
    }
    load();
  }, [open, load]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <Overlay
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <Dialog role="dialog" aria-modal="true" aria-labelledby="crm-profile-title" onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle id="crm-profile-title">Account information</DialogTitle>
          <CloseBtn type="button" onClick={onClose} aria-label="Close">
            ×
          </CloseBtn>
        </DialogHeader>
        <Body>
          {loading && <LoadingText>Loading…</LoadingText>}
          {error && <ErrorText>{error}</ErrorText>}
          {!loading && profile && (
            <>
              <Row>
                <Label>Full name</Label>
                <Value>{profile.full_name || '—'}</Value>
              </Row>
              <Row>
                <Label>Email</Label>
                <Value>{profile.email}</Value>
              </Row>
              <Row>
                <Label>Phone</Label>
                <Value>{profile.phone?.trim() ? profile.phone : '—'}</Value>
              </Row>
              <Row>
                <Label>Address</Label>
                <Value>{profile.address?.trim() ? profile.address : '—'}</Value>
              </Row>
              <Row>
                <Label>Selected plan</Label>
                <Value>
                  {profile.signup_plan
                    ? PLAN_LABEL[profile.signup_plan] || profile.signup_plan
                    : '—'}
                </Value>
              </Row>
              <Row>
                <Label>Account status</Label>
                <Value>{profile.is_active ? 'Active' : 'Inactive'}</Value>
              </Row>
              <Row>
                <Label>Member since</Label>
                <Value>
                  {profile.created_at
                    ? new Date(profile.created_at).toLocaleString(undefined, {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })
                    : '—'}
                </Value>
              </Row>
              {profile.is_admin && (
                <Row>
                  <Label>Role</Label>
                  <Value>Administrator</Value>
                </Row>
              )}
              <Muted>
                This is the information from your KimuX account. Your password is never shown.
              </Muted>
            </>
          )}
        </Body>
      </Dialog>
    </Overlay>
  );
}
