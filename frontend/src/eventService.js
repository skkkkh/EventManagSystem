// eventService.js
const API_BASE_URL = 'http://localhost:5080/api/events';

const getAuthHeaders = () => {
  let token = null;

  const userJson = localStorage.getItem('user');
  if (userJson) {
    try {
      const userData = JSON.parse(userJson);
      token = userData.token || userData.accessToken || userData.jwt || userData.authToken;
    } catch (err) {
      console.error("Error parsing user from localStorage", err);
    }
  }

  if (!token) {
    token = localStorage.getItem('token') || 
            localStorage.getItem('authToken') || 
            localStorage.getItem('accessToken') ||
            localStorage.getItem('jwt');
  }

  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

export const eventService = {
  async getAllEvents() {
    const response = await fetch(API_BASE_URL);
    if (!response.ok) throw new Error('Failed to fetch events');
    return response.json();
  },

  async createEvent(eventData) {
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(eventData),
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Failed to create event');
    }
    return response.json();
  },

  async updateEvent(id, eventData) {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(eventData),
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Failed to update event');
    }
    return response.text().then(text => text ? JSON.parse(text) : {});
  },

  async deleteEvent(id) {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Failed to delete event');
    }
    return response.text().then(text => text ? JSON.parse(text) : {});
  }
};