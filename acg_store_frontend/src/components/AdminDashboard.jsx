import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { COUNTRY_CODES } from '../utils/countryCodes';
import '../styles/AdminDashboard.css'; 

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

  if (loading) return <h2 className="admin-loading">Loading Admin Panel...</h2>;

  return (
    <div className="admin-container">
      <h1 className="admin-title">Admin Control Center</h1>

      {error && <div className="admin-error-box">{error}</div>}

      {/* Tabs */}
      <div className="admin-tabs">
        <button
          onClick={() => setActiveTab('products')}
          className={`tab-btn ${activeTab === 'products' ? 'active-products' : ''}`}
        >
          Manage Products
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`tab-btn ${activeTab === 'users' ? 'active-users' : ''}`}
        >
          Manage Users & Admins
        </button>
      </div>

      {/* PRODUCTS TAB */}
      {activeTab === 'products' && (
        <div>
          <div className="admin-card">
            <h2 style={{ marginBottom: '1.2rem' }}>{productEditingId ? 'Edit Product' : 'Add New Product'}</h2>
            <form onSubmit={handleProductSubmit} className="admin-form-grid">
              <div className="form-full-width">
                <label className="form-label">Product Name</label>
                <input
                  type="text"
                  required
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  className="form-input"
                />
              </div>
              <div className="form-full-width">
                <label className="form-label">Description</label>
                <textarea
                  rows="3"
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  className="form-input"
                />
              </div>
              <div>
                <label className="form-label">Price (MYR)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="999999.99"
                  required
                  value={productForm.price}
                  onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                  className="form-input"
                />
              </div>
              <div>
                <label className="form-label">Stock Quantity</label>
                <input
                  type="number"
                  min="0"
                  max="100000"
                  required
                  value={productForm.stock}
                  onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                  className="form-input"
                />
              </div>
              <div>
                <label className="form-label">Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setProductImageFile(e.target.files[0])}
                  className="form-input"
                />
              </div>
              <div>
                <label className="form-label">Status</label>
                <select
                  value={productForm.status}
                  onChange={(e) => setProductForm({ ...productForm, status: e.target.value })}
                  className="form-input"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="form-actions">
                <button type="submit" className={`btn-submit ${productEditingId ? 'update' : 'create'}`}>
                  {productEditingId ? 'Update Product' : 'Add Product'}
                </button>
                {productEditingId && (
                  <button type="button" onClick={resetProductForm} className="btn-cancel">
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          <h2>Inventory Items</h2>
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Image</th>
                <th>Name</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((item) => {
                const imageUrl = item.image
                  ? `http://127.0.0.1:8000/storage/${item.image}`
                  : 'https://via.placeholder.com/50?text=No+Img';

                return (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td>
                      <img
                        src={imageUrl}
                        alt={item.name}
                        className="table-img-thumb"
                        onError={(e) => { e.target.src = 'https://via.placeholder.com/50?text=No+Img'; }}
                      />
                    </td>
                    <td style={{ fontWeight: 'bold' }}>{item.name}</td>
                    <td style={{ color: '#4caf50' }}>RM {item.price}</td>
                    <td>{item.stock}</td>
                    <td>
                      <span className={`badge-status ${item.status === 'active' ? 'active' : 'inactive'}`}>
                        {item.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        onClick={() => {
                          setProductEditingId(item.id);
                          setProductForm({ name: item.name, description: item.description || '', price: item.price, stock: item.stock, category_id: item.category_id || 1, status: item.status || 'active' });
                        }}
                        className="table-action-btn edit"
                      >
                        Edit
                      </button>
                      <button onClick={() => handleProductDelete(item.id)} className="table-action-btn delete">
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

      {/* USERS TAB */}
      {activeTab === 'users' && (
        <div>
          <div className="admin-card">
            <h2 style={{ marginBottom: '1.2rem' }}>{userEditingId ? 'Edit User Account' : 'Create New User / Admin'}</h2>
            <form onSubmit={handleUserSubmit} className="admin-form-grid">
              <div>
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  required
                  value={userForm.name}
                  onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                  className="form-input"
                />
              </div>

              <div>
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  required
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  className="form-input"
                />
              </div>

              <div>
                <label className="form-label">
                  {userEditingId ? 'Password (Min 8 chars, leave blank to keep)' : 'Password (Min 8 chars)'}
                </label>
                <input
                  type="password"
                  required={!userEditingId}
                  value={userForm.password}
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                  className="form-input"
                />
              </div>

              {/* Country Code + Phone Input */}
              <div>
                <label className="form-label">Phone Number</label>
                <div className="phone-input-group">
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="form-input phone-country-select"
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
                    className="form-input phone-local-input"
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Profile Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setProfileImageFile(e.target.files[0]);
                    }
                  }}
                  className="form-input"
                />
              </div>

              <div>
                <label className="form-label">Account Role</label>
                <select
                  value={userForm.role}
                  onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                  className="form-input"
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="form-actions">
                <button type="submit" className={`btn-submit ${userEditingId ? 'update' : 'create'}`}>
                  {userEditingId ? 'Update Account' : 'Create Account'}
                </button>
                {userEditingId && (
                  <button type="button" onClick={resetUserForm} className="btn-cancel">
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          <h2>Registered Accounts</h2>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Avatar</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Role</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const avatarUrl = u.profile_image && u.profile_image !== 'default.png'
                  ? `http://127.0.0.1:8000/storage/${u.profile_image}`
                  : 'https://via.placeholder.com/40?text=U';

                return (
                  <tr key={u.id}>
                    <td>
                      <img
                        src={avatarUrl}
                        alt={u.name}
                        className="table-avatar-thumb"
                        onError={(e) => { e.target.src = 'https://via.placeholder.com/40?text=U'; }}
                      />
                    </td>
                    <td style={{ fontWeight: 'bold' }}>{u.name}</td>
                    <td style={{ color: '#aaa' }}>{u.email}</td>
                    <td style={{ color: '#aaa' }}>{u.phone_number || '-'}</td>
                    <td>
                      <span className={`badge-status ${u.role === 'admin' ? 'badge-role-admin' : 'badge-role-member'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button onClick={() => handleUserEdit(u)} className="table-action-btn edit">
                        Edit
                      </button>
                      <button onClick={() => handleUserDelete(u.id)} className="table-action-btn delete">
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