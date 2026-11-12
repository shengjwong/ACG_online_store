import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import '../styles/Shop.css';

const STATUSES = ['pending', 'successful', 'failed', 'refunded'];

function AdminPayments() {
  const [payments, setPayments] = useState([]);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [edits, setEdits] = useState({}); // payment id -> chosen status
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadPayments = (status = filter, term = search) =>
    api.get('/payments', { params: { ...(status && { status }), ...(term.trim() && { search: term.trim() }) } })
      .then((res) => setPayments(res.data.data))
      .catch(() => setError('Failed to load payments.'))
      .finally(() => setLoading(false));

  useEffect(() => {
    loadPayments('');
    // eslint-disable-next-line
  }, []);

  const changeFilter = (value) => {
    setFilter(value);
    loadPayments(value, search);
  };

  const submitSearch = (e) => {
    e.preventDefault();
    loadPayments(filter, search);
  };

  const save = (payment) => {
    const status = edits[payment.id];
    if (!status || status === payment.payment_status) return;
    if (status === 'refunded' && !window.confirm('Refund this payment on PayPal? This cannot be undone.')) return;

    setError('');
    setNotice('');
    api.put(`/payments/${payment.id}`, { payment_status: status })
      .then((res) => {
        setNotice(res.data.message);
        setEdits((prev) => { const next = { ...prev }; delete next[payment.id]; return next; });
        loadPayments();
      })
      .catch((err) => setError(err.response?.data?.message || 'Update failed.'));
  };

  if (loading) return <div className="shop-page shop-muted">Loading payments...</div>;

  return (
    <div className="shop-page" style={{ maxWidth: '1200px' }}>
      <h2 className="shop-title">Manage Payments</h2>
      {error && <div className="shop-error">{error}</div>}
      {notice && <div className="shop-success">{notice}</div>}

      <form className="shop-toolbar" onSubmit={submitSearch}>
        <input
          className="shop-input"
          placeholder="Search order no., transaction ID, customer name or email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button type="submit" className="shop-btn shop-btn-primary">Search</button>
        <select className="shop-select" value={filter} onChange={(e) => changeFilter(e.target.value)}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </form>

      <div className="shop-card shop-table-wrap">
        <table className="shop-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Date</th>
              <th>Customer</th>
              <th>Order</th>
              <th>Amount</th>
              <th>Transaction ID</th>
              <th>Status</th>
              <th>Update</th>
            </tr>
          </thead>
          <tbody>
            {payments.length === 0 && (
              <tr><td colSpan={8} className="shop-empty">No payments found.</td></tr>
            )}
            {payments.map((p) => (
              <tr key={p.id}>
                <td>{p.id}</td>
                <td>{new Date(p.created_at).toLocaleString()}</td>
                <td>{p.order?.user?.name}<div className="shop-muted">{p.order?.user?.email}</div></td>
                <td>{p.order?.order_number}</td>
                <td>RM {Number(p.amount).toFixed(2)}</td>
                <td className="shop-muted">{p.transaction_id || '-'}</td>
                <td><span className={`badge badge-${p.payment_status}`}>{p.payment_status}</span></td>
                <td>
                  <select
                    className="shop-select"
                    value={edits[p.id] ?? p.payment_status}
                    onChange={(e) => setEdits({ ...edits, [p.id]: e.target.value })}
                  >
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>{' '}
                  <button
                    className="shop-btn shop-btn-primary"
                    disabled={!edits[p.id] || edits[p.id] === p.payment_status}
                    onClick={() => save(p)}
                  >
                    Save
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminPayments;
