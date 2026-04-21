import React, { useCallback, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import blockchainService from '../services/blockchainService';
import { crm as C } from '../styles/crmTheme';

const Container = styled.div`
  background: ${C.surface};
  border: 1px solid ${C.border};
  border-radius: ${C.radiusLg};
  padding: 1.5rem;
`;

const Header = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1.25rem;
`;

const Title = styled.h3`
  color: ${C.text};
  margin: 0;
  font-size: 1.15rem;
  font-weight: 700;
`;

const Subtitle = styled.p`
  color: ${C.textMuted};
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.6;
`;

const FlowRow = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 0.9rem;
  margin-bottom: 1.25rem;
`;

const FlowCard = styled.div`
  background: ${C.card};
  border: 1px solid ${C.border};
  border-radius: ${C.radius};
  padding: 1rem;
`;

const FlowStep = styled.div`
  color: ${C.accent};
  font-size: 0.8rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin-bottom: 0.4rem;
`;

const FlowTitle = styled.div`
  color: ${C.text};
  font-size: 0.95rem;
  font-weight: 700;
  margin-bottom: 0.35rem;
`;

const FlowBody = styled.div`
  color: ${C.textMuted};
  font-size: 0.85rem;
  line-height: 1.55;
`;

const OverviewGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 0.9rem;
  margin-bottom: 1.5rem;
`;

const StatCard = styled.div`
  background: ${C.card};
  border: 1px solid ${C.border};
  border-radius: ${C.radius};
  padding: 1rem;
`;

const StatLabel = styled.div`
  color: ${C.textMuted};
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 0.35rem;
`;

const StatValue = styled.div`
  color: ${C.text};
  font-size: 1.15rem;
  font-weight: 800;
`;

const TabRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  margin-bottom: 1.25rem;
  border-bottom: 1px solid ${C.border};
  padding-bottom: 0.75rem;
`;

const Tab = styled.button`
  background: ${({ $active }) => ($active ? C.accentBg : 'transparent')};
  border: 1px solid ${({ $active }) => ($active ? `${C.accent}55` : C.border)};
  color: ${({ $active }) => ($active ? C.accent : C.textMuted)};
  border-radius: 999px;
  padding: 0.55rem 0.95rem;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
`;

const PanelGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
`;

const Panel = styled.div`
  background: ${C.card};
  border: 1px solid ${C.border};
  border-radius: ${C.radius};
  padding: 1rem;
`;

const PanelTitle = styled.h4`
  margin: 0 0 0.8rem;
  color: ${C.text};
  font-size: 0.98rem;
  font-weight: 700;
`;

const PanelCopy = styled.p`
  margin: 0 0 0.9rem;
  color: ${C.textMuted};
  font-size: 0.84rem;
  line-height: 1.55;
`;

const Meta = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.5rem;
  color: ${C.textMuted};
  font-size: 0.84rem;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
`;

const InputGroup = styled.div``;

const Label = styled.label`
  display: block;
  color: ${C.text};
  font-size: 0.84rem;
  font-weight: 600;
  margin-bottom: 0.45rem;
`;

const Input = styled.input`
  width: 100%;
  background: ${C.surfaceAlt};
  border: 1px solid ${C.border};
  border-radius: ${C.radius};
  padding: 0.75rem;
  color: ${C.text};
  font-size: 0.88rem;

  &:focus {
    outline: none;
    border-color: ${C.accent};
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  min-height: 90px;
  resize: vertical;
  background: ${C.surfaceAlt};
  border: 1px solid ${C.border};
  border-radius: ${C.radius};
  padding: 0.75rem;
  color: ${C.text};
  font-size: 0.88rem;

  &:focus {
    outline: none;
    border-color: ${C.accent};
  }
`;

const Select = styled.select`
  width: 100%;
  background: ${C.surfaceAlt};
  border: 1px solid ${C.border};
  border-radius: ${C.radius};
  padding: 0.75rem;
  color: ${C.text};
  font-size: 0.88rem;
`;

const ButtonRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
`;

const Button = styled.button`
  background: ${({ $variant }) => {
    if ($variant === 'secondary') return C.surfaceAlt;
    if ($variant === 'danger') return C.danger;
    return C.accent;
  }};
  color: ${({ $variant }) => ($variant === 'secondary' ? C.text : '#03120d')};
  border: 1px solid ${({ $variant }) => {
    if ($variant === 'secondary') return C.borderLight;
    if ($variant === 'danger') return `${C.danger}88`;
    return C.accent;
  }};
  border-radius: ${C.radius};
  padding: 0.7rem 1rem;
  font-size: 0.84rem;
  font-weight: 700;
  cursor: pointer;

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
`;

const Alert = styled.div`
  border-radius: ${C.radius};
  padding: 0.8rem 0.95rem;
  font-size: 0.85rem;
  margin-bottom: 1rem;
  border: 1px solid ${({ $tone }) => ($tone === 'error' ? `${C.danger}88` : `${C.success}88`)};
  background: ${({ $tone }) => ($tone === 'error' ? C.dangerBg : C.successBg)};
  color: ${({ $tone }) => ($tone === 'error' ? C.danger : C.success)};
`;

const MiniList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
`;

const MiniRow = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  color: ${C.textMuted};
  font-size: 0.84rem;
`;

const MiniValue = styled.span`
  color: ${C.text};
  font-weight: 600;
  text-align: right;
`;

const TransactionList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const TransactionCard = styled.div`
  border: 1px solid ${C.border};
  background: ${C.surfaceAlt};
  border-radius: ${C.radius};
  padding: 0.9rem;
`;

const TransactionTop = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.45rem;
`;

const TransactionLabel = styled.div`
  color: ${C.text};
  font-size: 0.9rem;
  font-weight: 700;
`;

const TransactionStatus = styled.span`
  color: ${({ $status }) => {
    if ($status === 'success') return C.success;
    if ($status === 'reverted') return C.danger;
    if ($status === 'pending') return C.warning;
    return C.textMuted;
  }};
  font-size: 0.8rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const TransactionMeta = styled.div`
  color: ${C.textMuted};
  font-size: 0.8rem;
  line-height: 1.5;
  word-break: break-all;
`;

const EmptyState = styled.div`
  padding: 1.5rem 1rem;
  text-align: center;
  color: ${C.textMuted};
  font-size: 0.9rem;
`;

const formatEth = (value) => Number(value || 0).toFixed(4);

const TransactionDemo = ({ connectedAddress }) => {
  const [activeTab, setActiveTab] = useState('affiliate');
  const [loadingAction, setLoadingAction] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [trackedTransactions, setTrackedTransactions] = useState([]);
  const [overview, setOverview] = useState({
    affiliateStatus: null,
    affiliateBalance: null,
    commissionConfig: null,
    walletConfig: null,
    walletDetails: null,
    escrowConfig: null,
  });

  const [affiliateForm, setAffiliateForm] = useState({
    registerAddress: connectedAddress || '',
    merchantAddress: connectedAddress || '',
    merchantStatus: 'true',
    affiliate: connectedAddress || '',
    sale_amount_eth: '0.05',
    commission_rate_bps: String(blockchainService.defaultCommissionRateBps),
    transaction_id: `KMX-COMM-${Date.now()}`,
    approveAffiliate: connectedAddress || '',
    approveIndex: '0',
    autoApproveAffiliate: connectedAddress || '',
    autoApproveTransactionId: '',
    withdrawAmount: '',
  });

  const [walletForm, setWalletForm] = useState({
    depositAmount: '0.05',
    creditUser: connectedAddress || '',
    creditAmount: '0.05',
    transferRecipient: '',
    transferAmount: '0.02',
    withdrawAmount: '0.01',
    minimumWithdrawal: '0.001',
    commissionFeeRate: '300',
    commissionMinimumPayout: '0.01',
  });

  const [escrowForm, setEscrowForm] = useState({
    seller: '',
    product_id: `KMX-PROD-${Date.now()}`,
    notes: '',
    arbiter: blockchainService.zeroAddress,
    amount_eth: '0.03',
    escrowId: '1',
    disputeReason: 'Buyer requested review before settlement.',
    resolveTo: 'seller',
  });

  useEffect(() => {
    if (!connectedAddress) {
      return;
    }
    setAffiliateForm((current) => ({
      ...current,
      registerAddress: current.registerAddress || connectedAddress,
      merchantAddress: current.merchantAddress || connectedAddress,
      affiliate: current.affiliate || connectedAddress,
      approveAffiliate: current.approveAffiliate || connectedAddress,
      autoApproveAffiliate: current.autoApproveAffiliate || connectedAddress,
    }));
    setWalletForm((current) => ({
      ...current,
      creditUser: current.creditUser || connectedAddress,
    }));
  }, [connectedAddress]);

  useEffect(() => {
    if (!overview.commissionConfig && !overview.walletConfig) {
      return;
    }
    setWalletForm((current) => ({
      ...current,
      minimumWithdrawal: overview.walletConfig?.minimum_withdrawal_eth
        ? String(overview.walletConfig.minimum_withdrawal_eth)
        : current.minimumWithdrawal,
      commissionFeeRate: overview.commissionConfig?.platform_fee_rate_bps
        ? String(overview.commissionConfig.platform_fee_rate_bps)
        : current.commissionFeeRate,
      commissionMinimumPayout: overview.commissionConfig?.minimum_payout_eth
        ? String(overview.commissionConfig.minimum_payout_eth)
        : current.commissionMinimumPayout,
    }));
  }, [overview.commissionConfig, overview.walletConfig]);

  const refreshOverview = useCallback(async () => {
    if (!connectedAddress) {
      return;
    }

    try {
      const [
        affiliateStatus,
        affiliateBalance,
        commissionConfig,
        walletConfig,
        walletStatus,
        escrowConfig,
      ] = await Promise.all([
        blockchainService.getAffiliateStatus(connectedAddress),
        blockchainService.getAffiliateBalance(connectedAddress),
        blockchainService.getCommissionConfig(),
        blockchainService.getWalletConfig(),
        blockchainService.getWalletStatus(connectedAddress),
        blockchainService.getEscrowConfig(),
      ]);

      let walletDetails = null;
      if (walletStatus.exists) {
        walletDetails = await blockchainService.getWalletDetails(connectedAddress);
      }

      setOverview({
        affiliateStatus,
        affiliateBalance,
        commissionConfig,
        walletConfig,
        walletDetails,
        escrowConfig,
      });
    } catch (err) {
      console.error('Failed to refresh KimuX finance overview:', err);
    }
  }, [connectedAddress]);

  useEffect(() => {
    refreshOverview();
  }, [refreshOverview]);

  useEffect(() => {
    if (!trackedTransactions.length) {
      return undefined;
    }

    const pendingHashes = trackedTransactions
      .filter((item) => item.status === 'pending')
      .map((item) => item.tx_hash);

    if (!pendingHashes.length) {
      return undefined;
    }

    const interval = setInterval(async () => {
      const updates = await Promise.all(
        pendingHashes.map(async (txHash) => {
          try {
            return await blockchainService.getTransactionStatus(txHash);
          } catch (err) {
            return null;
          }
        })
      );

      setTrackedTransactions((current) => current.map((item) => {
        const match = updates.find((entry) => entry?.tx_hash === item.tx_hash);
        return match ? { ...item, ...match } : item;
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, [trackedTransactions]);

  const overviewCards = useMemo(() => ([
    {
      label: 'Affiliate Balance',
      value: overview.affiliateBalance ? `${formatEth(overview.affiliateBalance.balance_eth)} ETH` : '--',
    },
    {
      label: 'Affiliate Status',
      value: overview.affiliateStatus?.is_affiliate ? 'Registered' : 'Not registered',
    },
    {
      label: 'Merchant Access',
      value: overview.affiliateStatus?.is_merchant ? 'Authorized' : 'Restricted',
    },
    {
      label: 'Wallet Treasury',
      value: overview.walletDetails ? `${formatEth(overview.walletDetails.eth_balance)} ETH` : 'No wallet',
    },
    {
      label: 'Min Payout',
      value: overview.commissionConfig ? `${formatEth(overview.commissionConfig.minimum_payout_eth)} ETH` : '--',
    },
    {
      label: 'Escrow Fee',
      value: overview.escrowConfig ? `${overview.escrowConfig.escrow_fee_rate_bps} bps` : '--',
    },
  ]), [overview]);

  const pushTrackedTransaction = useCallback((label, txHash) => {
    setTrackedTransactions((current) => [
      {
        label,
        tx_hash: txHash,
        status: 'pending',
        created_at: Date.now(),
      },
      ...current,
    ].slice(0, 12));
  }, []);

  const runAction = async (actionKey, label, fn) => {
    setLoadingAction(actionKey);
    setError('');
    setSuccess('');

    try {
      const result = await fn();
      if (result?.tx_hash) {
        pushTrackedTransaction(label, result.tx_hash);
        setSuccess(`${label} submitted successfully.`);
      } else {
        setSuccess(`${label} completed successfully.`);
      }
      refreshOverview();
    } catch (err) {
      setError(err.message || `${label} failed.`);
    } finally {
      setLoadingAction('');
    }
  };

  if (!connectedAddress) {
    return (
      <Container>
        <Title>KimuX Operations Center</Title>
        <EmptyState>Connect a wallet first to manage commissions, treasury actions, and escrow flows.</EmptyState>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <Title>KimuX Operations Center</Title>
        <Subtitle>
          Connected-wallet actions are signed in MetaMask. Platform-only actions like merchant approval, commission recording,
          policy updates, and owner-level dispute controls are executed by the KimuX backend signer.
        </Subtitle>
      </Header>

      <FlowRow>
        <FlowCard>
          <FlowStep>1. Wallet Owner Flow</FlowStep>
          <FlowTitle>Use MetaMask where the contract expects the user</FlowTitle>
          <FlowBody>Create the wallet, register as an affiliate, fund it, create escrow, and withdraw balances from the connected account.</FlowBody>
        </FlowCard>
        <FlowCard>
          <FlowStep>2. Platform Controls</FlowStep>
          <FlowTitle>Run admin settlement actions centrally</FlowTitle>
          <FlowBody>Authorize merchants, record sales, credit wallets, and manage payout rules from the KimuX backend signer.</FlowBody>
        </FlowCard>
        <FlowCard>
          <FlowStep>3. Transaction Tracking</FlowStep>
          <FlowTitle>Confirm every write on the local chain</FlowTitle>
          <FlowBody>Each submitted transaction is tracked below so the demo clearly shows pending, confirmed, or reverted state.</FlowBody>
        </FlowCard>
      </FlowRow>

      <OverviewGrid>
        {overviewCards.map((card) => (
          <StatCard key={card.label}>
            <StatLabel>{card.label}</StatLabel>
            <StatValue>{card.value}</StatValue>
          </StatCard>
        ))}
      </OverviewGrid>

      {error && <Alert $tone="error">{error}</Alert>}
      {success && <Alert $tone="success">{success}</Alert>}

      <TabRow>
        <Tab $active={activeTab === 'affiliate'} onClick={() => setActiveTab('affiliate')}>Affiliate Tools</Tab>
        <Tab $active={activeTab === 'treasury'} onClick={() => setActiveTab('treasury')}>Treasury</Tab>
        <Tab $active={activeTab === 'escrow'} onClick={() => setActiveTab('escrow')}>Escrow</Tab>
        <Tab $active={activeTab === 'transactions'} onClick={() => setActiveTab('transactions')}>Transactions</Tab>
      </TabRow>

      {activeTab === 'affiliate' && (
        <PanelGrid>
          <Panel>
            <PanelTitle>Affiliate Activation</PanelTitle>
            <PanelCopy>
              Register the connected wallet directly on-chain with MetaMask, or register any address from the platform signer.
            </PanelCopy>
            <Meta><span>Connected wallet</span><span>{connectedAddress}</span></Meta>
            <MiniList>
              <MiniRow><span>Registered</span><MiniValue>{overview.affiliateStatus?.is_affiliate ? 'Yes' : 'No'}</MiniValue></MiniRow>
              <MiniRow><span>Merchant</span><MiniValue>{overview.affiliateStatus?.is_merchant ? 'Yes' : 'No'}</MiniValue></MiniRow>
              <MiniRow><span>Claimable balance</span><MiniValue>{formatEth(overview.affiliateBalance?.balance_eth)} ETH</MiniValue></MiniRow>
            </MiniList>
            <Form onSubmit={(e) => {
              e.preventDefault();
              runAction('register-affiliate', 'Register affiliate from platform', () => (
                blockchainService.registerAffiliate(affiliateForm.registerAddress)
              ));
            }}>
              <InputGroup>
                <Label>Affiliate address</Label>
                <Input
                  value={affiliateForm.registerAddress}
                  onChange={(e) => setAffiliateForm({ ...affiliateForm, registerAddress: e.target.value.trim() })}
                />
              </InputGroup>
              <ButtonRow>
                <Button
                  type="button"
                  disabled={loadingAction === 'register-self'}
                  onClick={() => runAction('register-self', 'Register connected affiliate', () => (
                    blockchainService.registerAffiliateWithMetaMask(connectedAddress)
                  ))}
                >
                  Register Connected Wallet
                </Button>
                <Button $variant="secondary" disabled={loadingAction === 'register-affiliate'}>
                  Register Address From Platform
                </Button>
              </ButtonRow>
            </Form>
          </Panel>

          <Panel>
            <PanelTitle>Merchant Controls</PanelTitle>
            <PanelCopy>
              Merchant authorization is an owner-level function and is always executed by the KimuX platform signer.
            </PanelCopy>
            <Form onSubmit={(e) => {
              e.preventDefault();
              runAction('authorize-merchant', 'Update merchant access', () => (
                blockchainService.authorizeMerchant(
                  affiliateForm.merchantAddress,
                  affiliateForm.merchantStatus === 'true'
                )
              ));
            }}>
              <InputGroup>
                <Label>Merchant address</Label>
                <Input
                  value={affiliateForm.merchantAddress}
                  onChange={(e) => setAffiliateForm({ ...affiliateForm, merchantAddress: e.target.value.trim() })}
                />
              </InputGroup>
              <InputGroup>
                <Label>Access</Label>
                <Select
                  value={affiliateForm.merchantStatus}
                  onChange={(e) => setAffiliateForm({ ...affiliateForm, merchantStatus: e.target.value })}
                >
                  <option value="true">Authorize</option>
                  <option value="false">Revoke</option>
                </Select>
              </InputGroup>
              <Button disabled={loadingAction === 'authorize-merchant'}>Apply Merchant Access</Button>
            </Form>
          </Panel>

          <Panel>
            <PanelTitle>Record Commission</PanelTitle>
            <PanelCopy>
              Sales are recorded from the platform signer. Use this after the affiliate is registered and the merchant is authorized.
            </PanelCopy>
            <Meta><span>Fee rate</span><span>{overview.commissionConfig?.platform_fee_rate_bps ?? '--'} bps</span></Meta>
            <Form onSubmit={(e) => {
              e.preventDefault();
              runAction('record-commission', 'Record commission', () => blockchainService.recordCommission(affiliateForm));
            }}>
              <InputGroup>
                <Label>Affiliate address</Label>
                <Input
                  value={affiliateForm.affiliate}
                  onChange={(e) => setAffiliateForm({ ...affiliateForm, affiliate: e.target.value.trim() })}
                />
              </InputGroup>
              <InputGroup>
                <Label>Sale amount (ETH)</Label>
                <Input
                  type="number"
                  step="0.0001"
                  value={affiliateForm.sale_amount_eth}
                  onChange={(e) => setAffiliateForm({ ...affiliateForm, sale_amount_eth: e.target.value })}
                />
              </InputGroup>
              <InputGroup>
                <Label>Commission rate (bps)</Label>
                <Input
                  type="number"
                  min="1"
                  max="10000"
                  value={affiliateForm.commission_rate_bps}
                  onChange={(e) => setAffiliateForm({ ...affiliateForm, commission_rate_bps: e.target.value })}
                />
              </InputGroup>
              <InputGroup>
                <Label>Transaction ID</Label>
                <Input
                  value={affiliateForm.transaction_id}
                  onChange={(e) => setAffiliateForm({ ...affiliateForm, transaction_id: e.target.value })}
                />
              </InputGroup>
              <Button disabled={loadingAction === 'record-commission'}>Record Commission</Button>
            </Form>
          </Panel>

          <Panel>
            <PanelTitle>Approval & Payouts</PanelTitle>
            <PanelCopy>
              Approval uses the platform signer. Withdrawal uses the connected MetaMask affiliate wallet because the contract pays `msg.sender`.
            </PanelCopy>
            <Form onSubmit={(e) => {
              e.preventDefault();
              runAction('approve-commission', 'Approve commission', () => (
                blockchainService.approveCommission(affiliateForm.approveAffiliate, affiliateForm.approveIndex)
              ));
            }}>
              <InputGroup>
                <Label>Affiliate address</Label>
                <Input
                  value={affiliateForm.approveAffiliate}
                  onChange={(e) => setAffiliateForm({ ...affiliateForm, approveAffiliate: e.target.value.trim() })}
                />
              </InputGroup>
              <InputGroup>
                <Label>Commission index</Label>
                <Input
                  type="number"
                  min="0"
                  value={affiliateForm.approveIndex}
                  onChange={(e) => setAffiliateForm({ ...affiliateForm, approveIndex: e.target.value })}
                />
              </InputGroup>
              <InputGroup>
                <Label>Auto-approve transaction ID</Label>
                <Input
                  value={affiliateForm.autoApproveTransactionId}
                  onChange={(e) => setAffiliateForm({ ...affiliateForm, autoApproveTransactionId: e.target.value })}
                />
              </InputGroup>
              <InputGroup>
                <Label>Withdraw amount (optional)</Label>
                <Input
                  type="number"
                  step="0.0001"
                  value={affiliateForm.withdrawAmount}
                  onChange={(e) => setAffiliateForm({ ...affiliateForm, withdrawAmount: e.target.value })}
                />
              </InputGroup>
              <ButtonRow>
                <Button disabled={loadingAction === 'approve-commission'}>Approve By Index</Button>
                <Button
                  type="button"
                  $variant="secondary"
                  disabled={loadingAction === 'auto-approve'}
                  onClick={() => runAction('auto-approve', 'Auto approve commission', () => (
                    blockchainService.autoApproveCommission(
                      affiliateForm.autoApproveAffiliate,
                      affiliateForm.autoApproveTransactionId
                    )
                  ))}
                >
                  Auto Approve
                </Button>
                <Button
                  type="button"
                  $variant="secondary"
                  disabled={loadingAction === 'withdraw-commission'}
                  onClick={() => runAction('withdraw-commission', 'Withdraw commission balance', () => (
                    blockchainService.withdrawCommissionWithMetaMask(
                      affiliateForm.withdrawAmount ? affiliateForm.withdrawAmount : null,
                      connectedAddress
                    )
                  ))}
                >
                  Withdraw With MetaMask
                </Button>
              </ButtonRow>
            </Form>
          </Panel>
        </PanelGrid>
      )}

      {activeTab === 'treasury' && (
        <PanelGrid>
          <Panel>
            <PanelTitle>Connected Wallet Treasury</PanelTitle>
            <PanelCopy>
              Create the connected wallet and manage its ETH balance with MetaMask so the wallet owner is the on-chain sender.
            </PanelCopy>
            <MiniList>
              <MiniRow><span>Total wallets</span><MiniValue>{overview.walletConfig?.total_wallets ?? '--'}</MiniValue></MiniRow>
              <MiniRow><span>Minimum withdrawal</span><MiniValue>{formatEth(overview.walletConfig?.minimum_withdrawal_eth)} ETH</MiniValue></MiniRow>
              <MiniRow><span>Wallet balance</span><MiniValue>{formatEth(overview.walletDetails?.eth_balance)} ETH</MiniValue></MiniRow>
            </MiniList>
            <Form onSubmit={(e) => e.preventDefault()}>
              <ButtonRow>
                <Button
                  type="button"
                  disabled={loadingAction === 'create-wallet-self'}
                  onClick={() => runAction('create-wallet-self', 'Create connected wallet', () => (
                    blockchainService.createWalletWithMetaMask(connectedAddress)
                  ))}
                >
                  Create Wallet On-Chain
                </Button>
                <Button
                  type="button"
                  $variant="secondary"
                  disabled={loadingAction === 'deposit-eth'}
                  onClick={() => runAction('deposit-eth', 'Deposit ETH', () => (
                    blockchainService.depositEthWithMetaMask(walletForm.depositAmount, connectedAddress)
                  ))}
                >
                  Deposit ETH
                </Button>
              </ButtonRow>
              <InputGroup>
                <Label>Deposit amount</Label>
                <Input
                  type="number"
                  step="0.0001"
                  value={walletForm.depositAmount}
                  onChange={(e) => setWalletForm({ ...walletForm, depositAmount: e.target.value })}
                />
              </InputGroup>
              <ButtonRow>
                <Button
                  type="button"
                  $variant="secondary"
                  disabled={loadingAction === 'withdraw-eth'}
                  onClick={() => runAction('withdraw-eth', 'Withdraw ETH', () => (
                    blockchainService.withdrawEthWithMetaMask(walletForm.withdrawAmount, connectedAddress)
                  ))}
                >
                  Withdraw ETH
                </Button>
                <Button
                  type="button"
                  $variant="secondary"
                  disabled={loadingAction === 'withdraw-all-eth'}
                  onClick={() => runAction('withdraw-all-eth', 'Withdraw all ETH', () => (
                    blockchainService.withdrawAllEthWithMetaMask(connectedAddress)
                  ))}
                >
                  Withdraw All
                </Button>
              </ButtonRow>
              <InputGroup>
                <Label>Withdraw amount</Label>
                <Input
                  type="number"
                  step="0.0001"
                  value={walletForm.withdrawAmount}
                  onChange={(e) => setWalletForm({ ...walletForm, withdrawAmount: e.target.value })}
                />
              </InputGroup>
            </Form>
          </Panel>

          <Panel>
            <PanelTitle>Credit & Transfer</PanelTitle>
            <PanelCopy>
              Platform funding uses the backend signer. Internal wallet-to-wallet transfers are signed by the connected wallet owner.
            </PanelCopy>
            <Form onSubmit={(e) => {
              e.preventDefault();
              runAction('credit-eth', 'Credit user wallet', () => (
                blockchainService.creditEth(walletForm.creditUser, walletForm.creditAmount)
              ));
            }}>
              <InputGroup>
                <Label>User wallet</Label>
                <Input
                  value={walletForm.creditUser}
                  onChange={(e) => setWalletForm({ ...walletForm, creditUser: e.target.value.trim() })}
                />
              </InputGroup>
              <InputGroup>
                <Label>Credit amount (ETH)</Label>
                <Input
                  type="number"
                  step="0.0001"
                  value={walletForm.creditAmount}
                  onChange={(e) => setWalletForm({ ...walletForm, creditAmount: e.target.value })}
                />
              </InputGroup>
              <ButtonRow>
                <Button disabled={loadingAction === 'credit-eth'}>Credit Wallet From Platform</Button>
                <Button
                  type="button"
                  $variant="secondary"
                  disabled={loadingAction === 'transfer-eth'}
                  onClick={() => runAction('transfer-eth', 'Transfer ETH', () => (
                    blockchainService.transferEthWithMetaMask(
                      walletForm.transferRecipient,
                      walletForm.transferAmount,
                      connectedAddress
                    )
                  ))}
                >
                  Transfer ETH With MetaMask
                </Button>
              </ButtonRow>
              <InputGroup>
                <Label>Transfer recipient</Label>
                <Input
                  value={walletForm.transferRecipient}
                  onChange={(e) => setWalletForm({ ...walletForm, transferRecipient: e.target.value.trim() })}
                />
              </InputGroup>
              <InputGroup>
                <Label>Transfer amount (ETH)</Label>
                <Input
                  type="number"
                  step="0.0001"
                  value={walletForm.transferAmount}
                  onChange={(e) => setWalletForm({ ...walletForm, transferAmount: e.target.value })}
                />
              </InputGroup>
            </Form>
          </Panel>

          <Panel>
            <PanelTitle>Wallet Policy</PanelTitle>
            <PanelCopy>
              These are KimuX finance management controls owned by the platform, including minimum withdrawals and commission policy.
            </PanelCopy>
            <Form onSubmit={(e) => {
              e.preventDefault();
              runAction('wallet-minimum', 'Update wallet minimum withdrawal', () => (
                blockchainService.updateWalletMinimumWithdrawal(walletForm.minimumWithdrawal)
              ));
            }}>
              <InputGroup>
                <Label>Minimum withdrawal (ETH)</Label>
                <Input
                  type="number"
                  step="0.0001"
                  value={walletForm.minimumWithdrawal}
                  onChange={(e) => setWalletForm({ ...walletForm, minimumWithdrawal: e.target.value })}
                />
              </InputGroup>
              <Button disabled={loadingAction === 'wallet-minimum'}>Update Withdrawal Policy</Button>
            </Form>

            <Form onSubmit={(e) => {
              e.preventDefault();
              runAction('commission-minimum', 'Update commission minimum payout', () => (
                blockchainService.updateMinimumPayout(walletForm.commissionMinimumPayout)
              ));
            }}>
              <InputGroup>
                <Label>Platform fee rate (bps)</Label>
                <Input
                  type="number"
                  min="0"
                  max="1000"
                  value={walletForm.commissionFeeRate}
                  onChange={(e) => setWalletForm({ ...walletForm, commissionFeeRate: e.target.value })}
                />
              </InputGroup>
              <InputGroup>
                <Label>Commission minimum payout (ETH)</Label>
                <Input
                  type="number"
                  step="0.0001"
                  value={walletForm.commissionMinimumPayout}
                  onChange={(e) => setWalletForm({ ...walletForm, commissionMinimumPayout: e.target.value })}
                />
              </InputGroup>
              <ButtonRow>
                <Button
                  type="button"
                  $variant="secondary"
                  disabled={loadingAction === 'commission-fee'}
                  onClick={() => runAction('commission-fee', 'Update platform fee rate', () => (
                    blockchainService.updateCommissionFeeRate(walletForm.commissionFeeRate)
                  ))}
                >
                  Update Fee Rate
                </Button>
                <Button disabled={loadingAction === 'commission-minimum'}>Sync Commission Minimum</Button>
              </ButtonRow>
            </Form>
          </Panel>
        </PanelGrid>
      )}

      {activeTab === 'escrow' && (
        <PanelGrid>
          <Panel>
            <PanelTitle>Create Escrow</PanelTitle>
            <PanelCopy>
              Escrow creation is MetaMask-signed, which makes the connected wallet the buyer and keeps the buyer flow accurate on-chain.
            </PanelCopy>
            <Meta><span>Auto-release timeout</span><span>{overview.escrowConfig?.auto_release_timeout_seconds ?? '--'}s</span></Meta>
            <Form onSubmit={(e) => {
              e.preventDefault();
              runAction('create-escrow', 'Create escrow', () => (
                blockchainService.createEscrowWithMetaMask(escrowForm, connectedAddress)
              ));
            }}>
              <InputGroup>
                <Label>Seller address</Label>
                <Input
                  value={escrowForm.seller}
                  onChange={(e) => setEscrowForm({ ...escrowForm, seller: e.target.value.trim() })}
                />
              </InputGroup>
              <InputGroup>
                <Label>Product ID</Label>
                <Input
                  value={escrowForm.product_id}
                  onChange={(e) => setEscrowForm({ ...escrowForm, product_id: e.target.value })}
                />
              </InputGroup>
              <InputGroup>
                <Label>Amount (ETH)</Label>
                <Input
                  type="number"
                  step="0.0001"
                  value={escrowForm.amount_eth}
                  onChange={(e) => setEscrowForm({ ...escrowForm, amount_eth: e.target.value })}
                />
              </InputGroup>
              <InputGroup>
                <Label>Arbiter</Label>
                <Input
                  value={escrowForm.arbiter}
                  onChange={(e) => setEscrowForm({ ...escrowForm, arbiter: e.target.value.trim() })}
                />
              </InputGroup>
              <InputGroup>
                <Label>Notes</Label>
                <TextArea
                  value={escrowForm.notes}
                  onChange={(e) => setEscrowForm({ ...escrowForm, notes: e.target.value })}
                />
              </InputGroup>
              <Button disabled={loadingAction === 'create-escrow'}>Create Escrow With MetaMask</Button>
            </Form>
          </Panel>

          <Panel>
            <PanelTitle>Escrow Actions</PanelTitle>
            <PanelCopy>
              Buyer actions like release and dispute use MetaMask. Owner and arbiter actions like refund, cancel, and resolve still use the backend signer.
            </PanelCopy>
            <Form onSubmit={(e) => e.preventDefault()}>
              <InputGroup>
                <Label>Escrow ID</Label>
                <Input
                  type="number"
                  min="1"
                  value={escrowForm.escrowId}
                  onChange={(e) => setEscrowForm({ ...escrowForm, escrowId: e.target.value })}
                />
              </InputGroup>
              <ButtonRow>
                <Button
                  type="button"
                  disabled={loadingAction === 'release-escrow'}
                  onClick={() => runAction('release-escrow', 'Release escrow', () => (
                    blockchainService.releaseEscrowWithMetaMask(escrowForm.escrowId, connectedAddress)
                  ))}
                >
                  Release With MetaMask
                </Button>
                <Button
                  type="button"
                  $variant="secondary"
                  disabled={loadingAction === 'auto-release-escrow'}
                  onClick={() => runAction('auto-release-escrow', 'Auto release escrow', () => (
                    blockchainService.autoReleaseEscrow(escrowForm.escrowId)
                  ))}
                >
                  Auto Release From Platform
                </Button>
                <Button
                  type="button"
                  $variant="secondary"
                  disabled={loadingAction === 'refund-escrow'}
                  onClick={() => runAction('refund-escrow', 'Refund escrow', () => (
                    blockchainService.refundEscrow(escrowForm.escrowId)
                  ))}
                >
                  Refund From Platform
                </Button>
                <Button
                  type="button"
                  $variant="danger"
                  disabled={loadingAction === 'cancel-escrow'}
                  onClick={() => runAction('cancel-escrow', 'Cancel escrow', () => (
                    blockchainService.cancelEscrow(escrowForm.escrowId)
                  ))}
                >
                  Cancel From Platform
                </Button>
              </ButtonRow>
            </Form>

            <Form onSubmit={(e) => {
              e.preventDefault();
              runAction('dispute-escrow', 'Raise escrow dispute', () => (
                blockchainService.disputeEscrowWithMetaMask(
                  escrowForm.escrowId,
                  escrowForm.disputeReason,
                  connectedAddress
                )
              ));
            }}>
              <InputGroup>
                <Label>Dispute reason</Label>
                <TextArea
                  value={escrowForm.disputeReason}
                  onChange={(e) => setEscrowForm({ ...escrowForm, disputeReason: e.target.value })}
                />
              </InputGroup>
              <InputGroup>
                <Label>Resolve dispute to</Label>
                <Select
                  value={escrowForm.resolveTo}
                  onChange={(e) => setEscrowForm({ ...escrowForm, resolveTo: e.target.value })}
                >
                  <option value="seller">Release to seller</option>
                  <option value="buyer">Refund buyer</option>
                </Select>
              </InputGroup>
              <ButtonRow>
                <Button disabled={loadingAction === 'dispute-escrow'}>Raise Dispute With MetaMask</Button>
                <Button
                  type="button"
                  $variant="secondary"
                  disabled={loadingAction === 'resolve-escrow'}
                  onClick={() => runAction('resolve-escrow', 'Resolve escrow dispute', () => (
                    blockchainService.resolveEscrow(
                      escrowForm.escrowId,
                      escrowForm.resolveTo === 'seller'
                    )
                  ))}
                >
                  Resolve From Platform
                </Button>
              </ButtonRow>
            </Form>
          </Panel>
        </PanelGrid>
      )}

      {activeTab === 'transactions' && (
        <Panel>
          <PanelTitle>Submitted Transactions</PanelTitle>
          {trackedTransactions.length ? (
            <TransactionList>
              {trackedTransactions.map((transaction) => (
                <TransactionCard key={transaction.tx_hash}>
                  <TransactionTop>
                    <TransactionLabel>{transaction.label}</TransactionLabel>
                    <TransactionStatus $status={transaction.status}>{transaction.status}</TransactionStatus>
                  </TransactionTop>
                  <TransactionMeta>{transaction.tx_hash}</TransactionMeta>
                  <TransactionMeta>
                    Block: {transaction.block_number ?? 'Pending'} | Gas: {transaction.gas_used ?? '--'} | Confirmations: {transaction.confirmations ?? 0}
                  </TransactionMeta>
                </TransactionCard>
              ))}
            </TransactionList>
          ) : (
            <EmptyState>No KimuX transactions submitted from this session yet.</EmptyState>
          )}
        </Panel>
      )}
    </Container>
  );
};

export default TransactionDemo;
