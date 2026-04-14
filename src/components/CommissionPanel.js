/**
 * CommissionPanel.js
 * Affiliate commission management: register, view balance, withdraw.
 */

import React, { useState, useEffect, useCallback } from 'react';
import styled, { keyframes } from 'styled-components';
import { ethers } from 'ethers';
import useWallet from '../hooks/useWallet';

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

const spin = keyframes`to { transform: rotate(360deg); }`;

const Panel = styled.div`
  background: ${C.card};
  border: 1px solid ${C.border};
  border-radius: 12px;
  padding: 20px;
`;

const Title = styled.h3`
  color: ${C.text};
  font-size: 14px;
  font-weight: 700;
  margin: 0 0 16px 0;
`;

const Row = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: ${C.surface};
  border: 1px solid ${C.border};
  border-radius: 8px;
  padding: 10px 12px;
  margin-bottom: 10px;
`;

const Label = styled.div`
  font-size: 11px;
  color: ${C.muted};
  text-transform: uppercase;
  letter-spacing: 0.06em;
`;

const Value = styled.div`
  font-size: 16px;
  font-weight: 800;
  color: ${({ $color }) => $color || C.text};
`;

const Btn = styled.button`
  background: ${({ $variant }) =>
    $variant === 'success' ? C.success :
    $variant === 'danger'  ? C.danger  : C.accent};
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 8px 14px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
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
    $type === 'success' ? C.success + '22' : C.accent + '22'};
  color: ${({ $type }) =>
    $type === 'error'   ? C.danger  :
    $type === 'success' ? C.success : C.accent};
  word-break: break-all;
`;

const Spinner = styled.div`
  width: 14px; height: 14px;
  border: 2px solid ${C.border};
  border-top-color: ${C.accent};
  border-radius: 50%;
  animation: ${spin} 0.7s linear infinite;
  display: inline-block;
`;

const Divider = styled.div`
  height: 1px;
  background: ${C.border};
  margin: 12px 0;
`;

const CommissionList = styled.div`
  max-height: 200px;
  overflow-y: auto;
`;

const CommItem = styled.div`
  background: ${C.surface};
  border: 1px solid ${C.border};
  border-radius: 8px;
  padding: 10px;
  margin-bottom: 6px;
  font-size: 11px;
  color: ${C.muted};
`;

const CommAmount = styled.span`
  color: ${C.success};
  font-weight: 700;
`;

const StatusPill = styled.span`
  display: inline-block;
  padding: 1px 8px;
  border-radius: 999px;
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  color: #fff;
  background: ${({ $s }) =>
    $s === 'APPROVED' ? C.success :
    $s === 'PAID'     ? C.accent  :
    $s === 'DISPUTED' ? C.danger  : C.warning};
  margin-left: 6px;
`;

function fmtEth(wei) {
  try { return parseFloat(ethers.formatEther(wei)).toFixed(6); }
  catch { return '0.000000'; }
}

const STATUS_NAMES = ['PENDING', 'APPROVED', 'PAID', 'DISPUTED'];

export default function CommissionPanel() {
  const { account, commissionContract, isConnected, contractsReady } = useWallet();

  const [isAffiliate, setIsAffiliate]   = useState(null);
  const [balance, setBalance]           = useState('0');
  const [commissions, setCommissions]   = useState([]);
  const [loading, setLoading]           = useState('');
  const [status, setStatus]             = useState(null);

  const refresh = useCallback(async () => {
    if (!commissionContract || !account) return;
    try {
      const aff = await commissionContract.isAffiliate(account);
      setIsAffiliate(aff);
      if (aff) {
        const bal = await commissionContract.getBalance(account);
        setBalance(fmtEth(bal));
        const comms = await commissionContract.getAllCommissions(account);
        setCommissions(comms.map(c => ({
          amount: fmtEth(c.amount),
          timestamp: new Date(Number(c.timestamp) * 1000).toLocaleDateString(),
          txId: c.transactionId,
          status: STATUS_NAMES[Number(c.status)] || 'UNKNOWN',
        })));
      }
    } catch (e) {
      console.warn('commission refresh:', e.message);
    }
  }, [commissionContract, account]);

  useEffect(() => { refresh(); }, [refresh]);

  async function runTx(label, fn) {
    setLoading(label);
    setStatus(null);
    try {
      const tx = await fn();
      setStatus({ type: 'info', msg: `Tx: ${tx.hash}` });
      await tx.wait();
      setStatus({ type: 'success', msg: `✓ ${label} confirmed!` });
      await refresh();
    } catch (e) {
      setStatus({ type: 'error', msg: e.reason || e.message });
    } finally {
      setLoading('');
    }
  }

  const registerSelf = () => runTx('Register', () => commissionContract.registerSelf());
  const withdrawAll  = () => runTx('Withdraw', () => commissionContract.withdraw());

  if (!isConnected) {
    return (
      <Panel>
        <Title>💸 Commission System</Title>
        <p style={{ color: C.muted, fontSize: 12 }}>
          Connect your wallet on the Blockchain page to manage affiliate commissions.
        </p>
      </Panel>
    );
  }

  if (!contractsReady) {
    return (
      <Panel>
        <Title>💸 Commission System</Title>
        <p style={{ color: C.muted, fontSize: 12 }}>
          Deploy contracts and add addresses to .env.local to enable commissions.
        </p>
      </Panel>
    );
  }

  return (
    <Panel>
      <Title>💸 Commission System</Title>

      {isAffiliate === null && <Spinner />}

      {isAffiliate === false && (
        <>
          <p style={{ color: C.muted, fontSize: 12, marginBottom: 12 }}>
            Register as an affiliate to start earning commissions on KimuntuX sales.
          </p>
          <Btn onClick={registerSelf} disabled={!!loading}>
            {loading === 'Register' ? <Spinner /> : 'Register as Affiliate'}
          </Btn>
        </>
      )}

      {isAffiliate === true && (
        <>
          <Row>
            <div>
              <Label>Claimable Balance</Label>
              <Value $color={C.success}>{balance} ETH</Value>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Btn onClick={refresh} disabled={!!loading} style={{ fontSize: 11 }}>↻</Btn>
              <Btn
                $variant="success"
                onClick={withdrawAll}
                disabled={!!loading || balance === '0.000000'}
              >
                {loading === 'Withdraw' ? <Spinner /> : 'Withdraw All'}
              </Btn>
            </div>
          </Row>

          <Divider />

          <div style={{ fontSize: 11, color: C.muted, marginBottom: 8 }}>
            Commission History ({commissions.length})
          </div>

          {commissions.length === 0 ? (
            <p style={{ color: C.muted, fontSize: 11 }}>No commissions yet.</p>
          ) : (
            <CommissionList>
              {commissions.map((c, i) => (
                <CommItem key={i}>
                  <CommAmount>{c.amount} ETH</CommAmount>
                  <StatusPill $s={c.status}>{c.status}</StatusPill>
                  <div style={{ marginTop: 4 }}>
                    {c.timestamp} · TX: {c.txId.slice(0, 20)}…
                  </div>
                </CommItem>
              ))}
            </CommissionList>
          )}
        </>
      )}

      {status && <StatusMsg $type={status.type}>{status.msg}</StatusMsg>}
    </Panel>
  );
}
