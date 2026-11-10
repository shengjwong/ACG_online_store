import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import api from './api/axios';
import Login from './components/Login';
import Signup from './components/Signup';
import AdminDashboard from './components/AdminDashboard';

function ProductList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetches all products (both active and inactive)
    api.get('/products')
      .then((res) => {
        setProducts(res.data.data || res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <h2 style={{ padding: '2rem', color: '#fff', textAlign: 'center' }}>Loading ACG Catalog...</h2>;

  return (
    <div style={{ padding: '2rem' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>Product Catalog</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.5rem', maxWidth: '1100px', margin: '0 auto' }}>
        {products.map((item) => {
          const imageUrl = item.image
            ? `http://127.0.0.1:8000/storage/${item.image}`
            : 'https://via.placeholder.com/300x200?text=No+Image';

          const isInactive = item.status === 'inactive';

          return (
            <div 
              key={item.id} 
              style={{ 
                border: isInactive ? '1px solid #555' : '1px solid #333', 
                borderRadius: '10px', 
                padding: '1.5rem', 
                background: '#1e1e1e', 
                display: 'flex', 
                flexDirection: 'column', 
                justify: 'space-between',
                position: 'relative',
                opacity: isInactive ? 0.75 : 1,
              }}
            >
              {/* Inactive Badge */}
              {isInactive && (
                <span
                  style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    background: '#e53935',
                    color: '#fff',
                    padding: '0.25rem 0.6rem',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    zIndex: 2,
                    textTransform: 'uppercase',
                  }}
                >
                  Inactive
                </span>
              )}

              <div>
                <img
                  src={imageUrl}
                  alt={item.name}
                  style={{ width: '100%', height: '180px', objectFit: 'cover', borderRadius: '8px', marginBottom: '1rem' }}
                  onError={(e) => { e.target.src = 'https://via.placeholder.com/300x200?text=No+Image'; }}
                />
                <h3 style={{ marginTop: 0, color: isInactive ? '#aaa' : '#646cff', textAlign: 'center' }}>{item.name}</h3>
                <p style={{ color: '#aaa', fontSize: '0.9rem', textAlign: 'center' }}>{item.description}</p>
              </div>
              <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ fontSize: '1.2rem', color: isInactive ? '#888' : '#4caf50' }}>
                  RM {parseFloat(item.price).toFixed(2)}
                </strong>
                <span style={{ fontSize: '0.8rem', color: '#888' }}>Stock: {item.stock}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function App() {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')));

  const handleLogout = () => {
    api.post('/logout').finally(() => {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      setUser(null);
    });
  };

  return (
    <Router>
      <div style={{ minHeight: '100vh', background: '#121212', color: '#fff', fontFamily: 'sans-serif' }}>
        <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 2rem', background: '#1e1e1e', borderBottom: '1px solid #333' }}>
          <Link to="/" style={{ color: '#646cff', fontSize: '1.5rem', fontWeight: 'bold', textDecoration: 'none' }}>
            Online ACG Store
          </Link>
          <div>
            {user ? (
              <span style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                {user.role === 'admin' && (
                  <Link to="/admin" style={{ color: '#ff9800', fontWeight: 'bold', textDecoration: 'none', border: '1px solid #ff9800', padding: '0.4rem 0.8rem', borderRadius: '4px' }}>
                    Admin Dashboard
                  </Link>
                )}
                <span>Welcome, <strong>{user.name}</strong> ({user.role})</span>
                <button onClick={handleLogout} style={{ padding: '0.4rem 0.8rem', background: '#e53935', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                  Logout
                </button>
              </span>
            ) : (
              <div style={{ display: 'flex', gap: '1rem' }}>
                <Link to="/login" style={{ color: '#fff', textDecoration: 'none', padding: '0.4rem 0.8rem', border: '1px solid #444', borderRadius: '4px' }}>Login</Link>
                <Link to="/signup" style={{ color: '#fff', background: '#646cff', textDecoration: 'none', padding: '0.4rem 0.8rem', borderRadius: '4px' }}>Sign Up</Link>
              </div>
            )}
          </div>
        </nav>

        <Routes>
          <Route path="/" element={<ProductList />} />
          <Route path="/login" element={<Login onLoginSuccess={(u) => setUser(u)} />} />
          <Route path="/signup" element={<Signup onLoginSuccess={(u) => setUser(u)} />} />
          <Route 
            path="/admin" 
            element={user && user.role === 'admin' ? <AdminDashboard /> : <Navigate to="/login" replace />} 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;