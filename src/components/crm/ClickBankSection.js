import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

// ── Styled components ─────────────────────────────────────────────────────────

const Section = styled.div`
  background: ${p => p.theme.cardBg || '#1a1f2e'};
  border: 1px solid ${p => p.theme.border || '#2a3045'};
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
`;

const SectionTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: ${p => p.theme.text || '#e2e8f0'};
  margin: 0 0 4px 0;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const SubTitle = styled.p`
  font-size: 13px;
  color: ${p => p.theme.textMuted || '#64748b'};
  margin: 0 0 20px 0;
`;

const StatusRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;
`;

const StatusBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  background: ${p => p.$connected
    ? 'rgba(16,185,129,0.15)'
    : 'rgba(100,116,139,0.15)'};
  color: ${p => p.$connected ? '#10b981' : '#94a3b8'};
`;

const Dot = styled.span`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
`;

const StatRow = styled.div`
  display: flex;
  gap: 24px;
  margin-bottom: 16px;
  flex-wrap: wrap;
`;

const Stat = styled.div`
  font-size: 13px;
  color: ${p => p.theme.textMuted || '#64748b'};
  span {
    color: ${p => p.theme.text || '#e2e8f0'};
    font-weight: 600;
    margin-left: 4px;
  }
`;

const BtnRow = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
`;

const Btn = styled.button`
  padding: 8px 16px;
  border-radius: 8px;
  border: none;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.15s;
  &:disabled { opacity: 0.5; cursor: not-allowed; }
  background: ${p => p.$primary
    ? 'linear-gradient(135deg,#6366f1,#8b5cf6)'
    : p.$danger
      ? 'rgba(239,68,68,0.15)'
      : 'rgba(255,255,255,0.07)'};
  color: ${p => p.$danger ? '#ef4444' : '#e2e8f0'};
  border: 1px solid ${p => p.$danger ? 'rgba(239,68,68,0.3)' : 'transparent'};
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 16px;
  border-top: 1px solid ${p => p.theme.border || '#2a3045'};
  padding-top: 16px;
`;

const Label = styled.label`
  font-size: 12px;
  color: ${p => p.theme.textMuted || '#94a3b8'};
  margin-bottom: 4px;
  display: block;
`;

const Input = styled.input`
  width: 100%;
  padding: 9px 12px;
  border-radius: 8px;
  border: 1px solid ${p => p.theme.border || '#2a3045'};
  background: ${p => p.theme.inputBg || '#0f1117'};
  color: ${p => p.theme.text || '#e2e8f0'};
  font-size: 13px;
  box-sizing: border-box;
  &:focus { outline: none; border-color: #6366f1; }
`;

const ErrMsg = styled.p`
  font-size: 12px;
  color: #ef4444;
  margin: 0;
`;

const Divider = styled.hr`
  border: none;
  border-top: 1px solid ${p => p.theme.border || '#2a3045'};
  margin: 20px 0;
`;

// ── Component ─────────────────────────────────────────────────────────────────

function ClickBankSection({
  // marketplace props
  marketplaceStatus,
  marketplaceLoading,
  onSyncMarketplace,
  onFetchMarketplaceStatus,
  // account props
  clickbankAccount,
  clickbankAccountLoading,
  onConnectAccount,
  onDisconnectAccount,
  onSyncAccount,
  onFetchAccountStatus,
}) {
  const [showConnectForm, setShowConnectForm] = useState(false);
  const [formFields, setFormFields] = useState({ developerKey: '', accountNickname: '' });
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (onFetchMarketplaceStatus) onFetchMarketplaceStatus();
    if (onFetchAccountStatus) onFetchAccountStatus();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleConnect = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!formFields.developerKey) {
      setFormError('Developer API Key is required.');
      return;
    }
    try {
      await onConnectAccount(formFields);
      setShowConnectForm(false);
      setFormFields({ developerKey: '', accountNickname: '' });
    } catch (err) {
      setFormError(err.message || 'Connection failed.');
    }
  };

  const fmtDate = (iso) => {
    if (!iso) return 'Never';
    return new Date(iso).toLocaleString();
  };

  const isConnected = clickbankAccount?.connected;

  return (
    <Section>
      <SectionTitle>ClickBank</SectionTitle>
      <SubTitle>
        Sync affiliate offers from the ClickBank marketplace and optionally connect your vendor account.
      </SubTitle>

      {/* Marketplace tier */}
      <SectionTitle style={{ fontSize: 13, marginBottom: 8 }}>Marketplace (Platform)</SectionTitle>
      <StatusRow>
        <StatRow>
          <Stat>Offers synced: <span>{marketplaceStatus?.offer_count ?? '—'}</span></Stat>
          <Stat>Last sync: <span>{fmtDate(marketplaceStatus?.last_synced_at)}</span></Stat>
        </StatRow>
        <Btn
          $primary
          onClick={onSyncMarketplace}
          disabled={marketplaceLoading}
        >
          {marketplaceLoading ? 'Syncing…' : 'Sync Marketplace'}
        </Btn>
      </StatusRow>

      <Divider />

      {/* Account tier */}
      <SectionTitle style={{ fontSize: 13, marginBottom: 8 }}>Your Account (Optional)</SectionTitle>
      <StatusRow>
        <StatusBadge $connected={isConnected}>
          <Dot />
          {isConnected ? `Connected${clickbankAccount.account_nickname ? ` · ${clickbankAccount.account_nickname}` : ''}` : 'Not connected'}
        </StatusBadge>
        {isConnected && (
          <StatRow>
            <Stat>Account offers: <span>{clickbankAccount.offer_count}</span></Stat>
            <Stat>Last sync: <span>{fmtDate(clickbankAccount.last_sync_at)}</span></Stat>
          </StatRow>
        )}
      </StatusRow>

      <BtnRow>
        {!isConnected && (
          <Btn $primary onClick={() => setShowConnectForm(v => !v)} disabled={clickbankAccountLoading}>
            {showConnectForm ? 'Cancel' : 'Connect Account'}
          </Btn>
        )}
        {isConnected && (
          <>
            <Btn onClick={onSyncAccount} disabled={clickbankAccountLoading}>
              {clickbankAccountLoading ? 'Syncing…' : 'Sync Account Offers'}
            </Btn>
            <Btn
              $danger
              onClick={onDisconnectAccount}
              disabled={clickbankAccountLoading}
            >
              Disconnect
            </Btn>
          </>
        )}
      </BtnRow>

      {showConnectForm && (
        <Form onSubmit={handleConnect}>
          <div>
            <Label>Developer API Key *</Label>
            <Input
              type="password"
              placeholder="Your ClickBank developer key"
              value={formFields.developerKey}
              onChange={e => setFormFields(f => ({ ...f, developerKey: e.target.value }))}
            />
          </div>
          <div>
            <Label>Account Nickname (optional)</Label>
            <Input
              type="text"
              placeholder="e.g. My Vendor Account"
              value={formFields.accountNickname}
              onChange={e => setFormFields(f => ({ ...f, accountNickname: e.target.value }))}
            />
          </div>
          {formError && <ErrMsg>{formError}</ErrMsg>}
          <BtnRow>
            <Btn type="submit" $primary disabled={clickbankAccountLoading}>
              {clickbankAccountLoading ? 'Connecting…' : 'Verify & Connect'}
            </Btn>
            <Btn type="button" onClick={() => setShowConnectForm(false)}>Cancel</Btn>
          </BtnRow>
        </Form>
      )}
    </Section>
  );
}

export default ClickBankSection;
