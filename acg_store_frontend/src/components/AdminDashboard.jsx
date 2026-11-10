import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { COUNTRY_CODES } from '../utils/countryCodes';

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('products');
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Product Form State
  const [productEditingId, setProductEditingId] = useState(null);
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    category_id: 1,
    status: 'active',
  });
  const [productImageFile, setProductImageFile] = useState(null);

  // User Form State
  const [userEditingId, setUserEditingId] = useState(null);
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'member',
  });
  const [countryCode, setCountryCode] = useState('+60');
  const [localPhone, setLocalPhone] = useState('');
  const [profileImageFile, setProfileImageFile] = useState(null);

  const fetchData = () => {
    setLoading(true);
    Promise.all([api.get('/products'), api.get('/users')])
      .then(([prodRes, userRes]) => {
        setProducts(prodRes.data.data || prodRes.data);
        setUsers(userRes.data.data || userRes.data);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to fetch dashboard data.');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- PRODUCT HANDLERS ---
  const resetProductForm = () => {
    setProductForm({ name: '', description: '', price: '', stock: '', category_id: 1, status: 'active' });
    setProductImageFile(null);
    setProductEditingId(null);
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const data = new FormData();
    Object.keys(productForm).forEach((key) => data.append(key, productForm[key]));
    if (productImageFile) data.append('image', productImageFile);

    try {
      const config = { headers: { 'Content-Type': 'multipart/form-data' } };
      if (productEditingId) {
        data.append('_method', 'PUT');
        await api.post(`/products/${productEditingId}`, data, config);
      } else {
        await api.post('/products', data, config);
      }
      resetProductForm();
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save product.');
    }
  };

  const handleProductDelete = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      await api.delete(`/products/${id}`);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete product.');
    }
  };

  // --- USER HANDLERS ---
  const resetUserForm = () => {
    setUserForm({ name: '', email: '', password: '', role: 'member' });
    setCountryCode('+60');
    setLocalPhone('');
    setProfileImageFile(null);
    setUserEditingId(null);
  };

  const handleUserSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const data = new FormData();
    data.append('name', userForm.name);
    data.append('email', userForm.email);
    data.append('role', userForm.role);

    if (userForm.password) {
      data.append('password', userForm.password);
    }

    const cleanLocal = localPhone.replace(/^0+/, '');
    const formattedPhone = cleanLocal ? `${countryCode}${cleanLocal}` : '';
    if (formattedPhone) {
      data.append('phone_number', formattedPhone);
    }

    if (profileImageFile && profileImageFile instanceof File) {
      data.append('profile_image', profileImageFile);
    }

    try {
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      };

      if (userEditingId) {
        data.append('_method', 'PUT');
        await api.post(`/users/${userEditingId}`, data, config);
      } else {
        await api.post('/users', data, config);
      }
      resetUserForm();
      fetchData();
    } catch (err) {
      const serverMessage = err.response?.data?.message;
      const validationErrors = err.response?.data?.errors;
      if (validationErrors) {
        const firstErr = Object.values(validationErrors).flat()[0];
        setError(firstErr || serverMessage);
      } else {
        setError(serverMessage || 'Failed to save user account.');
      }
    }
  };

  const handleUserEdit = (user) => {
    setUserEditingId(user.id);
    setUserForm({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
    });

    let rawPhone = user.phone_number || '';
    let matchedCode = '+60';
    let matchedLocal = rawPhone;

    if (rawPhone.startsWith('+')) {
      const found = COUNTRY_CODES.find((c) => rawPhone.startsWith(c.code));
      if (found) {
        matchedCode = found.code;
        matchedLocal = rawPhone.slice(found.code.length);
      }
    } else {
      matchedLocal = rawPhone.replace(/^0+/, '');
    }

    setCountryCode(matchedCode);
    setLocalPhone(matchedLocal);
    setProfileImageFile(null);
  };

  const handleUserDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await api.delete(`/users/${id}`);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete user.');
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '0.55rem 0.75rem',
    borderRadius: '6px',
    border: '1px solid #444',
    background: '#2a2a2a',
    color: '#fff',
    fontSize: '0.9rem',
    boxSizing: 'border-box',
    outline: 'none',
  };

  if (loading) return <h2 style={{ padding: '2rem', color: '#fff', textAlign: 'center' }}>Loading Admin Panel...</h2>;

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', color: '#fff' }}>
      <h1 style={{ color: '#646cff', textAlign: 'center', marginBottom: '1.5rem' }}>Admin Control Center</h1>

      {error && (
        <div style={{ background: 'rgba(229, 57, 53, 0.2)', border: '1px solid #e53935', color: '#ff6b6b', padding: '0.75rem', borderRadius: '6px', marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', justifyContent: 'center' }}>
        <button
          onClick={() => setActiveTab('products')}
          style={{
            padding: '0.6rem 1.5rem',
            background: activeTab === 'products' ? '#646cff' : '#2a2a2a',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
        >
          Manage Products
        </button>
        <button
          onClick={() => setActiveTab('users')}
          style={{
            padding: '0.6rem 1.5rem',
            background: activeTab === 'users' ? '#ff9800' : '#2a2a2a',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
        >
          Manage Users & Admins
        </button>
      </div>

      {/* PRODUCTS TAB */}
      {activeTab === 'products' && (
        <div>
          <div style={{ background: '#1e1e1e', padding: '1.5rem', borderRadius: '10px', marginBottom: '2rem', border: '1px solid #333' }}>
            <h2 style={{ marginBottom: '1.2rem' }}>{productEditingId ? 'Edit Product' : 'Add New Product'}</h2>
            <form onSubmit={handleProductSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', color: '#ccc' }}>Product Name</label>
                <input
                  type="text"
                  required
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  style={inputStyle}
                />
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', color: '#ccc' }}>Description</label>
                <textarea
                  rows="3"
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', color: '#ccc' }}>Price (MYR)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="999999.99"
                  required
                  value={productForm.price}
                  onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', color: '#ccc' }}>Stock Quantity</label>
                <input
                  type="number"
                  min="0"
                  max="100000"
                  required
                  value={productForm.stock}
                  onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', color: '#ccc' }}>Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setProductImageFile(e.target.files[0])}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', color: '#ccc' }}>Status</label>
                <select
                  value={productForm.status}
                  onChange={(e) => setProductForm({ ...productForm, status: e.target.value })}
                  style={inputStyle}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div style={{ gridColumn: 'span 2', display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <button type="submit" style={{ padding: '0.75rem 1.5rem', background: productEditingId ? '#ff9800' : '#4caf50', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                  {productEditingId ? 'Update Product' : 'Add Product'}
                </button>
                {productEditingId && (
                  <button type="button" onClick={resetProductForm} style={{ padding: '0.75rem 1.5rem', background: '#757575', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          <h2>Inventory Items</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: '#1e1e1e', borderRadius: '8px', overflow: 'hidden' }}>
            <thead>
              <tr style={{ background: '#2a2a2a', textAlign: 'left', borderBottom: '1px solid #444' }}>
                <th style={{ padding: '1rem' }}>ID</th>
                <th style={{ padding: '1rem' }}>Image</th>
                <th style={{ padding: '1rem' }}>Name</th>
                <th style={{ padding: '1rem' }}>Price</th>
                <th style={{ padding: '1rem' }}>Stock</th>
                <th style={{ padding: '1rem' }}>Status</th>
                <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((item) => {
                const imageUrl = item.image
                  ? `http://127.0.0.1:8000/storage/${item.image}`
                  : 'https://via.placeholder.com/50?text=No+Img';

                return (
                  <tr key={item.id} style={{ borderBottom: '1px solid #333' }}>
                    <td style={{ padding: '1rem' }}>{item.id}</td>
                    <td style={{ padding: '1rem' }}>
                      <img
                        src={imageUrl}
                        alt={item.name}
                        style={{ width: '50px', height: '50px', borderRadius: '6px', objectFit: 'cover' }}
                        onError={(e) => { e.target.src = 'https://via.placeholder.com/50?text=No+Img'; }}
                      />
                    </td>
                    <td style={{ padding: '1rem', fontWeight: 'bold' }}>{item.name}</td>
                    <td style={{ padding: '1rem', color: '#4caf50' }}>RM {item.price}</td>
                    <td style={{ padding: '1rem' }}>{item.stock}</td>
                    <td style={{ padding: '1rem' }}>
                      <span
                        style={{
                          padding: '0.2rem 0.6rem',
                          borderRadius: '4px',
                          fontSize: '0.85rem',
                          fontWeight: 'bold',
                          background: item.status === 'active' ? '#4caf50' : '#e53935',
                          color: '#fff',
                        }}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      <button
                        onClick={() => {
                          setProductEditingId(item.id);
                          setProductForm({ name: item.name, description: item.description || '', price: item.price, stock: item.stock, category_id: item.category_id || 1, status: item.status || 'active' });
                        }}
                        style={{ padding: '0.4rem 0.8rem', background: '#ff9800', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', marginRight: '0.5rem' }}
                      >
                        Edit
                      </button>
                      <button onClick={() => handleProductDelete(item.id)} style={{ padding: '0.4rem 0.8rem', background: '#e53935', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Delete</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* USERS TAB */}
      {activeTab === 'users' && (
        <div>
          <div style={{ background: '#1e1e1e', padding: '1.5rem', borderRadius: '10px', marginBottom: '2rem', border: '1px solid #333' }}>
            <h2 style={{ marginBottom: '1.2rem' }}>{userEditingId ? 'Edit User Account' : 'Create New User / Admin'}</h2>
            <form onSubmit={handleUserSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', color: '#ccc' }}>Full Name</label>
                <input
                  type="text"
                  required
                  value={userForm.name}
                  onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', color: '#ccc' }}>Email Address</label>
                <input
                  type="email"
                  required
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', color: '#ccc' }}>
                  {userEditingId ? 'Password (Min 8 chars, leave blank to keep)' : 'Password (Min 8 chars)'}
                </label>
                <input
                  type="password"
                  required={!userEditingId}
                  value={userForm.password}
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                  style={inputStyle}
                />
              </div>

              {/* Compact Country Code + Phone Input */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', color: '#ccc' }}>Phone Number</label>
                <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    style={{
                      ...inputStyle,
                      width: '110px',
                      cursor: 'pointer',
                      paddingRight: '0.2rem',
                    }}
                  >
                    {COUNTRY_CODES.map((c) => (
                      <option key={c.code} value={c.code} style={{ background: '#1e1e1e', color: '#fff' }}>
                        {c.code} ({c.country})
                      </option>
                    ))}
                  </select>
                  <input
                    type="tel"
                    placeholder="123456789"
                    value={localPhone}
                    onChange={(e) => setLocalPhone(e.target.value.replace(/\D/g, ''))}
                    style={{ ...inputStyle, flex: 1 }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', color: '#ccc' }}>Profile Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setProfileImageFile(e.target.files[0]);
                    }
                  }}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', color: '#ccc' }}>Account Role</label>
                <select
                  value={userForm.role}
                  onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                  style={inputStyle}
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div style={{ gridColumn: 'span 2', display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <button type="submit" style={{ padding: '0.75rem 1.5rem', background: userEditingId ? '#ff9800' : '#4caf50', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                  {userEditingId ? 'Update Account' : 'Create Account'}
                </button>
                {userEditingId && (
                  <button type="button" onClick={resetUserForm} style={{ padding: '0.75rem 1.5rem', background: '#757575', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          <h2>Registered Accounts</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: '#1e1e1e', borderRadius: '8px', overflow: 'hidden' }}>
            <thead>
              <tr style={{ background: '#2a2a2a', textAlign: 'left', borderBottom: '1px solid #444' }}>
                <th style={{ padding: '1rem' }}>Avatar</th>
                <th style={{ padding: '1rem' }}>Name</th>
                <th style={{ padding: '1rem' }}>Email</th>
                <th style={{ padding: '1rem' }}>Phone</th>
                <th style={{ padding: '1rem' }}>Role</th>
                <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const avatarUrl = u.profile_image && u.profile_image !== 'default.png'
                  ? `http://127.0.0.1:8000/storage/${u.profile_image}`
                  : 'https://via.placeholder.com/40?text=U';

                return (
                  <tr key={u.id} style={{ borderBottom: '1px solid #333' }}>
                    <td style={{ padding: '1rem' }}>
                      <img
                        src={avatarUrl}
                        alt={u.name}
                        style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                        onError={(e) => { e.target.src = 'https://via.placeholder.com/40?text=U'; }}
                      />
                    </td>
                    <td style={{ padding: '1rem', fontWeight: 'bold' }}>{u.name}</td>
                    <td style={{ padding: '1rem', color: '#aaa' }}>{u.email}</td>
                    <td style={{ padding: '1rem', color: '#aaa' }}>{u.phone_number || '-'}</td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 'bold', background: u.role === 'admin' ? '#ff9800' : '#444', color: '#fff' }}>
                        {u.role}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      <button
                        onClick={() => handleUserEdit(u)}
                        style={{ padding: '0.4rem 0.8rem', background: '#ff9800', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', marginRight: '0.5rem' }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleUserDelete(u.id)}
                        style={{ padding: '0.4rem 0.8rem', background: '#e53935', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;