import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';

function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await api.post('/login', { email, password });
      const { access_token, user } = response.data;

      localStorage.setItem('access_token', access_token);
      localStorage.setItem('user', JSON.stringify(user));

      if (onLoginSuccess) onLoginSuccess(user);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password.');
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '4rem auto', padding: '2rem', background: '#1e1e1e', borderRadius: '10px', color: '#fff' }}>
      <h2>Login to ACG Store</h2>
      {error && <div style={{ background: '#e53935', padding: '0.5rem', borderRadius: '4px', marginBottom: '1rem' }}>{error}</div>}
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>Email Address</label>
          <input 
            type="email" 
            required 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #444', background: '#2a2a2a', color: '#fff' }}
          />
        </div>
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>Password</label>
          <input 
            type="password" 
            required 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #444', background: '#2a2a2a', color: '#fff' }}
          />
        </div>
        <button type="submit" style={{ width: '100%', padding: '0.75rem', background: '#646cff', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
          Log In
        </button>
      </form>
      <p style={{ marginTop: '1rem', textAlign: 'center', color: '#aaa' }}>
        Don't have an account? <Link to="/signup" style={{ color: '#646cff' }}>Sign up</Link>
      </p>
    </div>
  );
}

export default Login;