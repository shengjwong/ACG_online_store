import React, { useEffect, useMemo, useState } from 'react';
import api from '../api/axios';
import '../styles/Shop.css';
import '../styles/PaymentReceipt.css';

function PaymentHistory() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [receipt, setReceipt] = useState(null);

  useEffect(() => {
    Promise.all([
      api.get('/payments'),
      api.get('/membership/payment-history').catch(() => ({ data: { data: [] } })),
    ])
      .then(([productRes, membershipRes]) => {
        const products = (productRes.data.data || []).map(p => ({...p, record_type:'product', description:p.order?.order_number || 'Product Order'}));
        const memberships = membershipRes.data.data || [];
        setPayments([...products, ...memberships].sort((a,b) => new Date(b.paid_at || b.created_at) - new Date(a.paid_at || a.created_at)));
      })
      .catch(() => setError('Failed to load payment history.'))
      .finally(() => setLoading(false));
  }, []);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return payments.filter((p) =>
      (!status || p.payment_status === status) &&
      (!term || (p.description || '').toLowerCase().includes(term) ||
        (p.order?.order_number || '').toLowerCase().includes(term) ||
        (p.transaction_id || '').toLowerCase().includes(term))
    );
  }, [payments, search, status]);

  const printReceipt = () => window.print();

  if (loading) return <div className="shop-page shop-muted">Loading payments...</div>;
  return (
    <div className="shop-page payment-history-page">
      <h2 className="shop-title">Payment History</h2>
      <p className="payment-history-subtitle">View your product payments and membership renewal receipts in one place.</p>
      {error && <div className="shop-error">{error}</div>}
      <div className="shop-toolbar no-print">
        <input className="shop-input" placeholder="Search order or transaction ID" value={search} onChange={e=>setSearch(e.target.value)} />
        <select className="shop-select" value={status} onChange={e=>setStatus(e.target.value)}>
          <option value="">All statuses</option><option value="pending">Pending</option><option value="successful">Successful</option><option value="failed">Failed</option><option value="refunded">Refunded</option>
        </select>
      </div>
      {visible.length === 0 ? <div className="shop-card shop-empty">No payments yet.</div> :
        <div className="shop-card shop-table-wrap no-print"><table className="shop-table"><thead><tr><th>Date</th><th>Type / Description</th><th>Method</th><th>Amount</th><th>Status</th><th>Transaction ID</th><th>Receipt</th></tr></thead><tbody>
          {visible.map(p=><tr key={`${p.record_type}-${p.id}`}><td>{new Date(p.paid_at || p.created_at).toLocaleString()}</td><td>{p.record_type === 'membership' ? 'Membership Renewal (3 months)' : (p.description || p.order?.order_number)}</td><td>{p.payment_method || 'PayPal'}</td><td>RM {Number(p.amount).toFixed(2)}</td><td><span className={`badge badge-${p.payment_status}`}>{p.payment_status}</span></td><td className="shop-muted">{p.transaction_id || '-'}</td><td>{p.record_type === 'membership' && p.payment_status === 'successful' ? <button className="receipt-view-btn" onClick={() => setReceipt(p)}>View Receipt</button> : '—'}</td></tr>)}
        </tbody></table></div>}
      {receipt && (
        <div className="receipt-overlay" role="dialog" aria-modal="true" aria-label="Membership payment receipt">
          <section className="receipt-paper" id="membership-receipt">
            <div className="receipt-topline"><span>ACG STORE</span><span>PAYMENT RECEIPT</span></div>
            <div className="receipt-success-mark">✓</div>
            <h2>Payment Successful</h2>
            <p className="receipt-thanks">Thank you for renewing your ACG Store membership.</p>
            <div className="receipt-total-label">TOTAL PAID</div>
            <div className="receipt-total">RM {Number(receipt.amount).toFixed(2)}</div>
            <div className="receipt-divider"></div>
            <div className="receipt-details">
              <div><span>Receipt No.</span><strong>{receipt.receipt_number || `ACG-MEM-${String(receipt.id).replace('membership-','').padStart(6,'0')}`}</strong></div>
              <div><span>Payment Date</span><strong>{new Date(receipt.paid_at || receipt.created_at).toLocaleString()}</strong></div>
              <div><span>Description</span><strong>Membership Renewal — 3 Months</strong></div>
              <div><span>Payment Method</span><strong>PayPal Sandbox</strong></div>
              <div><span>Currency</span><strong>{receipt.currency || 'MYR'}</strong></div>
              <div><span>PayPal Capture ID</span><strong className="receipt-id">{receipt.transaction_id || 'Not available'}</strong></div>
              <div><span>Status</span><strong className="receipt-paid">PAID</strong></div>
            </div>
            <p className="receipt-footnote">This receipt confirms the membership renewal payment recorded by ACG Store.</p>
            <div className="receipt-actions no-print">
              <button onClick={printReceipt}>Print / Save as PDF</button>
              <button className="receipt-close" onClick={() => setReceipt(null)}>Close</button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
export default PaymentHistory;
