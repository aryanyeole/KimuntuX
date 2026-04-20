import React, { useEffect, useState } from 'react';
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

const TabContainer = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid #1a2d4d;
`;

const Tab = styled.button`
  background: none;
  border: none;
  color: ${props => props.active ? '#2d7aff' : '#6b7fa3'};
  padding: 0.75rem 1rem;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  border-bottom: 2px solid ${props => props.active ? '#2d7aff' : 'transparent'};
  transition: all 0.2s;
  
  &:hover {
    color: #2d7aff;
  }
`;

const Form = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const InputGroup = styled.div``;

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
  
  &:focus {
    outline: none;
    border-color: #2d7aff;
  }
  
  &::placeholder {
    color: #6b7fa3;
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  background: #0c1527;
  border: 1px solid #1a2d4d;
  border-radius: 8px;
  padding: 0.75rem;
  color: #e4eaf4;
  font-size: 0.9rem;
  min-height: 80px;
  resize: vertical;
  font-family: inherit;
  
  &:focus {
    outline: none;
    border-color: #2d7aff;
  }
  
  &::placeholder {
    color: #6b7fa3;
  }
`;

const Button = styled.button`
  background: #2d7aff;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.75rem 1.5rem;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
  
  &:hover {
    background: #4d93ff;
  }
  
  &:disabled {
    background: #1a2d4d;
    color: #6b7fa3;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.div`
  background: #ef444420;
  border: 1px solid #ef4444;
  border-radius: 8px;
  padding: 0.75rem;
  color: #ef4444;
  font-size: 0.85rem;
`;

const SuccessMessage = styled.div`
  background: #22c55e20;
  border: 1px solid #22c55e;
  border-radius: 8px;
  padding: 0.75rem;
  color: #22c55e;
  font-size: 0.85rem;
`;

const ResultBox = styled.div`
  background: #0c1527;
  border: 1px solid #1a2d4d;
  border-radius: 8px;
  padding: 1rem;
  margin-top: 1rem;
`;

const ResultLabel = styled.div`
  color: #6b7fa3;
  font-size: 0.85rem;
  margin-bottom: 0.5rem;
`;

const ResultValue = styled.div`
  color: #e4eaf4;
  font-size: 0.9rem;
  font-family: 'Courier New', monospace;
  word-break: break-all;
