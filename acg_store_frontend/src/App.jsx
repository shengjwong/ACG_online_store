import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import api from './api/axios';
import Login from './components/Login';
import Signup from './components/Signup';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import AdminDashboard from './components/AdminDashboard';
import './styles/App.css';

function ProductList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/products')
      .then((res) => {
        setProducts(res.data.data || res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <h2 style={{ color: '#94A3B8', fontWeight: '400', letterSpacing: '0.5px' }}>Loading ACG Catalog...</h2>
      </div>
    );
  }

  return (
    <div className="catalog-container">
      <div className="catalog-header">
        <h2 className="catalog-title">Product Catalog</h2>
        <div className="catalog-divider"></div>
      </div>

      <div className="product-grid">
        {products.map((item) => {
          const imageUrl = item.image
            ? `http://127.0.0.1:8000/storage/${item.image}`
            : 'https://via.placeholder.com/300x200?text=No+Image';

          const isInactive = item.status === 'inactive';

          return (
            <div key={item.id} className={`product-card ${isInactive ? 'inactive' : ''}`}>
              {isInactive && <span className="inactive-badge">Inactive</span>}

              <div>
                <div className="product-image-container">
                  <img
                    src={imageUrl}
                    alt={item.name}
                    className={`product-image ${isInactive ? 'inactive-img' : ''}`}
                    onError={(e) => { e.target.src = 'https://via.placeholder.com/300x200?text=No+Image'; }}
                  />
                </div>

                <h3 className={`product-name ${isInactive ? 'inactive-text' : ''}`}>
                  {item.name}
                </h3>
                
                <p className="product-desc">
                  {item.description || 'No description available.'}
                </p>
              </div>

              <div className="product-footer">
                <strong className={`product-price ${isInactive ? 'inactive-price' : ''}`}>
                  <span className="currency-symbol">RM</span>
                  {parseFloat(item.price).toFixed(2)}
                </strong>
                <span className="stock-tag">
                  Stock: <strong>{item.stock}</strong>
                </span>
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
      <div style={{ minHeight: '100vh', background: '#0B0E14', color: '#F8FAFC' }}>
        {/* Clean Navigation Navbar */}
        <nav className="navbar">
          <Link to="/" className="nav-logo">
            <span className="nav-logo-accent">ACG</span> Store
          </Link>

          <div className="nav-right-actions">
            {user ? (
              <div className="nav-user-group">
                {user.role === 'admin' && (
                  <Link to="/admin" className="btn-admin">
                    Admin Dashboard
                  </Link>
                )}

                <span className="nav-welcome-text">
                  Welcome, <strong>{user.name}</strong>
                </span>

                <button onClick={handleLogout} className="btn-logout">
                  Logout
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <Link to="/login" className="btn-login">Login</Link>
                <Link to="/signup" className="btn-signup">Sign Up</Link>
              </div>
            )}
          </div>
        </nav>

        <Routes>
          <Route path="/" element={<ProductList />} />
          <Route path="/login" element={<Login onLoginSuccess={(u) => setUser(u)} />} />
          <Route path="/signup" element={<Signup onLoginSuccess={(u) => setUser(u)} />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
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