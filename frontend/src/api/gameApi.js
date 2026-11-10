import api from './axios';

export const gameApi = {
  // Get all available games
  getGames: async (params = {}) => {
    const response = await api.get('/games', { params });
    return response.data;
  },

  // Get specific game by ID or slug
  getGameById: async (id) => {
    const response = await api.get(`/games/${id}`);
    return response.data;
  },

  // Get regional variants of a game
  getGameVariants: async (id) => {
    const response = await api.get(`/games/${id}/variants`);
    return response.data;
  },
};

export default gameApi;

