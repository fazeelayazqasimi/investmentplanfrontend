import apiClient from './apiClient';

/**
 * Registers a new user.
 * @param {Object} payload - { name, email, phone, password, confirmPassword, referralCode, emailVerifyToken }
 * @returns {Promise<Object>} response data: { user, token }
 */
const register = async (payload) => {
  const response = await apiClient.post('/auth/register', payload);
  return response.data.data;
};

/**
 * Sends registration OTP to email (register step 1).
 * @param {string} email
 * @returns {Promise<Object>} response data
 */
const sendRegisterOtp = async (email) => {
  const response = await apiClient.post('/auth/register/send-otp', { email });
  return response.data;
};

/**
 * Verifies the 4-digit registration OTP (register step 2).
 * @param {string} email
 * @param {string} code - 4-digit OTP
 * @returns {Promise<Object>} response data: { emailVerifyToken }
 */
const verifyEmail = async (email, code) => {
  const response = await apiClient.post('/auth/verify-email', { email, code });
  return response.data.data;
};

/**
 * Resends OTP code to email (for password reset).
 * @param {string} email
 * @param {string} purpose - 'PASSWORD_RESET'
 * @returns {Promise<Object>} response data
 */
const resendOtp = async (email, purpose = 'PASSWORD_RESET') => {
  const response = await apiClient.post('/auth/resend-otp', { email, purpose });
  return response.data;
};

/**
 * Logs in an existing user.
 * @param {Object} payload - { email, password }
 * @returns {Promise<Object>} response data: { user, token }
 */
const login = async (payload) => {
  const response = await apiClient.post('/auth/login', payload);
  return response.data.data;
};

/**
 * Sends password reset OTP to email.
 * @param {string} email
 * @returns {Promise<Object>} response data
 */
const forgotPassword = async (email) => {
  const response = await apiClient.post('/auth/forgot-password', { email });
  return response.data;
};

/**
 * Resets password with OTP code.
 * @param {string} email
 * @param {string} code - 4-digit OTP
 * @param {string} newPassword
 * @returns {Promise<Object>} response data
 */
const resetPassword = async (email, code, newPassword) => {
  const response = await apiClient.post('/auth/reset-password', { email, code, newPassword });
  return response.data;
};

/**
 * Logs out the current user (server-side call for API consistency;
 * actual session clearing happens client-side via AuthContext).
 */
const logout = async () => {
  const response = await apiClient.post('/auth/logout');
  return response.data;
};

/**
 * Fetches the currently logged-in user's data using the stored token.
 * @returns {Promise<Object>} response data: { user }
 */
const getMe = async () => {
  const response = await apiClient.get('/auth/me');
  return response.data.data;
};

export default {
  register,
  sendRegisterOtp,
  verifyEmail,
  resendOtp,
  login,
  forgotPassword,
  resetPassword,
  logout,
  getMe,
};
