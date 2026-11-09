import React, { useEffect, useState } from 'react';
import api from './api/axios';

function App() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get('/products')
      .then((res) => {
        // Unwraps response whether backend wraps data in res.data.data or res.data
        const data = res.data.data || res.data;
        setProducts(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error('API Error:', err);
        setError(err.message || 'Failed to connect to backend API');
        setLoading(false);
      });
  }, []);

  if (loading) return <h2 style={{ padding: '2rem', color: '#fff' }}>Loading ACG Store Products...</h2>;

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif', minHeight: '100vh', backgroundColor: '#121212', color: '#fff' }}>
      <h1 style={{ color: '#646cff', textAlign: 'center' }}>Online ACG Store</h1>
      <h2 style={{ textAlign: 'center' }}>Product Catalog</h2>

      {error && (
        <div style={{ padding: '1rem', background: '#e53935', borderRadius: '6px', margin: '1rem 0' }}>
          Error: {error}. Check if your Laravel backend server is running on http://127.0.0.1:8000.
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.5rem', marginTop: '2rem' }}>
        {products.map((item) => (
          <div key={item.id} style={{ border: '1px solid #333', borderRadius: '10px', padding: '1.5rem', background: '#1e1e1e' }}>
            <h3 style={{ marginTop: 0, color: '#646cff' }}>{item.name}</h3>
            <p style={{ color: '#aaa', fontSize: '0.9rem' }}>{item.description}</p>
            <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong style={{ fontSize: '1.2rem', color: '#4caf50' }}>RM {item.price}</strong>
              <span style={{ fontSize: '0.8rem', color: '#888' }}>Stock: {item.stock}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;