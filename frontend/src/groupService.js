// groupService.js
import API from './api';

export const groupService = {
  getMyGroups: async () => {
    const response = await API.get('/api/Groups');
    return response.data;
  },

  createGroup: async (name) => {
    const response = await API.post('/api/Groups', { name });
    return response.data;
  },

  getMembers: async (groupId) => {
    const response = await API.get(`/api/Groups/${groupId}/members`);
    return response.data;
  },

  addMember: async (groupId, userId) => {
    const response = await API.post(`/api/Groups/${groupId}/members`, { userId });
    return response.data;
  },
};