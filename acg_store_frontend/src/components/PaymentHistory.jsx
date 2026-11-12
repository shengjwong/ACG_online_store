import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import '../styles/Shop.css';

function PaymentHistory() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/payments')
      .then((res) => setPayments(res.data.data))
      .catch(() => setError('Failed to load payment history.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="shop-page shop-muted">Loading payments...</div>;

  return (
    <div className="shop-page">
      <h2 className="shop-title">Payment History</h2>
      {error && <div className="shop-error">{error}</div>}

      {payments.length === 0 ? (
        <div className="shop-card shop-empty">No payments yet.</div>
      ) : (
        <div className="shop-card shop-table-wrap">
          <table className="shop-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Order</th>
                <th>Method</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Transaction ID</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id}>
                  <td>{new Date(p.paid_at || p.created_at).toLocaleString()}</td>
                  <td>{p.order?.order_number}</td>
                  <td style={{ textTransform: 'capitalize' }}>{p.payment_method}</td>
                  <td>RM {Number(p.amount).toFixed(2)}</td>
                  <td><span className={`badge badge-${p.payment_status}`}>{p.payment_status}</span></td>
                  <td className="shop-muted">{p.transaction_id || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default PaymentHistory;
