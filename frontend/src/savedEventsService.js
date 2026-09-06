// savedEventsService.js
// Bookmarking events for later — mirrors the Flutter app's "Saved Events"
// feature. Backed by SavedEventsController on the API.
import API from './api';

export const savedEventsService = {
  getMine: async () => {
    const response = await API.get('/api/SavedEvents/mine');
    return response.data;
  },

  getStatus: async (eventId) => {
    const response = await API.get(`/api/SavedEvents/${eventId}/status`);
    return response.data;
  },

  save: async (eventId) => {
    const response = await API.post(`/api/SavedEvents/${eventId}`);
    return response.data;
  },

  unsave: async (eventId) => {
    const response = await API.delete(`/api/SavedEvents/${eventId}`);
    return response.data;
  },
};
