import pool from '../config/database.js';

export const createItem = async (userId, name, price, quantity) => {
  try {
    const connection = await pool.getConnection();
    
    const [result] = await connection.execute(
      'INSERT INTO items (user_id, name, price, quantity) VALUES (?, ?, ?, ?)',
      [userId, name, price, quantity]
    );
    
    connection.release();
    return result.insertId;
  } catch (error) {
    throw error;
  }
};

export const getItemsByUserId = async (userId) => {
  try {
    const connection = await pool.getConnection();
    
    const [rows] = await connection.execute(
      'SELECT * FROM items WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );
    
    connection.release();
    return rows;
  } catch (error) {
    throw error;
  }
};

export const deleteItem = async (itemId, userId) => {
  try {
    const connection = await pool.getConnection();
    
    const [result] = await connection.execute(
      'DELETE FROM items WHERE id = ? AND user_id = ?',
      [itemId, userId]
    );
    
    connection.release();
    return result.affectedRows;
  } catch (error) {
    throw error;
  }
};

export const updateItem = async (itemId, userId, name, price, quantity) => {
  try {
    const connection = await pool.getConnection();
    
    const [result] = await connection.execute(
      'UPDATE items SET name = ?, price = ?, quantity = ? WHERE id = ? AND user_id = ?',
      [name, price, quantity, itemId, userId]
    );
    
    connection.release();
    return result.affectedRows;
  } catch (error) {
    throw error;
  }
};
