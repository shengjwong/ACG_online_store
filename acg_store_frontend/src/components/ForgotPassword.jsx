import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import '../styles/Auth.css';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/forgot-password', { email: email.trim() });
      setMessage(response.data.message || 'Reset link sent! Please check your email inbox.');
    } catch (err) {
      // Extract Laravel validation error messages if available
      const apiError = err.response?.data?.errors?.email?.[0] || err.response?.data?.message || 'Failed to send reset link. Please try again.';
      setError(apiError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-wrapper">
      <div className="auth-container">
        <h2 className="auth-title">Reset Password</h2>

        {message && (
          <div style={{ background: 'rgba(76, 175, 80, 0.2)', border: '1px solid #4caf50', color: '#81c784', padding: '0.65rem 0.85rem', borderRadius: '8px', fontSize: '0.88rem', marginBottom: '1.25rem', textAlign: 'center' }}>
            {message}
          </div>
        )}
        {error && <div className="auth-error-box">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="auth-form-group">
            <label className="auth-label">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="auth-input"
              placeholder="name@example.com"
            />
          </div>

          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <p className="auth-footer-text">
          Remember your password? <Link to="/login" className="auth-link">Log in</Link>
        </p>
      </div>
    </div>
  );
}

export default ForgotPassword;