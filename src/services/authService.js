import apiClient from './apiClient';

/**
 * Registers a new user.
 * @param {Object} payload - { name, email, phone, password, confirmPassword, referralCode }
 * @returns {Promise<Object>} response data: { user, token }
 */
const register = async (payload) => {
  const response = await apiClient.post('/auth/register', payload);
  return response.data.data;
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
  login,
  logout,
  getMe,
};  