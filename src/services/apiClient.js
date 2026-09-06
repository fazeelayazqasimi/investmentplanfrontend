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

export const getMyInvestments = async () => {
  const { data } = await apiClient.get('/investments');
  return data.data;
};

export const getMyWallet = async () => {
  const { data } = await apiClient.get('/wallet');
  return data.data;
};

export const getMyTransactions = async () => {
  const { data } = await apiClient.get('/wallet/transactions');
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
export const processRoi = async () => {
  const { data } = await apiClient.post('/admin/roi/process');
  return data.data;
};

// User: active investment plans catalog
export const getPlans = async () => {
  const { data } = await apiClient.get('/investments/plans');
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