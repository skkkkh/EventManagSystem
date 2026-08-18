import { useState } from 'react';

const API_BASE = 'https://localhost:7080/api';

function App() {
  const [userId, setUserId] = useState('1');
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchRecommendations = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/Recommendations/user/${userId}`);
      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }
      const data = await response.json();
      setRecommendations(data);
    } catch (err) {
      setError(err.message);
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: 24, fontFamily: 'sans-serif' }}>
      <h1>Recommended for You</h1>

      <div style={{ marginBottom: 20 }}>
        <label>
          User ID:{' '}
          <input
            type="number"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            style={{ padding: 6, marginRight: 8 }}
          />
        </label>
        <button onClick={fetchRecommendations} style={{ padding: '6px 14px' }}>
          Get Recommendations
        </button>
      </div>

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}

      {!loading && !error && recommendations.length === 0 && (
        <p>No recommendations yet — click the button above.</p>
      )}

      {recommendations.map((rec, i) => (
        <div
          key={i}
          style={{
            background: '#fff',
            border: '1px solid #ddd',
            borderRadius: 8,
            padding: 16,
            marginBottom: 12,
          }}
        >
          <strong>{rec.event.title}</strong>
          <p style={{ color: '#555' }}>{rec.event.description}</p>
          <small style={{ color: '#888' }}>
            {new Date(rec.event.startDateTime).toLocaleString()} · {rec.reason}
          </small>
        </div>
      ))}
    </div>
  );
}

export default App;
