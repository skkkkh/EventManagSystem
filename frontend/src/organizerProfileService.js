// organizerProfileService.js
// An organizer's public "About Us" bio + leadership team — mirrors the
// Flutter app's organizer profile feature. Backed by OrganizerProfileController.
import API from './api';

export const organizerProfileService = {
  getProfile: async (organizerId) => {
    const response = await API.get(`/api/OrganizerProfile/${organizerId}`);
    return response.data;
  },

  updateAboutUs: async (aboutUs) => {
    const response = await API.put('/api/OrganizerProfile/about-us', { aboutUs });
    return response.data;
  },

  addTeamMember: async (member) => {
    const response = await API.post('/api/OrganizerProfile/team', member);
    return response.data;
  },

  updateTeamMember: async (id, member) => {
    const response = await API.put(`/api/OrganizerProfile/team/${id}`, member);
    return response.data;
  },

  deleteTeamMember: async (id) => {
    await API.delete(`/api/OrganizerProfile/team/${id}`);
  },
};
