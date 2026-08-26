import API from './api';

export const bookingService = {
  guestCheckout: async (payload) => {
    const response = await API.post('/api/Bookings/guest-checkout', payload);
    return response.data;
  },
};