import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import '../styles/Shop.css';
import { formatDateTime } from '../utils/dateFormat';

const fmt = (v) => {
  if (!v) return '—';
  const [year, month, day] = String(v).slice(0, 10).split('-');
  return year && month && day ? `${day}/${month}/${year}` : '—';
};

const toDisplayDate = (v) => {
  if (!v) return '';
  const [year, month, day] = String(v).slice(0, 10).split('-');
  return year && month && day ? `${day}/${month}/${year}` : '';
};

const toApiDate = (value) => {
  if (!value) return '';
  const parts = String(value).trim().split('/');
  if (parts.length !== 3 || parts[0].length !== 2 || parts[1].length !== 2 || parts[2].length !== 4) {
    throw new Error('Please enter the date as DD/MM/YYYY.');
  }
  const [day, month, year] = parts;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  if (date.getFullYear() !== Number(year) || date.getMonth() !== Number(month) - 1 || date.getDate() !== Number(day)) {
    throw new Error('Please enter a valid date as DD/MM/YYYY.');
  }
  return `${year}-${month}-${day}`;
};

const statusLabel = { paid: 'Paid', processing: 'Preparing', shipped: 'On the Way', delivered: 'Delivered', completed: 'Completed' };

function AdminOrderManagement() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [saving, setSaving] = useState(null);
  const [drafts, setDrafts] = useState({});

  // Product orders and reward redemptions are handled in the same list with the same controls.
  const load = () => Promise.all([
    api.get('/admin/orders'),
    api.get('/admin/redemptions').catch(() => ({ data: { data: [] } })),
  ]).then(([orderRes, rewardRes]) => {
    const orderRows = (orderRes.data.data || []).map((x) => ({ ...x, kind: 'order', key: `order-${x.id}`, number: x.order_number }));
    const rewardRows = (rewardRes.data.data || []).map((x) => ({ ...x, kind: 'reward', key: `reward-${x.id}`, number: x.redemption_number, order_status: x.status }));
    const rows = [...orderRows, ...rewardRows].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    setOrders(rows);
    const next = {};
    rows.forEach((o) => { next[o.key] = {
      order_status: o.order_status === 'paid' ? 'processing' : o.order_status,
      estimated_delivery_start: toDisplayDate(o.estimated_delivery_start),
      estimated_delivery_end: toDisplayDate(o.estimated_delivery_end),
    }; });
    setDrafts(next);
  }).catch((e) => setError(e.response?.data?.message || 'Could not load orders.')).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const updateDraft = (key, field, value) => setDrafts((old) => ({ ...old, [key]: { ...old[key], [field]: value } }));
  const save = async (item) => {
    setSaving(item.key); setError(''); setNotice('');
    try {
      const d = drafts[item.key];
      const dates = {
        estimated_delivery_start: toApiDate(d.estimated_delivery_start),
        estimated_delivery_end: toApiDate(d.estimated_delivery_end),
      };
      if (item.kind === 'reward') {
        await api.put(`/admin/redemptions/${item.id}`, { status: d.order_status, ...dates });
      } else {
        await api.put(`/admin/orders/${item.id}`, { order_status: d.order_status, ...dates });
      }
      setNotice(`${item.kind === 'reward' ? 'Redemption' : 'Order'} ${item.number} updated successfully.`);
      await load();
    }
    catch (e) { setError(e.response?.data?.message || e.message || 'Could not update order.'); }
    finally { setSaving(null); }
  };

  if (loading) return <div className="shop-page shop-muted">Loading orders...</div>;
  return <div className="shop-page">
    <h2 className="shop-title">Order & Shipping Management</h2>
    <p className="shop-muted">Update shipping progress and estimated delivery dates for paid orders and reward redemptions.</p>
    {error && <div className="shop-error">{error}</div>}
    {notice && <div className="shop-success" style={{ padding: 12, borderRadius: 8, marginBottom: 14, color: '#86efac', background: 'rgba(34,197,94,.12)' }}>{notice}</div>}
    {orders.length === 0 ? <div className="shop-card shop-empty">No paid orders or redemptions found.</div> : orders.map((o) => {
      const d = drafts[o.key] || {};
      const isReward = o.kind === 'reward';
      return <section className="shop-card" key={o.key} style={{ marginBottom: 18 }}>
        <div className="order-head"><div><strong>{o.number}</strong>{isReward && <span className="badge badge-reward" style={{ marginLeft: 8 }}>Reward</span>}<div className="shop-muted">{o.user?.name} · {o.user?.email}</div></div><span className={`badge badge-${o.order_status}`}>{statusLabel[o.order_status] || o.order_status}</span></div>
        <p className="shop-muted" style={{ marginTop: 8 }}><strong>Shipping Address:</strong> {o.shipping_address || 'Not provided'}</p>
        {isReward
          ? <ul className="order-items"><li>{o.product?.name || 'Reward item'} × 1</li></ul>
          : <ul className="order-items">{(o.items || []).map((item) => <li key={item.id}>{item.product_name} × {item.quantity}</li>)}</ul>}
        <p><strong>{isReward ? `${Number(o.points_spent).toLocaleString()} points · Free shipping` : `Total: RM ${Number(o.total_amount).toFixed(2)}`}</strong></p>
        {o.order_status === 'completed' ? <p style={{ color: '#86efac' }}>Completed on {o.completed_at ? formatDateTime(o.completed_at) : '—'}</p> : <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 12 }}>
            <label>Order Status<select className="shop-select" value={d.order_status || 'processing'} onChange={(e) => updateDraft(o.key, 'order_status', e.target.value)}>
              <option value="processing">Preparing</option><option value="shipped">On the Way</option><option value="delivered">Delivered</option>
            </select></label>
            <label>Estimated Delivery From<input className="shop-input" type="text" inputMode="numeric" placeholder="DD/MM/YYYY" value={d.estimated_delivery_start || ''} onChange={(e) => updateDraft(o.key, 'estimated_delivery_start', e.target.value)} /></label>
            <label>Estimated Delivery To<input className="shop-input" type="text" inputMode="numeric" placeholder="DD/MM/YYYY" value={d.estimated_delivery_end || ''} onChange={(e) => updateDraft(o.key, 'estimated_delivery_end', e.target.value)} /></label>
          </div>
          <button className="shop-btn shop-btn-primary" style={{ marginTop: 14 }} disabled={saving === o.key} onClick={() => save(o)}>{saving === o.key ? 'Saving...' : 'Save Order Update'}</button>
        </>}
      </section>;
    })}
  </div>;
}
export default AdminOrderManagement;
