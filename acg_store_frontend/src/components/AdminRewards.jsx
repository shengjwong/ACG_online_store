import React, { useEffect, useRef, useState } from 'react';
import api from '../api/axios';
import '../styles/RewardsManagement.css';

const emptyForm = { name: '', description: '', points_required: 100, stock: 1 };
const imageUrl = (image) => !image ? '' : image.startsWith('http') ? image : `http://127.0.0.1:8000/storage/${image}`;

export default function AdminRewards() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState('');
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const fileRef = useRef(null);

  const load = () => api.get('/admin/rewards')
    .then(r => setRows(r.data.data || []))
    .catch(e => setError(e.response?.data?.message || 'Unable to load rewards.'));

  useEffect(() => { load(); }, []);
  useEffect(() => () => { if (preview.startsWith('blob:')) URL.revokeObjectURL(preview); }, [preview]);

  const choosePhoto = (file) => {
    setPhoto(file || null);
    setPreview(file ? URL.createObjectURL(file) : '');
  };

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setMessage('');
    const data = new FormData();
    Object.entries(form).forEach(([key, value]) => data.append(key, value));
    if (photo) data.append('photo', photo);
    try {
      if (editing) {
        data.append('_method', 'PUT');
        await api.post(`/admin/rewards/${editing}`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
        setMessage('Reward updated successfully.');
      } else {
        await api.post('/admin/rewards', data, { headers: { 'Content-Type': 'multipart/form-data' } });
        setMessage('Reward created successfully.');
      }
      setForm(emptyForm); setPhoto(null); setPreview(''); setEditing(null);
      if (fileRef.current) fileRef.current.value = '';
      load();
    } catch (e2) {
      setError(e2.response?.data?.message || 'Unable to save reward.');
    }
  };

  const edit = (p) => {
    setEditing(p.id);
    setForm({ name: p.name || '', description: p.description || '', points_required: p.points_required, stock: p.stock });
    setPhoto(null); setPreview(imageUrl(p.image));
    if (fileRef.current) fileRef.current.value = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditing(null); setForm(emptyForm); setPhoto(null); setPreview('');
    if (fileRef.current) fileRef.current.value = '';
  };

  const del = async (id) => {
    if (!window.confirm('Delete this reward?')) return;
    try { await api.delete(`/admin/rewards/${id}`); setMessage('Reward deleted.'); load(); }
    catch (e) { setError(e.response?.data?.message || 'Delete failed.'); }
  };

  return (
    <main className="rewards-admin-page">
      <header className="rewards-admin-header">
        <div><span>ACG STORE · ADMIN</span><h1>Rewards Management</h1><p>Create rewards and manage points, photos and stock.</p></div>
        <div className="rewards-count"><strong>{rows.length}</strong><small>REWARD ITEMS</small></div>
      </header>
      {error && <p className="rewards-alert error">{error}</p>}
      {message && <p className="rewards-alert">{message}</p>}
      <form onSubmit={submit} className="reward-editor">
        <div className="reward-editor-title"><div><span>{editing ? 'UPDATE ITEM' : 'NEW ITEM'}</span><h2>{editing ? 'Edit Reward Product' : 'Create Reward Product'}</h2></div><span className="reward-editor-mark">✦</span></div>
        <div className="reward-form-grid">
          <label className="reward-field">Product name<input required maxLength="255" placeholder="e.g. Pokémon Booster Pack" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></label>
          <label className="reward-field">Description<textarea rows="3" placeholder="Describe this reward…" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></label>
          <div className="reward-field"><span>Product photo</span><label className="photo-dropzone">
            {preview ? <img src={preview} alt="Reward preview" /> : <span className="photo-placeholder"><b>＋</b><strong>Upload photo</strong><small>JPG, PNG or WEBP · Max 4MB</small></span>}
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={e => choosePhoto(e.target.files?.[0])} />
          </label>{photo && <small className="photo-name">{photo.name}</small>}</div>
          <div className="reward-side-fields">
            <label className="reward-field">Points required<input type="number" min="1" required value={form.points_required} onChange={e => setForm({ ...form, points_required: Number(e.target.value) })} /></label>
            <label className="reward-field">Available stock<input type="number" min="0" required value={form.stock} onChange={e => setForm({ ...form, stock: Number(e.target.value) })} /></label>
          </div>
        </div>
        <div className="reward-form-actions"><button className="reward-save" type="submit">{editing ? 'Save Changes' : 'Create Reward'}</button>{editing && <button className="reward-cancel" type="button" onClick={cancelEdit}>Cancel</button>}</div>
      </form>
      <section className="rewards-list-section">
        <div className="rewards-list-heading"><div><span>YOUR CATALOG</span><h2>Existing Rewards</h2></div><small>{rows.length} items</small></div>
        {rows.length === 0 ? <div className="reward-empty">No reward products yet. Create your first item above.</div> :
          <div className="rewards-admin-grid">{rows.map(p => <article className="reward-admin-card" key={p.id}>
            <div className="reward-admin-image">{p.image ? <img src={imageUrl(p.image)} alt={p.name} /> : <span>✦</span>}</div>
            <div className="reward-admin-info"><h3>{p.name}</h3><p>{p.description || 'No description provided.'}</p><div><b>{p.points_required} pts</b><span>Stock: {p.stock}</span></div>
              <footer><button onClick={() => edit(p)}>Edit</button><button className="delete" onClick={() => del(p.id)}>Delete</button></footer>
            </div>
          </article>)}</div>}
      </section>
    </main>
  );
}
