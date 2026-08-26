import API from './api';

export const recommendationService = {
  getForUser: async (userId) => {
    const response = await API.get(`/api/Recommendations/user/${userId}`);
    return response.data;
  },
};