import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom';
import api from './api/axios';
import Login from './components/Login';
import Signup from './components/Signup';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import AdminDashboard from './components/AdminDashboard';
import Profile from './components/Profile';
import Cart from './components/Cart';
import MyOrders from './components/MyOrders';
import PaymentHistory from './components/PaymentHistory';
import PaymentResult from './components/PaymentResult';
import AdminPayments from './components/AdminPayments';
import MembershipManagement from './components/MembershipManagement';
import MembershipRegistration from './components/MembershipRegistration';
import MembershipPaymentResult from './components/MembershipPaymentResult';
import './styles/Shop.css';
import './styles/App.css';

function ProductList() {
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');
  const navigate = useNavigate();

  const handleAddToCart = (item) => {
    if (!localStorage.getItem('access_token')) {
      navigate('/login');
      return;
    }
    api.post('/cart', { product_id: item.id, quantity: 1 })
      .then(() => setToast(`${item.name} added to cart`))
      .catch((err) => setToast(err.response?.data?.message || 'Could not add to cart'))
      .finally(() => setTimeout(() => setToast(''), 2500));
  };

  useEffect(() => {
    api.get('/products')
      .then((res) => {
        setProducts(res.data.data || res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filteredProducts = products
    .filter((item) => {
      const query = searchQuery.toLowerCase().trim();
      return (
        item.name?.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query)
      );
    })
    .sort((a, b) => {
      const aInactive = a.status === 'inactive' ? 1 : 0;
      const bInactive = b.status === 'inactive' ? 1 : 0;
      return aInactive - bInactive;
    });

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <h2 style={{ color: '#94A3B8', fontWeight: '400', letterSpacing: '0.5px' }}>Loading ACG Catalog...</h2>
      </div>
    );
  }

  return (
    <div className="catalog-container">
      {toast && <div className="shop-toast">{toast}</div>}
      <div className="catalog-header">
        <h2 className="catalog-title">Product Catalog</h2>
        <div className="catalog-divider"></div>
      </div>

      {/* Product Search Bar */}
      <div className="search-bar-wrapper">
        <input
          type="text"
          className="search-input"
          placeholder="Search products by name or description..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button
            type="button"
            className="search-clear-btn"
            onClick={() => setSearchQuery('')}
            title="Clear search"
          >
            ✕
          </button>
        )}
      </div>

      {filteredProducts.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#94A3B8', marginTop: '2rem' }}>
          No products found matching "<strong>{searchQuery}</strong>".
        </p>
      ) : (
        <div className="product-grid">
          {filteredProducts.map((item) => {
            const imageUrl = item.image
              ? `http://127.0.0.1:8000/storage/${item.image}`
              : 'https://via.placeholder.com/300x200?text=No+Image';

            const isInactive = item.status === 'inactive';

            return (
              <div key={item.id} className={`product-card ${isInactive ? 'inactive' : ''}`}>
                {isInactive && <span className="inactive-badge">Unavailable</span>}

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

                <button
                  className="btn-add-cart"
                  disabled={isInactive || item.stock < 1}
                  onClick={() => handleAddToCart(item)}
                >
                  {item.stock < 1 ? 'Out of stock' : 'Add to Cart'}
                </button>
              </div>
            );
          })}
        </div>
      )}
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
                {user.role === 'admin' ? (
                  <>
                    <Link to="/admin" className="btn-admin">
                      Admin Dashboard
                    </Link>
                    <Link to="/admin/payments" className="btn-admin">
                      Payments
                    </Link>
                    <Link to="/admin/memberships" className="btn-admin">
                      Memberships
                    </Link>
                  </>
                ) : (
                  <>
                    <Link to="/cart" className="nav-link-plain">Cart</Link>
                    <Link to="/my-orders" className="nav-link-plain">My Orders</Link>
                    <Link to="/payments" className="nav-link-plain">Payments</Link>
                    <Link to="/membership" className="btn-admin">Member</Link>
                  </>
                )}

                <Link to="/profile" className="nav-link-plain">
                  Profile
                </Link>

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
                <Link to="/login" className="btn-admin">Member</Link>
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
            path="/profile"
            element={user ? <Profile onUserUpdate={(updated) => setUser(updated)} /> : <Navigate to="/login" replace />}
          />
          <Route path="/cart" element={user ? <Cart /> : <Navigate to="/login" replace />} />
          <Route path="/my-orders" element={user ? <MyOrders /> : <Navigate to="/login" replace />} />
          <Route path="/payments" element={user ? <PaymentHistory /> : <Navigate to="/login" replace />} />
          <Route
            path="/membership"
            element={user && user.role === 'member' ? <MembershipManagement /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/membership/register"
            element={user && user.role === 'member' ? <MembershipRegistration /> : <Navigate to="/login" replace />}
          />
          <Route path="/membership/payment/success" element={user ? <MembershipPaymentResult mode="success" /> : <Navigate to="/login" replace />} />
          <Route path="/membership/payment/cancel" element={user ? <MembershipPaymentResult mode="cancel" /> : <Navigate to="/login" replace />} />
          <Route path="/admin/memberships" element={user && user.role === 'admin' ? <MembershipManagement admin /> : <Navigate to="/login" replace />} />
          <Route path="/payment/success" element={user ? <PaymentResult mode="success" /> : <Navigate to="/login" replace />} />
          <Route path="/payment/cancel" element={user ? <PaymentResult mode="cancel" /> : <Navigate to="/login" replace />} />
          <Route
            path="/admin/payments"
            element={user && user.role === 'admin' ? <AdminPayments /> : <Navigate to="/login" replace />}
          />
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