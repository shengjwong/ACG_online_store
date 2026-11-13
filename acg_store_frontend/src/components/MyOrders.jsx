import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import '../styles/Shop.css';

const statusSteps = ['paid', 'processing', 'shipped', 'delivered', 'completed'];
const labels = { paid: 'Paid', processing: 'Preparing', shipped: 'On the Way', delivered: 'Delivered', completed: 'Completed' };
const date = (value) => value ? new Date(`${String(value).slice(0, 10)}T00:00:00`).toLocaleDateString('en-GB') : 'Not set';

function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [addressDraft, setAddressDraft] = useState('');

  const loadOrders = () => api.get('/my-orders')
    .then((res) => setOrders(res.data.data || []))
    .catch((err) => setError(err.response?.data?.message || 'Failed to load your orders.'))
    .finally(() => setLoading(false));
  useEffect(() => { loadOrders(); }, []);

  const payAgain = async (payment) => {
    setError('');
    try { const { data } = await api.post(`/payments/${payment.id}/pay`); window.location.href = data.approval_url; }
    catch (err) { setError(err.response?.data?.message || 'Could not start payment.'); }
  };
  const cancelPayment = async (payment) => {
    if (!window.confirm('Cancel this pending payment?')) return;
    try { await api.post(`/payments/${payment.id}/cancel`); await loadOrders(); }
    catch (err) { setError(err.response?.data?.message || 'Could not cancel payment.'); }
  };
  const confirmReceived = async (order) => {
    if (!window.confirm(`Confirm that you received order ${order.order_number}?`)) return;
    setBusyId(order.id); setError('');
    try { await api.post(`/my-orders/${order.id}/confirm-received`); await loadOrders(); }
    catch (err) { setError(err.response?.data?.message || 'Could not confirm receipt.'); }
    finally { setBusyId(null); }
  };
  const saveAddress = async (order) => {
    setBusyId(order.id); setError('');
    try { await api.put(`/my-orders/${order.id}/address`, { shipping_address: addressDraft }); setEditingId(null); await loadOrders(); }
    catch (err) { setError(err.response?.data?.message || 'Could not update delivery address.'); }
    finally { setBusyId(null); }
  };
  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return orders.filter((o) => (!status || o.order_status === status) && (!term || (o.order_number || '').toLowerCase().includes(term)));
  }, [orders, search, status]);

  if (loading) return <div className="shop-page shop-muted">Loading orders...</div>;
  return <div className="shop-page">
    <h2 className="shop-title">My Orders</h2>
    <p className="shop-muted">Track your paid orders, manage delivery addresses before shipping and view completed order history.</p>
    {error && <div className="shop-error">{error}</div>}
    <div className="shop-toolbar">
      <input className="shop-input" placeholder="Search order number" value={search} onChange={(e) => setSearch(e.target.value)} />
      <select className="shop-select" value={status} onChange={(e) => setStatus(e.target.value)}>
        <option value="">All statuses</option>{statusSteps.map((s) => <option key={s} value={s}>{labels[s]}</option>)}
      </select>
    </div>
    {visible.length === 0 ? <div className="shop-card shop-empty">{orders.length ? 'No orders match your search.' : <>You have no paid orders yet.<br/><Link to="/" className="shop-btn shop-btn-primary">Browse products</Link></>}</div> : visible.map((order) => {
      const current = statusSteps.indexOf(order.order_status);
      const canEditAddress = ['paid', 'processing'].includes(order.order_status);
      return <section className="shop-card" key={order.id} style={{ marginBottom: 18 }}>
        <div className="order-head"><div><strong>{order.order_number}</strong><div className="shop-muted">Order date: {new Date(order.created_at).toLocaleDateString('en-GB')}</div></div>
          <div style={{ textAlign: 'right' }}><span className={`badge badge-${order.order_status}`}>{labels[order.order_status] || order.order_status}</span><div style={{ fontWeight: 800, marginTop: 5 }}>RM {Number(order.total_amount).toFixed(2)}</div></div>
        </div>
        <ul className="order-items">{(order.items || []).map((item) => <li key={item.id}>{item.product_name} × {item.quantity} — RM {Number(item.subtotal).toFixed(2)}</li>)}</ul>
        <div style={{ background: 'rgba(255,255,255,.04)', borderRadius: 10, padding: 14, marginTop: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}><strong>Shipping Address</strong>
            {canEditAddress && editingId !== order.id && <button type="button" className="shop-btn" onClick={() => { setEditingId(order.id); setAddressDraft(order.shipping_address || ''); }}>Edit Address</button>}
          </div>
          {editingId === order.id ? <>
            <textarea className="shop-input" rows="3" style={{ width: '100%', marginTop: 10 }} value={addressDraft} onChange={(e) => setAddressDraft(e.target.value)} placeholder="Enter your full delivery address" />
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}><button className="shop-btn shop-btn-primary" disabled={busyId === order.id || addressDraft.trim().length < 10} onClick={() => saveAddress(order)}>{busyId === order.id ? 'Saving...' : 'Save Address'}</button><button className="shop-btn" onClick={() => setEditingId(null)}>Cancel</button></div>
          </> : <p style={{ margin: '8px 0 0', whiteSpace: 'pre-wrap' }}>{order.shipping_address || 'No delivery address saved.'}</p>}
        </div>
        <div style={{ background: 'rgba(255,255,255,.04)', borderRadius: 10, padding: 14, marginTop: 12 }}>
          <strong>Estimated Delivery</strong>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#86efac', marginTop: 5 }}>{date(order.estimated_delivery_start)} – {date(order.estimated_delivery_end)}</div>
          <div className="shop-muted" style={{ marginTop: 4 }}>Estimated delivery is 1–3 days after successful payment and may change if shipping is delayed.</div>
        </div>
        {order.payment?.payment_status === 'pending' && <div style={{ display: 'flex', gap: 8, marginTop: 14 }}><button className="shop-btn shop-btn-primary" onClick={() => payAgain(order.payment)}>Pay with PayPal</button><button className="shop-btn shop-btn-danger" onClick={() => cancelPayment(order.payment)}>Cancel Payment</button></div>}
        {order.tracking_number && <p className="shop-muted" style={{ marginTop: 12 }}>Tracking Number: <strong>{order.tracking_number}</strong></p>}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 16 }}>
          {statusSteps.map((step, i) => <span key={step} style={{ fontSize: 12, padding: '6px 9px', borderRadius: 20, background: i <= current ? 'rgba(34,197,94,.18)' : 'rgba(255,255,255,.07)', color: i <= current ? '#86efac' : '#94a3b8' }}>{labels[step]}</span>)}
        </div>
        {order.order_status === 'delivered' && <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 18 }}><button className="shop-btn shop-btn-primary" disabled={busyId === order.id} onClick={() => confirmReceived(order)}>{busyId === order.id ? 'Confirming...' : 'Confirm Received'}</button></div>}
        {order.order_status === 'completed' && <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 18 }}><span className="shop-btn" style={{ color: '#86efac', cursor: 'default' }}>✓ Completed · {order.completed_at ? new Date(order.completed_at).toLocaleDateString('en-GB') : 'Confirmed'}</span></div>}
      </section>;
    })}
  </div>;
}
export default MyOrders;