`;

const TransactionDemo = ({ connectedAddress }) => {
  const [activeTab, setActiveTab] = useState('commission');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [result, setResult] = useState(null);

  // Commission form state
  const [commissionData, setCommissionData] = useState({
    affiliate: connectedAddress || '',
    sale_amount_eth: '0.01',
    commission_rate_bps: String(blockchainService.defaultCommissionRateBps),
    transaction_id: `COMM-${Date.now()}`
  });

  // Escrow form state
  const [escrowData, setEscrowData] = useState({
    seller: '',
    product_id: `PROD-${Date.now()}`,
    notes: '',
    arbiter: blockchainService.zeroAddress,
    amount_eth: '0.01'
  });

  useEffect(() => {
    if (connectedAddress) {
      setCommissionData((current) => ({
        ...current,
        affiliate: current.affiliate || connectedAddress,
      }));
    }
  }, [connectedAddress]);

  const handleCommissionSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setResult(null);
    setLoading(true);

    try {
      const response = await blockchainService.recordCommission(commissionData);
      setSuccess(`Commission recorded successfully!`);
      setResult(response);
    } catch (err) {
      setError(err.message || 'Failed to record commission');
      console.error('Commission error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEscrowSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setResult(null);
    setLoading(true);

    try {
      const response = await blockchainService.createEscrow(escrowData);
      setSuccess(`Escrow created successfully!`);
      setResult(response);
    } catch (err) {
      setError(err.message || 'Failed to create escrow');
      console.error('Escrow error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <Title>Transaction Operations</Title>

      <TabContainer>
        <Tab active={activeTab === 'commission'} onClick={() => setActiveTab('commission')}>
          Record Commission
        </Tab>
        <Tab active={activeTab === 'escrow'} onClick={() => setActiveTab('escrow')}>
          Create Escrow
        </Tab>
      </TabContainer>

      {error && <ErrorMessage>{error}</ErrorMessage>}
      {success && <SuccessMessage>{success}</SuccessMessage>}

      {activeTab === 'commission' && (
        <Form as="form" onSubmit={handleCommissionSubmit}>
          <InputGroup>
            <Label>Affiliate Address</Label>
            <Input
              type="text"
              placeholder="0x..."
              value={commissionData.affiliate}
              onChange={(e) => setCommissionData({ ...commissionData, affiliate: e.target.value })}
              required
            />
          </InputGroup>

          <InputGroup>
            <Label>Amount (ETH)</Label>
            <Input
              type="number"
              step="0.001"
              placeholder="0.01"
              value={commissionData.sale_amount_eth}
              onChange={(e) => setCommissionData({ ...commissionData, sale_amount_eth: e.target.value })}
              required
            />
          </InputGroup>

          <InputGroup>
            <Label>Commission Rate (bps)</Label>
            <Input
              type="number"
              min="1"
              max="10000"
              placeholder="10000"
              value={commissionData.commission_rate_bps}
              onChange={(e) => setCommissionData({ ...commissionData, commission_rate_bps: e.target.value })}
              required
            />
          </InputGroup>

          <InputGroup>
            <Label>Transaction ID</Label>
            <Input
              type="text"
              placeholder="COMM-..."
              value={commissionData.transaction_id}
              onChange={(e) => setCommissionData({ ...commissionData, transaction_id: e.target.value })}
              required
            />
          </InputGroup>

          <Button type="submit" disabled={loading || !connectedAddress}>
            {loading ? 'Processing...' : 'Record Commission'}
          </Button>
        </Form>
      )}

      {activeTab === 'escrow' && (
        <Form as="form" onSubmit={handleEscrowSubmit}>
          <InputGroup>
            <Label>Seller Address</Label>
            <Input
              type="text"
              placeholder="0x..."
              value={escrowData.seller}
              onChange={(e) => setEscrowData({ ...escrowData, seller: e.target.value })}
              required
            />
          </InputGroup>

          <InputGroup>
            <Label>Product ID</Label>
            <Input
              type="text"
              placeholder="PROD-..."
              value={escrowData.product_id}
              onChange={(e) => setEscrowData({ ...escrowData, product_id: e.target.value })}
              required
            />
          </InputGroup>

          <InputGroup>
            <Label>Amount (ETH)</Label>
            <Input
              type="number"
              step="0.001"
              placeholder="0.01"
              value={escrowData.amount_eth}
              onChange={(e) => setEscrowData({ ...escrowData, amount_eth: e.target.value })}
              required
            />
          </InputGroup>

          <InputGroup>
            <Label>Notes (Optional)</Label>
            <TextArea
              placeholder="Additional notes about this escrow..."
              value={escrowData.notes}
              onChange={(e) => setEscrowData({ ...escrowData, notes: e.target.value })}
            />
          </InputGroup>

          <InputGroup>
            <Label>Arbiter Address (Optional)</Label>
            <Input
              type="text"
              placeholder="0x... (leave default for no arbiter)"
              value={escrowData.arbiter}
              onChange={(e) => setEscrowData({ ...escrowData, arbiter: e.target.value })}
            />
          </InputGroup>

          <Button type="submit" disabled={loading || !connectedAddress}>
            {loading ? 'Processing...' : 'Create Escrow'}
          </Button>
        </Form>
      )}

      {result && (
        <ResultBox>
          <ResultLabel>Transaction Hash:</ResultLabel>
          <ResultValue>{result.tx_hash || 'N/A'}</ResultValue>
          
          {result.escrow_id && (
            <>
              <ResultLabel style={{ marginTop: '0.75rem' }}>Escrow ID:</ResultLabel>
              <ResultValue>{result.escrow_id}</ResultValue>
            </>
          )}
          
          {result.block_number && (
            <>
              <ResultLabel style={{ marginTop: '0.75rem' }}>Block Number:</ResultLabel>
              <ResultValue>{result.block_number}</ResultValue>
            </>
          )}
        </ResultBox>
      )}

      {!connectedAddress && (
        <ErrorMessage style={{ marginTop: '1rem' }}>
          Please connect a wallet first to execute transactions.
        </ErrorMessage>
      )}
    </Container>
  );
};

export default TransactionDemo;
