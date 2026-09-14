import axios from 'axios';

const TOKEN_KEY = 'investment_platform_token';

// Backend API base URL (configurable per environment).
// Priority:
//   1. VITE_API_URL (set in .env locally or in Vercel project env vars)
//   2. Relative /api path — works in local dev via Vite proxy.
//      For Vercel frontend deployment, you MUST set VITE_API_URL in the
//      Vercel project settings (Project → Settings → Environment Variables).
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ==========================================
// REQUEST INTERCEPTOR - Attach JWT token if present
// ==========================================
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ==========================================
// RESPONSE INTERCEPTOR - Handle expired/invalid tokens globally
// ==========================================
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const currentPath = window.location.pathname;
      const isAuthPage = currentPath === '/login' || currentPath === '/register';

      localStorage.removeItem(TOKEN_KEY);

      if (!isAuthPage) {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;

// ==========================================
// NAMED HELPERS - domain-specific API calls
// Each returns the inner `data.data` payload.
// ==========================================

export const getMyInvestments = async (params = {}) => {
  const { data } = await apiClient.get('/investments', { params });
  return data.data;
};

export const getMyWallet = async () => {
  const { data } = await apiClient.get('/wallet');
  return data.data;
};

export const getMyTransactions = async (params = {}) => {
  const { data } = await apiClient.get('/wallet/transactions', { params });
  return data.data;
};

// ==========================================
// DEPOSIT APPROVAL WORKFLOW
// ==========================================

// User submits a deposit request (status: PENDING until admin approves)
export const requestDeposit = async (payload) => {
  const { data } = await apiClient.post('/wallet/deposit', payload);
  return data.data;
};

// Admin: fetch pending deposit requests
export const getPendingDeposits = async () => {
  const { data } = await apiClient.get('/wallet/admin/deposits');
  return data.data;
};

// Admin: approve a deposit request (credits the user's wallet)
export const approveDeposit = async (id) => {
  const { data } = await apiClient.post(`/wallet/admin/deposits/${id}/approve`);
  return data.data;
};

// Admin: reject a deposit request
export const rejectDeposit = async (id) => {
  const { data } = await apiClient.post(`/wallet/admin/deposits/${id}/reject`);
  return data.data;
};

// ==========================================
// ADMIN PLATFORM DATA
// ==========================================

// Admin: list all users (optional ?search=&role=)
export const getAdminUsers = async (params = {}) => {
  const { data } = await apiClient.get('/admin/users', { params });
  return data.data;
};

// Admin: platform statistics (for dashboard charts)
export const getAdminStats = async () => {
  const { data } = await apiClient.get('/admin/stats');
  return data.data;
};

// Admin: user detail (profile, wallet, deposits, transactions, investments, roi, referrals)
export const getAdminUserDetail = async (id) => {
  const { data } = await apiClient.get(`/admin/users/${id}`);
  return data.data;
};

// Admin: all investments (platform-wide)
export const getAdminInvestments = async (params = {}) => {
  const { data } = await apiClient.get('/admin/investments', { params });
  return data.data;
};

// Admin: all transactions (platform-wide)
export const getAdminTransactions = async (params = {}) => {
  const { data } = await apiClient.get('/admin/transactions', { params });
  return data.data;
};

// Admin: get system settings
export const getAdminSettings = async () => {
  const { data } = await apiClient.get('/admin/settings');
  return data.data;
};

// Admin: update system settings
export const updateAdminSettings = async (payload) => {
  const { data } = await apiClient.put('/admin/settings', payload);
  return data.data;
};

// Admin: manually trigger ROI processing
export const processRoi = async (payload = {}) => {
  const { data } = await apiClient.post('/admin/roi/process', payload);
  return data.data;
};

// Admin: manually process ROI for all active investments at a given percentage
export const processRoiManual = async (payload = {}) => {
  const { data } = await apiClient.post('/admin/roi/process-manual', payload);
  return data.data;
};

// ==========================================
// BANK ACCOUNTS
// ==========================================

// Public: get active bank accounts (for user deposit page)
export const getBankAccounts = async () => {
  const { data } = await apiClient.get('/bank-accounts');
  return data.data;
};

// Admin: get all bank accounts
export const getAdminBankAccounts = async () => {
  const { data } = await apiClient.get('/bank-accounts/admin');
  return data.data;
};

// Admin: create bank account
export const createBankAccount = async (payload) => {
  const { data } = await apiClient.post('/bank-accounts/admin', payload);
  return data.data;
};

// Admin: update bank account
export const updateBankAccount = async (id, payload) => {
  const { data } = await apiClient.put(`/bank-accounts/admin/${id}`, payload);
  return data.data;
};

// Admin: delete bank account
export const deleteBankAccount = async (id) => {
  const { data } = await apiClient.delete(`/bank-accounts/admin/${id}`);
  return data.data;
};

// User: profile
export const getMyProfile = async () => {
  const { data } = await apiClient.get('/users/profile');
  return data.data;
};

export const updateMyProfile = async (payload) => {
  const { data } = await apiClient.put('/users/profile', payload);
  return data.data;
};

// User: activate account (deducts activation fee from main wallet)
export const activateAccount = async () => {
  const { data } = await apiClient.post('/users/activate');
  return data.data;
};

// User: get public config (activation fee, etc.)
export const getUserConfig = async () => {
  const { data } = await apiClient.get('/users/config');
  return data.data;
};

// User: ROI history
export const getMyRoiHistory = async () => {
  const { data } = await apiClient.get('/roi/history');
  return data.data;
};

// User: referral downlines
export const getMyDownlines = async () => {
  const { data } = await apiClient.get('/users/downlines');
  return data.data;
};

// User: referral upline
export const getMyUpline = async () => {
  const { data } = await apiClient.get('/users/upline');
  return data.data;
};

// User: referral tree (nested)
export const getMyReferralTree = async () => {
  const { data } = await apiClient.get('/users/tree');
  return data.data;
};

// User: enriched referral data (stats + direct + indirect + tree)
export const getEnrichedReferralData = async () => {
  const { data } = await apiClient.get('/users/referrals/enriched');
  return data.data;
};

// User: referral stats only
export const getReferralStats = async () => {
  const { data } = await apiClient.get('/users/referrals/stats');
  return data.data;
};

// User: get progress data for 2X and 3X milestones
export const getProgressData = async () => {
  const { data } = await apiClient.get('/users/progress');
  return data.data;
};

// ==========================================
// WALLET TRANSFERS
// ==========================================

// User: transfer ROI wallet to main wallet
export const transferRoiToMain = async () => {
  const { data } = await apiClient.post('/wallet/transfer/roi');
  return data.data;
};

// User: transfer profit share wallet to main wallet
export const transferProfitShareToMain = async () => {
  const { data } = await apiClient.post('/wallet/transfer/profit-share');
  return data.data;
};

// User: transfer fund wallet to another user
export const transferFundToUser = async (payload) => {
  const { data } = await apiClient.post('/wallet/transfer/fund', payload);
  return data.data;
};

// User: transfer main wallet to fund wallet
export const transferMainToFund = async (payload) => {
  const { data } = await apiClient.post('/wallet/transfer/main-to-fund', payload);
  return data.data;
};

// User: activate account with wallet source
export const activateAccountWithSource = async (walletSource) => {
  const { data } = await apiClient.post('/users/activate', { walletSource });
  return data.data;
};

// User: invest for downline using E-Wallet + Main Wallet
export const investForDownline = async (payload) => {
  const { data } = await apiClient.post('/investments/downline', payload);
  return data.data;
};

// User: get transfer settings (ROI & Profit Share)
export const getTransferSettings = async () => {
  const { data } = await apiClient.get('/wallet/transfer-settings');
  return data.data;
};

// ==========================================
// ADMIN - PROFIT SHARE & TRANSFERS
// ==========================================

// Admin: distribute profit share to all users
export const distributeProfitShare = async (payload) => {
  const { data } = await apiClient.post('/admin/profit-share/distribute', payload);
  return data.data;
};

// Admin: trigger ROI transfer for all users
export const triggerRoiTransfer = async () => {
  const { data } = await apiClient.post('/admin/roi/transfer');
  return data.data;
};

// Admin: trigger profit share transfer for all users
export const triggerProfitShareTransfer = async () => {
  const { data } = await apiClient.post('/admin/profit-share/transfer');
  return data.data;
};

// ==========================================
// ADMIN - REFERRAL NETWORK MANAGEMENT
// ==========================================

// Admin: platform-wide referral network stats
export const getAdminReferralStats = async () => {
  const { data } = await apiClient.get('/admin/referrals/stats');
  return data.data;
};

// Admin: search users for referral explorer
export const searchAdminReferralMembers = async (query) => {
  const { data } = await apiClient.get('/admin/referrals/search', { params: { q: query } });
  return data.data;
};

// Admin: get enriched referral tree for any user
export const getAdminReferralTree = async (userId, maxDepth = 10) => {
  const { data } = await apiClient.get(`/admin/referrals/tree/${userId}`, { params: { maxDepth } });
  return data.data;
};

// Admin: get member detail with upline path and downline summary
export const getAdminReferralMemberDetail = async (userId) => {
  const { data } = await apiClient.get(`/admin/referrals/member/${userId}`);
  return data.data;
};

// Admin: paginated/sorted member list with filters
export const getAdminReferralMembers = async (params = {}) => {
  const { data } = await apiClient.get('/admin/referrals/members', { params });
  return data.data;
};

// ==================== ANNOUNCEMENTS ====================
export const getAnnouncements = async (params = {}) => {
  const { data } = await apiClient.get('/announcements', { params });
  return data;
};

export const getActiveAnnouncements = async () => {
  const { data } = await apiClient.get('/announcements/active');
  return data;
};

export const createAnnouncement = async (payload) => {
  const { data } = await apiClient.post('/announcements', payload);
  return data;
};

export const updateAnnouncement = async (id, payload) => {
  const { data } = await apiClient.put(`/announcements/${id}`, payload);
  return data;
};

export const deleteAnnouncement = async (id) => {
  const { data } = await apiClient.delete(`/announcements/${id}`);
  return data;
};

export const toggleAnnouncement = async (id) => {
  const { data } = await apiClient.patch(`/announcements/${id}/toggle`);
  return data;
};

// ==================== CHAT ====================
export const getUserConversations = async () => {
  const { data } = await apiClient.get('/chat/user/conversations');
  return data;
};

export const getUserMessages = async (id) => {
  const { data } = await apiClient.get(`/chat/user/conversations/${id}`);
  return data;
};

export const createUserConversation = async (payload) => {
  const { data } = await apiClient.post('/chat/user/conversations', payload);
  return data;
};

export const sendUserMessage = async (id, message) => {
  const { data } = await apiClient.post(`/chat/user/conversations/${id}/messages`, { message });
  return data;
};

export const closeConversation = async (id) => {
  const { data } = await apiClient.patch(`/chat/user/conversations/${id}/close`);
  return data;
};

// Admin chat
export const getAdminConversations = async (params = {}) => {
  const { data } = await apiClient.get('/chat/admin/conversations', { params });
  return data;
};

export const getAdminChatMessages = async (id) => {
  const { data } = await apiClient.get(`/chat/admin/conversations/${id}`);
  return data;
};

export const sendAdminMessage = async (id, message) => {
  const { data } = await apiClient.post(`/chat/admin/conversations/${id}/messages`, { message });
  return data;
};

export const updateConversationStatus = async (id, status) => {
  const { data } = await apiClient.patch(`/chat/admin/conversations/${id}/status`, { status });
  return data;
};

export const getAdminChatUnread = async () => {
  const { data } = await apiClient.get('/chat/admin/unread');
  return data;
};