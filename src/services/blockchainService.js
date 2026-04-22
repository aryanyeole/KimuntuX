/**
 * blockchainService.js
 *
 * Service layer for blockchain API calls.
 * Follows the chatService.js pattern with named exports.
 */

import { BrowserProvider, Contract, parseEther } from 'ethers';

const API_URL = process.env.REACT_APP_BLOCKCHAIN_API_URL || 'http://localhost:8000';
const NETWORK = process.env.REACT_APP_BLOCKCHAIN_NETWORK || 'localhost';
const DEFAULT_COMMISSION_RATE_BPS = Number(process.env.REACT_APP_DEFAULT_COMMISSION_RATE_BPS || 10000);
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
const MARKET_API_URL = 'https://api.coingecko.com/api/v3';
const HARDHAT_CHAIN_ID = '0x7A69';
const HARDHAT_CHAIN_DECIMAL = 31337;
const HARDHAT_NETWORK_CONFIG = {
  chainId: HARDHAT_CHAIN_ID,
  chainName: 'KimuX Local Chain',
  nativeCurrency: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: ['http://127.0.0.1:8545'],
  blockExplorerUrls: [],
};

const ETH_ADDRESS_REGEX = /^0x[0-9a-fA-F]{40}$/;

const walletAbi = [
  'function createWallet()',
  'function depositETH() payable',
  'function withdrawETH(uint256 amount)',
  'function withdrawAllETH()',
  'function transferETH(address recipient, uint256 amount)',
];

const commissionAbi = [
  'function registerSelf()',
  'function withdraw()',
  'function withdrawAmount(uint256 amount)',
];

const escrowAbi = [
  'function createEscrow(address seller, string productId, string notes, address arbiter) payable returns (uint256)',
  'function releaseEscrow(uint256 escrowId)',
  'function raiseDispute(uint256 escrowId, string reason)',
];

const getEthereumProvider = () => {
  if (typeof window === 'undefined') {
    return null;
  }
  return window.ethereum || null;
};

export const validateAddress = (address) => {
  if (!address) return false;
  return ETH_ADDRESS_REGEX.test(address);
};

