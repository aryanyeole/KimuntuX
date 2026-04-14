/**
 * useWallet.js
 * Hook for MetaMask connection, Sepolia network switching,
 * and ethers.js contract instances.
 */

import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import {
  CONTRACT_ADDRESSES,
  ABIS,
  SEPOLIA_CHAIN_ID,
  SEPOLIA_CHAIN_HEX,
  SEPOLIA_PARAMS,
} from '../blockchain/contracts';

export default function useWallet() {
  const [provider, setProvider]         = useState(null);
  const [signer, setSigner]             = useState(null);
  const [account, setAccount]           = useState(null);
  const [chainId, setChainId]           = useState(null);
  const [walletContract, setWalletContract]         = useState(null);
  const [commissionContract, setCommissionContract] = useState(null);
  const [connecting, setConnecting]     = useState(false);
  const [error, setError]               = useState(null);

  const isConnected   = !!account;
  const isWrongNetwork = chainId !== null && chainId !== SEPOLIA_CHAIN_ID;
  const contractsReady = !!walletContract && !!commissionContract &&
                         !!CONTRACT_ADDRESSES.wallet && !!CONTRACT_ADDRESSES.commission;

  // ── Build contract instances ──────────────────────────────────────────────
  const buildContracts = useCallback((signerOrProvider) => {
    if (!CONTRACT_ADDRESSES.wallet || !CONTRACT_ADDRESSES.commission) return;
    try {
      setWalletContract(
        new ethers.Contract(CONTRACT_ADDRESSES.wallet, ABIS.wallet, signerOrProvider)
      );
      setCommissionContract(
        new ethers.Contract(CONTRACT_ADDRESSES.commission, ABIS.commission, signerOrProvider)
      );
    } catch (e) {
      console.warn('Contract init failed:', e.message);
    }
  }, []);

  // ── Connect MetaMask ──────────────────────────────────────────────────────
  const connect = useCallback(async () => {
    if (!window.ethereum) {
      setError('MetaMask not detected. Please install MetaMask.');
      return;
    }
    setConnecting(true);
    setError(null);
    try {
      const web3Provider = new ethers.BrowserProvider(window.ethereum);
      await web3Provider.send('eth_requestAccounts', []);
      const web3Signer = await web3Provider.getSigner();
      const address = await web3Signer.getAddress();
      const network = await web3Provider.getNetwork();

      setProvider(web3Provider);
      setSigner(web3Signer);
      setAccount(address);
      setChainId(Number(network.chainId));
      buildContracts(web3Signer);
    } catch (e) {
      setError(e.message || 'Failed to connect wallet');
    } finally {
      setConnecting(false);
    }
  }, [buildContracts]);

  // ── Switch to Sepolia ─────────────────────────────────────────────────────
  const switchToSepolia = useCallback(async () => {
    if (!window.ethereum) return;
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: SEPOLIA_CHAIN_HEX }],
      });
    } catch (e) {
      if (e.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [SEPOLIA_PARAMS],
        });
      } else {
        setError(e.message);
      }
    }
  }, []);

  // ── Disconnect ────────────────────────────────────────────────────────────
  const disconnect = useCallback(() => {
    setProvider(null);
    setSigner(null);
    setAccount(null);
    setChainId(null);
    setWalletContract(null);
    setCommissionContract(null);
    setError(null);
  }, []);

  // ── Listen for account / chain changes ───────────────────────────────────
  useEffect(() => {
    if (!window.ethereum) return;

    const onAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        disconnect();
      } else {
        setAccount(accounts[0]);
      }
    };

    const onChainChanged = (hex) => {
      setChainId(parseInt(hex, 16));
      // Rebuild contracts with new chain
      if (signer) buildContracts(signer);
    };

    window.ethereum.on('accountsChanged', onAccountsChanged);
    window.ethereum.on('chainChanged', onChainChanged);
    return () => {
      window.ethereum.removeListener('accountsChanged', onAccountsChanged);
      window.ethereum.removeListener('chainChanged', onChainChanged);
    };
  }, [signer, disconnect, buildContracts]);

  return {
    provider,
    signer,
    account,
    chainId,
    walletContract,
    commissionContract,
    connecting,
    error,
    isConnected,
    isWrongNetwork,
    contractsReady,
    connect,
    disconnect,
    switchToSepolia,
  };
}
