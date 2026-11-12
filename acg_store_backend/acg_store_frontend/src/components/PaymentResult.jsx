import React, { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import '../styles/Shop.css';

// mode="success": PayPal sent the buyer back after approval -> capture the payment
// mode="cancel":  the buyer pressed Cancel on PayPal -> cancel the pending payment
function PaymentResult({ mode }) {
  const [params] = useSearchParams();
  const paymentId = params.get('payment_id');
  const paypalOrderId = params.get('token');
  const [state, setState] = useState('working'); // working | ok | error
  const [message, setMessage] = useState('');
  const started = useRef(false); // StrictMode runs effects twice in dev

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    if (!paymentId) {
      setState('error');
      setMessage('Missing payment information.');
      return;
    }

    const request = mode === 'success'
      ? api.post(`/payments/${paymentId}/capture`, { paypal_order_id: paypalOrderId })
      : api.post(`/payments/${paymentId}/cancel`);

    request
      .then((res) => {
        setState('ok');
        setMessage(res.data.message);
      })
      .catch((err) => {
        setState('error');
        setMessage(err.response?.data?.message || 'Something went wrong.');
      });
  }, [mode, paymentId, paypalOrderId]);

  return (
    <div className="shop-page" style={{ textAlign: 'center' }}>
      {state === 'working' && (
        <p className="shop-muted">{mode === 'success' ? 'Confirming your payment with PayPal...' : 'Cancelling payment...'}</p>
      )}
      {state === 'ok' && (
        <div className="shop-success">
          {mode === 'success' ? '✅ ' : ''}{message}
        </div>
      )}
      {state === 'error' && <div className="shop-error">{message}</div>}

      {state !== 'working' && (
        <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'center' }}>
          <Link to="/my-orders" className="shop-btn shop-btn-primary">View my orders</Link>
          <Link to="/" className="shop-btn shop-btn-ghost">Continue shopping</Link>
        </div>
      )}
    </div>
  );
}

export default PaymentResult;
