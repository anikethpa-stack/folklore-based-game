import api from './axios';

export const userApi = {
  // Get full user profile
  getProfile: async () => {
    const response = await api.get('/users/profile');
    return response.data;
  },

  // Update profile
  updateProfile: async (data) => {
    const response = await api.patch('/users/profile', data);
    return response.data;
  },

  // Get user bookmarks
  getBookmarks: async () => {
    const response = await api.get('/bookmarks');
    return response.data;
  },

  // Bookmark a game
  addBookmark: async (gameId) => {
    const response = await api.post(`/bookmarks/${gameId}`);
    return response.data;
  },

  // Remove a bookmark
  removeBookmark: async (gameId) => {
    const response = await api.delete(`/bookmarks/${gameId}`);
    return response.data;
  },
};

export default userApi;

