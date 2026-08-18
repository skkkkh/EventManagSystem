import API from './api';

export const eventService = {
    // Fetch all events from the backend API
    getAllEvents: async () => {
        try {
            const response = await API.get('/api/events');
            return response.data;
        } catch (error) {
            console.error('Error fetching events:', error);
            throw error;
        }
    },

    // Create a new event via the backend API
    createEvent: async (eventData) => {
        try {
            const response = await API.post('/api/events', eventData);
            return response.data;
        } catch (error) {
            console.error('Error creating event:', error);
            throw error;
        }
    },
};