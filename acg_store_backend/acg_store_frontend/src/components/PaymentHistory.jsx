import React, { useEffect, useMemo, useState } from 'react';
import api from '../api/axios';
import '../styles/Shop.css';

function PaymentHistory() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    api.get('/payments')
      .then((res) => setPayments(res.data.data))
      .catch(() => setError('Failed to load payment history.'))
      .finally(() => setLoading(false));
  }, []);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return payments.filter((p) =>
      (!status || p.payment_status === status) &&
      (!term ||
        (p.order?.order_number || '').toLowerCase().includes(term) ||
        (p.transaction_id || '').toLowerCase().includes(term))
    );
  }, [payments, search, status]);

  if (loading) return <div className="shop-page shop-muted">Loading payments...</div>;

  return (
    <div className="shop-page">
      <h2 className="shop-title">Payment History</h2>
      {error && <div className="shop-error">{error}</div>}

      <div className="shop-toolbar">
        <input
          className="shop-input"
          placeholder="Search order number or transaction ID"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="shop-select" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="successful">Successful</option>
          <option value="failed">Failed</option>
          <option value="refunded">Refunded</option>
        </select>
      </div>

      {visible.length === 0 ? (
        <div className="shop-card shop-empty">{payments.length === 0 ? 'No payments yet.' : 'No payments match your search.'}</div>
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
              {visible.map((p) => (
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
