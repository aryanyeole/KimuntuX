/**
 * blockchainService.js
 *
 * Service layer for blockchain API calls.
 * Follows the chatService.js pattern with named exports.
 */

const API_URL = process.env.REACT_APP_BLOCKCHAIN_API_URL || 'http://localhost:8000';
const NETWORK = process.env.REACT_APP_BLOCKCHAIN_NETWORK || 'localhost';
const DEFAULT_COMMISSION_RATE_BPS = Number(process.env.REACT_APP_DEFAULT_COMMISSION_RATE_BPS || 10000);
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

const ETH_ADDRESS_REGEX = /^0x[0-9a-fA-F]{40}$/;

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

export const getEscrow = async (escrowId) => {
  const data = await apiFetch(`/api/v1/escrows/${escrowId}`);
  return {
    ...data,
    amount_eth: Number(data.amount_eth || 0),
    escrow_fee_eth: Number(data.escrow_fee_eth || 0),
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

export const network = NETWORK;
export const zeroAddress = ZERO_ADDRESS;
export const defaultCommissionRateBps = DEFAULT_COMMISSION_RATE_BPS;

const blockchainService = {
  validateAddress,
  apiFetch,
  getHealth,
  getContractStats,
  getAffiliateBalance,
  getAffiliateStatus,
  getCommissionHistory,
  getWalletStatus,
  getWalletDetails,
  getWalletBalances,
  getSupportedTokens,
  getEscrowStats,
  getEscrow,
  createWalletFor,
  recordCommission,
  createEscrow,
  network,
  zeroAddress,
  defaultCommissionRateBps,
};

export default blockchainService;
