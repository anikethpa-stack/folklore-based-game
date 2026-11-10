import api from './axios';

export const faqApi = {
  // Get all FAQs (with optional category filter)
  getFaqs: async (params = {}) => {
    const response = await api.get('/faqs', { params });
    return response.data;
  },

  // Get specific FAQ by ID
  getFaqById: async (id) => {
    const response = await api.get(`/faqs/${id}`);
    return response.data;
  },

  // Get game-specific FAQs
  getGameFaqs: async (gameId) => {
    const response = await api.get(`/games/${gameId}/faqs`);
    return response.data;
  },
};

export default faqApi;

