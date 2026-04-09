const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const V1 = '/api/v1';

function getToken() {
  return localStorage.getItem('kimuntu_token');
}

function buildHeaders(hasBody = false) {
  const headers = {};
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (hasBody) headers['Content-Type'] = 'application/json';
  return headers;
}

function buildUrl(path, params) {
  const url = new URL(`${BASE_URL}${path}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        url.searchParams.set(key, value);
      }
    });
  }
  return url.toString();
}

async function handleResponse(res) {
  if (res.ok) {
    if (res.status === 204) return null;
    return res.json();
  }
  let detail = `HTTP ${res.status}`;
  try {
    const body = await res.json();
    detail = body.detail || body.message || JSON.stringify(body);
  } catch {
    detail = res.statusText || detail;
  }
  const err = new Error(detail);
  err.status = res.status;
  throw err;
}

const api = {
  // ── Generic methods ────────────────────────────────────────────────────────
  get(path, params) {
    return fetch(buildUrl(path, params), {
      method: 'GET',
      headers: buildHeaders(false),
    }).then(handleResponse);
  },

  post(path, body) {
    return fetch(buildUrl(path), {
      method: 'POST',
      headers: buildHeaders(true),
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }).then(handleResponse);
  },

  patch(path, body) {
    return fetch(buildUrl(path), {
      method: 'PATCH',
      headers: buildHeaders(true),
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }).then(handleResponse);
  },

  delete(path) {
    return fetch(buildUrl(path), {
      method: 'DELETE',
      headers: buildHeaders(false),
    }).then(handleResponse);
  },

  // ── Auth ───────────────────────────────────────────────────────────────────
  auth: {
    login: (email, password) =>
      api.post(`${V1}/auth/login`, { email, password }),
    signup: (full_name, email, password) =>
      api.post(`${V1}/auth/signup`, { full_name, email, password }),
    me: () =>
      api.get(`${V1}/auth/me`),
  },

  // ── CRM ────────────────────────────────────────────────────────────────────
  crm: {
    // Leads
    getLeads: (params) => api.get(`${V1}/crm/leads`, params),
    getLead: (id) => api.get(`${V1}/crm/leads/${id}`),
    createLead: (payload) => api.post(`${V1}/crm/leads`, payload),
    updateLead: (id, payload) => api.patch(`${V1}/crm/leads/${id}`, payload),
    deleteLead: (id) => api.delete(`${V1}/crm/leads/${id}`),
    updateLeadStage: (id, stage) => api.patch(`${V1}/crm/leads/${id}/stage`, { stage }),
    // Activities
    getActivities: (leadId) => api.get(`${V1}/crm/leads/${leadId}/activities`),
    addActivity: (leadId, payload) => api.post(`${V1}/crm/leads/${leadId}/activities`, payload),
    // AI
    scoreLead: (id) => api.post(`${V1}/crm/leads/${id}/ai/score`),
    generateOutreach: (id, payload) => api.post(`${V1}/crm/leads/${id}/ai/outreach`, payload),
    // Dashboard
    getDashboardSummary: () => api.get(`${V1}/crm/dashboard/summary`),
    // Campaigns
    getCampaigns: (params) => api.get(`${V1}/crm/campaigns`, params),
    getCampaign: (id) => api.get(`${V1}/crm/campaigns/${id}`),
    createCampaign: (payload) => api.post(`${V1}/crm/campaigns`, payload),
    updateCampaign: (id, payload) => api.patch(`${V1}/crm/campaigns/${id}`, payload),
    // Offers
    getOffers: (params) => api.get(`${V1}/crm/offers`, params),
    createOffer: (payload) => api.post(`${V1}/crm/offers`, payload),
    // Communications
    getCommunications: (params) => api.get(`${V1}/crm/communications`, params),
    createCommunication: (payload) => api.post(`${V1}/crm/communications`, payload),
    // Integrations
    getIntegrations: () => api.get(`${V1}/crm/integrations`),
    connectIntegration: (platform) => api.post(`${V1}/crm/integrations/${platform}/connect`),
    disconnectIntegration: (platform) => api.delete(`${V1}/crm/integrations/${platform}/disconnect`),
  },

  // ── Contact form (public) ──────────────────────────────────────────────────
  contact: {
    submit: (payload) => api.post(`${V1}/contact`, payload),
  },

  // ── Blockchain: Commission ─────────────────────────────────────────────────
  blockchain: {
    // Commission
    getCommissionStats: () =>
      api.get(`${V1}/commissions/stats`),
    getAffiliateBalance: (address) =>
      api.get(`${V1}/commissions/balance/${address}`),
    getAffiliateCommissions: (address) =>
      api.get(`${V1}/commissions/${address}`),
    getAffiliateStatus: (address) =>
      api.get(`${V1}/commissions/affiliates/${address}/status`),
    recordCommission: (payload) =>
      api.post(`${V1}/commissions/record`, payload),
    approveCommission: (affiliate, index) =>
      api.post(`${V1}/commissions/approve`, { affiliate, index }),
    autoApprove: (affiliate, transaction_id) =>
      api.post(`${V1}/commissions/auto-approve`, { affiliate, transaction_id }),
    withdraw: () =>
      api.post(`${V1}/commissions/withdraw`),
    withdrawAmount: (amount_eth) =>
      api.post(`${V1}/commissions/withdraw-amount`, { amount_eth }),
    registerAffiliate: (affiliate) =>
      api.post(`${V1}/commissions/affiliates/register`, { affiliate }),
    registerSelf: () =>
      api.post(`${V1}/commissions/affiliates/register-self`),
    authorizeMerchant: (merchant, status) =>
      api.post(`${V1}/commissions/merchants/authorize`, { merchant, status }),
    setFeeRate: (rate_bps) =>
      api.post(`${V1}/commissions/fee-rate`, { rate_bps }),
    setMinimumPayout: (amount_eth) =>
      api.post(`${V1}/commissions/minimum-payout`, { amount_eth }),

    // Wallet
    getWalletStatus: (owner) =>
      api.get(`${V1}/wallets/${owner}/status`),
    getWalletDetails: (owner) =>
      api.get(`${V1}/wallets/${owner}/details`),
    getWalletBalances: (owner) =>
      api.get(`${V1}/wallets/${owner}/balances`),
    getEthBalance: (owner) =>
      api.get(`${V1}/wallets/${owner}/eth-balance`),
    getTotalWallets: () =>
      api.get(`${V1}/wallets/stats/total`),
    getSupportedTokens: () =>
      api.get(`${V1}/wallets/tokens/supported`),
    createWallet: () =>
      api.post(`${V1}/wallets/create`),
    createWalletFor: (user) =>
      api.post(`${V1}/wallets/create-for`, { user }),
    depositEth: (amount_eth) =>
      api.post(`${V1}/wallets/deposit-eth`, { amount_eth }),
    creditEth: (user, amount_eth) =>
      api.post(`${V1}/wallets/credit-eth`, { user, amount_eth }),
    withdrawEth: (amount_eth) =>
      api.post(`${V1}/wallets/withdraw-eth`, { amount_eth }),
    withdrawAllEth: () =>
      api.post(`${V1}/wallets/withdraw-all-eth`),
    transferEth: (recipient, amount_eth) =>
      api.post(`${V1}/wallets/transfer-eth`, { recipient, amount_eth }),
    authorizePlatform: (affiliate) =>
      api.post(`${V1}/wallets/platforms/authorize`, { affiliate }),
    revokePlatform: (platform) =>
      api.post(`${V1}/wallets/platforms/${platform}/revoke`),
  },
};

export default api;
