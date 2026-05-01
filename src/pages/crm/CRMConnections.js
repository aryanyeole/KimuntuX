import { useState } from 'react';
import styled, { keyframes } from 'styled-components';
import useIntegrations from '../../hooks/useIntegrations';
import { crm as C } from '../../styles/crmTheme';
import ClickBankSection from '../../components/crm/ClickBankSection';
import PlatformLogo from '../../components/crm/PlatformLogo';

// ── Constants ─────────────────────────────────────────────────────────────────
const PLATFORM_DESC = {
  ClickBank: 'Affiliate marketplace for digital products',
  BuyGoods: 'Health & wellness affiliate network',
  MaxWeb: 'Premium CPA affiliate network',
  Digistore24: 'European digital product marketplace',
  'Facebook Ads': 'Meta advertising platform',
  'Google Ads': 'Google search & display ads',
  'TikTok Ads': 'Short-form video ad platform',
  Instagram: 'Instagram ads & influencer tracking',
  YouTube: 'YouTube video ad campaigns',
  Stripe: 'Payment processing & subscriptions',
  PayPal: 'Online payment gateway',
  Zapier: 'No-code workflow automation',
  Slack: 'Team communication & alerts',
  Mailchimp: 'Email marketing platform',
};
const STATUS_COLOR = { connected: C.success, pending: C.warning, disconnected: C.muted };
const STATUS_LABEL = { connected: 'Connected', pending: 'Pending', disconnected: 'Disconnected' };

// ── Animations ────────────────────────────────────────────────────────────────
const fadeIn = keyframes`from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}`;

// ── Layout ────────────────────────────────────────────────────────────────────
const Page = styled.div`padding:20px;animation:${fadeIn} .2s ease;`;

const PageHeader = styled.div`margin-bottom:28px;`;
const PageTitle = styled.h1`font-size:20px;font-weight:700;color:${C.text};margin:0 0 6px 0;`;
const PageSubtitle = styled.p`font-size:13px;color:${C.muted};margin:0;line-height:1.5;`;

// ── Category sections ─────────────────────────────────────────────────────────
const CategorySection = styled.div`margin-bottom:32px;`;
const CategoryLabel = styled.h2`
  font-size:11px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;
  color:${C.muted};margin:0 0 14px 0;padding-bottom:8px;
  border-bottom:1px solid ${C.border};
`;
const CategorySub = styled.p`font-size:12px;color:${C.muted};margin:-4px 0 14px 0;`;

// ── SendGrid Email Sender card ────────────────────────────────────────────────
const EmailCard = styled.div`
  background:${C.card};border:1px solid ${C.border};border-radius:12px;padding:20px;
`;
const EmailCardTitle = styled.h3`
  font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;
  color:${C.muted};margin:0 0 4px 0;
`;
const EmailCardSub = styled.p`font-size:12px;color:${C.muted};margin:0 0 16px 0;`;
const EmailRow = styled.div`display:flex;align-items:flex-end;gap:10px;flex-wrap:wrap;`;
const EmailField = styled.div`display:flex;flex-direction:column;gap:4px;flex:1;min-width:160px;`;
const EmailLabel = styled.label`font-size:11px;font-weight:600;color:${C.muted};`;
const EmailInput = styled.input`
  background:${C.surface};border:1px solid ${C.border};border-radius:8px;
  color:${C.text};font-size:13px;padding:8px 12px;outline:none;
  &:focus{border-color:${C.accent};}
  &::placeholder{color:${C.textDim};}
`;
const SaveBtn = styled.button`
  background:${C.accent};color:#fff;border:none;border-radius:8px;
  padding:9px 20px;font-size:13px;font-weight:600;cursor:pointer;white-space:nowrap;
  &:hover:not(:disabled){background:${C.accentHover};}
  &:disabled{background:${C.border};cursor:default;}
`;
const ConnectedRow = styled.div`display:flex;align-items:center;gap:12px;flex-wrap:wrap;`;
const ConnectedInfo = styled.div`flex:1;min-width:0;`;
const ConnectedEmail = styled.div`font-size:13px;font-weight:700;color:${C.text};`;
const ConnectedName = styled.div`font-size:12px;color:${C.muted};margin-top:2px;`;
const TestBtn = styled.button`
  background:none;border:1px solid ${C.accent};color:${C.accent};
  border-radius:8px;padding:7px 14px;font-size:12px;font-weight:600;cursor:pointer;
  &:hover{background:${C.accent};color:#fff;}
  &:disabled{opacity:.4;cursor:default;}
`;
const DisconnectLink = styled.button`
  font-size:11px;font-weight:600;background:none;border:none;cursor:pointer;
  color:${C.muted};padding:0;text-decoration:underline;
  &:hover{color:${C.danger};}
`;
const TestResult = styled.div`
  margin-top:10px;padding:8px 12px;border-radius:8px;font-size:12px;
  background:${({ $ok }) => $ok ? C.successBg : C.dangerBg};
  border:1px solid ${({ $ok }) => $ok ? C.success : C.danger};
  color:${({ $ok }) => $ok ? C.success : C.danger};
`;

