import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import '../styles/Shop.css';

function Cart() {
  const [cart, setCart] = useState({ items: [], subtotal: 0, total_quantity: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [address, setAddress] = useState('');
  const [paying, setPaying] = useState(false);

  const loadCart = () =>
    api.get('/cart')
      .then((res) => setCart(res.data.data))
      .catch(() => setError('Failed to load your cart.'))
      .finally(() => setLoading(false));

  useEffect(() => {
    loadCart();
  }, []);

  const showError = (err, fallback) => setError(err.response?.data?.message || fallback);

  const changeQty = (item, quantity) => {
    if (quantity < 1) return;
    setError('');
    api.put(`/cart/${item.id}`, { quantity })
      .then(loadCart)
      .catch((err) => showError(err, 'Could not update quantity.'));
  };

  const removeItem = (item) => {
    setError('');
    api.delete(`/cart/${item.id}`)
      .then(loadCart)
      .catch((err) => showError(err, 'Could not remove item.'));
  };

  const clearCart = () => {
    if (!window.confirm('Remove everything from your cart?')) return;
    api.delete('/cart').then(loadCart).catch((err) => showError(err, 'Could not clear cart.'));
  };

  const checkout = () => {
    setError('');
    if (!address.trim()) {
      setError('Please enter a shipping address.');
      return;
    }
    setPaying(true);
    api.post('/checkout', { shipping_address: address })
      .then((res) => {
        // Send the buyer to PayPal (sandbox) to approve the payment
        window.location.href = res.data.approval_url;
      })
      .catch((err) => {
        showError(err, 'Could not start checkout.');
        setPaying(false);
      });
  };

  if (loading) return <div className="shop-page shop-muted">Loading cart...</div>;

  return (
    <div className="shop-page">
      <h2 className="shop-title">My Cart</h2>
      {error && <div className="shop-error">{error}</div>}

      {cart.items.length === 0 ? (
        <div className="shop-card shop-empty">
          <p>Your cart is empty.</p>
          <Link to="/" className="shop-btn shop-btn-primary">Browse products</Link>
        </div>
      ) : (
        <>
          <div className="shop-card">
            {cart.items.map((item) => {
              const p = item.product;
              const img = p.image ? `http://127.0.0.1:8000/storage/${p.image}` : 'https://via.placeholder.com/72?text=No+Image';
              return (
                <div className="cart-row" key={item.id}>
                  <img className="cart-img" src={img} alt={p.name} onError={(e) => { e.target.src = 'https://via.placeholder.com/72?text=No+Image'; }} />
                  <div className="cart-info">
                    <p className="cart-name">{p.name}</p>
                    <span className="cart-price">RM {parseFloat(p.price).toFixed(2)}</span>
                    <div className="shop-muted">Stock: {p.stock}</div>
                  </div>
                  <div className="qty-box">
                    <button className="qty-btn" onClick={() => changeQty(item, item.quantity - 1)} disabled={item.quantity <= 1}>−</button>
                    <span>{item.quantity}</span>
                    <button className="qty-btn" onClick={() => changeQty(item, item.quantity + 1)} disabled={item.quantity >= p.stock}>+</button>
                  </div>
                  <div className="cart-line-total">RM {(p.price * item.quantity).toFixed(2)}</div>
                  <button className="shop-btn shop-btn-danger" onClick={() => removeItem(item)}>Remove</button>
                </div>
              );
            })}
            <div style={{ textAlign: 'right', marginTop: '0.8rem' }}>
              <button className="shop-btn shop-btn-ghost" onClick={clearCart}>Clear cart</button>
            </div>
          </div>

          <div className="shop-card">
            <div className="cart-summary">
              <span>Subtotal ({cart.total_quantity} items)</span>
              <span>RM {Number(cart.subtotal).toFixed(2)}</span>
            </div>
            <label className="shop-muted" htmlFor="address">Shipping address</label>
            <textarea
              id="address"
              className="shop-textarea"
              rows={3}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="House no., street, city, postcode, state"
            />
            <button className="shop-btn shop-btn-paypal" onClick={checkout} disabled={paying}>
              {paying ? 'Redirecting to PayPal...' : 'Pay with PayPal'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default Cart;
