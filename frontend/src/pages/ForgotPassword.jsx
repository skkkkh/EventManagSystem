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

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await authService.forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(err.response?.data || 'Failed to send reset code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ fontFamily: fontBody, background: colors.bg, minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
      <div style={{ background: colors.card, padding: '40px', borderRadius: '20px', width: '100%', maxWidth: '420px', boxShadow: '0 15px 35px rgba(127,19,48,0.08)', border: `1px solid ${colors.roseSoft}` }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ fontSize: '40px', marginBottom: '10px' }}>🔑</div>
          <h2 style={{ fontFamily: fontDisplay, color: colors.ink, margin: '0 0 8px 0', fontSize: '26px' }}>Forgot Password</h2>
          <p style={{ fontSize: '13px', color: colors.muted }}>Enter your email and we'll send you a reset code.</p>
        </div>

        {sent ? (
          <>
            <div style={{ background: '#DCFCE7', color: '#166534', padding: '12px', borderRadius: '8px', fontSize: '13px', marginBottom: '20px', textAlign: 'center' }}>
              If an account exists for that email, a reset code has been sent.
            </div>
            <button
              onClick={() => navigate('/reset-password', { state: { email } })}
              style={{ width: '100%', background: colors.wine, color: '#fff', border: 'none', padding: '14px', borderRadius: '10px', fontWeight: 600, cursor: 'pointer' }}
            >
              I have my code →
            </button>
          </>
        ) : (
          <>
            {error && <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '12px', borderRadius: '8px', fontSize: '13px', marginBottom: '20px', textAlign: 'center' }}>{typeof error === 'string' ? error : 'Failed to send reset code.'}</div>}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: colors.ink, marginBottom: '6px' }}>Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ width: '100%', padding: '12px', borderRadius: '10px', border: `1px solid ${colors.roseSoft}`, outline: 'none' }} />
              </div>
              <button type="submit" disabled={loading} style={{ background: colors.wine, color: '#fff', border: 'none', padding: '14px', borderRadius: '10px', fontWeight: 600, cursor: 'pointer', marginTop: '6px' }}>
                {loading ? 'Sending...' : 'Send Reset Code'}
              </button>
            </form>
          </>
        )}

        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <Link to="/login" style={{ color: colors.wine, textDecoration: 'none', fontSize: '14px', fontWeight: 600 }}>← Back to Log In</Link>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
