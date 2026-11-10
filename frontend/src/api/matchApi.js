import api from './axios';

export const matchApi = {
  // Start a new match
  createMatch: async (matchData) => {
    const response = await api.post('/matches', matchData);
    return response.data;
  },

  // Get current match state by ID
  getMatchById: async (id) => {
    const response = await api.get(`/matches/${id}`);
    return response.data;
  },

  // Submit a move for authoritative backend validation
  submitMove: async (matchId, movePayload) => {
    const response = await api.post(`/matches/${matchId}/moves`, movePayload);
    return response.data;
  },

  // Restart a match
  restartMatch: async (matchId) => {
    const response = await api.post(`/matches/${matchId}/restart`);
    return response.data;
  },

  // Get match history for current user
  getMatchHistory: async (params = {}) => {
    const response = await api.get('/matches/history', { params });
    return response.data;
  },
};

export default matchApi;

