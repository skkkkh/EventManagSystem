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

  getPendingPayments: async () => {
    const response = await API.get('/api/Bookings/pending-payments');
    return response.data;
  },

  confirmPayment: async (bookingId) => {
    const response = await API.put(`/api/Bookings/${bookingId}/confirm-payment`);
    return response.data;
  },
};
