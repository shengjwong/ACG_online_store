import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import '../styles/Shop.css';
import { formatDate } from '../utils/dateFormat';

// Product orders go Paid -> Preparing -> On the Way -> Delivered.
// Reward redemptions are free, so they start at Preparing.
const orderSteps = ['paid', 'processing', 'shipped', 'delivered'];
const rewardSteps = ['processing', 'shipped', 'delivered'];
const labels = { paid: 'Paid', processing: 'Preparing', shipped: 'On the Way', delivered: 'Delivered', cancelled: 'Cancelled' };
const statusOptions = [...orderSteps, 'cancelled'];
const date = (value) => formatDate(value, 'Not set');
// The old "completed" status is no longer shown: those orders appear as Delivered.
const shownStatus = (status) => (status === 'completed' ? 'delivered' : status);
const imageUrl = (image) => (!image ? '' : image.startsWith('http') ? image : `http://127.0.0.1:8000/storage/${image}`);

function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [busyKey, setBusyKey] = useState(null);
  const [editingKey, setEditingKey] = useState(null);
  const [addressDraft, setAddressDraft] = useState('');

  const loadOrders = () => Promise.all([
    api.get('/my-orders'),
    api.get('/my-redemptions').catch(() => ({ data: { data: [] } })),
  ])
    .then(([orderRes, rewardRes]) => {
      const orderRows = (orderRes.data.data || []).map((x) => ({ ...x, kind: 'order', key: `order-${x.id}`, number: x.order_number }));
      const rewardRows = (rewardRes.data.data || []).map((x) => ({ ...x, kind: 'reward', key: `reward-${x.id}`, number: x.redemption_number, order_status: x.status }));
      setOrders([...orderRows, ...rewardRows].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
    })
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
  const cancelOrder = async (order) => {
    const confirmed = window.confirm(`Cancel order ${order.number}? This will only cancel the order. No refund will be issued.`);
    if (!confirmed) return;
    setBusyKey(order.key);
    setError('');
    try {
      await api.post(`/my-orders/${order.id}/cancel`);
      await loadOrders();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not cancel this order.');
    } finally {
      setBusyKey(null);
    }
  };
  const saveAddress = async (order) => {
    setBusyKey(order.key); setError('');
    const url = order.kind === 'reward' ? `/my-redemptions/${order.id}/address` : `/my-orders/${order.id}/address`;
    try { await api.put(url, { shipping_address: addressDraft }); setEditingKey(null); await loadOrders(); }
    catch (err) { setError(err.response?.data?.message || 'Could not update delivery address.'); }
    finally { setBusyKey(null); }
  };

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return orders.filter((o) => (!status || shownStatus(o.order_status) === status) && (!term || (o.number || '').toLowerCase().includes(term)));
  }, [orders, search, status]);

  if (loading) return <div className="shop-page shop-muted">Loading orders...</div>;
  return <div className="shop-page">
    <h2 className="shop-title">My Orders</h2>
    <p className="shop-muted">Track your orders and redeemed rewards, and manage delivery addresses before shipping.</p>
    {error && <div className="shop-error">{error}</div>}
    <div className="shop-toolbar">
      <input className="shop-input" placeholder="Search order number" value={search} onChange={(e) => setSearch(e.target.value)} />
      <select className="shop-select" value={status} onChange={(e) => setStatus(e.target.value)}>
        <option value="">All statuses</option>{statusOptions.map((s) => <option key={s} value={s}>{labels[s]}</option>)}
      </select>
    </div>
    {visible.length === 0 ? <div className="shop-card shop-empty">{orders.length ? 'No orders match your search.' : <>You have no orders yet.<br/><Link to="/" className="shop-btn shop-btn-primary">Browse products</Link></>}</div> : visible.map((order) => {
      const isReward = order.kind === 'reward';
      const steps = isReward ? rewardSteps : orderSteps;
      const current = steps.indexOf(shownStatus(order.order_status));
      const canEditAddress = ['paid', 'processing'].includes(order.order_status);
      const rewardName = order.product?.name || 'Reward item';
      return <section className="shop-card" key={order.key} style={{ marginBottom: 18 }}>
        <div className="order-head"><div><strong>{order.number}</strong>{isReward && <span className="badge badge-reward" style={{ marginLeft: 8 }}>Reward</span>}<div className="shop-muted">{isReward ? 'Redeemed on' : 'Order date'}: {formatDate(order.created_at)}</div></div>
          <div style={{ textAlign: 'right' }}><span className={`badge badge-${shownStatus(order.order_status)}`}>{labels[shownStatus(order.order_status)] || order.order_status}</span>
            <div style={{ fontWeight: 800, marginTop: 5 }}>{isReward ? `${Number(order.points_spent).toLocaleString()} points` : `RM ${Number(order.total_amount).toFixed(2)}`}</div></div>
        </div>
        {isReward
          ? <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '10px 0' }}>
              {order.product?.image && <img src={imageUrl(order.product.image)} alt={rewardName} style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 8 }} />}
              <div><div>{rewardName} × 1</div><div className="shop-muted">Free shipping</div></div>
            </div>
          : <ul className="order-items">{(order.items || []).map((item) => <li key={item.id}>{item.product_name} × {item.quantity} — RM {Number(item.subtotal).toFixed(2)}</li>)}</ul>}
        <div style={{ background: 'rgba(255,255,255,.04)', borderRadius: 10, padding: 14, marginTop: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}><strong>Shipping Address</strong>
            {canEditAddress && editingKey !== order.key && <button type="button" className="shop-btn" onClick={() => { setEditingKey(order.key); setAddressDraft(order.shipping_address || ''); }}>Edit Address</button>}
          </div>
          {editingKey === order.key ? <>
            <textarea className="shop-input" rows="3" style={{ width: '100%', marginTop: 10 }} value={addressDraft} onChange={(e) => setAddressDraft(e.target.value)} placeholder="Enter your full delivery address" />
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}><button className="shop-btn shop-btn-primary" disabled={busyKey === order.key || addressDraft.trim().length < 10} onClick={() => saveAddress(order)}>{busyKey === order.key ? 'Saving...' : 'Save Address'}</button><button className="shop-btn" onClick={() => setEditingKey(null)}>Cancel</button></div>
          </> : <p style={{ margin: '8px 0 0', whiteSpace: 'pre-wrap' }}>{order.shipping_address || 'No delivery address saved.'}</p>}
        </div>
        <div style={{ background: 'rgba(255,255,255,.04)', borderRadius: 10, padding: 14, marginTop: 12 }}>
          <strong>Estimated Delivery</strong>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#86efac', marginTop: 5 }}>{date(order.estimated_delivery_start)} – {date(order.estimated_delivery_end)}</div>
          <div className="shop-muted" style={{ marginTop: 4 }}>{isReward ? 'Estimated delivery is 1–3 days after redemption and may change if shipping is delayed.' : 'Estimated delivery is 1–3 days after successful payment and may change if shipping is delayed.'}</div>
        </div>
        {!isReward && order.payment?.payment_status === 'pending' && <div style={{ display: 'flex', gap: 8, marginTop: 14 }}><button className="shop-btn shop-btn-primary" onClick={() => payAgain(order.payment)}>Pay with PayPal</button><button className="shop-btn shop-btn-danger" onClick={() => cancelPayment(order.payment)}>Cancel Payment</button></div>}
        {order.tracking_number && <p className="shop-muted" style={{ marginTop: 12 }}>Tracking Number: <strong>{order.tracking_number}</strong></p>}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 16 }}>
          {steps.map((step, i) => <span key={step} style={{ fontSize: 12, padding: '6px 9px', borderRadius: 20, background: i <= current ? 'rgba(34,197,94,.18)' : 'rgba(255,255,255,.07)', color: i <= current ? '#86efac' : '#94a3b8' }}>{labels[step]}</span>)}
        </div>
        {!isReward && ['paid', 'processing', 'shipped', 'delivered'].includes(order.order_status) && <div style={{ display: 'flex', justifyContent: 'flex-end', flexWrap: 'wrap', gap: 8, marginTop: 18 }}>
          <button type="button" className="shop-btn shop-btn-danger" disabled={busyKey === order.key} onClick={() => cancelOrder(order)}>{busyKey === order.key ? 'Processing...' : 'Cancel Order'}</button>
        </div>}
        {order.order_status === 'cancelled' && <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 18 }}><span className="shop-btn" style={{ color: '#fca5a5', cursor: 'default' }}>Order Cancelled</span></div>}
      </section>;
    })}
  </div>;
}
export default MyOrders;
