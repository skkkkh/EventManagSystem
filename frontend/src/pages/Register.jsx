import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../authService';

const colors = {
  bg: '#FFF8F4',
  card: '#FFFFFF',
  wine: '#7F1330',
  roseSoft: '#F3DDE3',
  ink: '#2D2326',
  muted: '#8A7478',
};
const fontDisplay = "'Fraunces', Georgia, serif";
const fontBody = "'Inter', 'Segoe UI', sans-serif";

function Register({ setCurrentUser }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [interests, setInterests] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const user = await authService.register(name, email, password, 'Attendee', interests || null);
      setCurrentUser(user);
      navigate('/events');
    } catch (err) {
      setError(err.response?.data || 'Failed to register.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ fontFamily: fontBody, background: colors.bg, minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
      <div style={{ background: colors.card, padding: '40px', borderRadius: '20px', width: '100%', maxWidth: '420px', boxShadow: '0 15px 35px rgba(127,19,48,0.08)', border: `1px solid ${colors.roseSoft}` }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ fontSize: '40px', marginBottom: '10px' }}>🙋</div>
          <h2 style={{ fontFamily: fontDisplay, color: colors.ink, margin: '0 0 8px 0', fontSize: '26px' }}>Create Your Account</h2>
          <p style={{ fontSize: '13px', color: colors.muted }}>Register to book events and get notified about updates.</p>
        </div>

        {error && <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '12px', borderRadius: '8px', fontSize: '13px', marginBottom: '20px', textAlign: 'center' }}>{typeof error === 'string' ? error : JSON.stringify(error)}</div>}

        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: colors.ink, marginBottom: '6px' }}>Full Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required style={{ width: '100%', padding: '12px', borderRadius: '10px', border: `1px solid ${colors.roseSoft}`, outline: 'none' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: colors.ink, marginBottom: '6px' }}>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ width: '100%', padding: '12px', borderRadius: '10px', border: `1px solid ${colors.roseSoft}`, outline: 'none' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: colors.ink, marginBottom: '6px' }}>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ width: '100%', padding: '12px', borderRadius: '10px', border: `1px solid ${colors.roseSoft}`, outline: 'none' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: colors.ink, marginBottom: '6px' }}>
              Your Interests <span style={{ fontWeight: 400, color: colors.muted }}>(optional)</span>
            </label>
            <input
              type="text"
              value={interests}
              onChange={(e) => setInterests(e.target.value)}
              placeholder="e.g. tech, science, entertainment"
              style={{ width: '100%', padding: '12px', borderRadius: '10px', border: `1px solid ${colors.roseSoft}`, outline: 'none' }}
            />
            <p style={{ fontSize: '11px', color: colors.muted, margin: '6px 0 0 0' }}>
              We'll use this to recommend events you might like. Separate with commas.
            </p>
          </div>
          <button type="submit" disabled={loading} style={{ background: colors.wine, color: '#fff', border: 'none', padding: '14px', borderRadius: '10px', fontWeight: 600, cursor: 'pointer', marginTop: '6px' }}>
            {loading ? 'Creating account...' : 'Register'}
          </button>
        </form>

        <p style={{ marginTop: '16px', textAlign: 'center', fontSize: '13px', color: colors.muted }}>
          Already have an account? <Link to="/login" style={{ color: colors.wine, fontWeight: 600, textDecoration: 'none' }}>Login here</Link>
        </p>
        <div style={{ textAlign: 'center', marginTop: '10px' }}>
          <Link to="/" style={{ color: colors.muted, textDecoration: 'none', fontSize: '13px' }}>← Back to Home</Link>
        </div>
      </div>
    </div>
  );
}

export default Register;