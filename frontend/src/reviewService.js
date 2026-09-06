import API from './api';

export const reviewService = {
  getPending: async () => {
    const response = await API.get('/api/Reviews/pending');
    return response.data;
  },

  getSummary: async (eventId) => {
    const response = await API.get(`/api/Reviews/event/${eventId}/summary`);
    return response.data;
  },

  submitReview: async (eventId, rating, comment) => {
    const response = await API.post(`/api/Reviews/event/${eventId}`, {
      rating,
      comment,
    });
    return response.data;
  },
};