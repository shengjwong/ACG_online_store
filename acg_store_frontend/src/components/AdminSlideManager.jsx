import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import '../styles/Shop.css';

function AdminSlideManager() {
  const [products, setProducts] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    api.get('/products')
      .then((res) => {
        const list = res.data.data || res.data;
        setProducts(list);

        // Pre-select products currently marked as featured
        const featured = list
          .filter((p) => Boolean(p.is_featured) && p.status !== 'inactive' && Number(p.stock) > 0)
          .map((p) => p.id);
        setSelectedIds(featured);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const toggleProduct = (product) => {
    if (product.status === 'inactive' || Number(product.stock) < 1) return;

    setSelectedIds((prev) =>
      prev.includes(product.id)
        ? prev.filter((id) => id !== product.id)
        : [...prev, product.id]
    );
  };

  const handleSave = () => {
    setSaving(true);
    setMessage(null);

    api.post('/admin/featured-slides', { product_ids: selectedIds })
      .then((res) => {
        setMessage({
          type: 'success',
          text: res.data.message || 'Homepage slider products saved!',
        });
      })
      .catch((err) => {
        setMessage({
          type: 'error',
          text: err.response?.data?.message || 'Failed to update slider products.',
        });
      })
      .finally(() => setSaving(false));
  };

  const visibleProducts = products.filter((p) =>
    p.name?.toLowerCase().includes(search.toLowerCase().trim())
  );

  if (loading) {
    return (
      <div className="shop-page">
        <p className="shop-muted">Loading products...</p>
      </div>
    );
  }

  return (
    <div className="shop-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
        <div>
          <h2 className="shop-title" style={{ marginBottom: '0.25rem' }}>Homepage Slide Manager</h2>
          <p className="shop-muted" style={{ margin: 0 }}>
            Select which available products appear in the auto-running main page slider.
            {selectedIds.length === 0 && ' (If none are selected, all available products will rotate automatically.)'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
          <button
            type="button"
            className="shop-btn shop-btn-ghost"
            onClick={() => setSelectedIds([])}
          >
            Clear All ({selectedIds.length})
          </button>
          <button
            type="button"
            className="shop-btn shop-btn-primary"
            disabled={saving}
            onClick={handleSave}
          >
            {saving ? 'Saving...' : `Save Slides (${selectedIds.length})`}
          </button>
        </div>
      </div>

      {message && (
        <div className={message.type === 'success' ? 'shop-success' : 'shop-error'}>
          {message.text}
        </div>
      )}

      <div className="shop-toolbar">
        <input
          type="text"
          className="shop-input"
          placeholder="Filter products by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="slide-manager-grid">
        {visibleProducts.map((item) => {
          const isUnavailable = item.status === 'inactive' || Number(item.stock) < 1;
          const isSelected = !isUnavailable && selectedIds.includes(item.id);
          const imageUrl = item.image
            ? `http://127.0.0.1:8000/storage/${item.image}`
            : 'https://via.placeholder.com/300x200?text=No+Image';

          return (
            <div
              key={item.id}
              className={`slide-select-card ${isSelected ? 'selected' : ''} ${isUnavailable ? 'unavailable' : ''}`}
            >
              <div>
                <img
                  src={imageUrl}
                  alt={item.name}
                  className="slide-select-img"
                  onError={(e) => { e.target.src = 'https://via.placeholder.com/300x200?text=No+Image'; }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <span className="shop-muted" style={{ fontSize: '0.78rem' }}>
                    {item.category?.name || 'Uncategorized'}
                  </span>
                  <span className={`badge ${isUnavailable ? 'badge-failed' : 'badge-successful'}`}>
                    {item.status === 'inactive'
                      ? 'Unavailable'
                      : Number(item.stock) < 1
                      ? 'Out of Stock'
                      : `Stock: ${item.stock}`}
                  </span>
                </div>
                <h4 style={{ margin: '0 0 0.35rem', fontSize: '1rem' }}>{item.name}</h4>
                <div style={{ color: '#D4AF37', fontWeight: '700', fontSize: '0.95rem' }}>
                  RM {parseFloat(item.price).toFixed(2)}
                </div>
              </div>

              <button
                type="button"
                disabled={isUnavailable}
                className={`slide-toggle-btn ${isSelected ? 'included' : 'excluded'}`}
                onClick={() => toggleProduct(item)}
              >
                {isUnavailable
                  ? 'Cannot Show (Unavailable)'
                  : isSelected
                  ? '✓ Shown in Main Slide'
                  : '+ Add to Main Slide'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default AdminSlideManager;