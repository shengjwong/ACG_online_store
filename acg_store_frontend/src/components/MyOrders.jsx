import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import '../styles/Shop.css';

function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadOrders = () =>
    api.get('/my-orders')
      .then((res) => setOrders(res.data.data))
      .catch(() => setError('Failed to load your orders.'))
      .finally(() => setLoading(false));

  useEffect(() => {
    loadOrders();
  }, []);

  const payAgain = (payment) => {
    setError('');
    api.post(`/payments/${payment.id}/pay`)
      .then((res) => { window.location.href = res.data.approval_url; })
      .catch((err) => setError(err.response?.data?.message || 'Could not start payment.'));
  };

  const cancelPayment = (payment) => {
    if (!window.confirm('Cancel this payment and the order?')) return;
    setError('');
    api.post(`/payments/${payment.id}/cancel`)
      .then(loadOrders)
      .catch((err) => setError(err.response?.data?.message || 'Could not cancel payment.'));
  };

  if (loading) return <div className="shop-page shop-muted">Loading orders...</div>;

  return (
    <div className="shop-page">
      <h2 className="shop-title">My Orders</h2>
      {error && <div className="shop-error">{error}</div>}

      {orders.length === 0 ? (
        <div className="shop-card shop-empty">
          <p>You have no orders yet.</p>
          <Link to="/" className="shop-btn shop-btn-primary">Browse products</Link>
        </div>
      ) : (
        orders.map((order) => (
          <div className="shop-card" key={order.id}>
            <div className="order-head">
              <div>
                <strong>{order.order_number}</strong>
                <div className="shop-muted">{new Date(order.created_at).toLocaleString()}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span className={`badge badge-${order.order_status}`}>{order.order_status.replace('_', ' ')}</span>
                <div style={{ fontWeight: 800, marginTop: '0.3rem' }}>RM {Number(order.total_amount).toFixed(2)}</div>
              </div>
            </div>

            <ul className="order-items">
              {order.items.map((item) => (
                <li key={item.id}>{item.product_name} × {item.quantity} — RM {Number(item.subtotal).toFixed(2)}</li>
              ))}
            </ul>

            {order.tracking_number && (
              <div className="shop-muted">Tracking: {order.courier_name} {order.tracking_number}</div>
            )}

            {order.payment && (
              <div className="shop-muted">
                Payment: <span className={`badge badge-${order.payment.payment_status}`}>{order.payment.payment_status}</span>
              </div>
            )}

            {order.payment?.payment_status === 'pending' && (
              <div className="order-actions">
                <button className="shop-btn shop-btn-paypal" onClick={() => payAgain(order.payment)}>Pay with PayPal</button>
                <button className="shop-btn shop-btn-danger" onClick={() => cancelPayment(order.payment)}>Cancel payment</button>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}

export default MyOrders;
