import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { COUNTRY_CODES } from '../utils/countryCodes';
import '../styles/Auth.css';

const ALLOWED_EMAIL_REGEX =
  /^[a-zA-Z0-9._%+-]+@(gmail\.com|yahoo\.com|outlook\.com|hotmail\.com|icloud\.com|live\.com|[a-zA-Z0-9.-]+\.(edu\.my|com\.my|org|edu))$/i;

const validateEmailDomain = (email) => {
  const clean = email.trim();
  if (!ALLOWED_EMAIL_REGEX.test(clean)) {
    return 'Please enter a valid email address ending in @gmail.com, @yahoo.com, @outlook.com, @hotmail.com, @icloud.com, etc.';
  }
  return null;
};

function Signup({ onLoginSuccess }) {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');

  const [countryCode, setCountryCode] = useState('+60');
  const [localPhone, setLocalPhone] = useState('');
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => {
      setResendTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  const getFormattedPhone = () => {
    const cleanLocal = localPhone.replace(/^0+/, '');
    return cleanLocal ? `${countryCode}${cleanLocal}` : '';
  };

  const handleSendOtp = async () => {
    setError('');
    setInfoMessage('');

    const emailError = validateEmailDomain(email);
    if (emailError) {
      setError(emailError);
      return;
    }

    const cleanLocal = localPhone.replace(/^0+/, '');
    if (cleanLocal && (cleanLocal.length < 7 || cleanLocal.length > 12)) {
      setError('Please enter a valid phone number (7–12 digits).');
      return;
    }

    const formattedPhoneNumber = getFormattedPhone();

    setSendingOtp(true);
    try {
      const res = await api.post('/register/send-otp', {
        email: email.trim().toLowerCase(),
        phone_number: formattedPhoneNumber || null,
      });
      setOtpSent(true);
      setResendTimer(60);
      setInfoMessage(res.data.message || 'Verification OTP sent! Check your email inbox (or spam folder).');
    } catch (err) {
      const validationErrors = err.response?.data?.errors;
      if (validationErrors) {
        setError(Object.values(validationErrors).flat()[0]);
      } else {
        setError(err.response?.data?.message || 'Failed to send verification OTP.');
      }
    } finally {
      setSendingOtp(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');

    const emailError = validateEmailDomain(email);
    if (emailError) {
      setError(emailError);
      return;
    }

    const cleanLocal = localPhone.replace(/^0+/, '');
    if (cleanLocal && (cleanLocal.length < 7 || cleanLocal.length > 12)) {
      setError('Please enter a valid phone number (7–12 digits).');
      return;
    }

    if (!otpSent || otp.trim().length !== 6) {
      setError('Please click "Send OTP" and enter the 6-digit verification code sent to your email.');
      return;
    }

    if (password !== passwordConfirmation) {
      setError('Passwords do not match');
      return;
    }

    const formattedPhoneNumber = getFormattedPhone();

    try {
      const res = await api.post('/register', {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        otp: otp.trim(),
        password,
        password_confirmation: passwordConfirmation,
        phone_number: formattedPhoneNumber || null,
      });

      const { access_token, user } = res.data;
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('user', JSON.stringify(user));

      if (onLoginSuccess) onLoginSuccess(user);
      navigate('/');
    } catch (err) {
      const validationErrors = err.response?.data?.errors;
      if (validationErrors) {
        setError(Object.values(validationErrors).flat()[0]);
      } else {
        setError(err.response?.data?.message || 'Registration failed.');
      }
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 80px)', padding: '1rem' }}>
      <div className="auth-container" style={{ margin: '0' }}>
        <h2 className="auth-title">Create Account</h2>

        {error && <div className="auth-error-box">{error}</div>}
        {infoMessage && (
          <div
            style={{
              background: 'rgba(76, 175, 80, 0.14)',
              border: '1px solid rgba(76, 175, 80, 0.4)',
              color: '#86EFAC',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              marginBottom: '1.2rem',
              fontSize: '0.88rem',
            }}
          >
            {infoMessage}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="auth-form-group">
            <label className="auth-label">Full Name</label>
            <input
              type="text"
              required
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="auth-input"
            />
          </div>

          <div className="auth-form-group">
            <label className="auth-label">Email Address</label>
            <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
              <input
                type="email"
                required
                placeholder="name@gmail.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (otpSent) {
                    setOtpSent(false);
                    setOtp('');
                  }
                }}
                className="auth-input"
                style={{ flex: 1 }}
              />
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={sendingOtp || resendTimer > 0 || !email.trim()}
                className="auth-submit-btn"
                style={{
                  width: 'auto',
                  padding: '0 1rem',
                  marginTop: 0,
                  fontSize: '0.85rem',
                  whiteSpace: 'nowrap',
                  opacity: sendingOtp || resendTimer > 0 || !email.trim() ? 0.6 : 1,
                }}
              >
                {sendingOtp
                  ? 'Sending...'
                  : resendTimer > 0
                  ? `Resend (${resendTimer}s)`
                  : otpSent
                  ? 'Resend OTP'
                  : 'Send OTP'}
              </button>
            </div>
          </div>

          {otpSent && (
            <div className="auth-form-group">
              <label className="auth-label">Email Verification OTP (6 Digits)</label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                required
                placeholder="Enter 6-digit code from email"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                className="auth-input"
                style={{ letterSpacing: '0.3rem', fontWeight: '700', textAlign: 'center' }}
              />
            </div>
          )}

          <div className="auth-form-group">
            <label className="auth-label">Phone Number</label>
            <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
              <select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                className="auth-input"
                style={{
                  width: '110px',
                  cursor: 'pointer',
                  paddingRight: '0.2rem',
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                }}
              >
                {COUNTRY_CODES.map((c) => (
                  <option key={c.code} value={c.code} style={{ background: '#1e1e1e', color: '#fff' }}>
                    {c.code} ({c.country})
                  </option>
                ))}
              </select>
              <input
                type="tel"
                placeholder="123456789"
                value={localPhone}
                onChange={(e) => setLocalPhone(e.target.value.replace(/\D/g, ''))}
                className="auth-input"
                style={{ flex: 1 }}
              />
            </div>
          </div>

          <div className="auth-form-group">
            <label className="auth-label">Password</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="auth-input"
            />
          </div>

          <div className="auth-form-group" style={{ marginBottom: '1.8rem' }}>
            <label className="auth-label">Confirm Password</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={passwordConfirmation}
              onChange={(e) => setPasswordConfirmation(e.target.value)}
              className="auth-input"
            />
          </div>

          <button type="submit" className="auth-submit-btn">
            Create Account
          </button>
        </form>

        <p className="auth-footer-text">
          Already have an account? <Link to="/login" className="auth-link">Log in</Link>
        </p>
      </div>
    </div>
  );
}

export default Signup;