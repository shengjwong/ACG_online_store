import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import '../styles/Shop.css';

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

  const load = () => api.get('/admin/orders').then(({ data }) => {
    const rows = data.data || [];
    setOrders(rows);
    const next = {};
    rows.forEach((o) => { next[o.id] = {
      order_status: o.order_status === 'paid' ? 'processing' : o.order_status,
      estimated_delivery_start: toDisplayDate(o.estimated_delivery_start),
      estimated_delivery_end: toDisplayDate(o.estimated_delivery_end),
    }; });
    setDrafts(next);
  }).catch((e) => setError(e.response?.data?.message || 'Could not load orders.')).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const updateDraft = (id, key, value) => setDrafts((old) => ({ ...old, [id]: { ...old[id], [key]: value } }));
  const save = async (id) => {
    setSaving(id); setError(''); setNotice('');
    try {
      const payload = {
        order_status: drafts[id].order_status,
        estimated_delivery_start: toApiDate(drafts[id].estimated_delivery_start),
        estimated_delivery_end: toApiDate(drafts[id].estimated_delivery_end),
      };
      await api.put(`/admin/orders/${id}`, payload);
      setNotice(`Order ${orders.find(o => o.id === id)?.order_number || ''} updated successfully.`);
      await load();
    }
    catch (e) { setError(e.response?.data?.message || 'Could not update order.'); }
    finally { setSaving(null); }
  };

  if (loading) return <div className="shop-page shop-muted">Loading orders...</div>;
  return <div className="shop-page">
    <h2 className="shop-title">Order & Shipping Management</h2>
    <p className="shop-muted">Update each paid order's shipping progress and estimated delivery dates.</p>
    {error && <div className="shop-error">{error}</div>}
    {notice && <div className="shop-success" style={{ padding: 12, borderRadius: 8, marginBottom: 14, color: '#86efac', background: 'rgba(34,197,94,.12)' }}>{notice}</div>}
    {orders.length === 0 ? <div className="shop-card shop-empty">No paid orders found.</div> : orders.map((o) => {
      const d = drafts[o.id] || {};
      return <section className="shop-card" key={o.id} style={{ marginBottom: 18 }}>
        <div className="order-head"><div><strong>{o.order_number}</strong><div className="shop-muted">{o.user?.name} · {o.user?.email}</div></div><span className={`badge badge-${o.order_status}`}>{statusLabel[o.order_status] || o.order_status}</span></div>
        <p className="shop-muted" style={{ marginTop: 8 }}><strong>Shipping Address:</strong> {o.shipping_address || 'Not provided'}</p>
        <ul className="order-items">{(o.items || []).map((item) => <li key={item.id}>{item.product_name} × {item.quantity}</li>)}</ul>
        <p><strong>Total: RM {Number(o.total_amount).toFixed(2)}</strong></p>
        {o.order_status === 'completed' ? <p style={{ color: '#86efac' }}>Completed on {o.completed_at ? new Date(o.completed_at).toLocaleString('en-GB') : '—'}</p> : <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 12 }}>
            <label>Order Status<select className="shop-select" value={d.order_status || 'processing'} onChange={(e) => updateDraft(o.id, 'order_status', e.target.value)}>
              <option value="processing">Preparing</option><option value="shipped">On the Way</option><option value="delivered">Delivered</option>
            </select></label>
            <label>Estimated Delivery From<input className="shop-input" type="text" inputMode="numeric" placeholder="DD/MM/YYYY" value={d.estimated_delivery_start || ''} onChange={(e) => updateDraft(o.id, 'estimated_delivery_start', e.target.value)} /></label>
            <label>Estimated Delivery To<input className="shop-input" type="text" inputMode="numeric" placeholder="DD/MM/YYYY" value={d.estimated_delivery_end || ''} onChange={(e) => updateDraft(o.id, 'estimated_delivery_end', e.target.value)} /></label>
          </div>
          <button className="shop-btn shop-btn-primary" style={{ marginTop: 14 }} disabled={saving === o.id} onClick={() => save(o.id)}>{saving === o.id ? 'Saving...' : 'Save Order Update'}</button>
        </>}
      </section>;
    })}
  </div>;
}
export default AdminOrderManagement;