// ── Integrations Grid ─────────────────────────────────────────────────────────
const IntegrationsGrid = styled.div`
  display:grid;grid-template-columns:repeat(3,1fr);gap:12px;
  @media(max-width:900px){grid-template-columns:repeat(2,1fr);}
  @media(max-width:600px){grid-template-columns:1fr;}
`;
const IntCard = styled.div`
  background:${C.card};border:1px solid ${C.border};border-radius:12px;padding:16px;
  display:flex;flex-direction:column;gap:6px;
`;
const IntName = styled.div`font-size:13px;font-weight:700;color:${C.text};`;
const IntDesc = styled.div`font-size:11px;color:${C.muted};line-height:1.4;flex:1;`;
const IntFooter = styled.div`display:flex;align-items:center;justify-content:space-between;margin-top:4px;`;
const StatusBadge = styled.span`
  font-size:10px;font-weight:700;text-transform:capitalize;
  padding:2px 8px;border-radius:999px;color:#fff;
  background:${({ $status }) => STATUS_COLOR[$status] || C.muted};
`;
const ConnectBtn = styled.button`
  font-size:11px;font-weight:700;padding:4px 12px;border-radius:6px;cursor:pointer;
  background:none;border:1px solid ${C.accent};color:${C.accent};
  &:hover{background:${C.accent};color:#fff;}
  &:disabled{opacity:.5;cursor:default;}
`;

