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
  const load = () => Promise.all([api.get('/rewards'), api.get('/points')]).then(([a, b]) => { setItems(a.data.data || []); setPoints(b.data.data?.balance || 0); }).catch(() => setError('Unable to load rewards.'));
  useEffect(() => { load(); }, []);
  const redeem = async id => { try { setError(''); setMessage(''); const r = await api.post(`/rewards/${id}/redeem`); setMessage(r.data.message || 'Reward redeemed.'); await load(); } catch (e) { setError(e.response?.data?.message || 'Redemption failed.'); } };
  return <main className="benefits-page">
    <div className="benefits-heading"><div><span>EXCLUSIVE MEMBER BENEFITS</span><h1>Rewards Store</h1><p>Redeem your points for special rewards. Shipping is free.</p></div><Link to="/membership">← Back to Member</Link></div>
    <section className="rewards-points-strip"><div><small>YOUR POINTS BALANCE</small><strong>{Number(points).toLocaleString()} PTS</strong></div><Link to="/points">View points history →</Link></section>
    {error && <p className="benefits-error">{error}</p>}{message && <p className="benefits-success">{message}</p>}
    {items.length ? <div className="member-reward-grid">{items.map(p => <article className="member-reward-card" key={p.id}>
      <div className="member-reward-photo">{p.image ? <img src={imageUrl(p.image)} alt={p.name} /> : <span>✦</span>}</div>
      <div className="member-reward-content"><h3>{p.name}</h3><p>{p.description || 'Exclusive member reward.'}</p><div className="member-reward-meta"><strong>{p.points_required} Points</strong><span>{p.stock} left</span></div><div className="member-reward-shipping">✓ Free shipping</div><button disabled={points < p.points_required || p.stock < 1} onClick={() => redeem(p.id)}>{p.stock < 1 ? 'Out of stock' : points < p.points_required ? 'Not enough points' : 'Redeem now'}</button></div>
    </article>)}</div> : <div className="points-empty">There are no rewards available right now. Please check again later.</div>}
  </main>;
}
