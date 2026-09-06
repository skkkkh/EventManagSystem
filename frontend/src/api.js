import axios from 'axios';

const API = axios.create({
  // Relative — goes through Vite's dev-server proxy (vite.config.js) to the
  // backend, so the browser only ever talks to its own origin. In a real
  // build this would need to be an actual API origin/env var instead.
  baseURL: '',
  headers: {
    'Content-Type': 'application/json',
  },
});

API.interceptors.request.use((config) => {
  const user = JSON.parse(localStorage.getItem('user'));
  if (user && user.token) {
    config.headers.Authorization = `Bearer ${user.token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default API;