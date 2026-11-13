import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import '../styles/MemberBenefits.css';

export default function MyPoints() {
  const [data, setData] = useState({ balance: 0, transactions: [] });
  const [error, setError] = useState('');
  useEffect(() => { api.get('/points').then(r => setData(r.data.data || { balance: 0, transactions: [] })).catch(() => setError('Unable to load your points.')); }, []);
  return <main className="benefits-page">
    <div className="benefits-heading"><div><span>MEMBER BENEFITS</span><h1>My Points</h1><p>Earn points when you make successful product purchases.</p></div><Link to="/membership">← Back to Member</Link></div>
    {error && <p className="benefits-error">{error}</p>}
    <section className="points-balance"><div><small>AVAILABLE POINTS</small><h2>{Number(data.balance || 0).toLocaleString()} <span>PTS</span></h2><p>Use your points to redeem rewards.</p></div><div className="points-star">✧</div></section>
    <section className="points-history"><div className="benefits-section-title"><h2>Points History</h2><span>{data.transactions.length} transactions</span></div>
      {data.transactions.length ? <div className="points-table-wrap"><table><thead><tr><th>Date</th><th>Activity</th><th>Description</th><th>Points</th></tr></thead><tbody>{data.transactions.map(t => <tr key={t.id}><td>{new Date(t.created_at).toLocaleDateString()}</td><td>{t.type}</td><td>{t.description || '—'}</td><td className={Number(t.points) >= 0 ? 'points-plus' : 'points-minus'}>{Number(t.points) > 0 ? '+' : ''}{t.points}</td></tr>)}</tbody></table></div> : <div className="points-empty">No points activity yet. Shop and earn your first points!</div>}
    </section>
  </main>;
}
