import API from './api';

export const paymentService = {
  createPayment: async (bookingId, paymentMethod) => {
    const response = await API.post('/api/Payments', {
      bookingId,
      paymentMethod,
    });
    return response.data;
  },
};