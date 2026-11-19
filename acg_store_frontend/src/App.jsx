import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom';
import api from './api/axios';
import Login from './components/Login';
import Signup from './components/Signup';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import AdminDashboard from './components/AdminDashboard';
import AdminSlideManager from './components/AdminSlideManager';
import Profile from './components/Profile';
import Cart from './components/Cart';
import MyOrders from './components/MyOrders';
import AdminOrderManagement from './components/AdminOrderManagement';
import PaymentHistory from './components/PaymentHistory';
import PaymentResult from './components/PaymentResult';
import AdminPayments from './components/AdminPayments';
import MembershipManagement from './components/MembershipManagement';
import MembershipRegistration from './components/MembershipRegistration';
import MembershipPaymentResult from './components/MembershipPaymentResult';
import RewardsStore from './components/RewardsStore';
import MyPoints from './components/MyPoints';
import AdminRewards from './components/AdminRewards';
import './styles/Shop.css';
import './styles/App.css';

function ProductList() {
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [categoryId, setCategoryId] = useState('');
  const [slideIndex, setSlideIndex] = useState(0);
  const [isSliderPaused, setIsSliderPaused] = useState(false);
  const [touchStartX, setTouchStartX] = useState(null);
  const [highlightedId, setHighlightedId] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem('user'));

  const handleAddToCart = (item) => {
    if (!localStorage.getItem('access_token')) {
      navigate('/login');
      return;
    }
    api.post('/cart', { product_id: item.id, quantity: 1 })
      .then(() => {
        setToast({ text: `${item.name} added to cart`, type: 'success' });
        window.dispatchEvent(new Event('cart-updated'));
      })
      .catch((err) => setToast({ text: err.response?.data?.message || 'Could not add to cart', type: 'error' }))
      .finally(() => setTimeout(() => setToast(null), 2500));
  };

  useEffect(() => {
    api.get('/products')
      .then((res) => {
        setProducts(res.data.data || res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Close pop-up modal when pressing Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setSelectedProduct(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 1. Filter out inactive and out-of-stock products first
  const inStockActiveProducts = products.filter(
    (item) => item.status !== 'inactive' && Number(item.stock) > 0
  );

  // 2. Respect admin's selected slide products (is_featured flag from DB)
  const explicitlyFeatured = inStockActiveProducts.filter((item) => Boolean(item.is_featured));
  const availableSlideProducts =
    explicitlyFeatured.length > 0 ? explicitlyFeatured : inStockActiveProducts;

  // Auto-advance every 3.5 seconds unless hovered or modal is open
  useEffect(() => {
    if (isSliderPaused || selectedProduct || availableSlideProducts.length <= 1) return;

    const timer = setInterval(() => {
      setSlideIndex((prev) => (prev + 1) % availableSlideProducts.length);
    }, 3500);

    return () => clearInterval(timer);
  }, [isSliderPaused, selectedProduct, availableSlideProducts.length]);

  useEffect(() => {
    if (slideIndex >= availableSlideProducts.length) {
      setSlideIndex(0);
    }
  }, [availableSlideProducts.length, slideIndex]);

  const nextSlide = () => {
    setSlideIndex((prev) => (prev + 1) % availableSlideProducts.length);
  };

  const prevSlide = () => {
    setSlideIndex((prev) => (prev - 1 + availableSlideProducts.length) % availableSlideProducts.length);
  };

  // Mobile touch swipe handlers
  const handleTouchStart = (e) => setTouchStartX(e.touches[0].clientX);
  const handleTouchEnd = (e) => {
    if (touchStartX === null) return;
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (diff > 50) nextSlide();
    if (diff < -50) prevSlide();
    setTouchStartX(null);
  };

  const categories = [];
  products.forEach((p) => {
    if (p.category && !categories.some((c) => c.id === p.category.id)) categories.push(p.category);
  });

  const filteredProducts = products
    .filter((item) => categoryId === '' || String(item.category_id) === categoryId)
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
      {toast && (
        <div className={`shop-toast ${toast.type}`}>
          <span className="shop-toast-icon">{toast.type === 'success' ? '✓' : '!'}</span>
          {toast.text}
        </div>
      )}

      {/* Auto-Running Featured Product Slider */}
      {availableSlideProducts.length > 0 && (
        <div
          className="hero-slider"
          onMouseEnter={() => setIsSliderPaused(true)}
          onMouseLeave={() => setIsSliderPaused(false)}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div
            className="hero-slider-track"
            style={{ transform: `translateX(-${slideIndex * 100}%)` }}
          >
            {availableSlideProducts.map((item) => {
              const imageUrl = item.image
                ? `http://127.0.0.1:8000/storage/${item.image}`
                : 'https://via.placeholder.com/400x300?text=No+Image';

              return (
                <div key={item.id} className="hero-slide">
                  <div
                    className="hero-slide-image-box"
                    onClick={() => setSelectedProduct(item)}
                    title="Click to enlarge image"
                  >
                    <img
                      src={imageUrl}
                      alt={item.name}
                      className="hero-slide-image"
                      onError={(e) => { e.target.src = 'https://via.placeholder.com/400x300?text=No+Image'; }}
                    />
                  </div>

                  <div className="hero-slide-content">
                    <span className="hero-slide-badge">
                      {item.category?.name ? `${item.category.name} • ` : ''}In Stock ({item.stock})
                    </span>
                    <h2
                      className="hero-slide-title"
                      onClick={() => setSelectedProduct(item)}
                    >
                      {item.name}
                    </h2>
                    <p className="hero-slide-desc">
                      {item.description || 'Available now in the ACG Store catalog.'}
                    </p>
                    <div className="hero-slide-actions">
                      <span className="hero-slide-price">
                        <span className="currency-symbol">RM</span>
                        {parseFloat(item.price).toFixed(2)}
                      </span>
                      {currentUser?.role !== 'admin' && (
                        <button
                          type="button"
                          className="hero-slide-btn"
                          onClick={() => handleAddToCart(item)}
                        >
                          Add to Cart
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {availableSlideProducts.length > 1 && (
            <>
              <button
                type="button"
                className="hero-slider-arrow left"
                onClick={prevSlide}
                aria-label="Previous slide"
              >
                ‹
              </button>
              <button
                type="button"
                className="hero-slider-arrow right"
                onClick={nextSlide}
                aria-label="Next slide"
              >
                ›
              </button>

              <div className="hero-slider-dots">
                {availableSlideProducts.map((item, idx) => (
                  <button
                    key={item.id}
                    type="button"
                    aria-label={`Go to slide ${idx + 1}`}
                    className={`hero-slider-dot ${idx === slideIndex ? 'active' : ''}`}
                    onClick={() => setSlideIndex(idx)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

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

      {/* Category filter */}
      {categories.length > 0 && (
        <div className="category-chips">
          <button
            type="button"
            className={`chip ${categoryId === '' ? 'active' : ''}`}
            onClick={() => setCategoryId('')}
          >
            All <span className="chip-count">{products.length}</span>
          </button>
          {categories.map((c) => (
            <button
              type="button"
              key={c.id}
              className={`chip ${categoryId === String(c.id) ? 'active' : ''}`}
              onClick={() => setCategoryId(String(c.id))}
            >
              {c.name} <span className="chip-count">{products.filter((p) => p.category_id === c.id).length}</span>
            </button>
          ))}
        </div>
      )}

      {filteredProducts.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#94A3B8', marginTop: '2rem' }}>
          No products found{searchQuery ? <> matching "<strong>{searchQuery}</strong>"</> : ''}.
        </p>
      ) : (
        <div className="product-grid">
          {filteredProducts.map((item) => {
            const imageUrl = item.image
              ? `http://127.0.0.1:8000/storage/${item.image}`
              : 'https://via.placeholder.com/300x200?text=No+Image';

            const isInactive = item.status === 'inactive';

            return (
              <div
                key={item.id}
                id={`product-card-${item.id}`}
                onClick={() => setSelectedProduct(item)}
                style={{ cursor: 'pointer' }}
                className={`product-card ${isInactive ? 'inactive' : ''} ${highlightedId === item.id ? 'card-highlight' : ''}`}
              >
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
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddToCart(item);
                  }}
                >
                  {item.stock < 1 ? 'Out of stock' : 'Add to Cart'}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Product Lightbox / Quick-View Pop-up Modal */}
      {selectedProduct && (
        <div
          className="product-modal-backdrop"
          onClick={() => setSelectedProduct(null)}
        >
          <div
            className="product-modal-box"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="product-modal-close"
              onClick={() => setSelectedProduct(null)}
              aria-label="Close modal"
            >
              ✕
            </button>

            <div className="product-modal-image-wrap">
              <img
                src={
                  selectedProduct.image
                    ? `http://127.0.0.1:8000/storage/${selectedProduct.image}`
                    : 'https://via.placeholder.com/600x450?text=No+Image'
                }
                alt={selectedProduct.name}
                className="product-modal-image"
                onError={(e) => { e.target.src = 'https://via.placeholder.com/600x450?text=No+Image'; }}
              />
            </div>

            <div className="product-modal-details">
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                {selectedProduct.category?.name && (
                  <span className="hero-slide-badge" style={{ marginBottom: 0 }}>
                    {selectedProduct.category.name}
                  </span>
                )}
                <span
                  className={`badge ${
                    selectedProduct.status === 'inactive' || Number(selectedProduct.stock) < 1
                      ? 'badge-failed'
                      : 'badge-successful'
                  }`}
                >
                  {selectedProduct.status === 'inactive'
                    ? 'Unavailable'
                    : Number(selectedProduct.stock) < 1
                    ? 'Out of Stock'
                    : `In Stock: ${selectedProduct.stock}`}
                </span>
              </div>

              <h2 className="product-modal-title">{selectedProduct.name}</h2>

              <p className="product-modal-desc">
                {selectedProduct.description || 'No description available.'}
              </p>

              <div className="product-modal-footer">
                <div className="product-modal-price">
                  <span className="currency-symbol">RM</span>
                  {parseFloat(selectedProduct.price).toFixed(2)}
                </div>

                {currentUser?.role !== 'admin' && (
                  <button
                    type="button"
                    className="hero-slide-btn"
                    disabled={selectedProduct.status === 'inactive' || Number(selectedProduct.stock) < 1}
                    onClick={() => {
                      handleAddToCart(selectedProduct);
                      setSelectedProduct(null);
                    }}
                  >
                    {Number(selectedProduct.stock) < 1 ? 'Out of Stock' : 'Add to Cart'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function App() {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')));
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    if (!user || user.role === 'admin') {
      setCartCount(0);
      return undefined;
    }
    const refresh = (e) => {
      if (typeof e?.detail === 'number') {
        setCartCount(e.detail);
        return;
      }
      api.get('/cart')
        .then((res) => setCartCount(res.data.data.total_quantity || 0))
        .catch(() => {});
    };
    refresh();
    window.addEventListener('cart-updated', refresh);
    return () => window.removeEventListener('cart-updated', refresh);
  }, [user]);

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
                    <Link to="/admin/slides" className="btn-admin">
                      Slides
                    </Link>
                    <Link to="/admin/payments" className="btn-admin">
                      Payments
                    </Link>
                    <Link to="/admin/orders" className="btn-admin">Orders</Link>
                    <Link to="/admin/memberships" className="btn-admin">Memberships</Link>
                    <Link to="/admin/rewards" className="btn-admin">Rewards</Link>
                  </>
                ) : (
                  <>
                    <Link to="/cart" className="btn-admin">
                      Cart
                      {cartCount > 0 && <span className="cart-badge">{cartCount > 99 ? '99+' : cartCount}</span>}
                    </Link>
                    <Link to="/my-orders" className="btn-admin">My Orders</Link>
                    <Link to="/membership" className="btn-admin">Member</Link>
                  </>
                )}

                <Link to="/profile" className="btn-admin">
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
          <Route path="/points" element={user && user.role === 'member' ? <MyPoints /> : <Navigate to="/login" replace />} />
          <Route path="/rewards" element={user && user.role === 'member' ? <RewardsStore /> : <Navigate to="/login" replace />} />
          <Route path="/admin/orders" element={user && user.role === 'admin' ? <AdminOrderManagement /> : <Navigate to="/login" replace />} />
          <Route path="/admin/rewards" element={user && user.role === 'admin' ? <AdminRewards /> : <Navigate to="/login" replace />} />
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
            path="/admin/slides" 
            element={user && user.role === 'admin' ? <AdminSlideManager /> : <Navigate to="/login" replace />} 
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