// ── Component ─────────────────────────────────────────────────────────────────
export default function CRMConnections() {
  const {
    integrations,
    loading,
    connect,
    disconnect,
    isSendGridConnected,
    sendgridIntegration,
    connectSendGrid,
    disconnectSendGrid,
    sendSendGridTestEmail,
    clickbankAccount,
    clickbankAccountLoading,
    fetchClickbankAccountStatus,
    connectClickbankAccount,
    disconnectClickbankAccount,
    syncClickbankAccount,
  } = useIntegrations();

  const [connecting, setConnecting] = useState({});
  const [sgEmail, setSgEmail] = useState('');
  const [sgName, setSgName] = useState('');
  const [sgSaving, setSgSaving] = useState(false);
  const [sgTesting, setSgTesting] = useState(false);
  const [sgTestResult, setSgTestResult] = useState(null);

  async function handleConnect(name) {
    setConnecting(prev => ({ ...prev, [name]: true }));
    try { await connect(name); } catch (err) { console.error(err.message); }
    finally { setConnecting(prev => ({ ...prev, [name]: false })); }
  }

  async function handleDisconnect(name) {
    try { await disconnect(name); } catch (err) { console.error(err.message); }
  }

  async function handleSgSave() {
    setSgSaving(true);
    setSgTestResult(null);
    try {
      await connectSendGrid({ senderEmail: sgEmail, senderName: sgName });
    } catch (err) {
      console.error('SendGrid connect failed:', err.message);
    } finally {
      setSgSaving(false);
    }
  }

  async function handleSgDisconnect() {
    setSgTestResult(null);
    try { await disconnectSendGrid(); } catch (err) { console.error(err.message); }
  }

  async function handleSgTestSend() {
    setSgTesting(true);
    setSgTestResult(null);
    try {
      const res = await sendSendGridTestEmail();
      setSgTestResult({ ok: true, message: `Test email sent! Message ID: ${res.message_id}` });
    } catch (err) {
      setSgTestResult({ ok: false, message: err.message || 'Test send failed.' });
    } finally {
      setSgTesting(false);
    }
  }

  return (
    <Page>
      <PageHeader>
        <PageTitle>Connections</PageTitle>
        <PageSubtitle>Connect external accounts and services to power your CRM.</PageSubtitle>
      </PageHeader>

      {/* ── Affiliate Networks ── */}
      <CategorySection>
        <CategoryLabel>Affiliate Networks</CategoryLabel>
        <ClickBankSection
          clickbankAccount={clickbankAccount}
          clickbankAccountLoading={clickbankAccountLoading}
          onConnectAccount={connectClickbankAccount}
          onDisconnectAccount={disconnectClickbankAccount}
          onSyncAccount={syncClickbankAccount}
          onFetchAccountStatus={fetchClickbankAccountStatus}
        />
      </CategorySection>

      {/* ── Email ── */}
      <CategorySection>
        <CategoryLabel>Email</CategoryLabel>
        <EmailCard>
          <EmailCardTitle>Email Sender</EmailCardTitle>
          <EmailCardSub>
            Configure the From address for outreach emails. KimuX uses a shared SendGrid account — you only need to set your sender identity.
          </EmailCardSub>

          {isSendGridConnected ? (
            <>
              <ConnectedRow>
                <StatusBadge $status="connected">Connected</StatusBadge>
                <ConnectedInfo>
                  <ConnectedEmail>{sendgridIntegration?.config?.sender_email}</ConnectedEmail>
                  <ConnectedName>{sendgridIntegration?.config?.sender_name}</ConnectedName>
                </ConnectedInfo>
                <TestBtn onClick={handleSgTestSend} disabled={sgTesting}>
                  {sgTesting ? 'Sending…' : 'Send test email'}
                </TestBtn>
                <DisconnectLink onClick={handleSgDisconnect}>Disconnect</DisconnectLink>
              </ConnectedRow>
              {sgTestResult && (
                <TestResult $ok={sgTestResult.ok}>{sgTestResult.message}</TestResult>
              )}
            </>
          ) : (
            <EmailRow>
              <EmailField>
                <EmailLabel htmlFor="conn-sg-email">Sender email</EmailLabel>
                <EmailInput
                  id="conn-sg-email"
                  type="email"
                  placeholder="hello@yourdomain.com"
                  value={sgEmail}
                  onChange={e => setSgEmail(e.target.value)}
                />
              </EmailField>
              <EmailField>
                <EmailLabel htmlFor="conn-sg-name">Sender name</EmailLabel>
                <EmailInput
                  id="conn-sg-name"
                  placeholder="Your Name or Company"
                  value={sgName}
                  onChange={e => setSgName(e.target.value)}
                />
              </EmailField>
              <SaveBtn
                onClick={handleSgSave}
                disabled={sgSaving || !sgEmail.trim() || !sgName.trim()}
              >
                {sgSaving ? 'Saving…' : 'Save'}
              </SaveBtn>
            </EmailRow>
          )}
        </EmailCard>
      </CategorySection>

      {/* ── All integrations ── */}
      <CategorySection>
        <CategoryLabel>All integrations</CategoryLabel>
        <CategorySub>Ad platforms, affiliate networks, payment gateways, and marketing tools.</CategorySub>
        <IntegrationsGrid>
          {loading && <div style={{ color: C.muted, fontSize: 13 }}>Loading integrations…</div>}
          {!loading && integrations.map(int => (
            <IntCard key={int.id || int.platform_name}>
              <PlatformLogo name={int.platform_name} size={40} />
              <IntName>{int.platform_name}</IntName>
              <IntDesc>{PLATFORM_DESC[int.platform_name] || int.platform_type}</IntDesc>
              <IntFooter>
                <StatusBadge $status={int.status}>{STATUS_LABEL[int.status] || int.status}</StatusBadge>
                {int.status === 'connected' ? (
                  <DisconnectLink onClick={() => handleDisconnect(int.platform_name)}>
                    Disconnect
                  </DisconnectLink>
                ) : (
                  <ConnectBtn
                    disabled={connecting[int.platform_name]}
                    onClick={() => handleConnect(int.platform_name)}
                  >
                    {connecting[int.platform_name] ? 'Connecting…' : 'Connect'}
                  </ConnectBtn>
                )}
              </IntFooter>
            </IntCard>
          ))}
        </IntegrationsGrid>
      </CategorySection>
    </Page>
  );
}
