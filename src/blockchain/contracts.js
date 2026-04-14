/**
 * src/blockchain/contracts.js
 * Contract addresses and ABI imports for frontend use.
 * Addresses are loaded from environment variables set after deployment.
 */

import WalletABI from './abis/KimuntuXWallet.json';
import CommissionABI from './abis/KimuntuXCommissionSystem.json';

export const CONTRACT_ADDRESSES = {
  wallet:     process.env.REACT_APP_WALLET_CONTRACT_ADDRESS     || '',
  commission: process.env.REACT_APP_COMMISSION_CONTRACT_ADDRESS || '',
};

export const ABIS = {
  wallet:     WalletABI,
  commission: CommissionABI,
};

export const SEPOLIA_CHAIN_ID  = 31337;   // Hardhat local (switch to 11155111 for Sepolia)
export const SEPOLIA_CHAIN_HEX = '0x7a69'; // 31337 in hex

export const SEPOLIA_PARAMS = {
  chainId: SEPOLIA_CHAIN_HEX,
  chainName: 'Hardhat Local',
  nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
  rpcUrls: ['http://127.0.0.1:8545'],
  blockExplorerUrls: [],
};