export const apiFetch = async (endpoint, options = {}) => {
  const url = `${API_URL}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  const response = await fetch(url, config);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    const err = new Error(error.error || error.detail || 'Request failed');
    err.status = response.status;
    err.detail = error.detail;
    throw err;
  }

  return response.json();
};

export const hasMetaMask = () => Boolean(getEthereumProvider());

export const getConnectedMetaMaskAddress = async () => {
  const provider = getEthereumProvider();
  if (!provider) {
    return null;
  }

  const accounts = await provider.request({ method: 'eth_accounts' });
  return accounts?.[0] || null;
};

const requireMetaMaskProvider = async () => {
  const provider = getEthereumProvider();
  if (!provider) {
    throw new Error('MetaMask is not installed.');
  }
  await ensureMetaMaskNetwork();
  return provider;
};

const getMetaMaskSigner = async (expectedAddress = null) => {
  const provider = await requireMetaMaskProvider();
  const browserProvider = new BrowserProvider(provider);
  const signer = await browserProvider.getSigner();
  const signerAddress = await signer.getAddress();

  if (expectedAddress && signerAddress.toLowerCase() !== expectedAddress.toLowerCase()) {
    throw new Error('MetaMask account does not match the connected KimuX wallet.');
  }

  return { browserProvider, signer, signerAddress };
};

const getContractAddresses = async () => {
  const health = await getHealth();
  return {
    wallet: health.contracts?.wallet?.address || null,
    commission: health.contracts?.commission?.address || null,
    escrow: health.contracts?.escrow?.address || null,
  };
};

const sendMetaMaskTransaction = async ({ abi, address, expectedAddress, action }) => {
  if (!address) {
    throw new Error(`${action} is unavailable because the contract is not loaded.`);
  }

  const { signer } = await getMetaMaskSigner(expectedAddress);
  const contract = new Contract(address, abi, signer);
  return { contract };
};

export const ensureMetaMaskNetwork = async () => {
  const provider = getEthereumProvider();
  if (!provider) {
    throw new Error('MetaMask is not installed.');
  }

  const currentChainId = await provider.request({ method: 'eth_chainId' });
  if (currentChainId === HARDHAT_CHAIN_ID) {
    return currentChainId;
  }

  try {
    await provider.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: HARDHAT_CHAIN_ID }],
    });
  } catch (error) {
    if (error?.code !== 4902) {
      throw new Error('Unable to switch MetaMask to the KimuX local network.');
    }

    await provider.request({
      method: 'wallet_addEthereumChain',
      params: [HARDHAT_NETWORK_CONFIG],
    });
  }

  return HARDHAT_CHAIN_ID;
};

export const connectMetaMask = async () => {
  const provider = getEthereumProvider();
  if (!provider) {
    throw new Error('MetaMask is not installed.');
  }

  await ensureMetaMaskNetwork();
  const accounts = await provider.request({ method: 'eth_requestAccounts' });
  const address = accounts?.[0];

  if (!validateAddress(address)) {
    throw new Error('MetaMask returned an invalid wallet address.');
  }

  return address;
};

export const watchMetaMaskAccount = (handler) => {
  const provider = getEthereumProvider();
  if (!provider?.on) {
    return () => {};
  }

  const handleAccountsChanged = (accounts) => {
    handler(accounts?.[0] || null);
  };

  provider.on('accountsChanged', handleAccountsChanged);
  return () => {
    if (provider.removeListener) {
      provider.removeListener('accountsChanged', handleAccountsChanged);
    }
  };
};

export const getHealth = async () => {
  const data = await apiFetch('/health');
  return {
    status: data.status,
    chain_id: data.chain_id,
    latest_block: data.latest_block,
    gas_price_gwei: Number(data.gas_price_gwei || 0),
    platform_balance_eth: Number(data.platform_balance_eth || 0),
    contracts: data.contracts || {},
    error: data.error || null,
  };
};

export const getContractStats = async () => {
  const data = await apiFetch('/api/v1/commissions/stats');
  return {
    contract_balance_eth: Number(data.contract_balance_eth || 0),
    total_paid_eth: Number(data.total_paid_eth || 0),
    platform_fee_rate_bps: Number(data.platform_fee_rate_bps || 0),
    minimum_payout_eth: Number(data.minimum_payout_eth || 0),
  };
};

export const getCommissionConfig = async () => {
  const data = await apiFetch('/api/v1/commissions/config');
  return {
    platform_fee_rate_bps: Number(data.platform_fee_rate_bps || 0),
    minimum_payout_eth: Number(data.minimum_payout_eth || 0),
    paused: Boolean(data.paused),
  };
};

export const getAffiliateBalance = async (address) => {
  if (!validateAddress(address)) {
    throw new Error('Invalid Ethereum address');
  }
  const data = await apiFetch(`/api/v1/commissions/balance/${address}`);
  return {
    affiliate: data.affiliate,
    balance_eth: Number(data.balance_eth || 0),
  };
};

export const getAffiliateStatus = async (address) => {
  if (!validateAddress(address)) {
    throw new Error('Invalid Ethereum address');
  }
  return apiFetch(`/api/v1/commissions/affiliates/${address}/status`);
};

export const getCommissionHistory = async (address) => {
  if (!validateAddress(address)) {
    throw new Error('Invalid Ethereum address');
  }
  const records = await apiFetch(`/api/v1/commissions/${address}`);
  return {
    commissions: (records || []).map((record) => ({
      affiliate: record.affiliate,
      amount_eth: Number(record.amount_eth || 0),
      status: record.status,
      tx_id: record.transaction_id,
      created_at: record.timestamp,
    })),
  };
};

export const getCommissionTransactionStatus = async (transactionId) => (
  apiFetch(`/api/v1/commissions/transactions/${encodeURIComponent(transactionId)}`)
);

export const getWalletStatus = async (address) => {
  if (!validateAddress(address)) {
    throw new Error('Invalid Ethereum address');
  }
  const data = await apiFetch(`/api/v1/wallets/${address}/status`);
  return {
    address: data.address,
    exists: Boolean(data.has_wallet),
  };
};

export const getWalletDetails = async (address) => {
  if (!validateAddress(address)) {
    throw new Error('Invalid Ethereum address');
  }
  const data = await apiFetch(`/api/v1/wallets/${address}/details`);
  return {
    owner: data.owner,
    is_active: true,
    created_at: data.created_at,
    eth_balance: Number(data.eth_balance || 0),
    total_deposits: Number(data.total_deposits || 0),
    total_withdrawals: Number(data.total_withdrawals || 0),
  };
};

export const getWalletBalances = async (address) => {
  if (!validateAddress(address)) {
    throw new Error('Invalid Ethereum address');
  }
  const data = await apiFetch(`/api/v1/wallets/${address}/balances`);
  return {
    eth_balance: Number(data.eth_balance || 0),
    token_balances: data.token_balances || {},
  };
};

export const getSupportedTokens = async () => {
  const data = await apiFetch('/api/v1/wallets/tokens/supported');
  return {
    supported_tokens: data.supported_tokens || [],
  };
};

export const getWalletConfig = async () => {
  const data = await apiFetch('/api/v1/wallets/config');
  return {
    total_wallets: Number(data.total_wallets || 0),
    minimum_withdrawal_eth: Number(data.minimum_withdrawal_eth || 0),
    paused: Boolean(data.paused),
  };
};

export const getEscrowStats = async () => {
  const data = await apiFetch('/api/v1/escrows/stats');
  return {
    active_escrows: Number(data.active_escrows || 0),
    total_locked_value: Number(data.total_locked_value || 0),
    total_escrows: Number(data.total_escrows || 0),
    completed_escrows: Number(data.completed_escrows || 0),
    escrow_fee_rate_bps: Number(data.escrow_fee_rate_bps || 0),
    recent_escrows: (data.recent_escrows || []).map((escrow) => ({
      ...escrow,
      amount_eth: Number(escrow.amount_eth || 0),
      escrow_fee_eth: Number(escrow.escrow_fee_eth || 0),
    })),
  };
};

export const getEscrowConfig = async () => {
  const data = await apiFetch('/api/v1/escrows/config');
  return {
    escrow_fee_rate_bps: Number(data.escrow_fee_rate_bps || 0),
    auto_release_timeout_seconds: Number(data.auto_release_timeout_seconds || 0),
    paused: Boolean(data.paused),
  };
};

export const getEscrow = async (escrowId) => {
  const data = await apiFetch(`/api/v1/escrows/${escrowId}`);
  return {
    ...data,
    amount_eth: Number(data.amount_eth || 0),
    escrow_fee_eth: Number(data.escrow_fee_eth || 0),
  };
};

export const getTransactionStatus = async (txHash) => {
  const data = await apiFetch(`/api/v1/network/transactions/${txHash}`);
  return {
    tx_hash: data.tx_hash,
    status: data.status,
    block_number: data.block_number ?? null,
    gas_used: data.gas_used ?? null,
    confirmations: data.confirmations ?? null,
  };
};

export const getCryptoMarketSnapshot = async () => {
  const query = new URLSearchParams({
    vs_currency: 'usd',
    ids: 'bitcoin,ethereum,solana,chainlink,usd-coin',
    order: 'market_cap_desc',
    per_page: '5',
    page: '1',
    sparkline: 'false',
    price_change_percentage: '24h',
  });

  const response = await fetch(`${MARKET_API_URL}/coins/markets?${query.toString()}`);
  if (!response.ok) {
    throw new Error('Unable to load crypto market data right now.');
  }

  const rows = await response.json();
  return rows.map((coin) => ({
    id: coin.id,
    symbol: String(coin.symbol || '').toUpperCase(),
    name: coin.name,
    image: coin.image,
    current_price: Number(coin.current_price || 0),
    price_change_percentage_24h: Number(coin.price_change_percentage_24h || 0),
    market_cap_rank: Number(coin.market_cap_rank || 0),
    market_cap: Number(coin.market_cap || 0),
  }));
};

export const getCryptoPriceMap = async () => {
  const query = new URLSearchParams({
    ids: 'bitcoin,ethereum,solana,chainlink,usd-coin',
    vs_currencies: 'usd',
    include_24hr_change: 'true',
  });

  const response = await fetch(`${MARKET_API_URL}/simple/price?${query.toString()}`);
  if (!response.ok) {
    throw new Error('Unable to load crypto prices right now.');
  }

  const data = await response.json();
  return {
    bitcoin: {
      usd: Number(data.bitcoin?.usd || 0),
      change_24h: Number(data.bitcoin?.usd_24h_change || 0),
    },
    ethereum: {
      usd: Number(data.ethereum?.usd || 0),
      change_24h: Number(data.ethereum?.usd_24h_change || 0),
    },
    solana: {
      usd: Number(data.solana?.usd || 0),
      change_24h: Number(data.solana?.usd_24h_change || 0),
    },
    chainlink: {
      usd: Number(data.chainlink?.usd || 0),
      change_24h: Number(data.chainlink?.usd_24h_change || 0),
    },
    'usd-coin': {
      usd: Number(data['usd-coin']?.usd || 0),
      change_24h: Number(data['usd-coin']?.usd_24h_change || 0),
    },
  };
};

export const createWalletFor = async (address) => {
  if (!validateAddress(address)) {
    throw new Error('Invalid Ethereum address');
  }
  return apiFetch('/api/v1/wallets/create-for', {
    method: 'POST',
    body: JSON.stringify({ user: address }),
  });
};

export const createWalletWithMetaMask = async (expectedAddress) => {
  const addresses = await getContractAddresses();
  const { contract } = await sendMetaMaskTransaction({
    abi: walletAbi,
    address: addresses.wallet,
    expectedAddress,
    action: 'Wallet creation',
  });
  const tx = await contract.createWallet();
  return { tx_hash: tx.hash };
};

export const depositEthWithMetaMask = async (amountEth, expectedAddress) => {
  const addresses = await getContractAddresses();
  const { contract } = await sendMetaMaskTransaction({
    abi: walletAbi,
    address: addresses.wallet,
    expectedAddress,
    action: 'Wallet deposit',
  });
  const tx = await contract.depositETH({ value: parseEther(String(amountEth)) });
  return { tx_hash: tx.hash };
};

export const depositEth = async (amountEth) => apiFetch('/api/v1/wallets/deposit-eth', {
  method: 'POST',
  body: JSON.stringify({ amount_eth: Number(amountEth) }),
});

export const creditEth = async (user, amountEth) => {
  if (!validateAddress(user)) {
    throw new Error('Invalid wallet address');
  }
  return apiFetch('/api/v1/wallets/credit-eth', {
    method: 'POST',
    body: JSON.stringify({ user, amount_eth: Number(amountEth) }),
  });
};

export const withdrawEth = async (amountEth) => apiFetch('/api/v1/wallets/withdraw-eth', {
  method: 'POST',
  body: JSON.stringify({ amount_eth: Number(amountEth) }),
});

export const withdrawEthWithMetaMask = async (amountEth, expectedAddress) => {
  const addresses = await getContractAddresses();
  const { contract } = await sendMetaMaskTransaction({
    abi: walletAbi,
    address: addresses.wallet,
    expectedAddress,
    action: 'Wallet withdrawal',
  });
  const tx = await contract.withdrawETH(parseEther(String(amountEth)));
  return { tx_hash: tx.hash };
};

export const withdrawAllEth = async () => apiFetch('/api/v1/wallets/withdraw-all-eth', {
  method: 'POST',
});

export const withdrawAllEthWithMetaMask = async (expectedAddress) => {
  const addresses = await getContractAddresses();
  const { contract } = await sendMetaMaskTransaction({
    abi: walletAbi,
    address: addresses.wallet,
    expectedAddress,
    action: 'Wallet full withdrawal',
  });
  const tx = await contract.withdrawAllETH();
  return { tx_hash: tx.hash };
};

export const transferEth = async (recipient, amountEth) => {
  if (!validateAddress(recipient)) {
    throw new Error('Invalid recipient address');
  }
  return apiFetch('/api/v1/wallets/transfer-eth', {
    method: 'POST',
    body: JSON.stringify({ recipient, amount_eth: Number(amountEth) }),
  });
};

export const transferEthWithMetaMask = async (recipient, amountEth, expectedAddress) => {
  if (!validateAddress(recipient)) {
    throw new Error('Invalid recipient address');
  }

  const addresses = await getContractAddresses();
  const { contract } = await sendMetaMaskTransaction({
    abi: walletAbi,
    address: addresses.wallet,
    expectedAddress,
    action: 'Wallet transfer',
  });
  const tx = await contract.transferETH(recipient, parseEther(String(amountEth)));
  return { tx_hash: tx.hash };
};

export const updateWalletMinimumWithdrawal = async (amountEth) => apiFetch('/api/v1/wallets/minimum-withdrawal', {
  method: 'POST',
  body: JSON.stringify({ amount_eth: Number(amountEth) }),
});

export const registerAffiliate = async (affiliate) => {
  if (!validateAddress(affiliate)) {
    throw new Error('Invalid affiliate address');
  }
  return apiFetch('/api/v1/commissions/affiliates/register', {
    method: 'POST',
    body: JSON.stringify({ affiliate }),
  });
};

export const registerAffiliateWithMetaMask = async (expectedAddress) => {
  const addresses = await getContractAddresses();
  const { contract } = await sendMetaMaskTransaction({
    abi: commissionAbi,
    address: addresses.commission,
    expectedAddress,
    action: 'Affiliate registration',
  });
  const tx = await contract.registerSelf();
  return { tx_hash: tx.hash };
};

export const authorizeMerchant = async (merchant, status) => {
  if (!validateAddress(merchant)) {
    throw new Error('Invalid merchant address');
  }
  return apiFetch('/api/v1/commissions/merchants/authorize', {
    method: 'POST',
    body: JSON.stringify({ merchant, status: Boolean(status) }),
  });
};

export const approveCommission = async (affiliate, index) => {
  if (!validateAddress(affiliate)) {
    throw new Error('Invalid affiliate address');
  }
  return apiFetch('/api/v1/commissions/approve', {
    method: 'POST',
    body: JSON.stringify({ affiliate, index: Number(index) }),
  });
};

export const autoApproveCommission = async (affiliate, transactionId) => {
  if (!validateAddress(affiliate)) {
    throw new Error('Invalid affiliate address');
  }
  return apiFetch('/api/v1/commissions/auto-approve', {
    method: 'POST',
    body: JSON.stringify({ affiliate, transaction_id: transactionId }),
  });
};

export const withdrawCommissionBalance = async (amountEth = null) => (
  amountEth === null
    ? apiFetch('/api/v1/commissions/withdraw', { method: 'POST' })
    : apiFetch('/api/v1/commissions/withdraw-amount', {
      method: 'POST',
      body: JSON.stringify({ amount_eth: Number(amountEth) }),
    })
);

export const withdrawCommissionWithMetaMask = async (amountEth = null, expectedAddress = null) => {
  const addresses = await getContractAddresses();
  const { contract } = await sendMetaMaskTransaction({
    abi: commissionAbi,
    address: addresses.commission,
    expectedAddress,
    action: 'Commission withdrawal',
  });
  const tx = amountEth === null || amountEth === ''
    ? await contract.withdraw()
    : await contract.withdrawAmount(parseEther(String(amountEth)));
  return { tx_hash: tx.hash };
};

export const updateCommissionFeeRate = async (rateBps) => apiFetch('/api/v1/commissions/fee-rate', {
  method: 'POST',
  body: JSON.stringify({ rate_bps: Number(rateBps) }),
});

export const updateMinimumPayout = async (amountEth) => apiFetch('/api/v1/commissions/minimum-payout', {
  method: 'POST',
  body: JSON.stringify({ amount_eth: Number(amountEth) }),
});

export const recordCommission = async (data) => {
  if (!validateAddress(data.affiliate)) {
    throw new Error('Invalid affiliate address');
  }
  return apiFetch('/api/v1/commissions/record', {
    method: 'POST',
    body: JSON.stringify({
      affiliate: data.affiliate,
      sale_amount_eth: Number(data.sale_amount_eth),
      commission_rate_bps: Number(data.commission_rate_bps || DEFAULT_COMMISSION_RATE_BPS),
      transaction_id: data.transaction_id,
    }),
  });
};

export const createEscrow = async (data) => {
  if (!validateAddress(data.seller)) {
    throw new Error('Invalid seller address');
  }
  const arbiter = data.arbiter || ZERO_ADDRESS;
  if (!validateAddress(arbiter)) {
    throw new Error('Invalid arbiter address');
  }
  return apiFetch('/api/v1/escrows/create', {
    method: 'POST',
    body: JSON.stringify({
      seller: data.seller,
      product_id: data.product_id,
      notes: data.notes || '',
      arbiter,
      amount_eth: Number(data.amount_eth),
    }),
  });
};

export const createEscrowWithMetaMask = async (data, expectedAddress) => {
  if (!validateAddress(data.seller)) {
    throw new Error('Invalid seller address');
  }
  const arbiter = data.arbiter || ZERO_ADDRESS;
  if (!validateAddress(arbiter)) {
    throw new Error('Invalid arbiter address');
  }

  const addresses = await getContractAddresses();
  const { contract } = await sendMetaMaskTransaction({
    abi: escrowAbi,
    address: addresses.escrow,
    expectedAddress,
    action: 'Escrow creation',
  });
  const tx = await contract.createEscrow(
    data.seller,
    data.product_id,
    data.notes || '',
    arbiter,
    { value: parseEther(String(data.amount_eth)) }
  );
  return { tx_hash: tx.hash };
};

export const releaseEscrow = async (escrowId) => apiFetch(`/api/v1/escrows/${escrowId}/release`, {
  method: 'POST',
});

export const releaseEscrowWithMetaMask = async (escrowId, expectedAddress) => {
  const addresses = await getContractAddresses();
  const { contract } = await sendMetaMaskTransaction({
    abi: escrowAbi,
    address: addresses.escrow,
    expectedAddress,
    action: 'Escrow release',
  });
  const tx = await contract.releaseEscrow(Number(escrowId));
  return { tx_hash: tx.hash };
};

export const autoReleaseEscrow = async (escrowId) => apiFetch(`/api/v1/escrows/${escrowId}/auto-release`, {
  method: 'POST',
});

export const refundEscrow = async (escrowId) => apiFetch(`/api/v1/escrows/${escrowId}/refund`, {
  method: 'POST',
});

export const disputeEscrow = async (escrowId, reason) => apiFetch(`/api/v1/escrows/${escrowId}/dispute`, {
  method: 'POST',
  body: JSON.stringify({ reason }),
});

export const disputeEscrowWithMetaMask = async (escrowId, reason, expectedAddress) => {
  const addresses = await getContractAddresses();
  const { contract } = await sendMetaMaskTransaction({
    abi: escrowAbi,
    address: addresses.escrow,
    expectedAddress,
    action: 'Escrow dispute',
  });
  const tx = await contract.raiseDispute(Number(escrowId), reason);
  return { tx_hash: tx.hash };
};

export const resolveEscrow = async (escrowId, releaseToSeller) => apiFetch(`/api/v1/escrows/${escrowId}/resolve`, {
  method: 'POST',
  body: JSON.stringify({ release_to_seller: Boolean(releaseToSeller) }),
});

export const cancelEscrow = async (escrowId) => apiFetch(`/api/v1/escrows/${escrowId}/cancel`, {
  method: 'POST',
});

export const network = NETWORK;
export const networkLabel = NETWORK === 'localhost' ? `KimuX Local Chain (${HARDHAT_CHAIN_DECIMAL})` : NETWORK;
export const zeroAddress = ZERO_ADDRESS;
export const defaultCommissionRateBps = DEFAULT_COMMISSION_RATE_BPS;
export const hardhatChainId = HARDHAT_CHAIN_DECIMAL;

const blockchainService = {
  validateAddress,
  apiFetch,
  hasMetaMask,
  getConnectedMetaMaskAddress,
  ensureMetaMaskNetwork,
  connectMetaMask,
  watchMetaMaskAccount,
  getHealth,
  getContractStats,
  getCommissionConfig,
  getAffiliateBalance,
  getAffiliateStatus,
  getCommissionHistory,
  getCommissionTransactionStatus,
  getWalletStatus,
  getWalletDetails,
  getWalletBalances,
  getSupportedTokens,
  getWalletConfig,
  getEscrowStats,
  getEscrowConfig,
  getEscrow,
  getTransactionStatus,
  getCryptoMarketSnapshot,
  getCryptoPriceMap,
  createWalletFor,
  createWalletWithMetaMask,
  depositEth,
  depositEthWithMetaMask,
  creditEth,
  withdrawEth,
  withdrawEthWithMetaMask,
  withdrawAllEth,
  withdrawAllEthWithMetaMask,
  transferEth,
  transferEthWithMetaMask,
  updateWalletMinimumWithdrawal,
  registerAffiliate,
  registerAffiliateWithMetaMask,
  authorizeMerchant,
  approveCommission,
  autoApproveCommission,
  withdrawCommissionBalance,
  withdrawCommissionWithMetaMask,
  updateCommissionFeeRate,
  updateMinimumPayout,
  recordCommission,
  createEscrow,
  createEscrowWithMetaMask,
  releaseEscrow,
  releaseEscrowWithMetaMask,
  autoReleaseEscrow,
  refundEscrow,
  disputeEscrow,
  disputeEscrowWithMetaMask,
  resolveEscrow,
  cancelEscrow,
  network,
  networkLabel,
  zeroAddress,
  defaultCommissionRateBps,
  hardhatChainId,
};

export default blockchainService;
