import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import '../styles/MembershipManagement.css';

export default function MembershipRegistration() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [name, setName] = useState(user.name || '');
  const [phone, setPhone] = useState(user.phone_number || '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/membership/me').then((r) => {
      if (r.data.data?.membership_registered_at) {
        navigate('/membership', { replace: true });
      }
    }).catch(() => {});
  }, [navigate]);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await api.post('/membership/register', {
        name,
        phone_number: phone,
      });
      if (response.data.approval_url) {
        window.location.href = response.data.approval_url;
      } else {
        setError('PayPal approval link was not returned.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to start membership payment.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="membership-page m-registration-page">
      <section className="m-card m-register m-register-modern">
        <div className="m-register-heading">
          <span className="m-register-crown" aria-hidden="true">♛</span>
          <h1>Membership Registration</h1>
        </div>
        <p className="m-register-intro">
          Register for a Bronze Membership for RM15. Your membership will be valid for 3 months after successful payment.
        </p>

        {error && <p className="m-alert error">{error}</p>}

        <form onSubmit={submit} className="m-register-form">
          <div className="m-register-field">
            <label htmlFor="membership-full-name"><span aria-hidden="true">♙</span>Full Name <b>*</b></label>
            <input id="membership-full-name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter your full name" />
          </div>

          <div className="m-register-field">
            <label htmlFor="membership-email"><span aria-hidden="true">✉</span>Email</label>
            <input id="membership-email" type="email" value={user.email || ''} readOnly />
          </div>

          <div className="m-register-field">
            <label htmlFor="membership-phone"><span aria-hidden="true">☎</span>Phone Number <b>*</b></label>
            <input id="membership-phone" required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Enter phone number" />
          </div>

          <section className="m-registration-details" aria-label="Membership details">
            <div className="m-registration-medal" aria-hidden="true">★</div>
            <div className="m-registration-info">
              <h2>Membership Details</h2>
              <div className="m-registration-facts">
                <div className="m-registration-fact">
                  <span className="m-fact-icon" aria-hidden="true">♛</span>
                  <div><small>Membership Tier</small><strong>Bronze</strong></div>
                </div>
                <div className="m-registration-fact">
                  <span className="m-fact-icon" aria-hidden="true">◉</span>
                  <div><small>Price</small><strong>RM15</strong></div>
                </div>
                <div className="m-registration-fact">
                  <span className="m-fact-icon" aria-hidden="true">▣</span>
                  <div><small>Validity</small><strong>3 Months</strong></div>
                </div>
              </div>
            </div>
          </section>

          <div className="m-register-actions">
            <button type="submit" disabled={loading}>
              <span className="m-paypal-mark" aria-hidden="true">P</span>
              {loading ? 'Connecting to PayPal...' : 'Pay RM15 and Register'}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
