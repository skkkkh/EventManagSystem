import API from './api';

export const bookingService = {
  guestCheckout: async (payload) => {
    const response = await API.post('/api/Bookings/guest-checkout', payload);
    return response.data;
  },

  getMine: async () => {
    const response = await API.get('/api/Bookings/mine');
    return response.data;
  },
};