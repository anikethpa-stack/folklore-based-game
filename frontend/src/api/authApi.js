import api, { setAccessToken } from './axios';

export const authApi = {
  // Register a new user
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    if (response.data?.accessToken) {
      setAccessToken(response.data.accessToken);
    }
    return response.data;
  },

  // Login existing user
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    if (response.data?.accessToken) {
      setAccessToken(response.data.accessToken);
    }
    return response.data;
  },

  // Refresh access token via HttpOnly cookie
  refresh: async () => {
    const response = await api.post('/auth/refresh');
    if (response.data?.accessToken) {
      setAccessToken(response.data.accessToken);
    }
    return response.data;
  },

  // Logout user and clear tokens
  logout: async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      setAccessToken(null);
    }
  },

  // Get current user profile
  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};

export default authApi;

