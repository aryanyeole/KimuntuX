/**
 * WalletPanel.js
 * Full wallet interaction panel: connect MetaMask, create on-chain wallet,
 * deposit/withdraw ETH, and view balance.
 * Styled to match the CRM dark theme.
 */

import React, { useState, useEffect, useCallback } from 'react';
import styled, { keyframes } from 'styled-components';
import { ethers } from 'ethers';
import useWallet from '../hooks/useWallet';

// ── Palette ───────────────────────────────────────────────────────────────────
const C = {
  bg:      '#060d1b',
  surface: '#0c1527',
  card:    '#121e34',
  border:  '#1a2d4d',
  text:    '#e4eaf4',
  muted:   '#6b7fa3',
  accent:  '#2d7aff',
  success: '#00c48c',
  warning: '#ffb020',
  danger:  '#ff4757',
};

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const spin = keyframes`
  to { transform: rotate(360deg); }
`;

const Panel = styled.div`
  background: ${C.card};
  border: 1px solid ${C.border};
  border-radius: 12px;
  padding: 20px;
  animation: ${fadeIn} 0.25s ease;
`;

const Title = styled.h3`
  color: ${C.text};
  font-size: 14px;
  font-weight: 700;
  margin: 0 0 16px 0;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ConnectBtn = styled.button`
  width: 100%;
  background: ${C.accent};
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 12px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
  &:hover { background: #4d93ff; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

const WarnBtn = styled(ConnectBtn)`
  background: ${C.warning};
  &:hover { background: #ffc040; }
`;

const DangerBtn = styled(ConnectBtn)`
  background: transparent;
  border: 1px solid ${C.border};
  color: ${C.muted};
  font-size: 11px;
  padding: 6px;
  margin-top: 8px;
  &:hover { border-color: ${C.danger}; color: ${C.danger}; }
`;

const AddressChip = styled.div`
  background: ${C.surface};
  border: 1px solid ${C.border};
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 11px;
  color: ${C.muted};
  font-family: monospace;
  margin-bottom: 12px;
  word-break: break-all;
`;

const BalanceRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: ${C.surface};
  border: 1px solid ${C.border};
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 12px;
`;

const BalanceLabel = styled.div`
  font-size: 11px;
  color: ${C.muted};
  text-transform: uppercase;
  letter-spacing: 0.06em;
`;

const BalanceValue = styled.div`
  font-size: 20px;
  font-weight: 800;
  color: ${C.success};
`;

const InputRow = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
`;

const Input = styled.input`
  flex: 1;
  background: ${C.surface};
  border: 1px solid ${C.border};
  border-radius: 8px;
  padding: 8px 12px;
  color: ${C.text};
  font-size: 13px;
  outline: none;
  &:focus { border-color: ${C.accent}; }
  &::placeholder { color: ${C.muted}; }
`;

const ActionBtn = styled.button`
  background: ${({ $variant }) =>
    $variant === 'danger' ? C.danger :
    $variant === 'success' ? C.success :
    C.accent};
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 8px 16px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: opacity 0.2s;
  &:hover { opacity: 0.85; }
  &:disabled { opacity: 0.4; cursor: not-allowed; }
`;

const StatusMsg = styled.div`
  font-size: 11px;
  padding: 8px 10px;
  border-radius: 6px;
  margin-top: 8px;
  background: ${({ $type }) =>
    $type === 'error'   ? C.danger  + '22' :
    $type === 'success' ? C.success + '22' :
                          C.accent  + '22'};
  color: ${({ $type }) =>
    $type === 'error'   ? C.danger  :
    $type === 'success' ? C.success :
                          C.accent};
  word-break: break-all;
`;

const Spinner = styled.div`
  width: 14px;
  height: 14px;
  border: 2px solid ${C.border};
  border-top-color: ${C.accent};
  border-radius: 50%;
  animation: ${spin} 0.7s linear infinite;
  display: inline-block;
`;

const Divider = styled.div`
  height: 1px;
  background: ${C.border};
  margin: 14px 0;
`;

const TxLink = styled.a`
  color: ${C.accent};
  font-size: 11px;
  text-decoration: none;
  &:hover { text-decoration: underline; }
`;

// ── Helpers ───────────────────────────────────────────────────────────────────
function shortAddr(addr) {
  return addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : '';
}

function fmtEth(wei) {
  try { return parseFloat(ethers.formatEther(wei)).toFixed(6); }
  catch { return '0.000000'; }
}

export default function WalletPanel() {
  const {
    account, chainId, walletContract, connecting, error: walletError,
    isConnected, isWrongNetwork, contractsReady,
    connect, disconnect, switchToSepolia,
  } = useWallet();

  const [hasOnChainWallet, setHasOnChainWallet] = useState(null);
  const [ethBalance, setEthBalance]             = useState('0');
  const [depositAmt, setDepositAmt]             = useState('');
  const [withdrawAmt, setWithdrawAmt]           = useState('');
  const [transferTo, setTransferTo]             = useState('');
  const [transferAmt, setTransferAmt]           = useState('');
  const [loading, setLoading]                   = useState('');
  const [status, setStatus]                     = useState(null); // { type, msg }

  const noContracts = isConnected && !contractsReady;

  // ── Fetch on-chain wallet state ───────────────────────────────────────────
  const refresh = useCallback(async () => {
    if (!walletContract || !account) return;
    try {
      const exists = await walletContract.hasWallet(account);
      setHasOnChainWallet(exists);
      if (exists) {
        const bal = await walletContract.getETHBalance(account);
        setEthBalance(fmtEth(bal));
      }
    } catch (e) {
      console.warn('refresh error:', e.message);
    }
  }, [walletContract, account]);

  useEffect(() => { refresh(); }, [refresh]);

  // ── Tx helper ─────────────────────────────────────────────────────────────
  async function runTx(label, fn) {
    setLoading(label);
    setStatus(null);
    try {
      const tx = await fn();
      setStatus({ type: 'info', msg: `Tx submitted: ${tx.hash}` });
      await tx.wait();
      setStatus({ type: 'success', msg: `✓ ${label} confirmed!` });
      await refresh();
    } catch (e) {
      setStatus({ type: 'error', msg: e.reason || e.message });
    } finally {
      setLoading('');
    }
  }

  // ── Actions ───────────────────────────────────────────────────────────────
  const createWallet = () => runTx('Create Wallet', () => walletContract.createWallet());

  const deposit = () => {
    if (!depositAmt || isNaN(depositAmt)) return;
    runTx('Deposit ETH', () =>
      walletContract.depositETH({ value: ethers.parseEther(depositAmt) })
    );
  };

  const withdraw = () => {
    if (!withdrawAmt || isNaN(withdrawAmt)) return;
    runTx('Withdraw ETH', () =>
      walletContract.withdrawETH(ethers.parseEther(withdrawAmt))
    );
  };

  const transfer = () => {
    if (!transferTo || !transferAmt || isNaN(transferAmt)) return;
    runTx('Transfer ETH', () =>
      walletContract.transferETH(transferTo, ethers.parseEther(transferAmt))
    );
  };

  // ── Render ────────────────────────────────────────────────────────────────
  if (!isConnected) {
    return (
      <Panel>
        <Title>🔗 Blockchain Wallet</Title>
        <p style={{ color: C.muted, fontSize: 12, marginBottom: 14 }}>
          Connect MetaMask to create your on-chain wallet and manage ETH transactions.
        </p>
        <ConnectBtn onClick={connect} disabled={connecting}>
          {connecting ? <Spinner /> : 'Connect MetaMask'}
        </ConnectBtn>
        {walletError && <StatusMsg $type="error">{walletError}</StatusMsg>}
      </Panel>
    );
  }

  if (isWrongNetwork) {
    return (
      <Panel>
        <Title>⚠️ Wrong Network</Title>
        <AddressChip>{shortAddr(account)}</AddressChip>
        <p style={{ color: C.muted, fontSize: 12, marginBottom: 14 }}>
          Please switch to Sepolia Testnet to use KimuntuX contracts.
        </p>
        <WarnBtn onClick={switchToSepolia}>Switch to Sepolia</WarnBtn>
        <DangerBtn onClick={disconnect}>Disconnect</DangerBtn>
      </Panel>
    );
  }

  if (noContracts) {
    return (
      <Panel>
        <Title>🔗 Wallet Connected</Title>
        <AddressChip>{account}</AddressChip>
        <StatusMsg $type="error">
          Contract addresses not configured. Add REACT_APP_WALLET_CONTRACT_ADDRESS
          and REACT_APP_COMMISSION_CONTRACT_ADDRESS to .env.local after deploying contracts.
        </StatusMsg>
        <DangerBtn onClick={disconnect}>Disconnect</DangerBtn>
      </Panel>
    );
  }

  return (
    <Panel>
      <Title>🔗 Blockchain Wallet</Title>
      <AddressChip>{account}</AddressChip>

      {hasOnChainWallet === null && <Spinner />}

      {hasOnChainWallet === false && (
        <>
          <p style={{ color: C.muted, fontSize: 12, marginBottom: 12 }}>
            No on-chain wallet found for your address. Create one to start receiving payouts.
          </p>
          <ConnectBtn
            onClick={createWallet}
            disabled={!!loading}
          >
            {loading === 'Create Wallet' ? <Spinner /> : 'Create On-Chain Wallet'}
          </ConnectBtn>
        </>
      )}

      {hasOnChainWallet === true && (
        <>
          <BalanceRow>
            <div>
              <BalanceLabel>ETH Balance</BalanceLabel>
              <BalanceValue>{ethBalance} ETH</BalanceValue>
            </div>
            <ActionBtn onClick={refresh} disabled={!!loading} style={{ fontSize: 11 }}>
              ↻ Refresh
            </ActionBtn>
          </BalanceRow>

          <Divider />

          {/* Deposit */}
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 6 }}>Deposit ETH</div>
            <InputRow>
              <Input
                type="number"
                placeholder="0.01"
                value={depositAmt}
                onChange={e => setDepositAmt(e.target.value)}
                min="0"
                step="0.001"
              />
              <ActionBtn
                $variant="success"
                onClick={deposit}
                disabled={!!loading || !depositAmt}
              >
                {loading === 'Deposit ETH' ? <Spinner /> : 'Deposit'}
              </ActionBtn>
            </InputRow>
          </div>

          {/* Withdraw */}
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 6 }}>Withdraw ETH</div>
            <InputRow>
              <Input
                type="number"
                placeholder="0.01"
                value={withdrawAmt}
                onChange={e => setWithdrawAmt(e.target.value)}
                min="0"
                step="0.001"
              />
              <ActionBtn
                $variant="danger"
                onClick={withdraw}
                disabled={!!loading || !withdrawAmt}
              >
                {loading === 'Withdraw ETH' ? <Spinner /> : 'Withdraw'}
              </ActionBtn>
            </InputRow>
          </div>

          <Divider />

          {/* Transfer */}
          <div>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 6 }}>Transfer ETH to another wallet</div>
            <InputRow>
              <Input
                placeholder="0x recipient address"
                value={transferTo}
                onChange={e => setTransferTo(e.target.value)}
              />
            </InputRow>
            <InputRow>
              <Input
                type="number"
                placeholder="Amount ETH"
                value={transferAmt}
                onChange={e => setTransferAmt(e.target.value)}
                min="0"
                step="0.001"
              />
              <ActionBtn
                onClick={transfer}
                disabled={!!loading || !transferTo || !transferAmt}
              >
                {loading === 'Transfer ETH' ? <Spinner /> : 'Transfer'}
              </ActionBtn>
            </InputRow>
          </div>
        </>
      )}

      {status && (
        <StatusMsg $type={status.type}>
          {status.msg}
          {status.type !== 'error' && status.msg.includes('0x') && (
            <>
              {' '}
              <TxLink
                href={`https://sepolia.etherscan.io/tx/${status.msg.split(': ')[1]}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                View on Etherscan ↗
              </TxLink>
            </>
          )}
        </StatusMsg>
      )}

      <DangerBtn onClick={disconnect}>Disconnect Wallet</DangerBtn>
    </Panel>
  );
}
