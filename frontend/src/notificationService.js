import API from './api';

export const notificationService = {
  getUnreadForUser: async (userId) => {
    const response = await API.get(`/api/notifications/user/${userId}`);
    return response.data;
  },

  markAsRead: async (notificationId) => {
    const response = await API.patch(`/api/notifications/${notificationId}/read`);
    return response.data;
  },
};