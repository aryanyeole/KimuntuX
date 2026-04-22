import React, { useEffect, useState } from 'react';
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
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1rem;
`;

const HeaderText = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
`;

const Title = styled.h3`
  color: ${C.accent};
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
`;

const Subtitle = styled.p`
  color: ${C.textMuted};
  margin: 0;
  font-size: 0.88rem;
  line-height: 1.5;
`;

const StatusBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.45rem 0.9rem;
  border-radius: 999px;
  font-size: 0.84rem;
  font-weight: 700;
  background: ${({ $connected }) => ($connected ? C.successBg : C.card)};
  color: ${({ $connected }) => ($connected ? C.success : C.textMuted)};
  border: 1px solid ${({ $connected }) => ($connected ? `${C.success}44` : C.border)};
`;

const WalletGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
`;

const InputGroup = styled.div`
  margin-bottom: 1rem;
`;

const Label = styled.label`
  display: block;
  color: ${C.text};
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
  font-weight: 600;
`;

const Input = styled.input`
  width: 100%;
  background: ${C.card};
  border: 1px solid ${C.border};
  border-radius: ${C.radius};
  padding: 0.85rem;
  color: ${C.text};
  font-size: 0.9rem;
  font-family: 'Courier New', monospace;

  &:focus {
    outline: none;
    border-color: ${C.accent};
  }

  &::placeholder {
    color: ${C.textDim};
  }
`;

const ButtonRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
`;

const Button = styled.button`
  background: ${({ $variant }) => {
    if ($variant === 'secondary') return C.card;
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
  padding: 0.8rem 1.2rem;
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.15s ease, opacity 0.15s ease, border-color 0.15s ease;

  &:hover {
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
    transform: none;
  }
`;

const HelperText = styled.p`
  margin: 0.75rem 0 0;
  color: ${C.textMuted};
  font-size: 0.82rem;
  line-height: 1.5;
`;

const WalletInfo = styled.div`
  background: ${C.card};
  border: 1px solid ${C.border};
  border-radius: ${C.radius};
  padding: 1rem;
  margin-bottom: 1rem;
`;

const InfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.6rem;

  &:last-child {
    margin-bottom: 0;
  }
`;

const InfoLabel = styled.span`
  color: ${C.textMuted};
  font-size: 0.85rem;
`;

const InfoValue = styled.span`
  color: ${C.text};
  font-size: 0.85rem;
  font-weight: 600;
  font-family: ${({ $mono }) => ($mono ? "'Courier New', monospace" : 'inherit')};
  text-align: right;
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

const OnboardingGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 0.85rem;
  margin: 1rem 0;
`;

const OnboardingCard = styled.div`
  background: ${C.card};
  border: 1px solid ${C.border};
  border-radius: ${C.radius};
  padding: 0.95rem;
`;

const StepLabel = styled.div`
  color: ${C.accent};
  font-size: 0.76rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin-bottom: 0.35rem;
`;

const StepTitle = styled.div`
  color: ${C.text};
  font-size: 0.9rem;
  font-weight: 700;
  margin-bottom: 0.28rem;
`;

const StepBody = styled.div`
  color: ${C.textMuted};
  font-size: 0.82rem;
  line-height: 1.5;
`;

const WalletConnector = ({ onWalletConnected }) => {
  const [address, setAddress] = useState('');
  const [connected, setConnected] = useState(false);
  const [walletData, setWalletData] = useState(null);
  const [externalBalance, setExternalBalance] = useState(null);
  const [walletExists, setWalletExists] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [metaMaskAvailable, setMetaMaskAvailable] = useState(false);
  const [metaMaskAddress, setMetaMaskAddress] = useState(null);

  useEffect(() => {
    let active = true;

    const bootstrapMetaMask = async () => {
      const available = blockchainService.hasMetaMask();
      if (!active) {
        return;
      }

      setMetaMaskAvailable(available);
      if (!available) {
        return;
      }

      try {
        const activeAccount = await blockchainService.getConnectedMetaMaskAddress();
        if (!active) {
          return;
        }
        setMetaMaskAddress(activeAccount);
        if (!connected && activeAccount) {
          setAddress(activeAccount);
        }
      } catch (err) {
        console.error('MetaMask bootstrap error:', err);
      }
    };

    bootstrapMetaMask();
    const unsubscribe = blockchainService.watchMetaMaskAccount((nextAddress) => {
      setMetaMaskAddress(nextAddress);
      setAddress(nextAddress || '');

      if (connected) {
        setConnected(false);
        setWalletData(null);
        setExternalBalance(null);
        setWalletExists(false);
        setSuccess('');
        setError(nextAddress
          ? 'MetaMask account changed. Review the new wallet and reconnect.'
          : 'MetaMask disconnected. Reconnect to continue.');

        if (onWalletConnected) {
          onWalletConnected(null, null, null);
        }
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [connected, onWalletConnected]);

  const hydrateWallet = async (walletAddress, nativeBalance = externalBalance) => {
    const status = await blockchainService.getWalletStatus(walletAddress);
    setWalletExists(status.exists);

    if (!status.exists) {
      setWalletData(null);

      if (onWalletConnected) {
        onWalletConnected(walletAddress, null, {
          externalBalance: nativeBalance,
          walletExists: false,
        });
      }
      return null;
    }

    const details = await blockchainService.getWalletDetails(walletAddress);
    setWalletData(details);

    if (onWalletConnected) {
      onWalletConnected(walletAddress, details, {
        externalBalance: nativeBalance,
        walletExists: true,
      });
    }

    return details;
  };

  const handleConnect = async (incomingAddress = address) => {
    setError('');
    setSuccess('');

    if (!blockchainService.validateAddress(incomingAddress)) {
      setError('Invalid Ethereum address format. Use a 42-character 0x wallet address.');
      return;
    }

    setLoading(true);

    try {
      const nativeBalance = await blockchainService.getMetaMaskNativeBalance(incomingAddress);
      setExternalBalance(nativeBalance);
      setConnected(true);
      await hydrateWallet(incomingAddress, nativeBalance);
      setAddress(incomingAddress);
    } catch (err) {
      setError(err.message || 'Failed to connect wallet.');
      console.error('Wallet connection error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMetaMaskConnect = async () => {
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const nextAddress = await blockchainService.connectMetaMask();
      const nativeBalance = await blockchainService.getMetaMaskNativeBalance(nextAddress);
      setMetaMaskAddress(nextAddress);
      setAddress(nextAddress);
      setExternalBalance(nativeBalance);
      setConnected(true);
      await hydrateWallet(nextAddress, nativeBalance);
      setSuccess('Wallet connected. No on-chain transaction was required to inspect the account.');
    } catch (err) {
      const fallbackMessage = blockchainService.hasMetaMask()
        ? 'MetaMask did not complete the connection request. Unlock the extension, approve the account request, and confirm the network switch.'
        : 'MetaMask was not detected in this browser. Open the CRM in the browser where the MetaMask extension is installed and unlocked, then retry.';
      setError(err.message || fallbackMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = () => {
    setConnected(false);
    setWalletData(null);
    setExternalBalance(null);
    setWalletExists(false);
    setError('');
    setSuccess('');
    setAddress(metaMaskAddress || '');

    if (onWalletConnected) {
      onWalletConnected(null, null, null);
    }
  };

  const handleCreateWallet = async () => {
    setError('');
    setSuccess('');

    if (!metaMaskAddress) {
      setError('Connect MetaMask first so the wallet can be created by the active account.');
      return;
    }

    setLoading(true);

    try {
      const createResult = await blockchainService.createWalletWithMetaMask(metaMaskAddress);
      const nativeBalance = await blockchainService.getMetaMaskNativeBalance(metaMaskAddress);
      setExternalBalance(nativeBalance);
      await hydrateWallet(metaMaskAddress, nativeBalance);
      setSuccess(`KimuX wallet created successfully. Transaction: ${createResult.tx_hash}`);
    } catch (err) {
      setError(err.message || 'Failed to create the KimuX wallet.');
      console.error('Wallet creation error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <Header>
        <HeaderText>
          <Title>Wallet Connection</Title>
          <Subtitle>
            Connect with MetaMask for the smoothest flow, or paste any valid wallet address to sync it with the platform.
          </Subtitle>
        </HeaderText>
        <StatusBadge $connected={connected}>
          {connected ? 'Connected' : 'Disconnected'}
        </StatusBadge>
      </Header>

      {error && <Alert $tone="error">{error}</Alert>}
      {success && <Alert $tone="success">{success}</Alert>}

      {!connected ? (
        <>
          <WalletGrid>
            <WalletInfo>
              <InfoRow>
                <InfoLabel>MetaMask</InfoLabel>
                <InfoValue>{metaMaskAvailable ? 'Detected' : 'Not installed'}</InfoValue>
              </InfoRow>
              <InfoRow>
                <InfoLabel>Active Account</InfoLabel>
                <InfoValue $mono>{metaMaskAddress || 'None connected'}</InfoValue>
              </InfoRow>
              <InfoRow>
                <InfoLabel>Expected Network</InfoLabel>
                <InfoValue>{blockchainService.networkLabel}</InfoValue>
              </InfoRow>
            </WalletInfo>

            <WalletInfo>
              <InfoRow>
                <InfoLabel>On connect</InfoLabel>
                <InfoValue>Reads account and balance</InfoValue>
              </InfoRow>
              <InfoRow>
                <InfoLabel>Wallet creation</InfoLabel>
                <InfoValue>Only when you request it</InfoValue>
              </InfoRow>
              <InfoRow>
                <InfoLabel>Then</InfoLabel>
                <InfoValue>Enables internal transactions</InfoValue>
              </InfoRow>
            </WalletInfo>
          </WalletGrid>

          <OnboardingGrid>
            <OnboardingCard>
              <StepLabel>Step 1</StepLabel>
              <StepTitle>Detect MetaMask</StepTitle>
              <StepBody>
                {metaMaskAvailable
                  ? 'MetaMask is available here and ready to request an account.'
                  : 'If the connect button does not open MetaMask, use the browser where the MetaMask extension is installed and unlocked.'}
              </StepBody>
            </OnboardingCard>
            <OnboardingCard>
              <StepLabel>Step 2</StepLabel>
              <StepTitle>Approve account and chain</StepTitle>
              <StepBody>
                The wallet flow asks MetaMask for the active account and switches to the KimuX local chain automatically.
              </StepBody>
            </OnboardingCard>
            <OnboardingCard>
              <StepLabel>Step 3</StepLabel>
              <StepTitle>Choose whether to create a KimuX wallet</StepTitle>
              <StepBody>
                Connecting MetaMask no longer creates anything on-chain. If you want internal transfers and wallet-managed actions, create the KimuX wallet explicitly after connecting.
              </StepBody>
            </OnboardingCard>
          </OnboardingGrid>

          <ButtonRow>
            <Button onClick={handleMetaMaskConnect} disabled={loading}>
              {loading ? 'Connecting…' : 'Connect with MetaMask'}
            </Button>
            <Button
              $variant="secondary"
              onClick={() => handleConnect()}
              disabled={loading || !address}
            >
              {loading ? 'Syncing…' : 'Use Entered Address'}
            </Button>
          </ButtonRow>

          <InputGroup>
            <Label>Ethereum Address</Label>
            <Input
              type="text"
              placeholder="0x..."
              value={address}
              onChange={(e) => setAddress(e.target.value.trim())}
              disabled={loading}
            />
          </InputGroup>

          <HelperText>
            MetaMask connect now only requests the active account, switches to the KimuX local chain, and reads the live wallet balance.
            Internal KimuX wallet creation is a separate action so the user is not asked to sign a fee-bearing transaction just to connect.
          </HelperText>
        </>
      ) : (
        <>
          <WalletInfo>
            <InfoRow>
              <InfoLabel>Address</InfoLabel>
              <InfoValue $mono>{address.slice(0, 10)}...{address.slice(-8)}</InfoValue>
            </InfoRow>
            <InfoRow>
              <InfoLabel>Status</InfoLabel>
              <InfoValue>{walletExists ? (walletData?.is_active ? 'Active' : 'Inactive') : 'External wallet only'}</InfoValue>
            </InfoRow>
            <InfoRow>
              <InfoLabel>MetaMask Balance</InfoLabel>
              <InfoValue>{externalBalance !== null ? `${externalBalance.toFixed(4)} ETH` : 'N/A'}</InfoValue>
            </InfoRow>
            <InfoRow>
              <InfoLabel>KimuX Wallet Balance</InfoLabel>
              <InfoValue>{walletData?.eth_balance?.toFixed(4) || '0.0000'} ETH</InfoValue>
            </InfoRow>
            <InfoRow>
              <InfoLabel>Created</InfoLabel>
              <InfoValue>
                {walletData?.created_at ? new Date(walletData.created_at * 1000).toLocaleDateString() : (walletExists ? 'N/A' : 'Create wallet to activate')}
              </InfoValue>
            </InfoRow>
          </WalletInfo>

          {!walletExists && (
            <Alert $tone="success">
              MetaMask is connected and the external balance is available. Create a KimuX wallet only if you want to use internal wallet-managed transfers and settlement actions on the site.
            </Alert>
          )}

          <ButtonRow>
            {metaMaskAvailable && (
              <Button $variant="secondary" onClick={handleMetaMaskConnect} disabled={loading}>
                Refresh MetaMask
              </Button>
            )}
            {!walletExists && metaMaskAvailable && (
              <Button onClick={handleCreateWallet} disabled={loading}>
                {loading ? 'Creating...' : 'Create KimuX Wallet'}
              </Button>
            )}
            <Button $variant="danger" onClick={handleDisconnect} disabled={loading}>
              Disconnect Wallet
            </Button>
          </ButtonRow>
        </>
      )}
    </Container>
  );
};

export default WalletConnector;
