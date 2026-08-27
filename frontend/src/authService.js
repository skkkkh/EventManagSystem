import API from './api';

export const authService = {
  login: async (email, password) => {
    const response = await API.post('/api/auth/login', { email, password });
    if (response.data.token) {
      localStorage.setItem('user', JSON.stringify(response.data));
    }
    return response.data;
  },

  register: async (name, email, password, role, interests, identificationNumber) => {
    const response = await API.post('/api/auth/register', {
      name,
      email,
      password,
      role,
      interests,
      identificationNumber
    });
    if (response.data.token) {
      localStorage.setItem('user', JSON.stringify(response.data));
    }
    return response.data;
  },

  updateInterests: async (interests) => {
    const response = await API.put('/api/auth/interests', { interests });
    if (response.data.token) {
      localStorage.setItem('user', JSON.stringify(response.data));
    }
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('user');
  },

  getCurrentUser: () => {
    return JSON.parse(localStorage.getItem('user'));
  },
};