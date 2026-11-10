import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { COUNTRY_CODES } from '../utils/countryCodes';

function Signup({ onLoginSuccess }) {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');

  const [countryCode, setCountryCode] = useState('+60');
  const [localPhone, setLocalPhone] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== passwordConfirmation) {
      setError('Passwords do not match');
      return;
    }

    const cleanLocal = localPhone.replace(/^0+/, '');
    const formattedPhoneNumber = localPhone ? `${countryCode}${cleanLocal}` : '';

    try {
      const res = await api.post('/register', {
        name,
        email,
        password,
        password_confirmation: passwordConfirmation,
        phone_number: formattedPhoneNumber,
      });

      const { access_token, user } = res.data;
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('user', JSON.stringify(user));

      onLoginSuccess(user);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.');
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '0.65rem 0.8rem',
    borderRadius: '6px',
    border: '1px solid #333',
    background: '#121212',
    color: '#fff',
    fontSize: '0.95rem',
    outline: 'none',
    boxSizing: 'border-box',
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 80px)', padding: '1rem' }}>
      <div style={{ width: '100%', maxWidth: '420px', padding: '2.5rem 2rem', background: '#1e1e1e', borderRadius: '12px', color: '#fff', border: '1px solid #2e2e2e', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '1.8rem', color: '#646cff', fontSize: '1.8rem', fontWeight: 'bold' }}>
          Create Account
        </h2>

        {error && (
          <div style={{ background: 'rgba(229, 57, 53, 0.2)', border: '1px solid #e53935', color: '#ff6b6b', padding: '0.65rem', borderRadius: '6px', marginBottom: '1.2rem', fontSize: '0.88rem', textAlign: 'center' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ width: '100%' }}>
          <div style={{ marginBottom: '1.2rem' }}>
            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.88rem', color: '#ccc' }}>Full Name</label>
            <input
              type="text"
              required
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: '1.2rem' }}>
            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.88rem', color: '#ccc' }}>Email Address</label>
            <input
              type="email"
              required
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: '1.2rem' }}>
            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.88rem', color: '#ccc' }}>Phone Number</label>
            <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
              <select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                style={{
                  ...inputStyle,
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
                style={{ ...inputStyle, flex: 1 }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '1.2rem' }}>
            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.88rem', color: '#ccc' }}>Password</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: '1.8rem' }}>
            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.88rem', color: '#ccc' }}>Confirm Password</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={passwordConfirmation}
              onChange={(e) => setPasswordConfirmation(e.target.value)}
              style={inputStyle}
            />
          </div>

          <button
            type="submit"
            style={{
              width: '100%',
              padding: '0.75rem',
              background: '#646cff',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '1rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
          >
            Create Account
          </button>
        </form>
      </div>
    </div>
  );
}

export default Signup;