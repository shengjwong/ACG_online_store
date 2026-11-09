import React, { useState, useEffect } from 'react';
import api from '../api/axios';

function AdminDashboard() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    category_id: 1,
    status: 'active',
  });
  const [imageFile, setImageFile] = useState(null);

  const fetchProducts = () => {
    setLoading(true);
    api.get('/products')
      .then((res) => {
        setProducts(res.data.data || res.data);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to fetch products.');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', description: '', price: '', stock: '', category_id: 1, status: 'active' });
    setImageFile(null);
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Prepare Multipart Form Data for Image Upload
    const data = new FormData();
    Object.keys(formData).forEach((key) => data.append(key, formData[key]));
    if (imageFile) {
      data.append('image', imageFile);
    }

    try {
      if (editingId) {
        // Method spoofing for Laravel PUT requests with file uploads
        data.append('_method', 'PUT');
        await api.post(`/products/${editingId}`, data, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        await api.post('/products', data, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      resetForm();
      fetchProducts();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save product. Check inputs.');
    }
  };

  const handleEdit = (product) => {
    setEditingId(product.id);
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price,
      stock: product.stock,
      category_id: product.category_id || 1,
      status: product.status || 'active',
    });
    setImageFile(null);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;

    try {
      await api.delete(`/products/${id}`);
      fetchProducts();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete product.');
    }
  };

  if (loading) return <h2 style={{ padding: '2rem', color: '#fff', textAlign: 'center' }}>Loading Admin Panel...</h2>;

  return (
    <div style={{ padding: '2rem', maxWidth: '1100px', margin: '0 auto', color: '#fff' }}>
      <h1 style={{ color: '#646cff', textAlign: 'center' }}>Admin Product Dashboard</h1>

      {error && (
        <div style={{ background: '#e53935', padding: '0.75rem', borderRadius: '6px', marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      {/* Form Section */}
      <div style={{ background: '#1e1e1e', padding: '1.5rem', borderRadius: '10px', marginBottom: '2rem', border: '1px solid #333' }}>
        <h2>{editingId ? 'Edit Product' : 'Add New Product'}</h2>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div style={{ gridColumn: 'span 2' }}>
            <label style={{ display: 'block', marginBottom: '0.4rem' }}>Product Name</label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #444', background: '#2a2a2a', color: '#fff' }}
            />
          </div>

          <div style={{ gridColumn: 'span 2' }}>
            <label style={{ display: 'block', marginBottom: '0.4rem' }}>Description</label>
            <textarea
              name="description"
              rows="3"
              value={formData.description}
              onChange={handleChange}
              style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #444', background: '#2a2a2a', color: '#fff' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.4rem' }}>Price (MYR)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="999999.99"
              name="price"
              required
              value={formData.price}
              onChange={handleChange}
              style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #444', background: '#2a2a2a', color: '#fff' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.4rem' }}>Stock Quantity</label>
            <input
              type="number"
              min="0"
              max="100000"
              name="stock"
              required
              value={formData.stock}
              onChange={handleChange}
              style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #444', background: '#2a2a2a', color: '#fff' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.4rem' }}>Product Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              style={{ width: '100%', padding: '0.4rem', borderRadius: '4px', border: '1px solid #444', background: '#2a2a2a', color: '#fff' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.4rem' }}>Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #444', background: '#2a2a2a', color: '#fff' }}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div style={{ gridColumn: 'span 2', display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
            <button
              type="submit"
              style={{ padding: '0.75rem 1.5rem', background: editingId ? '#ff9800' : '#4caf50', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              {editingId ? 'Update Product' : 'Add Product'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                style={{ padding: '0.75rem 1.5rem', background: '#757575', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Table Section */}
      <h2>Manage Inventory</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', background: '#1e1e1e', borderRadius: '8px', overflow: 'hidden' }}>
        <thead>
          <tr style={{ background: '#2a2a2a', textAlign: 'left', borderBottom: '1px solid #444' }}>
            <th style={{ padding: '1rem' }}>ID</th>
            <th style={{ padding: '1rem' }}>Name</th>
            <th style={{ padding: '1rem' }}>Status</th>
            <th style={{ padding: '1rem' }}>Price</th>
            <th style={{ padding: '1rem' }}>Stock</th>
            <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map((item) => (
            <tr key={item.id} style={{ borderBottom: '1px solid #333' }}>
              <td style={{ padding: '1rem' }}>{item.id}</td>
              <td style={{ padding: '1rem', fontWeight: 'bold' }}>{item.name}</td>
              <td style={{ padding: '1rem', textTransform: 'capitalize', color: item.status === 'active' ? '#4caf50' : '#e53935' }}>
                {item.status || 'active'}
              </td>
              <td style={{ padding: '1rem', color: '#4caf50' }}>RM {item.price}</td>
              <td style={{ padding: '1rem' }}>{item.stock}</td>
              <td style={{ padding: '1rem', textAlign: 'right' }}>
                <button
                  onClick={() => handleEdit(item)}
                  style={{ padding: '0.4rem 0.8rem', background: '#ff9800', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', marginRight: '0.5rem' }}
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  style={{ padding: '0.4rem 0.8rem', background: '#e53935', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default AdminDashboard;