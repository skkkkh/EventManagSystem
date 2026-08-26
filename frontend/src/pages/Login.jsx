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

function Login({ setCurrentUser }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const user = await authService.login(email, password);
      setCurrentUser(user);
      navigate('/events');
    } catch (err) {
      setError(err.response?.data || 'Failed to login. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ fontFamily: fontBody, background: colors.bg, minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
      <div style={{ background: colors.card, padding: '40px', borderRadius: '20px', width: '100%', maxWidth: '420px', boxShadow: '0 15px 35px rgba(127,19,48,0.08)', border: `1px solid ${colors.roseSoft}` }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ fontSize: '40px', marginBottom: '10px' }}>🎟️</div>
          <h2 style={{ fontFamily: fontDisplay, color: colors.ink, margin: '0 0 8px 0', fontSize: '26px' }}>Welcome Back</h2>
          <p style={{ fontSize: '13px', color: colors.muted }}>Log in to book events and track your notifications.</p>
        </div>

        {error && <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '12px', borderRadius: '8px', fontSize: '13px', marginBottom: '20px', textAlign: 'center' }}>{typeof error === 'string' ? error : 'Login failed.'}</div>}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: colors.ink, marginBottom: '6px' }}>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ width: '100%', padding: '12px', borderRadius: '10px', border: `1px solid ${colors.roseSoft}`, outline: 'none' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: colors.ink, marginBottom: '6px' }}>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ width: '100%', padding: '12px', borderRadius: '10px', border: `1px solid ${colors.roseSoft}`, outline: 'none' }} />
          </div>
          <button type="submit" disabled={loading} style={{ background: colors.wine, color: '#fff', border: 'none', padding: '14px', borderRadius: '10px', fontWeight: 600, cursor: 'pointer', marginTop: '6px' }}>
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        <p style={{ marginTop: '16px', textAlign: 'center', fontSize: '13px', color: colors.muted }}>
          Don't have an account? <Link to="/register" style={{ color: colors.wine, fontWeight: 600, textDecoration: 'none' }}>Register here</Link>
        </p>
        <div style={{ textAlign: 'center', marginTop: '10px' }}>
          <Link to="/" style={{ color: colors.muted, textDecoration: 'none', fontSize: '13px' }}>← Back to Home</Link>
        </div>
      </div>
    </div>
  );
}

export default Login;