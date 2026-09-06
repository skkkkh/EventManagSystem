// userService.js
import API from './api';

export const userService = {
  search: async (query) => {
    const response = await API.get('/api/Users/search', { params: { query } });
    return response.data;
  },
};