import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
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

function ResetPassword() {
  const location = useLocation();
  const [email, setEmail] = useState(location.state?.email || '');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      await authService.resetPassword(email, token.trim(), newPassword);
      setDone(true);
    } catch (err) {
      setError(err.response?.data || 'Failed to reset password. Check your code and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ fontFamily: fontBody, background: colors.bg, minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
      <div style={{ background: colors.card, padding: '40px', borderRadius: '20px', width: '100%', maxWidth: '420px', boxShadow: '0 15px 35px rgba(127,19,48,0.08)', border: `1px solid ${colors.roseSoft}` }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ fontSize: '40px', marginBottom: '10px' }}>🔐</div>
          <h2 style={{ fontFamily: fontDisplay, color: colors.ink, margin: '0 0 8px 0', fontSize: '26px' }}>Reset Password</h2>
          <p style={{ fontSize: '13px', color: colors.muted }}>Paste the code from your email and choose a new password.</p>
        </div>

        {done ? (
          <>
            <div style={{ background: '#DCFCE7', color: '#166534', padding: '12px', borderRadius: '8px', fontSize: '13px', marginBottom: '20px', textAlign: 'center' }}>
              Password reset! You can now log in with your new password.
            </div>
            <button
              onClick={() => navigate('/login')}
              style={{ width: '100%', background: colors.wine, color: '#fff', border: 'none', padding: '14px', borderRadius: '10px', fontWeight: 600, cursor: 'pointer' }}
            >
              Go to Log In
            </button>
          </>
        ) : (
          <>
            {error && <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '12px', borderRadius: '8px', fontSize: '13px', marginBottom: '20px', textAlign: 'center' }}>{typeof error === 'string' ? error : 'Failed to reset password.'}</div>}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: colors.ink, marginBottom: '6px' }}>Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ width: '100%', padding: '12px', borderRadius: '10px', border: `1px solid ${colors.roseSoft}`, outline: 'none' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: colors.ink, marginBottom: '6px' }}>Reset Code</label>
                <input type="text" value={token} onChange={(e) => setToken(e.target.value)} required placeholder="Paste the code from your email" style={{ width: '100%', padding: '12px', borderRadius: '10px', border: `1px solid ${colors.roseSoft}`, outline: 'none' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: colors.ink, marginBottom: '6px' }}>New Password</label>
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: `1px solid ${colors.roseSoft}`, outline: 'none' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: colors.ink, marginBottom: '6px' }}>Confirm New Password</label>
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={6} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: `1px solid ${colors.roseSoft}`, outline: 'none' }} />
              </div>
              <button type="submit" disabled={loading} style={{ background: colors.wine, color: '#fff', border: 'none', padding: '14px', borderRadius: '10px', fontWeight: 600, cursor: 'pointer', marginTop: '6px' }}>
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          </>
        )}

        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <Link to="/forgot-password" style={{ color: colors.wine, textDecoration: 'none', fontSize: '14px', fontWeight: 600 }}>Didn't get a code? Try again</Link>
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;
