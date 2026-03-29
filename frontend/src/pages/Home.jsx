import { useState, useEffect } from 'react';
import { api } from '../api';
import './Home.css';

export default function Home({ token, onLogout }) {
  const [items, setItems] = useState([]);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      setLoading(true);
      const data = await api.getItems(token);
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      setError('Failed to load items');
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!name || !price || !quantity) {
      setError('All fields required');
      return;
    }

    try {
      await api.addItem(token, name, parseFloat(price), parseInt(quantity));
      setName('');
      setPrice('');
      setQuantity('');
      setError('');
      loadItems();
    } catch (err) {
      setError('Failed to add item');
    }
  };

  const handleDeleteItem = async (id) => {
    try {
      await api.deleteItem(token, id);
      loadItems();
    } catch (err) {
      setError('Failed to delete item');
    }
  };

  const handleUpdateItem = async (e) => {
    e.preventDefault();
    try {
      await api.updateItem(token, editingId, name, parseFloat(price), parseInt(quantity));
      setName('');
      setPrice('');
      setQuantity('');
      setEditingId(null);
      setError('');
      loadItems();
    } catch (err) {
      setError('Failed to update item');
    }
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setName(item.name);
    setPrice(item.price);
    setQuantity(item.quantity);
  };

  return (
    <div className="home-container">
      <header className="header">
        <h1>Grocery Store</h1>
        <button onClick={onLogout} className="logout-btn">Logout</button>
      </header>

      <div className="content">
        <div className="form-section">
          <h2>{editingId ? 'Edit Item' : 'Add New Item'}</h2>
          <form onSubmit={editingId ? handleUpdateItem : handleAddItem}>
            <input
              type="text"
              placeholder="Item name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input
              type="number"
              placeholder="Price"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              step="0.01"
            />
            <input
              type="number"
              placeholder="Quantity"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
            <button type="submit">
              {editingId ? 'Update Item' : 'Add Item'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setName('');
                  setPrice('');
                  setQuantity('');
                }}
                className="cancel-btn"
              >
                Cancel
              </button>
            )}
          </form>
          {error && <p className="error">{error}</p>}
        </div>

        <div className="items-section">
          <h2>Your Items</h2>
          {loading ? (
            <p className="loading">Loading...</p>
          ) : items.length === 0 ? (
            <p className="empty">No items yet. Add one to get started!</p>
          ) : (
            <div className="items-grid">
              {items.map((item) => (
                <div key={item.id} className="item-card">
                  <div className="item-info">
                    <h3>{item.name}</h3>
                    <p className="price">${parseFloat(item.price).toFixed(2)}</p>
                    <p className="quantity">Qty: {item.quantity}</p>
                  </div>
                  <div className="item-actions">
                    <button
                      onClick={() => startEdit(item)}
                      className="edit-btn"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="delete-btn"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
