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

const WalletConnector = ({ onWalletConnected }) => {
  const [address, setAddress] = useState('');
  const [connected, setConnected] = useState(false);
  const [walletData, setWalletData] = useState(null);
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
        setSuccess('');
        setError(nextAddress
          ? 'MetaMask account changed. Review the new wallet and reconnect.'
          : 'MetaMask disconnected. Reconnect to continue.');

        if (onWalletConnected) {
          onWalletConnected(null, null);
        }
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [connected, onWalletConnected]);

  const hydrateWallet = async (walletAddress) => {
    const status = await blockchainService.getWalletStatus(walletAddress);

    if (!status.exists) {
      throw new Error('No KimuX wallet exists for this address yet.');
    }

    const details = await blockchainService.getWalletDetails(walletAddress);
    setWalletData(details);
    setConnected(true);

    if (onWalletConnected) {
      onWalletConnected(walletAddress, details);
    }
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
      await hydrateWallet(incomingAddress);
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
      setMetaMaskAddress(nextAddress);
      setAddress(nextAddress);

      const status = await blockchainService.getWalletStatus(nextAddress);
      if (!status.exists) {
        const createResult = await blockchainService.createWalletWithMetaMask(nextAddress);
        setSuccess(`Wallet created with MetaMask. Transaction: ${createResult.tx_hash}`);
      }

      await hydrateWallet(nextAddress);
    } catch (err) {
      setError(err.message || 'Failed to connect MetaMask.');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = () => {
    setConnected(false);
    setWalletData(null);
    setError('');
    setSuccess('');
    setAddress(metaMaskAddress || '');

    if (onWalletConnected) {
      onWalletConnected(null, null);
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
                <InfoValue>Checks wallet registry</InfoValue>
              </InfoRow>
              <InfoRow>
                <InfoLabel>If missing via MetaMask</InfoLabel>
                <InfoValue>Creates wallet on-chain as you</InfoValue>
              </InfoRow>
              <InfoRow>
                <InfoLabel>Then</InfoLabel>
                <InfoValue>Loads balances and status</InfoValue>
              </InfoRow>
            </WalletInfo>
          </WalletGrid>

          <ButtonRow>
            <Button onClick={handleMetaMaskConnect} disabled={loading || !metaMaskAvailable}>
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
            MetaMask connect will request the active account, switch to the local Hardhat network automatically,
            and create the wallet from your connected account if one does not exist yet.
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
              <InfoValue>{walletData?.is_active ? 'Active' : 'Inactive'}</InfoValue>
            </InfoRow>
            <InfoRow>
              <InfoLabel>ETH Balance</InfoLabel>
              <InfoValue>{walletData?.eth_balance?.toFixed(4) || '0.0000'} ETH</InfoValue>
            </InfoRow>
            <InfoRow>
              <InfoLabel>Created</InfoLabel>
              <InfoValue>
                {walletData?.created_at ? new Date(walletData.created_at * 1000).toLocaleDateString() : 'N/A'}
              </InfoValue>
            </InfoRow>
          </WalletInfo>

          <ButtonRow>
            {metaMaskAvailable && (
              <Button $variant="secondary" onClick={handleMetaMaskConnect} disabled={loading}>
                Refresh from MetaMask
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
