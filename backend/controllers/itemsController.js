import { createItem, getItemsByUserId, deleteItem, updateItem } from '../models/Item.js';

export const addItem = async (req, res) => {
  try {
    const { name, price, quantity } = req.body;
    const userId = req.user.userId;

    if (!name || !price || quantity === undefined) {
      return res.status(400).json({ error: 'Name, price, and quantity required' });
    }

    const itemId = await createItem(userId, name, price, quantity);
    res.json({ message: 'Item added', itemId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getItems = async (req, res) => {
  try {
    const userId = req.user.userId;
    const items = await getItemsByUserId(userId);
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const removeItem = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const affectedRows = await deleteItem(id, userId);
    if (affectedRows === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.json({ message: 'Item deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const editItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, quantity } = req.body;
    const userId = req.user.userId;

    if (!name || !price || quantity === undefined) {
      return res.status(400).json({ error: 'Name, price, and quantity required' });
    }

    const affectedRows = await updateItem(id, userId, name, price, quantity);
    if (affectedRows === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.json({ message: 'Item updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
