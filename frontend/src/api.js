const API_URL = import.meta.env.VITE_API_URL;

export const api = {
  register: async (email, password) => {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return response.json();
  },

  login: async (email, password) => {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return response.json();
  },

  getItems: async (token) => {
    const response = await fetch(`${API_URL}/items`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    return response.json();
  },

  addItem: async (token, name, price, quantity) => {
    const response = await fetch(`${API_URL}/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ name, price, quantity }),
    });
    return response.json();
  },

  deleteItem: async (token, itemId) => {
    const response = await fetch(`${API_URL}/items/${itemId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    return response.json();
  },

  updateItem: async (token, itemId, name, price, quantity) => {
    const response = await fetch(`${API_URL}/items/${itemId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ name, price, quantity }),
    });
    return response.json();
  },
};
