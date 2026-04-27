import React, { useEffect, useState, useCallback } from 'react';
import styled from 'styled-components';
import { Link, useNavigate } from 'react-router-dom';
import { parseJsonOrApiError } from '../../utils/parseFetchJson';
import { crm as C } from '../../styles/crmTheme';
import { useUser } from '../../contexts/UserContext';

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
  starter: 'Starter',
  growth: 'Pro',
  scalex: 'Enterprise',
};

const Dialog = styled.div`
  background: ${C.surface};
  border: 1px solid ${C.border};
  border-radius: 14px;
  width: 100%;
  max-width: 480px;
  max-height: min(90vh, 640px);
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

const SuccessText = styled.div`
  font-size: 13px;
  color: ${C.accent};
  margin-bottom: 12px;
`;

const LoadingText = styled.div`
  font-size: 14px;
  color: ${C.muted};
`;

const TextInput = styled.input`
  width: 100%;
  box-sizing: border-box;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid ${C.border};
  background: ${C.card};
  color: ${C.text};
  font-size: 14px;
  font-family: inherit;
  &:focus {
    outline: none;
    border-color: ${C.accent};
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  box-sizing: border-box;
  min-height: 72px;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid ${C.border};
  background: ${C.card};
  color: ${C.text};
  font-size: 14px;
  font-family: inherit;
  resize: vertical;
  &:focus {
    outline: none;
    border-color: ${C.accent};
  }
`;

const BtnRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 16px;
`;

const Btn = styled.button`
  flex: 1;
  min-width: 120px;
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  border: 1px solid ${C.border};
  background: ${C.card};
  color: ${C.text};
  &:hover:not(:disabled) {
    border-color: ${C.muted};
  }
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const BtnPrimary = styled(Btn)`
  background: ${C.accent};
  border-color: ${C.accent};
  color: #fff;
  &:hover:not(:disabled) {
    filter: brightness(1.05);
  }
`;

const BtnDanger = styled(Btn)`
  border-color: rgba(220, 80, 80, 0.5);
  color: #f87171;
  background: rgba(220, 80, 80, 0.12);
  &:hover:not(:disabled) {
    background: rgba(220, 80, 80, 0.2);
  }
`;

const HomeLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  min-width: 120px;
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  text-decoration: none;
  text-align: center;
  border: 1px solid ${C.border};
  color: ${C.text};
  &:hover {
    border-color: ${C.accent};
    color: ${C.accent};
  }
`;

const Divider = styled.div`
  height: 1px;
  background: ${C.border};
  margin: 16px 0;
`;

const SubTitle = styled.h3`
  margin: 0 0 12px;
  font-size: 14px;
  font-weight: 700;
  color: ${C.text};
`;

export default function CRMProfilePanel({ open, onClose, token }) {
  const navigate = useNavigate();
  const { updateUser, logout } = useUser();
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState('view');

  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');

  const [curPassword, setCurPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [deletePassword, setDeletePassword] = useState('');

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const r = await fetch(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await parseJsonOrApiError(r);
      setProfile(data);
      setEditName(data.full_name || '');
      setEditPhone(data.phone || '');
      setEditAddress(data.address || '');
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
      setSuccess('');
      setMode('view');
      setCurPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setDeletePassword('');
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

  const authHeaders = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const r = await fetch(`${API_BASE}/auth/me`, {
        method: 'PATCH',
        headers: authHeaders,
        body: JSON.stringify({
          full_name: editName.trim(),
          phone: editPhone.trim() || null,
          address: editAddress.trim() || null,
        }),
      });
      const data = await parseJsonOrApiError(r);
      setProfile(data);
      updateUser({
        name: data.full_name,
        full_name: data.full_name,
        phone: data.phone ?? null,
        address: data.address ?? null,
      });
      setSuccess('Profile updated.');
      setMode('view');
    } catch (err) {
      setError(err.message || 'Could not save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      setSaving(false);
      return;
    }
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters.');
      setSaving(false);
      return;
    }
    try {
      const r = await fetch(`${API_BASE}/auth/me/change-password`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          current_password: curPassword,
          new_password: newPassword,
        }),
      });
      await parseJsonOrApiError(r);
      setCurPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSuccess('Password updated.');
      setMode('view');
    } catch (err) {
      setError(err.message || 'Could not change password');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const r = await fetch(`${API_BASE}/auth/me/delete`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ password: deletePassword }),
      });
      await parseJsonOrApiError(r);
      onClose();
      logout();
      navigate('/');
    } catch (err) {
      setError(err.message || 'Could not delete account');
    } finally {
      setSaving(false);
    }
  };

  const handleForgotPassword = () => {
    onClose();
    logout();
    navigate('/login?forgot=1');
  };

  if (!open) return null;

  const title =
    mode === 'edit'
      ? 'Edit account'
      : mode === 'password'
        ? 'Change password'
        : mode === 'delete'
          ? 'Delete account'
          : 'Account information';

  return (
    <Overlay
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <Dialog role="dialog" aria-modal="true" aria-labelledby="crm-profile-title" onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle id="crm-profile-title">{title}</DialogTitle>
          <CloseBtn type="button" onClick={onClose} aria-label="Close">
            ×
          </CloseBtn>
        </DialogHeader>
        <Body>
          {loading && <LoadingText>Loading…</LoadingText>}
          {error && <ErrorText>{error}</ErrorText>}
          {success && mode === 'view' && <SuccessText>{success}</SuccessText>}

          {!loading && profile && mode === 'view' && (
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
              <BtnRow>
                <Btn type="button" onClick={() => { setError(''); setSuccess(''); setMode('edit'); }}>
                  Edit account
                </Btn>
                <Btn type="button" onClick={() => { setError(''); setSuccess(''); setMode('password'); }}>
                  Change password
                </Btn>
              </BtnRow>
              <BtnRow>
                <HomeLink to="/" onClick={onClose}>
                  Go to Homepage
                </HomeLink>
                <Btn type="button" onClick={handleForgotPassword}>
                  Forgot password
                </Btn>
              </BtnRow>
              {!profile.is_admin && (
                <BtnRow>
                  <BtnDanger type="button" onClick={() => { setError(''); setSuccess(''); setMode('delete'); }}>
                    Delete account
                  </BtnDanger>
                </BtnRow>
              )}
            </>
          )}

          {!loading && profile && mode === 'edit' && (
            <form onSubmit={handleSaveProfile}>
              <SubTitle>Update your details</SubTitle>
              <Row>
                <Label>Full name</Label>
                <TextInput value={editName} onChange={(e) => setEditName(e.target.value)} required />
              </Row>
              <Row>
                <Label>Phone</Label>
                <TextInput value={editPhone} onChange={(e) => setEditPhone(e.target.value)} />
              </Row>
              <Row>
                <Label>Address</Label>
                <TextArea value={editAddress} onChange={(e) => setEditAddress(e.target.value)} />
              </Row>
              <Muted>Email cannot be changed here. Contact support if you need to update it.</Muted>
              <BtnRow>
                <Btn type="button" onClick={() => { setError(''); setEditName(profile.full_name || ''); setEditPhone(profile.phone || ''); setEditAddress(profile.address || ''); setMode('view'); }}>
                  Cancel
                </Btn>
                <BtnPrimary type="submit" disabled={saving}>
                  {saving ? 'Saving…' : 'Save changes'}
                </BtnPrimary>
              </BtnRow>
            </form>
          )}

          {!loading && profile && mode === 'password' && (
            <form onSubmit={handleChangePassword}>
              <SubTitle>Set a new password</SubTitle>
              <Row>
                <Label>Current password</Label>
                <TextInput
                  type="password"
                  value={curPassword}
                  onChange={(e) => setCurPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
              </Row>
              <Row>
                <Label>New password</Label>
                <TextInput
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                  minLength={6}
                />
              </Row>
              <Row>
                <Label>Confirm new password</Label>
                <TextInput
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                  minLength={6}
                />
              </Row>
              <BtnRow>
                <Btn type="button" onClick={() => { setError(''); setCurPassword(''); setNewPassword(''); setConfirmPassword(''); setMode('view'); }}>
                  Cancel
                </Btn>
                <BtnPrimary type="submit" disabled={saving}>
                  {saving ? 'Updating…' : 'Update password'}
                </BtnPrimary>
              </BtnRow>
            </form>
          )}

          {!loading && profile && mode === 'delete' && (
            <form onSubmit={handleDeleteAccount}>
              <SubTitle>Permanently delete your account</SubTitle>
              <Muted style={{ marginTop: 0, marginBottom: 12 }}>
                This removes your user, workspace memberships, and any tenants that have no remaining members.
                This cannot be undone. Administrators cannot use self-delete here.
              </Muted>
              <Row>
                <Label>Confirm with your password</Label>
                <TextInput
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
              </Row>
              <BtnRow>
                <Btn type="button" onClick={() => { setError(''); setDeletePassword(''); setMode('view'); }}>
                  Cancel
                </Btn>
                <BtnDanger type="submit" disabled={saving}>
                  {saving ? 'Deleting…' : 'Delete my account'}
                </BtnDanger>
              </BtnRow>
            </form>
          )}
        </Body>
      </Dialog>
    </Overlay>
  );
}
