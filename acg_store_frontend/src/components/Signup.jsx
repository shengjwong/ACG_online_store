import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';

function Signup({ onLoginSuccess }) {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', phone_number: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await api.post('/register', formData);
      const { access_token, user } = response.data;

      localStorage.setItem('access_token', access_token);
      localStorage.setItem('user', JSON.stringify(user));

      if (onLoginSuccess) onLoginSuccess(user);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Check inputs.');
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '4rem auto', padding: '2rem', background: '#1e1e1e', borderRadius: '10px', color: '#fff' }}>
      <h2>Create an Account</h2>
      {error && <div style={{ background: '#e53935', padding: '0.5rem', borderRadius: '4px', marginBottom: '1rem' }}>{error}</div>}
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>Full Name</label>
          <input 
            type="text" name="name" required value={formData.name} onChange={handleChange}
            style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #444', background: '#2a2a2a', color: '#fff' }}
          />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>Email Address</label>
          <input 
            type="email" name="email" required value={formData.email} onChange={handleChange}
            style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #444', background: '#2a2a2a', color: '#fff' }}
          />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>Phone Number</label>
          <input 
            type="text" name="phone_number" value={formData.phone_number} onChange={handleChange} placeholder="+60..."
            style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #444', background: '#2a2a2a', color: '#fff' }}
          />
        </div>
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>Password</label>
          <input 
            type="password" name="password" required value={formData.password} onChange={handleChange}
            style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #444', background: '#2a2a2a', color: '#fff' }}
          />
        </div>
        <button type="submit" style={{ width: '100%', padding: '0.75rem', background: '#4caf50', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
          Register Account
        </button>
      </form>
      <p style={{ marginTop: '1rem', textAlign: 'center', color: '#aaa' }}>
        Already have an account? <Link to="/login" style={{ color: '#646cff' }}>Log in</Link>
      </p>
    </div>
  );
}

export default Signup;