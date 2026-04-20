import React, { useState } from 'react';
import styled from 'styled-components';
import blockchainService from '../services/blockchainService';

const Container = styled.div`
  background: #121e34;
  border: 1px solid #1a2d4d;
  border-radius: 12px;
  padding: 1.5rem;
`;

const Title = styled.h3`
  color: #2d7aff;
  margin: 0 0 1rem 0;
  font-size: 1.1rem;
  font-weight: 600;
`;

const InputGroup = styled.div`
  margin-bottom: 1rem;
`;

const Label = styled.label`
  display: block;
  color: #e4eaf4;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
  font-weight: 500;
`;

const Input = styled.input`
  width: 100%;
  background: #0c1527;
  border: 1px solid #1a2d4d;
  border-radius: 8px;
  padding: 0.75rem;
  color: #e4eaf4;
  font-size: 0.9rem;
  font-family: 'Courier New', monospace;
  
  &:focus {
    outline: none;
    border-color: #2d7aff;
  }
  
  &::placeholder {
    color: #6b7fa3;
  }
`;

const Button = styled.button`
  background: ${props => props.variant === 'danger' ? '#ef4444' : '#2d7aff'};
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.75rem 1.5rem;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  width: 100%;
  transition: background 0.2s;
  
  &:hover {
    background: ${props => props.variant === 'danger' ? '#dc2626' : '#4d93ff'};
  }
  
  &:disabled {
    background: #1a2d4d;
    color: #6b7fa3;
    cursor: not-allowed;
  }
`;

const StatusBadge = styled.div`
  display: inline-block;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
  background: ${props => props.connected ? '#22c55e20' : '#6b7fa320'};
  color: ${props => props.connected ? '#22c55e' : '#6b7fa3'};
  margin-bottom: 1rem;
`;

const WalletInfo = styled.div`
  background: #0c1527;
  border: 1px solid #1a2d4d;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
`;

const InfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const InfoLabel = styled.span`
  color: #6b7fa3;
  font-size: 0.85rem;
`;

const InfoValue = styled.span`
  color: #e4eaf4;
  font-size: 0.85rem;
  font-weight: 500;
  font-family: ${props => props.mono ? "'Courier New', monospace" : 'inherit'};
`;

const ErrorMessage = styled.div`
  background: #ef444420;
  border: 1px solid #ef4444;
  border-radius: 8px;
  padding: 0.75rem;
  color: #ef4444;
  font-size: 0.85rem;
  margin-bottom: 1rem;
`;

const SuccessMessage = styled.div`
  background: #22c55e20;
  border: 1px solid #22c55e;
  border-radius: 8px;
  padding: 0.75rem;
  color: #22c55e;
  font-size: 0.85rem;
  margin-bottom: 1rem;
`;

const WalletConnector = ({ onWalletConnected }) => {
  const [address, setAddress] = useState('');
  const [connected, setConnected] = useState(false);
  const [walletData, setWalletData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleConnect = async () => {
    setError('');
    setSuccess('');
    
    if (!blockchainService.validateAddress(address)) {
      setError('Invalid Ethereum address format. Must start with 0x and be 42 characters long.');
      return;
    }

    setLoading(true);
    
    try {
      // Check if wallet exists
      const status = await blockchainService.getWalletStatus(address);
      
      if (!status.exists) {
        // Create wallet if it doesn't exist
        const createResult = await blockchainService.createWalletFor(address);
        setSuccess(`Wallet created successfully! Transaction: ${createResult.tx_hash}`);
      }
      
      // Get wallet details
      const details = await blockchainService.getWalletDetails(address);
      
      setWalletData(details);
      setConnected(true);
      
      if (onWalletConnected) {
        onWalletConnected(address, details);
      }
      
    } catch (err) {
      setError(err.message || 'Failed to connect wallet');
      console.error('Wallet connection error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = () => {
    setAddress('');
    setConnected(false);
    setWalletData(null);
    setError('');
    setSuccess('');
    
    if (onWalletConnected) {
      onWalletConnected(null, null);
    }
  };

  return (
    <Container>
      <Title>Wallet Connection</Title>
      
      <StatusBadge connected={connected}>
        {connected ? '● Connected' : '○ Disconnected'}
      </StatusBadge>
      
      {error && <ErrorMessage>{error}</ErrorMessage>}
      {success && <SuccessMessage>{success}</SuccessMessage>}
      
      {!connected ? (
        <>
          <InputGroup>
            <Label>Ethereum Address</Label>
            <Input
              type="text"
              placeholder="0x..."
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              disabled={loading}
            />
          </InputGroup>
          
          <Button onClick={handleConnect} disabled={loading || !address}>
            {loading ? 'Connecting...' : 'Connect Wallet'}
          </Button>
        </>
      ) : (
        <>
          <WalletInfo>
            <InfoRow>
              <InfoLabel>Address:</InfoLabel>
              <InfoValue mono>{address.slice(0, 10)}...{address.slice(-8)}</InfoValue>
            </InfoRow>
            <InfoRow>
              <InfoLabel>Status:</InfoLabel>
              <InfoValue>{walletData?.is_active ? 'Active' : 'Inactive'}</InfoValue>
            </InfoRow>
            <InfoRow>
              <InfoLabel>ETH Balance:</InfoLabel>
              <InfoValue>{walletData?.eth_balance?.toFixed(4) || '0.0000'} ETH</InfoValue>
            </InfoRow>
            <InfoRow>
              <InfoLabel>Created:</InfoLabel>
              <InfoValue>
                {walletData?.created_at ? new Date(walletData.created_at * 1000).toLocaleDateString() : 'N/A'}
              </InfoValue>
            </InfoRow>
          </WalletInfo>
          
          <Button variant="danger" onClick={handleDisconnect}>
            Disconnect Wallet
          </Button>
        </>
      )}
    </Container>
  );
};

export default WalletConnector;
