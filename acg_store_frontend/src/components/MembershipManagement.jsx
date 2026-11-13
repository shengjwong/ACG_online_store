import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import '../styles/MembershipManagement.css';

// Display dates consistently as DD/MM/YYYY (day/month/year).
const fmt = (v) => {
  if (!v) return 'Not set';
  const date = new Date(v);
  if (Number.isNaN(date.getTime())) return 'Not set';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

export default function MembershipManagement({ admin = false }) {
  const [rows, setRows] = useState([]);
  const [mine, setMine] = useState(null);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = async () => {
    try {
      setError('');
      if (admin) {
        const r = await api.get('/admin/memberships');
        setRows(r.data.data || []);
      } else {
        const r = await api.get('/membership/me');
        setMine(r.data.data);
      }
    } catch (e) {
      setError(e.response?.data?.message || 'Unable to load membership.');
    }
  };

  useEffect(() => { load(); }, [admin]);

  const startPaidRenewal = async () => {
    try {
      setError(''); setMessage('');
      const r = await api.post('/membership/renew/checkout');
      if (r.data.approval_url) window.location.href = r.data.approval_url;
      else setError('PayPal approval link was not returned.');
    } catch (e) {
      setError(e.response?.data?.message || 'Unable to start PayPal renewal.');
    }
  };

  const action = async (url) => {
    try {
      setError(''); setMessage('');
      const r = await api.post(url);
      setMessage(r.data.message || 'Updated successfully.');
      if (admin) setSelected(r.data.data); else setMine(r.data.data);
      await load();
    } catch (e) {
      setError(e.response?.data?.message || 'Action failed.');
    }
  };

  if (!admin) {
    const active = mine?.membership_status === 'active';
    const tier = mine?.membership_tier || 'Bronze';
    return (
      <main className="membership-page member-dashboard">
        <div className="member-hero">
          <div>
            <span className="member-eyebrow">ACG STORE · MEMBER AREA</span>
            <h1>My Membership</h1>
            <p>Your membership, points and exclusive rewards — all in one place.</p>
          </div>
          <div className={`tier-emblem tier-${tier.toLowerCase()}`}>
            <span>✦</span><small>{tier.toUpperCase()}</small>
          </div>
        </div>

        {error && <p className="m-alert error">{error}</p>}
        {message && <p className="m-alert">{message}</p>}

        {mine ? (
          <>
            <section className="member-overview">
              <div className="member-overview-top">
                <div>
                  <span className="member-label">MEMBERSHIP TIER</span>
                  <h2>{tier} Member</h2>
                  <span className={`m-status ${mine.membership_status}`}>{mine.membership_status || 'inactive'}</span>
                </div>
                <div className="member-id">MEMBER ID <strong>#{mine.id}</strong></div>
              </div>
              <div className="member-details-grid">
                <div><span>Name</span><strong>{mine.name}</strong></div>
                <div><span>Email</span><strong>{mine.email}</strong></div>
                <div><span>Phone</span><strong>{mine.phone_number || 'Not provided'}</strong></div>
                <div><span>Member since</span><strong>{fmt(mine.created_at)}</strong></div>
                <div><span>Membership expiry</span><strong>{fmt(mine.membership_expiry)}</strong></div>
                <div><span>Total product spending</span><strong>RM {Number(mine.total_spend || 0).toFixed(2)}</strong></div>
              </div>
              <div className="member-renew-row">
                <div>
                  <strong>{active ? 'Keep enjoying your member benefits' : 'Your membership needs renewal'}</strong>
                  <p>{active ? 'Renew early to extend your membership.' : 'Renew to reactivate your membership benefits.'}</p>
                </div>
                <button onClick={startPaidRenewal}>Renew · RM15 / 3 Months</button>
              </div>
            </section>

            <section className="member-shortcuts">
              <Link to="/points" className="member-shortcut points-shortcut">
                <span className="shortcut-icon">✧</span>
                <span><small>YOUR BALANCE</small><strong>My Points</strong><em>View points and transaction history</em></span>
                <b>→</b>
              </Link>
              <Link to="/rewards" className="member-shortcut rewards-shortcut">
                <span className="shortcut-icon">🎁</span>
                <span><small>EXCLUSIVE FOR MEMBERS</small><strong>Rewards Store</strong><em>Redeem points for rewards with free shipping</em></span>
                <b>→</b>
              </Link>
            </section>
          </>
        ) : (
          <section className="m-card"><p>Loading membership details…</p></section>
        )}
      </main>
    );
  }

  return (
    <main className="membership-page">
      <h1>Membership Management</h1>
      <p>View member profiles, deactivate and renew membership.</p>
      {error && <p className="m-alert error">{error}</p>}
      {message && <p className="m-alert">{message}</p>}
      <div className="m-layout">
        <section className="m-card">
          <h2>Members ({rows.length})</h2>
          <div className="m-scroll"><table><thead><tr><th>Member</th><th>Tier</th><th>Status</th><th>Expiry</th><th></th></tr></thead>
            <tbody>{rows.map(m => <tr key={m.id}><td>{m.name}<small>{m.email}</small></td><td>{m.membership_tier}</td><td><span className={'m-status ' + m.membership_status}>{m.membership_status}</span></td><td>{fmt(m.membership_expiry)}</td><td><button onClick={async () => { try { const r = await api.get('/admin/memberships/' + m.id); setSelected(r.data.data); } catch (e) { setError(e.response?.data?.message || 'Unable to view profile.'); } }}>View</button></td></tr>)}</tbody>
          </table></div>
        </section>
        {selected && <section className="m-card"><h2>Member Profile</h2><h3>{selected.name}</h3><p>{selected.email}</p><p><b>Member ID:</b> {selected.id}</p><p><b>Phone:</b> {selected.phone_number || 'Not provided'}</p><p><b>Tier:</b> {selected.membership_tier}</p><p><b>Status:</b> {selected.membership_status}</p><p><b>Expiry:</b> {fmt(selected.membership_expiry)}</p><p><b>Joined:</b> {fmt(selected.created_at)}</p><button className="m-danger" disabled={selected.membership_status === 'inactive'} onClick={() => { if (window.confirm('Deactivate membership for ' + selected.name + '?')) action('/admin/memberships/' + selected.id + '/deactivate'); }}>Deactivate Membership</button><small>Deactivation does not delete or disable the login account.</small></section>}
      </div>
    </main>
  );
}
