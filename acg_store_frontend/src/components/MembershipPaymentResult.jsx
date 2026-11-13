import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import '../styles/MembershipManagement.css';

export default function MembershipPaymentResult({ mode }) {
  const [params] = useSearchParams();
  const [message, setMessage] = useState(mode === 'cancel' ? 'Cancelling renewal payment...' : 'Confirming PayPal payment...');
  const [error, setError] = useState('');
  const [membership, setMembership] = useState(null);

  useEffect(() => {
    let active = true;
    const run = async () => {
      const paymentId = params.get('membership_payment_id');
      const paypalOrderId = params.get('token');
      try {
        if (!paymentId) throw new Error('Membership payment reference is missing.');
        if (mode === 'cancel') {
          await api.post('/membership/renew/cancel', { payment_id: paymentId });
          if (active) setMessage('Payment was cancelled. Your membership expiry was not changed.');
        } else {
          if (!paypalOrderId) throw new Error('PayPal order reference is missing.');
          const response = await api.post('/membership/renew/capture', {
            payment_id: paymentId,
            paypal_order_id: paypalOrderId,
          });
          if (active) {
            setMessage(response.data.message || 'Membership renewed successfully.');
            setMembership(response.data.data || null);
          }
        }
      } catch (e) {
        if (active) setError(e.response?.data?.message || e.message || 'Unable to process the renewal result.');
      }
    };
    run();
    return () => { active = false; };
  }, [mode, params]);

  return (
    <main className="membership-page">
      <section className="m-card">
        <h1>{mode === 'cancel' ? 'Renewal Cancelled' : 'Membership Payment'}</h1>
        {error ? <p className="m-alert error">{error}</p> : <p className="m-alert">{message}</p>}
        {membership && !error && <p><strong>New membership expiry:</strong> {membership.membership_expiry ? new Date(membership.membership_expiry).toLocaleDateString() : 'Updated'}</p>}
        {!error && mode === 'success' && <p>Your receipt is available under Payment History after this successful payment.</p>}
        <div style={{display:'flex',gap:16,flexWrap:'wrap',marginTop:16}}>
          <Link to="/membership">Return to My Membership</Link>
          {membership && !error && <Link to="/payments">View Payment Receipt</Link>}
        </div>
      </section>
    </main>
  );
}
