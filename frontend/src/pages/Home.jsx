import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { eventService } from './eventService';

function Home() {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const fetchEvents = async () => {
        try {
            setLoading(true);
            const data = await eventService.getAllEvents();
            setEvents(data);
        } catch (err) {
            console.error(err);
            setError('Failed to load events from the database.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEvents();
    }, []);

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this event?')) {
            try {
                await eventService.deleteEvent(id);
                setEvents(events.filter(ev => ev.id !== id));
            } catch (err) {
                console.error(err);
                alert('Failed to delete event.');
            }
        }
    };

    return (
        <div style={{ padding: '30px', fontFamily: 'Arial', maxWidth: '800px', margin: '0 auto', color: '#fff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h1>Manage Events Database</h1>
                <button 
                    onClick={() => navigate('/create-event')} 
                    style={{ padding: '10px 20px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                    + Add Event
                </button>
            </div>

            {loading && <p>Loading events...</p>}
            {error && <p style={{ color: 'red' }}>{error}</p>}

            {!loading && !error && events.length === 0 && (
                <p>No events found in the database. Click "+ Add Event" to create one!</p>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {events.map((ev) => (
                    <div key={ev.id} style={{ background: '#1e1e1e', padding: '20px', borderRadius: '8px', border: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h3 style={{ margin: '0 0 8px 0' }}>{ev.title}</h3>
                            <p style={{ margin: '0 0 5px 0', color: '#bbb' }}>{ev.description}</p>
                            <small style={{ color: '#888' }}>Location: {ev.location || 'N/A'} | Capacity: {ev.capacity || 'Unlimited'}</small>
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button 
                                onClick={() => navigate(`/edit-event/${ev.id}`)} 
                                style={{ padding: '6px 14px', background: '#17a2b8', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                            >
                                Edit
                            </button>
                            <button 
                                onClick={() => handleDelete(ev.id)} 
                                style={{ padding: '6px 14px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default Home;