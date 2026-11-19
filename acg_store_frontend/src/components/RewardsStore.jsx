import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import '../styles/MemberBenefits.css';

const imageUrl = image => !image ? '' : image.startsWith('http') ? image : `http://127.0.0.1:8000/storage/${image}`;

export default function RewardsStore() {
  const [items, setItems] = useState([]);
  const [points, setPoints] = useState(0);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [target, setTarget] = useState(null);      // reward being redeemed (opens the address pop-up)
  const [address, setAddress] = useState('');
  const [modalError, setModalError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = () => Promise.all([api.get('/rewards'), api.get('/points')]).then(([a, b]) => { setItems(a.data.data || []); setPoints(b.data.data?.balance || 0); }).catch(() => setError('Unable to load rewards.'));
  useEffect(() => { load(); }, []);

  const openRedeem = p => { setError(''); setMessage(''); setModalError(''); setAddress(''); setTarget(p); };
  const confirmRedeem = async e => {
    e.preventDefault();
    setBusy(true); setModalError('');
    try {
      const r = await api.post(`/rewards/${target.id}/redeem`, { shipping_address: address.trim() });
      setMessage(r.data.message || 'Reward redeemed.');
      setTarget(null);
      await load();
    } catch (e2) {
      setModalError(e2.response?.data?.errors?.shipping_address?.[0] || e2.response?.data?.message || 'Redemption failed.');
    } finally { setBusy(false); }
  };

  return <main className="benefits-page">
    <div className="benefits-heading"><div><span>EXCLUSIVE MEMBER BENEFITS</span><h1>Rewards Store</h1><p>Redeem your points for special rewards. Shipping is free.</p></div><Link to="/membership">← Back to Member</Link></div>
    <section className="rewards-points-strip"><div><small>YOUR POINTS BALANCE</small><strong>{Number(points).toLocaleString()} PTS</strong></div><Link to="/points">View points history →</Link></section>
    {error && <p className="benefits-error">{error}</p>}{message && <p className="benefits-success">{message} <Link to="/my-orders" style={{ color: 'inherit', fontWeight: 800 }}>Track in My Orders →</Link></p>}
    {items.length ? <div className="member-reward-grid">{items.map(p => <article className="member-reward-card" key={p.id}>
      <div className="member-reward-photo">{p.image ? <img src={imageUrl(p.image)} alt={p.name} /> : <span>✦</span>}</div>
      <div className="member-reward-content"><h3>{p.name}</h3><p>{p.description || 'Exclusive member reward.'}</p><div className="member-reward-meta"><strong>{p.points_required} Points</strong><span>{p.stock} left</span></div><div className="member-reward-shipping">✓ Free shipping</div><button disabled={points < p.points_required || p.stock < 1} onClick={() => openRedeem(p)}>{p.stock < 1 ? 'Out of stock' : points < p.points_required ? 'Not enough points' : 'Redeem now'}</button></div>
    </article>)}</div> : <div className="points-empty">There are no rewards available right now. Please check again later.</div>}

    {target && <div className="redeem-backdrop" role="dialog" aria-modal="true" aria-label="Redeem reward" onClick={() => !busy && setTarget(null)}>
      <form className="redeem-modal" onSubmit={confirmRedeem} onClick={e => e.stopPropagation()}>
        <h2>Redeem reward</h2>
        <p className="redeem-summary"><strong>{target.name}</strong><br />{target.points_required} points · Free shipping</p>
        <label htmlFor="redeem-address">Delivery address</label>
        <textarea id="redeem-address" rows="4" required minLength={10} value={address} onChange={e => setAddress(e.target.value)} placeholder="House no., street, city, postcode, state" />
        {modalError && <p className="benefits-error">{modalError}</p>}
        <div className="redeem-actions">
          <button type="button" className="redeem-cancel" disabled={busy} onClick={() => setTarget(null)}>Cancel</button>
          <button type="submit" className="redeem-confirm" disabled={busy || address.trim().length < 10}>{busy ? 'Redeeming...' : 'Confirm redeem'}</button>
        </div>
      </form>
    </div>}
  </main>;
}
